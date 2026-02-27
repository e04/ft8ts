/**
 * LDPC (174,91) Belief Propagation decoder for FT8.
 * Port of bpdecode174_91.f90 and decode174_91.f90.
 */

import { gHex, N_LDPC } from "./constants.js";
import { checkCRC14 } from "./crc.js";
import { Mn, Nm, ncw, nrw } from "./ldpc_tables.js";

const KK = 91;
const M_LDPC = N_LDPC - KK; // 83

export interface DecodeResult {
	message91: number[];
	cw: number[];
	nharderrors: number;
	dmin: number;
	ntype: number;
}

function platanh(x: number): number {
	if (x > 0.9999999) return 18.71;
	if (x < -0.9999999) return -18.71;
	return 0.5 * Math.log((1 + x) / (1 - x));
}

/**
 * BP decoder for (174,91) LDPC code.
 * llr: log-likelihood ratios (174 values, positive = bit more likely 0)
 * apmask: AP mask (174 values, 1 = a priori bit, don't update from check messages)
 * maxIterations: max BP iterations
 * Returns null if decoding fails, otherwise { message91, cw, nharderrors }
 */
export function bpDecode174_91(
	llr: Float64Array,
	apmask: Int8Array,
	maxIterations: number,
): DecodeResult | null {
	const N = N_LDPC;
	const M = M_LDPC;

	const tov = new Float64Array(ncw * N);
	const toc = new Float64Array(7 * M);
	const tanhtoc = new Float64Array(7 * M);
	const zn = new Float64Array(N);
	const cw = new Int8Array(N);

	// Initialize messages to checks
	for (let j = 0; j < M; j++) {
		const w = nrw[j]!;
		for (let i = 0; i < w; i++) {
			toc[i * M + j] = llr[Nm[j]![i]!]!;
		}
	}

	let nclast = 0;
	let ncnt = 0;

	for (let iter = 0; iter <= maxIterations; iter++) {
		// Update bit LLRs
		for (let i = 0; i < N; i++) {
			if (apmask[i] !== 1) {
				let sum = 0;
				for (let k = 0; k < ncw; k++) sum += tov[k * N + i]!;
				zn[i] = llr[i]! + sum;
			} else {
				zn[i] = llr[i]!;
			}
		}

		// Hard decision
		for (let i = 0; i < N; i++) cw[i] = zn[i]! > 0 ? 1 : 0;

		// Check parity
		let ncheck = 0;
		for (let i = 0; i < M; i++) {
			const w = nrw[i]!;
			let s = 0;
			for (let k = 0; k < w; k++) s += cw[Nm[i]![k]!]!;
			if (s % 2 !== 0) ncheck++;
		}

		if (ncheck === 0) {
			const bits91 = Array.from(cw.slice(0, KK));
			if (checkCRC14(bits91)) {
				let nharderrors = 0;
				for (let i = 0; i < N; i++) {
					if ((2 * cw[i]! - 1) * llr[i]! < 0) nharderrors++;
				}
				return {
					message91: bits91,
					cw: Array.from(cw),
					nharderrors,
					dmin: 0,
					ntype: 1,
				};
			}
		}

		// Early stopping
		if (iter > 0) {
			const nd = ncheck - nclast;
			if (nd < 0) {
				ncnt = 0;
			} else {
				ncnt++;
			}
			if (ncnt >= 5 && iter >= 10 && ncheck > 15) return null;
		}
		nclast = ncheck;

		// Send messages from bits to check nodes
		for (let j = 0; j < M; j++) {
			const w = nrw[j]!;
			for (let i = 0; i < w; i++) {
				const ibj = Nm[j]![i]!;
				let val = zn[ibj]!;
				for (let kk = 0; kk < ncw; kk++) {
					if (Mn[ibj]![kk] === j) {
						val -= tov[kk * N + ibj]!;
					}
				}
				toc[i * M + j] = val;
			}
		}

		// Send messages from check nodes to variable nodes
		for (let i = 0; i < M; i++) {
			for (let k = 0; k < 7; k++) {
				tanhtoc[k * M + i] = Math.tanh(-toc[k * M + i]! / 2);
			}
		}

		for (let j = 0; j < N; j++) {
			for (let i = 0; i < ncw; i++) {
				const ichk = Mn[j]![i]!;
				const w = nrw[ichk]!;
				let Tmn = 1.0;
				for (let k = 0; k < w; k++) {
					if (Nm[ichk]![k] !== j) {
						Tmn *= tanhtoc[k * M + ichk]!;
					}
				}
				tov[i * N + j] = 2 * platanh(-Tmn);
			}
		}
	}

	return null;
}

