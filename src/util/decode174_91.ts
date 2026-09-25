/**
 * LDPC (174,91) decoder for FT8/FT4.
 * Port of decode174_91.f90 (hybrid BP/OSD) and osd174_91.f90 from WSJT-X.
 */

import { gHex, N_LDPC } from "./constants.js";
import { Mn, Nm, nrw } from "./ldpc_tables.js";

const N = N_LDPC;
const KK = 91;
const M_LDPC = N - KK; // 83
const MAX_ITERATIONS = 30;

export interface DecodeResult {
	message91: number[];
	cw: number[];
	nharderrors: number;
	dmin: number;
	ntype: number;
}

// ── Tanner graph as flat edge arrays ────────────────────────────────────────

/** Edges of check j are CHECK_START[j]..CHECK_START[j+1]-1. */
const CHECK_START = new Int32Array(M_LDPC + 1);
/** Variable node of each edge. */
const EDGE_VAR = new Int32Array(3 * N);
/** The three edges of variable i are VAR_EDGES[3i..3i+2] (Mn order). */
const VAR_EDGES = new Int32Array(3 * N);

(() => {
	let e = 0;
	for (let j = 0; j < M_LDPC; j++) {
		CHECK_START[j] = e;
		for (let i = 0; i < nrw[j]!; i++) EDGE_VAR[e++] = Nm[j]![i]!;
	}
	CHECK_START[M_LDPC] = e;
	for (let v = 0; v < N; v++) {
		for (let t = 0; t < 3; t++) {
			const chk = Mn[v]![t]!;
			for (let k = CHECK_START[chk]!; k < CHECK_START[chk + 1]!; k++) {
				if (EDGE_VAR[k] === v) VAR_EDGES[3 * v + t] = k;
			}
		}
	}
})();

const NEDGES = CHECK_START[M_LDPC]!;
const tov = new Float64Array(NEDGES);
const toc = new Float64Array(NEDGES);
const tanhtoc = new Float64Array(NEDGES);
const zn = new Float64Array(N);
const zsum = new Float64Array(N);
const zsave = new Float64Array(3 * N);
const hardBits = new Int8Array(N);

/** Piecewise-linear atanh approximation used by WSJT-X (platanh.f90). */
function platanh(x: number): number {
	const z = x < 0 ? -x : x;
	let y: number;
	if (z <= 0.664) return x / 0.83;
	if (z <= 0.9217) y = (z - 0.4064) / 0.322;
	else if (z <= 0.9951) y = (z - 0.8378) / 0.0524;
	else if (z <= 0.9998) y = (z - 0.9914) / 0.0012;
	else y = 7.0;
	return x < 0 ? -y : y;
}

/** CRC-14 check on bits 0..90 of `bits` (77 message bits followed by 14 CRC bits). */
function crc14Matches(bits: ArrayLike<number>): boolean {
	const poly = 0x2757;
	let crc = 0;
	for (let bit = 0; bit < 96; bit++) {
		const nextBit = bit < 77 ? bits[bit]! : 0;
		if ((crc & 0x2000) !== 0) {
			crc = ((crc << 1) | nextBit) ^ poly;
		} else {
			crc = (crc << 1) | nextBit;
		}
		crc &= 0x3fff;
	}
	let received = 0;
	for (let i = 77; i < 91; i++) received = (received << 1) | bits[i]!;
	return received === crc;
}

function distanceToHardDecision(llr: Float64Array, cw: ArrayLike<number>): number {
	let dmin = 0;
	for (let i = 0; i < N; i++) {
		const hard = llr[i]! >= 0 ? 1 : 0;
		if (hard !== cw[i]) dmin += Math.abs(llr[i]!);
	}
	return dmin;
}

/**
 * Hybrid BP/OSD decoder for the (174,91) code (decode174_91.f90).
 *
 * maxosd < 0: BP only
 * maxosd = 0: BP, then OSD once with the channel LLRs
 * maxosd > 0: BP, then OSD up to `maxosd` times (max 3) with the accumulated
 *             BP soft outputs of iterations 1..maxosd
 * norder: OSD search depth (osd174_91 `ndeep`)
 */
