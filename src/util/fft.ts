/**
 * FFT for FT8/FT4 decoding.
 * Radix-2 Cooley-Tukey for powers of two, mixed-radix Stockham for sizes
 * with small prime factors (e.g. 3840, 3200, 192000, 72576), and Bluestein
 * for everything else.
 * Supports real-to-complex, complex-to-complex, and inverse transforms.
 */

interface Radix2Plan {
	bitReversed: Uint32Array;
}

interface MixedRadixPlan {
	factors: number[];
	/** exp(-2πik/n), k = 0..n-1 */
	twRe: Float64Array;
	twIm: Float64Array;
	workRe: Float64Array;
	workIm: Float64Array;
	/** Scratch for generic odd radices. */
	vRe: Float64Array;
	vIm: Float64Array;
}

interface BluesteinPlan {
	m: number;
	chirpRe: Float64Array;
	chirpIm: Float64Array;
	bFftRe: Float64Array;
	bFftIm: Float64Array;
	aRe: Float64Array;
	aIm: Float64Array;
}

const RADIX2_PLAN_CACHE = new Map<number, Radix2Plan>();
const MIXED_RADIX_PLAN_CACHE = new Map<number, MixedRadixPlan | null>();
const BLUESTEIN_PLAN_CACHE = new Map<string, BluesteinPlan>();
const MAX_GENERIC_RADIX = 31;

export function fftComplex(re: Float64Array, im: Float64Array, inverse: boolean): void {
	const n = re.length;
	if (n <= 1) return;

	if ((n & (n - 1)) !== 0) {
		const plan = getMixedRadixPlan(n);
		if (plan) {
			mixedRadix(re, im, inverse, plan);
		} else {
			bluestein(re, im, inverse);
		}
		return;
	}

	const { bitReversed } = getRadix2Plan(n);

	// Bit-reversal permutation
	for (let i = 0; i < n; i++) {
		const j = bitReversed[i]!;
		if (j > i) {
			let tmp = re[i]!;
			re[i] = re[j]!;
			re[j] = tmp;
			tmp = im[i]!;
			im[i] = im[j]!;
			im[j] = tmp;
		}
	}

	const sign = inverse ? 1 : -1;

	for (let size = 2; size <= n; size <<= 1) {
		const halfsize = size >> 1;
		const step = (sign * Math.PI) / halfsize;
		const wRe = Math.cos(step);
		const wIm = Math.sin(step);

		for (let i = 0; i < n; i += size) {
			let curRe = 1;
			let curIm = 0;
			for (let k = 0; k < halfsize; k++) {
				const evenIdx = i + k;
				const oddIdx = i + k + halfsize;
				const tRe = curRe * re[oddIdx]! - curIm * im[oddIdx]!;
				const tIm = curRe * im[oddIdx]! + curIm * re[oddIdx]!;
				re[oddIdx] = re[evenIdx]! - tRe;
				im[oddIdx] = im[evenIdx]! - tIm;
				re[evenIdx] = re[evenIdx]! + tRe;
				im[evenIdx] = im[evenIdx]! + tIm;
				const newCurRe = curRe * wRe - curIm * wIm;
				curIm = curRe * wIm + curIm * wRe;
				curRe = newCurRe;
			}
		}
	}

	if (inverse) {
		const scale = 1 / n;
		for (let i = 0; i < n; i++) {
			re[i] = re[i]! * scale;
			im[i] = im[i]! * scale;
		}
	}
}

