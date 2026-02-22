/**
 * LDPC (174,91) Belief Propagation decoder for FT8.
 * Port of bpdecode174_91.f90 and decode174_91.f90.
 */

import { gHex, KK, M_LDPC, N_LDPC } from "./constants.js";
import { checkCRC14 } from "./crc.js";
import { Mn, Nm, ncw, nrw } from "./ldpc_tables.js";

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

	// Sort by reliability (descending)
	const indices = Array.from({ length: N }, (_, i) => i);
	indices.sort((a, b) => Math.abs(llr[b]!) - Math.abs(llr[a]!));

	// Reorder generator matrix columns
	const genmrb = new Uint8Array(K * N);
	for (let i = 0; i < N; i++) {
		for (let k = 0; k < K; k++) {
			genmrb[k * N + i] = gen[k * N + indices[i]!]!;
		}
	}

	// Gaussian elimination to get systematic form on the K most-reliable bits
	for (let id = 0; id < K; id++) {
		let found = false;
		for (let icol = id; icol < Math.min(K + 20, N); icol++) {
			if (genmrb[id * N + icol] === 1) {
				if (icol !== id) {
					// Swap columns
					for (let k = 0; k < K; k++) {
						const tmp = genmrb[k * N + id]!;
						genmrb[k * N + id] = genmrb[k * N + icol]!;
						genmrb[k * N + icol] = tmp;
					}
					const tmp = indices[id]!;
					indices[id] = indices[icol]!;
					indices[icol] = tmp;
				}
				for (let ii = 0; ii < K; ii++) {
					if (ii !== id && genmrb[ii * N + id] === 1) {
						for (let c = 0; c < N; c++) {
							genmrb[ii * N + c]! ^= genmrb[id * N + c]!;
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
		hdec[i] = llr[indices[i]!]! >= 0 ? 1 : 0;
	}
	const absrx = new Float64Array(N);
	for (let i = 0; i < N; i++) {
		absrx[i] = Math.abs(llr[indices[i]!]!);
	}

	// Transpose of reordered gen matrix
	const g2 = new Uint8Array(N * K);
	for (let i = 0; i < K; i++) {
		for (let j = 0; j < N; j++) {
			g2[j * K + i] = genmrb[i * N + j]!;
		}
	}

	function mrbencode(me: Int8Array): Int8Array {
		const codeword = new Int8Array(N);
		for (let i = 0; i < K; i++) {
			if (me[i] === 1) {
				for (let j = 0; j < N; j++) {
					codeword[j]! ^= g2[j * K + i]!;
				}
			}
		}
		return codeword;
	}

	const m0 = hdec.slice(0, K);
	const c0 = mrbencode(m0);
	const bestCw = new Int8Array(c0);
	let dmin = 0;
	for (let i = 0; i < N; i++) {
		const x = c0[i]! ^ hdec[i]!;
		dmin += x * absrx[i]!;
	}

	// Order-1: flip single bits in the info portion
	for (let i1 = K - 1; i1 >= 0; i1--) {
		if (apmask[indices[i1]!] === 1) continue;
		const me = new Int8Array(m0);
		me[i1]! ^= 1;
		const ce = mrbencode(me);
		let _nh = 0;
		let dd = 0;
		for (let j = 0; j < N; j++) {
			const x = ce[j]! ^ hdec[j]!;
			_nh += x;
			dd += x * absrx[j]!;
		}
		if (dd < dmin) {
			dmin = dd;
			bestCw.set(ce);
		}
	}

	// Order-2: flip pairs of least-reliable info bits (limited search)
	if (norder >= 2) {
		const ntry = Math.min(40, K);
		for (let i1 = K - 1; i1 >= K - ntry; i1--) {
			if (apmask[indices[i1]!] === 1) continue;
			for (let i2 = i1 - 1; i2 >= K - ntry; i2--) {
				if (apmask[indices[i2]!] === 1) continue;
				const me = new Int8Array(m0);
				me[i1]! ^= 1;
				me[i2]! ^= 1;
				const ce = mrbencode(me);
				let _nh = 0;
				let dd = 0;
				for (let j = 0; j < N; j++) {
					const x = ce[j]! ^ hdec[j]!;
					_nh += x;
					dd += x * absrx[j]!;
				}
				if (dd < dmin) {
					dmin = dd;
					bestCw.set(ce);
				}
			}
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
	const hdecOrig = new Int8Array(N);
	for (let i = 0; i < N; i++) hdecOrig[i] = llr[i]! >= 0 ? 1 : 0;
	let nhe = 0;
	for (let i = 0; i < N; i++) {
		const x = finalCw[i]! ^ hdecOrig[i]!;
		nhe += x;
		dminOrig += x * Math.abs(llr[i]!);
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