export function decode174_91(
	llr: Float64Array,
	apmask: Int8Array,
	maxosd: number,
	norder = 2,
): DecodeResult | null {
	if (maxosd > 3) maxosd = 3;
	let nosd = 0;
	if (maxosd === 0) {
		nosd = 1;
		zsave.set(llr);
	} else if (maxosd > 0) {
		nosd = maxosd;
	}

	tov.fill(0);
	zsum.fill(0);
	let ncnt = 0;
	let nclast = 0;

	for (let iter = 0; iter <= MAX_ITERATIONS; iter++) {
		for (let i = 0; i < N; i++) {
			let z = llr[i]!;
			if (apmask[i] !== 1) {
				const e = 3 * i;
				z += tov[VAR_EDGES[e]!]! + tov[VAR_EDGES[e + 1]!]! + tov[VAR_EDGES[e + 2]!]!;
			}
			zn[i] = z;
			zsum[i] = zsum[i]! + z;
			hardBits[i] = z > 0 ? 1 : 0;
		}
		if (iter > 0 && iter <= maxosd) zsave.set(zsum, (iter - 1) * N);

		let ncheck = 0;
		for (let j = 0; j < M_LDPC; j++) {
			let parity = 0;
			for (let e = CHECK_START[j]!; e < CHECK_START[j + 1]!; e++) parity ^= hardBits[EDGE_VAR[e]!]!;
			ncheck += parity;
		}

		if (ncheck === 0 && crc14Matches(hardBits)) {
			let nharderrors = 0;
			for (let i = 0; i < N; i++) {
				if ((2 * hardBits[i]! - 1) * llr[i]! < 0) nharderrors++;
			}
			return {
				message91: Array.from(hardBits.subarray(0, KK)),
				cw: Array.from(hardBits),
				nharderrors,
				dmin: distanceToHardDecision(llr, hardBits),
				ntype: 1,
			};
		}

		if (iter > 0) {
			if (ncheck - nclast < 0) {
				ncnt = 0;
			} else {
				ncnt++;
			}
			if (ncnt >= 5 && iter >= 10 && ncheck > 15) break;
		}
		nclast = ncheck;

		// Messages from bits to checks
		for (let e = 0; e < NEDGES; e++) {
			const t = zn[EDGE_VAR[e]!]! - tov[e]!;
			toc[e] = t;
			tanhtoc[e] = Math.tanh(-t / 2);
		}

		// Messages from checks to bits
		for (let j = 0; j < M_LDPC; j++) {
			const start = CHECK_START[j]!;
			const end = CHECK_START[j + 1]!;
			for (let e = start; e < end; e++) {
				let tmn = 1.0;
				for (let k = start; k < end; k++) {
					if (k !== e) tmn *= tanhtoc[k]!;
				}
				tov[e] = 2 * platanh(-tmn);
			}
		}
	}

	for (let i = 0; i < nosd; i++) {
		const osd = osd174_91(zsave.subarray(i * N, (i + 1) * N), apmask, norder);
		if (osd && osd.nhardmin > 0) {
			return {
				message91: osd.cw.slice(0, KK),
				cw: osd.cw,
				nharderrors: osd.nhardmin,
				dmin: distanceToHardDecision(llr, osd.cw),
				ntype: 2,
			};
		}
	}

	return null;
}

// ── Ordered-statistics decoder ──────────────────────────────────────────────

/** Number of 32-bit words for a 91-row column bitset. */
const RW = 3;
/** Number of 32-bit words for the 83 parity positions. */
const PW = 3;

/**
 * Generator matrix in column-major bitset form: column c is a 91-bit set of the
 * information bits whose unit codeword has a 1 in position c.
 */
const GEN_COLS = buildGeneratorColumns();

const osdCols = new Int32Array(N * RW);
const osdIndices = new Int32Array(N);
const osdAbs = new Float64Array(N);
const osdAbsP = new Float64Array(N);
const osdHdecP = new Int8Array(N);
const osdApP = new Int8Array(N);
const osdC0 = new Int8Array(N);
const osdRowParity = new Int32Array(KK * PW);
const osdOrder: number[] = Array.from({ length: N }, (_, i) => i);

interface OsdResult {
	cw: number[];
	/** Hard errors w.r.t. the OSD input; negative if the CRC check failed. */
	nhardmin: number;
}

function popcount32(x: number): number {
	x -= (x >>> 1) & 0x55555555;
	x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
	x = (x + (x >>> 4)) & 0x0f0f0f0f;
	return Math.imul(x, 0x01010101) >>> 24;
}