function getMixedRadixPlan(n: number): MixedRadixPlan | null {
	const cached = MIXED_RADIX_PLAN_CACHE.get(n);
	if (cached !== undefined) return cached;

	const factors: number[] = [];
	let rest = n;
	while (rest % 4 === 0) {
		factors.push(4);
		rest /= 4;
	}
	for (let p = 2; p <= MAX_GENERIC_RADIX && rest > 1; p++) {
		while (rest % p === 0) {
			factors.push(p);
			rest /= p;
		}
	}
	if (rest !== 1) {
		MIXED_RADIX_PLAN_CACHE.set(n, null);
		return null;
	}

	const twRe = new Float64Array(n);
	const twIm = new Float64Array(n);
	for (let k = 0; k < n; k++) {
		const angle = (-2 * Math.PI * k) / n;
		twRe[k] = Math.cos(angle);
		twIm[k] = Math.sin(angle);
	}
	const maxRadix = Math.max(...factors);
	const plan: MixedRadixPlan = {
		factors,
		twRe,
		twIm,
		workRe: new Float64Array(n),
		workIm: new Float64Array(n),
		vRe: new Float64Array(maxRadix),
		vIm: new Float64Array(maxRadix),
	};
	MIXED_RADIX_PLAN_CACHE.set(n, plan);
	return plan;
}

const SIN_60 = Math.sqrt(3) / 2;
const COS_72 = Math.cos((2 * Math.PI) / 5);
const COS_144 = Math.cos((4 * Math.PI) / 5);
const SIN_72 = Math.sin((2 * Math.PI) / 5);
const SIN_144 = Math.sin((4 * Math.PI) / 5);

/**
 * Stockham autosort mixed-radix FFT. Each stage combines `radix` transforms
 * of length `ns` into transforms of length `ns * radix`.
 */
