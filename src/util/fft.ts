/**
 * Radix-2 Cooley-Tukey FFT for FT8 decoding.
 * Supports real-to-complex, complex-to-complex, and inverse transforms.
 */

export function fftComplex(re: Float64Array, im: Float64Array, inverse: boolean): void {
	const n = re.length;
	if (n <= 1) return;

	if ((n & (n - 1)) !== 0) {
		bluestein(re, im, inverse);
		return;
	}

	// Bit-reversal permutation
	let j = 0;
	for (let i = 0; i < n; i++) {
		if (j > i) {
			let tmp = re[i]!;
			re[i] = re[j]!;
			re[j] = tmp;
			tmp = im[i]!;
			im[i] = im[j]!;
			im[j] = tmp;
		}
		let m = n >> 1;
		while (m >= 1 && j >= m) {
			j -= m;
			m >>= 1;
		}
		j += m;
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
		for (let i = 0; i < n; i++) {
			re[i]! /= n;
			im[i]! /= n;
		}
	}
}

function bluestein(re: Float64Array, im: Float64Array, inverse: boolean): void {
	const n = re.length;
	const m = nextPow2(n * 2 - 1);
	const s = inverse ? 1 : -1;

	const aRe = new Float64Array(m);
	const aIm = new Float64Array(m);
	const bRe = new Float64Array(m);
	const bIm = new Float64Array(m);

	for (let i = 0; i < n; i++) {
		const angle = (s * Math.PI * ((i * i) % (2 * n))) / n;
		const cosA = Math.cos(angle);
		const sinA = Math.sin(angle);

		aRe[i] = re[i]! * cosA - im[i]! * sinA;
		aIm[i] = re[i]! * sinA + im[i]! * cosA;

		bRe[i] = cosA;
		bIm[i] = -sinA;
	}
	for (let i = 1; i < n; i++) {
		bRe[m - i] = bRe[i]!;
		bIm[m - i] = bIm[i]!;
	}

	fftComplex(aRe, aIm, false);
	fftComplex(bRe, bIm, false);

	for (let i = 0; i < m; i++) {
		const r = aRe[i]! * bRe[i]! - aIm[i]! * bIm[i]!;
		const iIm = aRe[i]! * bIm[i]! + aIm[i]! * bRe[i]!;
		aRe[i] = r;
		aIm[i] = iIm;
	}

	fftComplex(aRe, aIm, true);

	const scale = inverse ? 1 / n : 1;
	for (let i = 0; i < n; i++) {
		const angle = (s * Math.PI * ((i * i) % (2 * n))) / n;
		const cosA = Math.cos(angle);
		const sinA = Math.sin(angle);

		const r = aRe[i]! * cosA - aIm[i]! * sinA;
		const iIm = aRe[i]! * sinA + aIm[i]! * cosA;
		re[i] = r * scale;
		im[i] = iIm * scale;
	}
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
