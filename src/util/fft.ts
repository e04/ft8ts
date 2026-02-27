/**
 * Radix-2 Cooley-Tukey FFT for FT8 decoding.
 * Supports real-to-complex, complex-to-complex, and inverse transforms.
 */

interface Radix2Plan {
	bitReversed: Uint32Array;
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
const BLUESTEIN_PLAN_CACHE = new Map<string, BluesteinPlan>();

export function fftComplex(re: Float64Array, im: Float64Array, inverse: boolean): void {
	const n = re.length;
	if (n <= 1) return;

	if ((n & (n - 1)) !== 0) {
		bluestein(re, im, inverse);
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