function mixedRadix(
	re: Float64Array,
	im: Float64Array,
	inverse: boolean,
	plan: MixedRadixPlan,
): void {
	const n = re.length;
	const { factors, twRe, twIm, vRe, vIm } = plan;
	const sign = inverse ? 1 : -1;
	let xRe = re;
	let xIm = im;
	let yRe = plan.workRe;
	let yIm = plan.workIm;
	let ns = 1;

	for (const radix of factors) {
		const stride = n / radix;
		const twStep = n / (ns * radix);
		const nblocks = stride / ns;

		for (let b = 0; b < nblocks; b++) {
			const inBase = b * ns;
			const outBase = b * ns * radix;
			for (let k = 0; k < ns; k++) {
				const j = inBase + k;
				const d = outBase + k;
				const tw = k * twStep;

				if (radix === 2) {
					const aRe = xRe[j]!;
					const aIm = xIm[j]!;
					let bRe = xRe[j + stride]!;
					let bIm = xIm[j + stride]!;
					if (tw !== 0) {
						const wr = twRe[tw]!;
						const wi = -sign * twIm[tw]!;
						const t = bRe * wr - bIm * wi;
						bIm = bRe * wi + bIm * wr;
						bRe = t;
					}
					yRe[d] = aRe + bRe;
					yIm[d] = aIm + bIm;
					yRe[d + ns] = aRe - bRe;
					yIm[d + ns] = aIm - bIm;
				} else if (radix === 4) {
					const v0r = xRe[j]!;
					const v0i = xIm[j]!;
					let v1r = xRe[j + stride]!;
					let v1i = xIm[j + stride]!;
					let v2r = xRe[j + 2 * stride]!;
					let v2i = xIm[j + 2 * stride]!;
					let v3r = xRe[j + 3 * stride]!;
					let v3i = xIm[j + 3 * stride]!;
					if (tw !== 0) {
						let wr = twRe[tw]!;
						let wi = -sign * twIm[tw]!;
						let t = v1r * wr - v1i * wi;
						v1i = v1r * wi + v1i * wr;
						v1r = t;
						wr = twRe[2 * tw]!;
						wi = -sign * twIm[2 * tw]!;
						t = v2r * wr - v2i * wi;
						v2i = v2r * wi + v2i * wr;
						v2r = t;
						wr = twRe[3 * tw]!;
						wi = -sign * twIm[3 * tw]!;
						t = v3r * wr - v3i * wi;
						v3i = v3r * wi + v3i * wr;
						v3r = t;
					}
					const t0r = v0r + v2r;
					const t0i = v0i + v2i;
					const t1r = v0r - v2r;
					const t1i = v0i - v2i;
					const t2r = v1r + v3r;
					const t2i = v1i + v3i;
					// (v1 - v3) * (sign * i)
					const dr = v1r - v3r;
					const di = v1i - v3i;
					const t3r = -sign * di;
					const t3i = sign * dr;
					yRe[d] = t0r + t2r;
					yIm[d] = t0i + t2i;
					yRe[d + ns] = t1r + t3r;
					yIm[d + ns] = t1i + t3i;
					yRe[d + 2 * ns] = t0r - t2r;
					yIm[d + 2 * ns] = t0i - t2i;
					yRe[d + 3 * ns] = t1r - t3r;
					yIm[d + 3 * ns] = t1i - t3i;
				} else if (radix === 3) {
					const v0r = xRe[j]!;
					const v0i = xIm[j]!;
					let v1r = xRe[j + stride]!;
					let v1i = xIm[j + stride]!;
					let v2r = xRe[j + 2 * stride]!;
					let v2i = xIm[j + 2 * stride]!;
					if (tw !== 0) {
						let wr = twRe[tw]!;
						let wi = -sign * twIm[tw]!;
						let t = v1r * wr - v1i * wi;
						v1i = v1r * wi + v1i * wr;
						v1r = t;
						wr = twRe[2 * tw]!;
						wi = -sign * twIm[2 * tw]!;
						t = v2r * wr - v2i * wi;
						v2i = v2r * wi + v2i * wr;
						v2r = t;
					}
					const sr = v1r + v2r;
					const si = v1i + v2i;
					const mr = v0r - 0.5 * sr;
					const mi = v0i - 0.5 * si;
					// i * sign * sin60 * (v1 - v2)
					const s = sign * SIN_60;
					const qr = -s * (v1i - v2i);
					const qi = s * (v1r - v2r);
					yRe[d] = v0r + sr;
					yIm[d] = v0i + si;
					yRe[d + ns] = mr + qr;
					yIm[d + ns] = mi + qi;
					yRe[d + 2 * ns] = mr - qr;
					yIm[d + 2 * ns] = mi - qi;
				} else if (radix === 5) {
					const v0r = xRe[j]!;
					const v0i = xIm[j]!;
					let v1r = xRe[j + stride]!;
					let v1i = xIm[j + stride]!;
					let v2r = xRe[j + 2 * stride]!;
					let v2i = xIm[j + 2 * stride]!;
					let v3r = xRe[j + 3 * stride]!;
					let v3i = xIm[j + 3 * stride]!;
					let v4r = xRe[j + 4 * stride]!;
					let v4i = xIm[j + 4 * stride]!;
					if (tw !== 0) {
						let wr = twRe[tw]!;
						let wi = -sign * twIm[tw]!;
						let t = v1r * wr - v1i * wi;
						v1i = v1r * wi + v1i * wr;
						v1r = t;
						wr = twRe[2 * tw]!;
						wi = -sign * twIm[2 * tw]!;
						t = v2r * wr - v2i * wi;
						v2i = v2r * wi + v2i * wr;
						v2r = t;
						wr = twRe[3 * tw]!;
						wi = -sign * twIm[3 * tw]!;
						t = v3r * wr - v3i * wi;
						v3i = v3r * wi + v3i * wr;
						v3r = t;
						wr = twRe[4 * tw]!;
						wi = -sign * twIm[4 * tw]!;
						t = v4r * wr - v4i * wi;
						v4i = v4r * wi + v4i * wr;
						v4r = t;
					}
					const a1r = v1r + v4r;
					const a1i = v1i + v4i;
					const b1r = v1r - v4r;
					const b1i = v1i - v4i;
					const a2r = v2r + v3r;
					const a2i = v2i + v3i;
					const b2r = v2r - v3r;
					const b2i = v2i - v3i;
					const c1r = v0r + COS_72 * a1r + COS_144 * a2r;
					const c1i = v0i + COS_72 * a1i + COS_144 * a2i;
					const c2r = v0r + COS_144 * a1r + COS_72 * a2r;
					const c2i = v0i + COS_144 * a1i + COS_72 * a2i;
					// i * sign * (...)
					const s1r = SIN_72 * b1r + SIN_144 * b2r;
					const s1i = SIN_72 * b1i + SIN_144 * b2i;
					const s2r = SIN_144 * b1r - SIN_72 * b2r;
					const s2i = SIN_144 * b1i - SIN_72 * b2i;
					const q1r = -sign * s1i;
					const q1i = sign * s1r;
					const q2r = -sign * s2i;
					const q2i = sign * s2r;
					yRe[d] = v0r + a1r + a2r;
					yIm[d] = v0i + a1i + a2i;
					yRe[d + ns] = c1r + q1r;
					yIm[d + ns] = c1i + q1i;
					yRe[d + 2 * ns] = c2r + q2r;
					yIm[d + 2 * ns] = c2i + q2i;
					yRe[d + 3 * ns] = c2r - q2r;
					yIm[d + 3 * ns] = c2i - q2i;
					yRe[d + 4 * ns] = c1r - q1r;
					yIm[d + 4 * ns] = c1i - q1i;
				} else {
					for (let r = 0; r < radix; r++) {
						let vr = xRe[j + r * stride]!;
						let vi = xIm[j + r * stride]!;
						const ti = r * tw;
						if (ti !== 0) {
							const wr = twRe[ti]!;
							const wi = -sign * twIm[ti]!;
							const t = vr * wr - vi * wi;
							vi = vr * wi + vi * wr;
							vr = t;
						}
						vRe[r] = vr;
						vIm[r] = vi;
					}
					const rootStep = n / radix;
					for (let q = 0; q < radix; q++) {
						let sr = 0;
						let si = 0;
						for (let r = 0; r < radix; r++) {
							const ri = ((q * r) % radix) * rootStep;
							const wr = twRe[ri]!;
							const wi = -sign * twIm[ri]!;
							sr += vRe[r]! * wr - vIm[r]! * wi;
							si += vRe[r]! * wi + vIm[r]! * wr;
						}
						yRe[d + q * ns] = sr;
						yIm[d + q * ns] = si;
					}
				}
			}
		}

		const tRe = xRe;
		const tIm = xIm;
		xRe = yRe;
		xIm = yIm;
		yRe = tRe;
		yIm = tIm;
		ns *= radix;
	}

	const scale = inverse ? 1 / n : 1;
	if (xRe !== re) {
		for (let i = 0; i < n; i++) {
			re[i] = xRe[i]! * scale;
			im[i] = xIm[i]! * scale;
		}
	} else if (inverse) {
		for (let i = 0; i < n; i++) {
			re[i] = re[i]! * scale;
			im[i] = im[i]! * scale;
		}
	}
}