function paritySum(w0: number, w1: number, w2: number, absP: Float64Array): number {
	let sum = 0;
	let w = w0;
	while (w !== 0) {
		const low = w & -w;
		sum += absP[KK + 31 - Math.clz32(low)]!;
		w ^= low;
	}
	w = w1;
	while (w !== 0) {
		const low = w & -w;
		sum += absP[KK + 32 + 31 - Math.clz32(low)]!;
		w ^= low;
	}
	w = w2;
	while (w !== 0) {
		const low = w & -w;
		sum += absP[KK + 64 + 31 - Math.clz32(low)]!;
		w ^= low;
	}
	return sum;
}

/**
 * Ordered-statistics decoder for the (174,91) code (osd174_91.f90 with k=91).
 * Supports ndeep 0..2 (the depths WSJT-X uses for FT8/FT4).
 */
function osd174_91(llr: Float64Array, apmask: Int8Array, ndeep: number): OsdResult | null {
	if (ndeep > 2) ndeep = 2;
	const k = KK;
	const cols = osdCols;
	const indices = osdIndices;

	for (let i = 0; i < N; i++) {
		osdAbs[i] = Math.abs(llr[i]!);
		osdOrder[i] = i;
	}
	osdOrder.sort((a, b) => osdAbs[b]! - osdAbs[a]!);

	// Columns of the generator matrix in order of decreasing reliability.
	for (let i = 0; i < N; i++) {
		const src = osdOrder[i]!;
		indices[i] = src;
		cols[i * RW] = GEN_COLS[src * RW]!;
		cols[i * RW + 1] = GEN_COLS[src * RW + 1]!;
		cols[i * RW + 2] = GEN_COLS[src * RW + 2]!;
	}

	// Gaussian elimination: make the first k columns (most reliable) systematic.
	const maxPivotCol = Math.min(k + 20, N);
	for (let id = 0; id < k; id++) {
		const word = id >>> 5;
		const mask = 1 << (id & 31);
		for (let icol = id; icol < maxPivotCol; icol++) {
			if ((cols[icol * RW + word]! & mask) === 0) continue;
			if (icol !== id) {
				for (let w = 0; w < RW; w++) {
					const tmp = cols[id * RW + w]!;
					cols[id * RW + w] = cols[icol * RW + w]!;
					cols[icol * RW + w] = tmp;
				}
				const tmp = indices[id]!;
				indices[id] = indices[icol]!;
				indices[icol] = tmp;
			}
			// Rows (other than id) that have a 1 in column id.
			const s0 = cols[id * RW]!;
			const s1 = cols[id * RW + 1]!;
			const s2 = cols[id * RW + 2]!;
			const r0 = word === 0 ? s0 & ~mask : s0;
			const r1 = word === 1 ? s1 & ~mask : s1;
			const r2 = word === 2 ? s2 & ~mask : s2;
			if ((r0 | r1 | r2) !== 0) {
				for (let c = 0; c < N; c++) {
					if ((cols[c * RW + word]! & mask) !== 0) {
						cols[c * RW] = cols[c * RW]! ^ r0;
						cols[c * RW + 1] = cols[c * RW + 1]! ^ r1;
						cols[c * RW + 2] = cols[c * RW + 2]! ^ r2;
					}
				}
			}
			break;
		}
	}

	// Received word in MRB order.
	let m0w0 = 0;
	let m0w1 = 0;
	let m0w2 = 0;
	for (let i = 0; i < N; i++) {
		const src = indices[i]!;
		const hard = llr[src]! >= 0 ? 1 : 0;
		osdHdecP[i] = hard;
		osdAbsP[i] = osdAbs[src]!;
		osdApP[i] = apmask[src]!;
		if (i < k && hard === 1) {
			if (i < 32) m0w0 |= 1 << i;
			else if (i < 64) m0w1 |= 1 << (i - 32);
			else m0w2 |= 1 << (i - 64);
		}
	}

	// Order-0 codeword and distance.
	let nhardmin = 0;
	let dmin = 0;
	for (let c = 0; c < N; c++) {
		const bit =
			(popcount32(m0w0 & cols[c * RW]!) +
				popcount32(m0w1 & cols[c * RW + 1]!) +
				popcount32(m0w2 & cols[c * RW + 2]!)) &
			1;
		osdC0[c] = bit;
		if (bit !== osdHdecP[c]) {
			nhardmin++;
			dmin += osdAbsP[c]!;
		}
	}

	let bestA = -1;
	let bestB = -1;

	if (ndeep > 0) {
		const npre1 = ndeep >= 2 ? 1 : 0;
		const ntheta = ndeep === 2 ? 10 : 12;
		// nt = 40: the screening uses the 40 most reliable parity positions.
		const NT_MASK1 = 0xff;

		// Parity part of each (systematic) row, and of the order-0 error pattern.
		osdRowParity.fill(0);
		let e0w0 = 0;
		let e0w1 = 0;
		let e0w2 = 0;
		for (let j = 0; j < M_LDPC; j++) {
			const c = k + j;
			const pw = j >>> 5;
			const pmask = 1 << (j & 31);
			if (osdC0[c] !== osdHdecP[c]) {
				if (pw === 0) e0w0 |= pmask;
				else if (pw === 1) e0w1 |= pmask;
				else e0w2 |= pmask;
			}
			for (let w = 0; w < RW; w++) {
				let bits = cols[c * RW + w]!;
				while (bits !== 0) {
					const low = bits & -bits;
					const row = w * 32 + 31 - Math.clz32(low);
					osdRowParity[row * PW + pw] = osdRowParity[row * PW + pw]! | pmask;
					bits ^= low;
				}
			}
		}

		for (let iflag = k - 1; iflag >= 0; iflag--) {
			// Every pattern of this iteration contains bit iflag.
			if (osdApP[iflag] === 1) continue;
			const s0 = e0w0 ^ osdRowParity[iflag * PW]!;
			const s1 = e0w1 ^ osdRowParity[iflag * PW + 1]!;
			const s2 = e0w2 ^ osdRowParity[iflag * PW + 2]!;
			const d1 = osdAbsP[iflag]!;

			let nd1kpt = popcount32(s0) + popcount32(s1 & NT_MASK1) + 1;
			if (nd1kpt <= ntheta) {
				const dd = d1 + paritySum(s0, s1, s2, osdAbsP);
				if (dd < dmin) {
					dmin = dd;
					bestA = iflag;
					bestB = -1;
				}
			}
			if (npre1 === 0) continue;

			for (let n1 = iflag - 1; n1 >= 0; n1--) {
				if (osdApP[n1] === 1) continue;
				const t0 = s0 ^ osdRowParity[n1 * PW]!;
				const t1 = s1 ^ osdRowParity[n1 * PW + 1]!;
				nd1kpt = popcount32(t0) + popcount32(t1 & NT_MASK1) + 2;
				if (nd1kpt > ntheta) continue;
				const t2 = s2 ^ osdRowParity[n1 * PW + 2]!;
				const dd = d1 + osdAbsP[n1]! + paritySum(t0, t1, t2, osdAbsP);
				if (dd < dmin) {
					dmin = dd;
					bestA = iflag;
					bestB = n1;
				}
			}
		}
	}

	// Build the best codeword: c0 + rows bestA and bestB of the reduced generator.
	const cwP = osdC0;
	if (bestA >= 0) {
		for (const row of [bestA, bestB]) {
			if (row < 0) continue;
			const w = row >>> 5;
			const mask = 1 << (row & 31);
			for (let c = 0; c < N; c++) {
				if ((cols[c * RW + w]! & mask) !== 0) cwP[c] = cwP[c]! ^ 1;
			}
		}
		nhardmin = 0;
		for (let c = 0; c < N; c++) if (cwP[c] !== osdHdecP[c]) nhardmin++;
	}

	const cw = new Array<number>(N);
	for (let i = 0; i < N; i++) cw[indices[i]!] = cwP[i]!;
	if (!crc14Matches(cw)) nhardmin = -nhardmin;
	return { cw, nhardmin };
}

function buildGeneratorColumns(): Int32Array {
	const colsOut = new Int32Array(N * RW);
	// Identity for the information positions.
	for (let i = 0; i < KK; i++) {
		colsOut[i * RW + (i >>> 5)] = 1 << (i & 31);
	}
	// gHex encodes the M×K generator parity matrix: parity bit m depends on info bit col.
	for (let m = 0; m < M_LDPC; m++) {
		const hexStr = gHex[m]!;
		const c = KK + m;
		for (let j = 0; j < 23; j++) {
			const val = parseInt(hexStr[j]!, 16);
			const limit = j === 22 ? 3 : 4;
			for (let jj = 1; jj <= limit; jj++) {
				const col = j * 4 + jj - 1;
				if (col < KK && (val & (1 << (4 - jj))) !== 0) {
					colsOut[c * RW + (col >>> 5)] = colsOut[c * RW + (col >>> 5)]! | (1 << (col & 31));
				}
			}
		}
	}
	return colsOut;
}