/**
 * Hybrid BP + OSD-like decoder for (174,91) code.
 * Tries BP first, then falls back to OSD approach for deeper decoding.
 */
export function decode174_91(
	llr: Float64Array,
	apmask: Int8Array,
	maxosd: number,
): DecodeResult | null {
	const maxIterations = 30;

	// Try BP decoding
	const bpResult = bpDecode174_91(llr, apmask, maxIterations);
	if (bpResult) return bpResult;

	// OSD-0 fallback: try hard-decision with bit flipping for most unreliable bits
	if (maxosd >= 0) {
		return osdDecode174_91(llr, apmask, maxosd >= 1 ? 2 : 1);
	}

	return null;
}

/**
 * Simplified OSD decoder for (174,91) code.
 * Uses ordered statistics approach: sort bits by reliability,
 * do Gaussian elimination, try flipping least reliable info bits.
 */
function osdDecode174_91(
	llr: Float64Array,
	apmask: Int8Array,
	norder: number,
): DecodeResult | null {
	const N = N_LDPC;
	const K = KK;

	const gen = getGenerator();
	const absllr = new Float64Array(N);
	for (let i = 0; i < N; i++) absllr[i] = Math.abs(llr[i]!);

	// Sort by reliability (descending)
	const indices = new Array<number>(N);
	for (let i = 0; i < N; i++) indices[i] = i;
	indices.sort((a, b) => absllr[b]! - absllr[a]!);

	// Reorder generator matrix columns
	const genmrb = new Uint8Array(K * N);
	for (let k = 0; k < K; k++) {
		const row = k * N;
		for (let i = 0; i < N; i++) {
			genmrb[row + i] = gen[row + indices[i]!]!;
		}
	}

	// Gaussian elimination to get systematic form on the K most-reliable bits
	const maxPivotCol = Math.min(K + 20, N);
	for (let id = 0; id < K; id++) {
		let found = false;
		const idRow = id * N;
		for (let icol = id; icol < maxPivotCol; icol++) {
			if (genmrb[idRow + icol] === 1) {
				if (icol !== id) {
					// Swap columns
					for (let k = 0; k < K; k++) {
						const row = k * N;
						const tmp = genmrb[row + id]!;
						genmrb[row + id] = genmrb[row + icol]!;
						genmrb[row + icol] = tmp;
					}
					const tmp = indices[id]!;
					indices[id] = indices[icol]!;
					indices[icol] = tmp;
				}
				for (let ii = 0; ii < K; ii++) {
					if (ii === id) continue;
					const iiRow = ii * N;
					if (genmrb[iiRow + id] === 1) {
						for (let c = 0; c < N; c++) {
							genmrb[iiRow + c]! ^= genmrb[idRow + c]!;
						}
					}
				}
				found = true;
				break;
			}
		}
		if (!found) return null;
	}

	// Hard decisions on reordered received word
	const hdec = new Int8Array(N);
	for (let i = 0; i < N; i++) {
		const idx = indices[i]!;
		hdec[i] = llr[idx]! >= 0 ? 1 : 0;
	}
	const absrx = new Float64Array(N);
	for (let i = 0; i < N; i++) {
		absrx[i] = absllr[indices[i]!]!;
	}

	// Encode hard decision on MRB (c0): xor selected rows of genmrb.
	const c0 = new Int8Array(N);
	for (let i = 0; i < K; i++) {
		if (hdec[i] !== 1) continue;
		const row = i * N;
		for (let j = 0; j < N; j++) {
			c0[j]! ^= genmrb[row + j]!;
		}
	}

	let dmin = 0;
	for (let i = 0; i < N; i++) {
		const x = c0[i]! ^ hdec[i]!;
		dmin += x * absrx[i]!;
	}
	let bestFlip1 = -1;
	let bestFlip2 = -1;

	// Order-1: flip single bits in the info portion
	for (let i1 = K - 1; i1 >= 0; i1--) {
		if (apmask[indices[i1]!] === 1) continue;
		const row1 = i1 * N;
		let dd = 0;
		for (let j = 0; j < N; j++) {
			const x = c0[j]! ^ genmrb[row1 + j]! ^ hdec[j]!;
			dd += x * absrx[j]!;
		}
		if (dd < dmin) {
			dmin = dd;
			bestFlip1 = i1;
			bestFlip2 = -1;
		}
	}

	// Order-2: flip pairs of least-reliable info bits (limited search)
	if (norder >= 2) {
		const ntry = Math.min(64, K);
		const iMin = Math.max(0, K - ntry);
		for (let i1 = K - 1; i1 >= iMin; i1--) {
			if (apmask[indices[i1]!] === 1) continue;
			const row1 = i1 * N;
			for (let i2 = i1 - 1; i2 >= iMin; i2--) {
				if (apmask[indices[i2]!] === 1) continue;
				const row2 = i2 * N;
				let dd = 0;
				for (let j = 0; j < N; j++) {
					const x = c0[j]! ^ genmrb[row1 + j]! ^ genmrb[row2 + j]! ^ hdec[j]!;
					dd += x * absrx[j]!;
				}
				if (dd < dmin) {
					dmin = dd;
					bestFlip1 = i1;
					bestFlip2 = i2;
				}
			}
		}
	}

	const bestCw = new Int8Array(c0);
	if (bestFlip1 >= 0) {
		const row1 = bestFlip1 * N;
		for (let j = 0; j < N; j++) bestCw[j]! ^= genmrb[row1 + j]!;
		if (bestFlip2 >= 0) {
			const row2 = bestFlip2 * N;
			for (let j = 0; j < N; j++) bestCw[j]! ^= genmrb[row2 + j]!;
		}
	}

	// Reorder codeword back to original order
	const finalCw = new Int8Array(N);
	for (let i = 0; i < N; i++) {
		finalCw[indices[i]!] = bestCw[i]!;
	}

	const bits91 = Array.from(finalCw.slice(0, KK));
	if (!checkCRC14(bits91)) return null;

	// Compute dmin in original order
	let dminOrig = 0;
	let nhe = 0;
	for (let i = 0; i < N; i++) {
		const hard = llr[i]! >= 0 ? 1 : 0;
		const x = finalCw[i]! ^ hard;
		nhe += x;
		dminOrig += x * absllr[i]!;
	}

	return {
		message91: bits91,
		cw: Array.from(finalCw),
		nharderrors: nhe,
		dmin: dminOrig,
		ntype: 2,
	};
}

let _generator: Uint8Array | null = null;

function getGenerator(): Uint8Array {
	if (_generator) return _generator;

	const K = KK;
	const N = N_LDPC;
	const M = M_LDPC;

	// Build full generator matrix (K×N) where first K columns are identity
	const gen = new Uint8Array(K * N);

	for (let i = 0; i < K; i++) gen[i * N + i] = 1;

	// gHex encodes the M×K generator parity matrix
	// gen_parity[m][k] = 1 means info bit k contributes to parity bit m
	for (let m = 0; m < M; m++) {
		const hexStr = gHex[m]!;
		for (let j = 0; j < 23; j++) {
			const val = parseInt(hexStr[j]!, 16);
			const limit = j === 22 ? 3 : 4;
			for (let jj = 1; jj <= limit; jj++) {
				const col = j * 4 + jj - 1;
				if (col < K && (val & (1 << (4 - jj))) !== 0) {
					// For info bit `col`, parity bit `m` is set
					gen[col * N + K + m] = 1;
				}
			}
		}
	}

	_generator = gen;
	return gen;
}