function bluestein(re: Float64Array, im: Float64Array, inverse: boolean): void {
	const n = re.length;
	const { m, chirpRe, chirpIm, bFftRe, bFftIm, aRe, aIm } = getBluesteinPlan(n, inverse);

	aRe.fill(0);
	aIm.fill(0);
	for (let i = 0; i < n; i++) {
		const cosA = chirpRe[i]!;
		const sinA = chirpIm[i]!;
		const inRe = re[i]!;
		const inIm = im[i]!;
		aRe[i] = inRe * cosA - inIm * sinA;
		aIm[i] = inRe * sinA + inIm * cosA;
	}

	fftComplex(aRe, aIm, false);

	for (let i = 0; i < m; i++) {
		const ar = aRe[i]!;
		const ai = aIm[i]!;
		const br = bFftRe[i]!;
		const bi = bFftIm[i]!;
		aRe[i] = ar * br - ai * bi;
		aIm[i] = ar * bi + ai * br;
	}

	fftComplex(aRe, aIm, true);

	const scale = inverse ? 1 / n : 1;
	for (let i = 0; i < n; i++) {
		const cosA = chirpRe[i]!;
		const sinA = chirpIm[i]!;

		const r = aRe[i]! * cosA - aIm[i]! * sinA;
		const iIm = aRe[i]! * sinA + aIm[i]! * cosA;
		re[i] = r * scale;
		im[i] = iIm * scale;
	}
}

function getRadix2Plan(n: number): Radix2Plan {
	let plan = RADIX2_PLAN_CACHE.get(n);
	if (plan) return plan;

	const bits = 31 - Math.clz32(n);
	const bitReversed = new Uint32Array(n);
	for (let i = 1; i < n; i++) {
		bitReversed[i] = (bitReversed[i >> 1]! >> 1) | ((i & 1) << (bits - 1));
	}

	plan = { bitReversed };
	RADIX2_PLAN_CACHE.set(n, plan);
	return plan;
}

function getBluesteinPlan(n: number, inverse: boolean): BluesteinPlan {
	const key = `${n}:${inverse ? 1 : 0}`;
	const cached = BLUESTEIN_PLAN_CACHE.get(key);
	if (cached) return cached;

	const m = nextPow2(n * 2 - 1);
	const s = inverse ? 1 : -1;
	const chirpRe = new Float64Array(n);
	const chirpIm = new Float64Array(n);
	for (let i = 0; i < n; i++) {
		const angle = (s * Math.PI * ((i * i) % (2 * n))) / n;
		chirpRe[i] = Math.cos(angle);
		chirpIm[i] = Math.sin(angle);
	}

	const bFftRe = new Float64Array(m);
	const bFftIm = new Float64Array(m);
	for (let i = 0; i < n; i++) {
		const cosA = chirpRe[i]!;
		const sinA = chirpIm[i]!;
		bFftRe[i] = cosA;
		bFftIm[i] = -sinA;
	}
	for (let i = 1; i < n; i++) {
		bFftRe[m - i] = bFftRe[i]!;
		bFftIm[m - i] = bFftIm[i]!;
	}
	fftComplex(bFftRe, bFftIm, false);

	const plan: BluesteinPlan = {
		m,
		chirpRe,
		chirpIm,
		bFftRe,
		bFftIm,
		aRe: new Float64Array(m),
		aIm: new Float64Array(m),
	};
	BLUESTEIN_PLAN_CACHE.set(key, plan);
	return plan;
}

/**
 * Real-to-complex FFT. Input: n real values. Output: n/2+1 complex values
 * stored in re[0..n/2] and im[0..n/2].
 */
export function fftReal(input: Float64Array, outRe: Float64Array, outIm: Float64Array): void {
	const n = input.length;
	const half = n >> 1;

	const re = new Float64Array(half);
	const im = new Float64Array(half);
	for (let i = 0; i < half; i++) {
		re[i] = input[i * 2]!;
		im[i] = input[i * 2 + 1]!;
	}
	fftComplex(re, im, false);

	outRe[0] = re[0]! + im[0]!;
	outIm[0] = 0;
	outRe[half] = re[0]! - im[0]!;
	outIm[half] = 0;

	for (let k = 1; k < half; k++) {
		const nk = half - k;
		const eRe = 0.5 * (re[k]! + re[nk]!);
		const eIm = 0.5 * (im[k]! - im[nk]!);
		const angle = (-2 * Math.PI * k) / n;
		const twRe = Math.cos(angle);
		const twIm = Math.sin(angle);
		const oRe = 0.5 * (im[k]! + im[nk]!);
		const oIm = -0.5 * (re[k]! - re[nk]!);
		const toRe = twRe * oRe - twIm * oIm;
		const toIm = twRe * oIm + twIm * oRe;
		outRe[k] = eRe + toRe;
		outIm[k] = eIm + toIm;
		outRe[n - k] = eRe - toRe;
		outIm[n - k] = -(eIm - toIm);
	}
}

/** Next power of 2 >= n */
export function nextPow2(n: number): number {
	let v = 1;
	while (v < n) v <<= 1;
	return v;
}
