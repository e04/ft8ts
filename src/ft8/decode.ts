import { N_LDPC, SAMPLE_RATE } from "../util/constants.js";
import { decode174_91 } from "../util/decode174_91.js";
import { fftComplex, nextPow2 } from "../util/fft.js";
import type { HashCallBook } from "../util/hashcall.js";
import { unpack77 } from "../util/unpack_jt77.js";
import { generateFT8Waveform } from "../util/waveform.js";
import { COSTAS, GRAY_MAP } from "./constants.js";
import { encodeMessage } from "./encode.js";

const NSPS = 1920;
const NFFT1 = 2 * NSPS; // 3840
const NSTEP = NSPS / 4; // 480
const NMAX = 15 * 12_000; // 180000
const NHSYM = Math.floor(NMAX / NSTEP) - 3; // 372
const NDOWN = 60;
const NN = 79;

const NFFT1_LONG = 192000;
const NFFT2 = 3200;
const NP2 = 2812;
const COSTAS_BLOCKS = 7;
const COSTAS_SYMBOL_LEN = 32;
const SYNC_TIME_SHIFTS = [0, 36, 72] as const;
const TAPER_SIZE = 101;
const TAPER_LAST = TAPER_SIZE - 1;
const TWO_PI = 2 * Math.PI;
const MAX_DECODE_PASSES_DEPTH3 = 2;
const SUBTRACTION_GAIN = 0.95;
const SUBTRACTION_PHASE_SHIFT = Math.PI / 2;
const MIN_SUBTRACTION_SNR = -22;
const FS2 = SAMPLE_RATE / NDOWN;
const DT2 = 1.0 / FS2;
const DOWNSAMPLE_DF = SAMPLE_RATE / NFFT1_LONG;
const DOWNSAMPLE_BAUD = SAMPLE_RATE / NSPS;
const DOWNSAMPLE_SCALE = Math.sqrt(NFFT2 / NFFT1_LONG);

const TAPER = buildTaper(TAPER_SIZE);
const COSTAS_SYNC = buildCostasSyncTemplates();
const FREQ_SHIFT_SYNC = buildFrequencyShiftSyncTemplates();

export interface DecodedMessage {
	freq: number;
	dt: number;
	snr: number;
	msg: string;
	sync: number;
}

export interface DecodeOptions {
	/** Sample rate (Hz), default 12000 */
	sampleRate?: number;
	/** Lower frequency bound (Hz), default 200 */
	freqLow?: number;
	/** Upper frequency bound (Hz), default 3000 */
	freqHigh?: number;
	/** Minimum sync threshold, default 1.3 */
	syncMin?: number;
	/** Decoding depth: 1=fast BP only, 2=BP+OSD, 3=deep */
	depth?: number;
	/** Maximum candidates to process */
	maxCandidates?: number;
	/**
	 * Hash call book for resolving hashed callsigns.
	 * When provided, decoded standard callsigns are saved into the book,
	 * and hashed callsigns (e.g. `<...>`) are resolved from it.
	 * Pass the same instance across multiple `decode` calls to accumulate
	 * callsign knowledge over time.
	 */
	hashCallBook?: HashCallBook;
}

/**
 * Decode all FT8 signals in an audio buffer.
 * Input: mono audio samples at `sampleRate` Hz, duration ~15s.
 */
export function decode(
	samples: Float32Array | Float64Array,
	options: DecodeOptions = {},
): DecodedMessage[] {
	const sampleRate = options.sampleRate ?? SAMPLE_RATE;
	const nfa = options.freqLow ?? 200;
	const nfb = options.freqHigh ?? 3000;
	const syncmin = options.syncMin ?? 1.2;
	const depth = options.depth ?? 2;
	const maxCandidates = options.maxCandidates ?? 300;
	const book = options.hashCallBook;

	const dd =
		sampleRate === SAMPLE_RATE
			? copySamplesToDecodeWindow(samples)
			: resample(samples, sampleRate, SAMPLE_RATE, NMAX);
	const residual = new Float64Array(dd);

	const cxRe = new Float64Array(NFFT1_LONG);
	const cxIm = new Float64Array(NFFT1_LONG);
	const workspace = createDecodeWorkspace();
	const toneCache = new Map<string, number[]>();

	const decoded: DecodedMessage[] = [];
	const seenMessages = new Set<string>();
	const maxPasses = depth >= 3 ? MAX_DECODE_PASSES_DEPTH3 : 1;

	for (let pass = 0; pass < maxPasses; pass++) {
		cxRe.fill(0);
		cxIm.fill(0);
		cxRe.set(residual);
		fftComplex(cxRe, cxIm, false);

		const { candidates, sbase } = sync8(residual, nfa, nfb, syncmin, maxCandidates);
		const coarseFrequencyUses = countCandidateFrequencies(candidates);
		const coarseDownsampleCache: DownsampleCache = new Map();
		let decodedInPass = 0;

		for (const cand of candidates) {
			const result = ft8b(
				residual,
				cxRe,
				cxIm,
				cand.freq,
				cand.dt,
				sbase,
				depth,
				book,
				workspace,
				coarseDownsampleCache,
				coarseFrequencyUses,
			);
			if (!result) continue;
			const messageKey = normalizeMessageKey(result.msg);
			if (seenMessages.has(messageKey)) continue;

			seenMessages.add(messageKey);
			decoded.push({
				freq: result.freq,
				dt: result.dt - 0.5,
				snr: result.snr,
				msg: result.msg,
				sync: cand.sync,
			});
			decodedInPass++;

			if (pass + 1 < maxPasses) {
				subtractDecodedSignal(residual, result, toneCache);
			}
		}

		if (decodedInPass === 0) break;
	}

	return decoded;
}

function normalizeMessageKey(msg: string): string {
	return msg.trim().replace(/\s+/g, " ").toUpperCase();
}

function countCandidateFrequencies(candidates: Candidate[]): FrequencyUseCounts {
	const counts: FrequencyUseCounts = new Map();
	for (const c of candidates) {
		counts.set(c.freq, (counts.get(c.freq) ?? 0) + 1);
	}
	return counts;
}

interface Candidate {
	freq: number;
	dt: number;
	sync: number;
}

interface Ft8bResult {
	msg: string;
	freq: number;
	dt: number;
	snr: number;
}

interface SyncTemplate {
	re: Float64Array;
	im: Float64Array;
}

interface FrequencyShiftSyncTemplate extends SyncTemplate {
	delf: number;
}

interface DownsampleSnapshot {
	re: Float64Array;
	im: Float64Array;
}

type DownsampleCache = Map<number, DownsampleSnapshot>;
type FrequencyUseCounts = Map<number, number>;

interface DecodeWorkspace {
	cd0Re: Float64Array;
	cd0Im: Float64Array;
	shiftRe: Float64Array;
	shiftIm: Float64Array;
	s8: Float64Array;
	csRe: Float64Array;
	csIm: Float64Array;
	symbRe: Float64Array;
	symbIm: Float64Array;
	s2: Float64Array;
	bmeta: Float64Array;
	bmetb: Float64Array;
	bmetc: Float64Array;
	bmetd: Float64Array;
	llr: Float64Array;
	apmask: Int8Array;
	ss: Float64Array;
}

function createDecodeWorkspace(): DecodeWorkspace {
	return {
		cd0Re: new Float64Array(NFFT2),
		cd0Im: new Float64Array(NFFT2),
		shiftRe: new Float64Array(NFFT2),
		shiftIm: new Float64Array(NFFT2),
		s8: new Float64Array(8 * NN),
		csRe: new Float64Array(8 * NN),
		csIm: new Float64Array(8 * NN),
		symbRe: new Float64Array(COSTAS_SYMBOL_LEN),
		symbIm: new Float64Array(COSTAS_SYMBOL_LEN),
		s2: new Float64Array(1 << 9),
		bmeta: new Float64Array(N_LDPC),
		bmetb: new Float64Array(N_LDPC),
		bmetc: new Float64Array(N_LDPC),
		bmetd: new Float64Array(N_LDPC),
		llr: new Float64Array(N_LDPC),
		apmask: new Int8Array(N_LDPC),
		ss: new Float64Array(9),
	};
}

function copySamplesToDecodeWindow(samples: Float32Array | Float64Array): Float64Array {
	const out = new Float64Array(NMAX);
	const len = Math.min(samples.length, NMAX);
	for (let i = 0; i < len; i++) out[i] = samples[i]!;
	return out;
}

function sync8(
	dd: Float64Array,
	nfa: number,
	nfb: number,
	syncmin: number,
	maxcand: number,
): { candidates: Candidate[]; sbase: Float64Array } {
	const JZ = 62;
	const fftSize = nextPow2(NFFT1); // 4096
	const halfSize = fftSize / 2;
	const tstep = NSTEP / SAMPLE_RATE;
	const df = SAMPLE_RATE / fftSize;
	const fac = 1.0 / 300.0;

	const s = new Float64Array(halfSize * NHSYM);
	const savg = new Float64Array(halfSize);
	const xRe = new Float64Array(fftSize);
	const xIm = new Float64Array(fftSize);

	for (let j = 0; j < NHSYM; j++) {
		const ia = j * NSTEP;
		xRe.fill(0);
		xIm.fill(0);
		for (let i = 0; i < NSPS && ia + i < dd.length; i++) xRe[i] = fac * dd[ia + i]!;
		fftComplex(xRe, xIm, false);
		for (let i = 0; i < halfSize; i++) {
			const power = xRe[i]! * xRe[i]! + xIm[i]! * xIm[i]!;
			s[i * NHSYM + j] = power;
			savg[i] = savg[i]! + power;
		}
	}

	const sbase = computeBaseline(savg, nfa, nfb, df, halfSize);

	const ia = Math.max(1, Math.round(nfa / df));
	const ib = Math.min(halfSize - 14, Math.round(nfb / df));
	const nssy = Math.floor(NSPS / NSTEP);
	const nfos = Math.round(SAMPLE_RATE / NSPS / df);
	const jstrt = Math.round(0.5 / tstep);
	const width = 2 * JZ + 1;
	const sync2d = new Float64Array((ib - ia + 1) * width);

	for (let i = ia; i <= ib; i++) {
		for (let jj = -JZ; jj <= JZ; jj++) {
			let ta = 0;
			let tb = 0;
			let tc = 0;
			let t0a = 0;
			let t0b = 0;
			let t0c = 0;

			for (let n = 0; n < COSTAS_BLOCKS; n++) {
				const m = jj + jstrt + nssy * n;
				const iCostas = i + nfos * COSTAS[n]!;

				if (m >= 0 && m < NHSYM && iCostas < halfSize) {
					ta += s[iCostas * NHSYM + m]!;
					for (let tone = 0; tone <= 6; tone++) {
						const idx = i + nfos * tone;
						if (idx < halfSize) t0a += s[idx * NHSYM + m]!;
					}
				}

				const m36 = m + nssy * 36;
				if (m36 >= 0 && m36 < NHSYM && iCostas < halfSize) {
					tb += s[iCostas * NHSYM + m36]!;
					for (let tone = 0; tone <= 6; tone++) {
						const idx = i + nfos * tone;
						if (idx < halfSize) t0b += s[idx * NHSYM + m36]!;
					}
				}

				const m72 = m + nssy * 72;
				if (m72 >= 0 && m72 < NHSYM && iCostas < halfSize) {
					tc += s[iCostas * NHSYM + m72]!;
					for (let tone = 0; tone <= 6; tone++) {
						const idx = i + nfos * tone;
						if (idx < halfSize) t0c += s[idx * NHSYM + m72]!;
					}
				}
			}

			const t = ta + tb + tc;
			const t0 = (t0a + t0b + t0c - t) / 6.0;
			const syncVal = t0 > 0 ? t / t0 : 0;

			const tbc = tb + tc;
			const t0bc = (t0b + t0c - tbc) / 6.0;
			const syncBc = t0bc > 0 ? tbc / t0bc : 0;

			sync2d[(i - ia) * width + (jj + JZ)] = Math.max(syncVal, syncBc);
		}
	}

	const candidates0: Candidate[] = [];
	const mlag = 10;
	for (let i = ia; i <= ib; i++) {
		let bestSync = -1;
		let bestJ = 0;
		for (let j = -mlag; j <= mlag; j++) {
			const v = sync2d[(i - ia) * width + (j + JZ)]!;
			if (v > bestSync) {
				bestSync = v;
				bestJ = j;
			}
		}

		let bestSync2 = -1;
		let bestJ2 = 0;
		for (let j = -JZ; j <= JZ; j++) {
			const v = sync2d[(i - ia) * width + (j + JZ)]!;
			if (v > bestSync2) {
				bestSync2 = v;
				bestJ2 = j;
			}
		}

		if (bestSync >= syncmin) {
			candidates0.push({
				freq: i * df,
				dt: (bestJ - 0.5) * tstep,
				sync: bestSync,
			});
		}
		if (bestJ2 !== bestJ && bestSync2 >= syncmin) {
			candidates0.push({
				freq: i * df,
				dt: (bestJ2 - 0.5) * tstep,
				sync: bestSync2,
			});
		}
	}

	const syncValues = candidates0.map((c) => c.sync);
	syncValues.sort((a, b) => a - b);
	const pctileIdx = Math.max(0, Math.round(0.4 * syncValues.length) - 1);
	const base = syncValues[pctileIdx] ?? 1;
	if (base > 0) {
		for (const c of candidates0) c.sync /= base;
	}

	for (let i = 0; i < candidates0.length; i++) {
		for (let j = 0; j < i; j++) {
			const fdiff = Math.abs(candidates0[i]!.freq - candidates0[j]!.freq);
			const tdiff = Math.abs(candidates0[i]!.dt - candidates0[j]!.dt);
			if (fdiff < 4.0 && tdiff < 0.04) {
				if (candidates0[i]!.sync >= candidates0[j]!.sync) {
					candidates0[j]!.sync = 0;
				} else {
					candidates0[i]!.sync = 0;
				}
			}
		}
	}

	const filtered = candidates0.filter((c) => c.sync >= syncmin);
	filtered.sort((a, b) => b.sync - a.sync);

	return { candidates: filtered.slice(0, maxcand), sbase };
}

function computeBaseline(
	savg: Float64Array,
	nfa: number,
	nfb: number,
	df: number,
	nh1: number,
): Float64Array {
	const sbase = new Float64Array(nh1);
	const ia = Math.max(1, Math.round(nfa / df));
	const ib = Math.min(nh1 - 1, Math.round(nfb / df));
	const window = 50;

	for (let i = 0; i < nh1; i++) {
		let sum = 0;
		let count = 0;
		const lo = Math.max(ia, i - window);
		const hi = Math.min(ib, i + window);
		for (let j = lo; j <= hi; j++) {
			sum += savg[j]!;
			count++;
		}
		sbase[i] = count > 0 ? 10 * Math.log10(Math.max(1e-30, sum / count)) : 0;
	}
	return sbase;
}

function ft8b(
	_dd0: Float64Array,
	cxRe: Float64Array,
	cxIm: Float64Array,
	f1: number,
	xdt: number,
	_sbase: Float64Array,
	depth: number,
	book: HashCallBook | undefined,
	workspace: DecodeWorkspace,
	coarseDownsampleCache: DownsampleCache,
	coarseFrequencyUses: FrequencyUseCounts,
): Ft8bResult | null {
	loadCoarseDownsample(cxRe, cxIm, f1, workspace, coarseDownsampleCache, coarseFrequencyUses);

	let ibest = findBestTimeOffset(workspace.cd0Re, workspace.cd0Im, xdt);
	const delfbest = findBestFrequencyShift(workspace.cd0Re, workspace.cd0Im, ibest);

	f1 += delfbest;
	ft8Downsample(cxRe, cxIm, f1, workspace);

	ibest = refineTimeOffset(workspace.cd0Re, workspace.cd0Im, ibest, workspace.ss);
	xdt = (ibest - 1) * DT2;

	extractSoftSymbols(workspace.cd0Re, workspace.cd0Im, ibest, workspace);
	const minCostasHits = depth >= 3 ? 6 : 7;
	if (!passesSyncGate(workspace.s8, minCostasHits)) return null;

	buildBitMetrics(workspace);
	const result = tryDecodePasses(workspace, depth);
	if (!result) return null;

	if (result.cw.every((b) => b === 0)) return null;

	const message77 = result.message91.slice(0, 77);
	if (!isValidMessageType(message77)) return null;

	const { msg, success } = unpack77(message77, book);
	if (!success || msg.trim().length === 0) return null;

	const snr = estimateSnr(workspace.s8, result.cw);
	return { msg, freq: f1, dt: xdt, snr };
}

function loadCoarseDownsample(
	cxRe: Float64Array,
	cxIm: Float64Array,
	f0: number,
	workspace: DecodeWorkspace,
	coarseDownsampleCache: DownsampleCache,
	coarseFrequencyUses: FrequencyUseCounts,
): void {
	const cached = coarseDownsampleCache.get(f0);
	if (cached) {
		workspace.cd0Re.set(cached.re);
		workspace.cd0Im.set(cached.im);
	} else {
		ft8Downsample(cxRe, cxIm, f0, workspace);
		const uses = coarseFrequencyUses.get(f0) ?? 0;
		if (uses > 1) {
			coarseDownsampleCache.set(f0, {
				re: new Float64Array(workspace.cd0Re),
				im: new Float64Array(workspace.cd0Im),
			});
		}
	}

	const remaining = (coarseFrequencyUses.get(f0) ?? 1) - 1;
	if (remaining <= 0) {
		coarseFrequencyUses.delete(f0);
		coarseDownsampleCache.delete(f0);
	} else {
		coarseFrequencyUses.set(f0, remaining);
	}
}

function findBestTimeOffset(cd0Re: Float64Array, cd0Im: Float64Array, xdt: number): number {
	const i0 = Math.round((xdt + 0.5) * FS2);
	let smax = 0;
	let ibest = i0;
	for (let idt = i0 - 10; idt <= i0 + 10; idt++) {
		const sync = sync8d(cd0Re, cd0Im, idt, COSTAS_SYNC.re, COSTAS_SYNC.im);
		if (sync > smax) {
			smax = sync;
			ibest = idt;
		}
	}
	return ibest;
}

function findBestFrequencyShift(cd0Re: Float64Array, cd0Im: Float64Array, ibest: number): number {
	let smax = 0;
	let delfbest = 0;

	for (const tpl of FREQ_SHIFT_SYNC) {
		const sync = sync8d(cd0Re, cd0Im, ibest, tpl.re, tpl.im);
		if (sync > smax) {
			smax = sync;
			delfbest = tpl.delf;
		}
	}

	return delfbest;
}

function refineTimeOffset(
	cd0Re: Float64Array,
	cd0Im: Float64Array,
	ibest: number,
	ss: Float64Array,
): number {
	for (let idt = -4; idt <= 4; idt++) {
		ss[idt + 4] = sync8d(cd0Re, cd0Im, ibest + idt, COSTAS_SYNC.re, COSTAS_SYNC.im);
	}

	let maxss = -1;
	let maxIdx = 4;
	for (let i = 0; i < 9; i++) {
		if (ss[i]! > maxss) {
			maxss = ss[i]!;
			maxIdx = i;
		}
	}

	return ibest + maxIdx - 4;
}

function extractSoftSymbols(
	cd0Re: Float64Array,
	cd0Im: Float64Array,
	ibest: number,
	workspace: DecodeWorkspace,
): void {
	const { s8, csRe, csIm, symbRe, symbIm } = workspace;

	for (let k = 0; k < NN; k++) {
		const i1 = ibest + k * COSTAS_SYMBOL_LEN;
		symbRe.fill(0);
		symbIm.fill(0);

		if (i1 >= 0 && i1 + COSTAS_SYMBOL_LEN - 1 < NP2) {
			for (let j = 0; j < COSTAS_SYMBOL_LEN; j++) {
				symbRe[j] = cd0Re[i1 + j]!;
				symbIm[j] = cd0Im[i1 + j]!;
			}
		}

		fftComplex(symbRe, symbIm, false);
		for (let tone = 0; tone < 8; tone++) {
			const re = symbRe[tone]! / 1000;
			const im = symbIm[tone]! / 1000;
			const idx = tone * NN + k;
			csRe[idx] = re;
			csIm[idx] = im;
			s8[idx] = Math.sqrt(re * re + im * im);
		}
	}
}

function passesSyncGate(s8: Float64Array, minCostasHits: number): boolean {
	let nsync = 0;
	for (let k = 0; k < COSTAS_BLOCKS; k++) {
		for (const offset of SYNC_TIME_SHIFTS) {
			let maxTone = 0;
			let maxVal = -1;
			for (let t = 0; t < 8; t++) {
				const v = s8[t * NN + k + offset]!;
				if (v > maxVal) {
					maxVal = v;
					maxTone = t;
				}
			}
			if (maxTone === COSTAS[k]) nsync++;
		}
	}
	return nsync >= minCostasHits;
}

function buildBitMetrics(workspace: DecodeWorkspace): void {
	const { csRe, csIm, bmeta, bmetb, bmetc, bmetd, s2 } = workspace;

	bmeta.fill(0);
	bmetb.fill(0);
	bmetc.fill(0);
	bmetd.fill(0);

	for (let nsym = 1; nsym <= 3; nsym++) {
		const nt = 1 << (3 * nsym);
		const ibmax = nsym === 1 ? 2 : nsym === 2 ? 5 : 8;

		for (let ihalf = 1; ihalf <= 2; ihalf++) {
			for (let k = 1; k <= 29; k += nsym) {
				const ks = ihalf === 1 ? k + 7 : k + 43;

				for (let i = 0; i < nt; i++) {
					const i1 = Math.floor(i / 64);
					const i2 = Math.floor((i & 63) / 8);
					const i3 = i & 7;
					if (nsym === 1) {
						const re = csRe[GRAY_MAP[i3]! * NN + ks - 1]!;
						const im = csIm[GRAY_MAP[i3]! * NN + ks - 1]!;
						s2[i] = Math.sqrt(re * re + im * im);
					} else if (nsym === 2) {
						const sRe = csRe[GRAY_MAP[i2]! * NN + ks - 1]! + csRe[GRAY_MAP[i3]! * NN + ks]!;
						const sIm = csIm[GRAY_MAP[i2]! * NN + ks - 1]! + csIm[GRAY_MAP[i3]! * NN + ks]!;
						s2[i] = Math.sqrt(sRe * sRe + sIm * sIm);
					} else {
						const sRe =
							csRe[GRAY_MAP[i1]! * NN + ks - 1]! +
							csRe[GRAY_MAP[i2]! * NN + ks]! +
							csRe[GRAY_MAP[i3]! * NN + ks + 1]!;
						const sIm =
							csIm[GRAY_MAP[i1]! * NN + ks - 1]! +
							csIm[GRAY_MAP[i2]! * NN + ks]! +
							csIm[GRAY_MAP[i3]! * NN + ks + 1]!;
						s2[i] = Math.sqrt(sRe * sRe + sIm * sIm);
					}
				}

				const i32 = 1 + (k - 1) * 3 + (ihalf - 1) * 87;
				for (let ib = 0; ib <= ibmax; ib++) {
					let max1 = -1e30;
					let max0 = -1e30;
					for (let i = 0; i < nt; i++) {
						const bitSet = (i & (1 << (ibmax - ib))) !== 0;
						if (bitSet) {
							if (s2[i]! > max1) max1 = s2[i]!;
						} else {
							if (s2[i]! > max0) max0 = s2[i]!;
						}
					}

					const idx = i32 + ib - 1;
					if (idx < 0 || idx >= N_LDPC) continue;

					const bm = max1 - max0;
					if (nsym === 1) {
						bmeta[idx] = bm;
						const den = Math.max(max1, max0);
						bmetd[idx] = den > 0 ? bm / den : 0;
					} else if (nsym === 2) {
						bmetb[idx] = bm;
					} else {
						bmetc[idx] = bm;
					}
				}
			}
		}
	}

	normalizeBmet(bmeta);
	normalizeBmet(bmetb);
	normalizeBmet(bmetc);
	normalizeBmet(bmetd);
}

function tryDecodePasses(
	workspace: DecodeWorkspace,
	depth: number,
): import("../util/decode174_91.js").DecodeResult | null {
	const scalefac = 2.83;
	const maxosd = depth >= 3 ? 2 : depth >= 2 ? 0 : -1;
	const bmetrics = [workspace.bmeta, workspace.bmetb, workspace.bmetc, workspace.bmetd];

	workspace.apmask.fill(0);

	for (let ipass = 0; ipass < 4; ipass++) {
		const metric = bmetrics[ipass]!;
		for (let i = 0; i < N_LDPC; i++) workspace.llr[i] = scalefac * metric[i]!;

		const result = decode174_91(workspace.llr, workspace.apmask, maxosd);
		if (result && result.nharderrors >= 0 && result.nharderrors <= 36) return result;
	}

	return null;
}

function isValidMessageType(message77: number[]): boolean {
	const n3v = (message77[71]! << 2) | (message77[72]! << 1) | message77[73]!;
	const i3v = (message77[74]! << 2) | (message77[75]! << 1) | message77[76]!;
	if (i3v > 5 || (i3v === 0 && n3v > 6)) return false;
	if (i3v === 0 && n3v === 2) return false;
	return true;
}

function estimateSnr(s8: Float64Array, cw: number[]): number {
	let xsig = 0;
	let xnoi = 0;
	const itone = getTones(cw);

	for (let i = 0; i < 79; i++) {
		xsig += s8[itone[i]! * NN + i]! ** 2;
		const ios = (itone[i]! + 4) % 7;
		xnoi += s8[ios * NN + i]! ** 2;
	}

	let snr = 0.001;
	const arg = xsig / Math.max(xnoi, 1e-30) - 1.0;
	if (arg > 0.1) snr = arg;
	snr = 10 * Math.log10(snr) - 27.0;
	return snr < -24 ? -24 : snr;
}

function getTones(cw: number[]): number[] {
	const tones = new Array(79).fill(0) as number[];
	for (let i = 0; i < 7; i++) tones[i] = COSTAS[i]!;
	for (let i = 0; i < 7; i++) tones[36 + i] = COSTAS[i]!;
	for (let i = 0; i < 7; i++) tones[72 + i] = COSTAS[i]!;

	let k = 7;
	for (let j = 1; j <= 58; j++) {
		const i = (j - 1) * 3;
		if (j === 30) k += 7;
		const indx = cw[i]! * 4 + cw[i + 1]! * 2 + cw[i + 2]!;
		tones[k] = GRAY_MAP[indx]!;
		k++;
	}
	return tones;
}

/**
 * Mix f0 to baseband and decimate by NDOWN (60x) by extracting frequency bins.
 * Identical to Fortran ft8_downsample.
 */
function ft8Downsample(
	cxRe: Float64Array,
	cxIm: Float64Array,
	f0: number,
	workspace: DecodeWorkspace,
): void {
	const { cd0Re, cd0Im, shiftRe, shiftIm } = workspace;
	const df = DOWNSAMPLE_DF;
	const baud = DOWNSAMPLE_BAUD;
	const i0 = Math.round(f0 / df);
	const ft = f0 + 8.5 * baud;
	const it = Math.min(Math.round(ft / df), NFFT1_LONG / 2);
	const fb = f0 - 1.5 * baud;
	const ib = Math.max(1, Math.round(fb / df));

	cd0Re.fill(0);
	cd0Im.fill(0);
	let k = 0;
	for (let i = ib; i <= it; i++) {
		if (k >= NFFT2) break;
		cd0Re[k] = cxRe[i]!;
		cd0Im[k] = cxIm[i]!;
		k++;
	}

	for (let i = 0; i <= TAPER_LAST; i++) {
		if (i >= NFFT2) break;
		const tap = TAPER[TAPER_LAST - i]!;
		cd0Re[i] = cd0Re[i]! * tap;
		cd0Im[i] = cd0Im[i]! * tap;
	}

	const endTap = k - 1;
	for (let i = 0; i <= TAPER_LAST; i++) {
		const idx = endTap - TAPER_LAST + i;
		if (idx >= 0 && idx < NFFT2) {
			const tap = TAPER[i]!;
			cd0Re[idx] = cd0Re[idx]! * tap;
			cd0Im[idx] = cd0Im[idx]! * tap;
		}
	}

	const shift = i0 - ib;
	for (let i = 0; i < NFFT2; i++) {
		let srcIdx = (i + shift) % NFFT2;
		if (srcIdx < 0) srcIdx += NFFT2;
		shiftRe[i] = cd0Re[srcIdx]!;
		shiftIm[i] = cd0Im[srcIdx]!;
	}
	for (let i = 0; i < NFFT2; i++) {
		cd0Re[i] = shiftRe[i]!;
		cd0Im[i] = shiftIm[i]!;
	}

	fftComplex(cd0Re, cd0Im, true);

	for (let i = 0; i < NFFT2; i++) {
		cd0Re[i] = cd0Re[i]! * DOWNSAMPLE_SCALE;
		cd0Im[i] = cd0Im[i]! * DOWNSAMPLE_SCALE;
	}
}

function sync8d(
	cd0Re: Float64Array,
	cd0Im: Float64Array,
	i0: number,
	syncRe: Float64Array,
	syncIm: Float64Array,
): number {
	let sync = 0;
	const stride = 36 * COSTAS_SYMBOL_LEN;

	for (let i = 0; i < COSTAS_BLOCKS; i++) {
		const base = i * COSTAS_SYMBOL_LEN;
		let iStart = i0 + i * COSTAS_SYMBOL_LEN;

		for (let block = 0; block < 3; block++, iStart += stride) {
			if (iStart < 0 || iStart + COSTAS_SYMBOL_LEN - 1 >= NP2) continue;

			let zRe = 0;
			let zIm = 0;
			for (let j = 0; j < COSTAS_SYMBOL_LEN; j++) {
				const sRe = syncRe[base + j]!;
				const sIm = syncIm[base + j]!;
				const dRe = cd0Re[iStart + j]!;
				const dIm = cd0Im[iStart + j]!;
				zRe += dRe * sRe + dIm * sIm;
				zIm += dIm * sRe - dRe * sIm;
			}
			sync += zRe * zRe + zIm * zIm;
		}
	}

	return sync;
}

function normalizeBmet(bmet: Float64Array): void {
	const n = bmet.length;
	let sum = 0;
	let sum2 = 0;
	for (let i = 0; i < n; i++) {
		sum += bmet[i]!;
		sum2 += bmet[i]! * bmet[i]!;
	}
	const avg = sum / n;
	const avg2 = sum2 / n;
	const variance = avg2 - avg * avg;
	const sigma = variance > 0 ? Math.sqrt(variance) : Math.sqrt(avg2);
	if (sigma > 0) {
		for (let i = 0; i < n; i++) bmet[i] = bmet[i]! / sigma;
	}
}

function resample(
	input: Float32Array | Float64Array,
	fromRate: number,
	toRate: number,
	outLen: number,
): Float64Array {
	const out = new Float64Array(outLen);
	const ratio = fromRate / toRate;
	for (let i = 0; i < outLen; i++) {
		const srcIdx = i * ratio;
		const lo = Math.floor(srcIdx);
		const frac = srcIdx - lo;
		const v0 = lo < input.length ? (input[lo] ?? 0) : 0;
		const v1 = lo + 1 < input.length ? (input[lo + 1] ?? 0) : 0;
		out[i] = v0 * (1 - frac) + v1 * frac;
	}
	return out;
}

function subtractDecodedSignal(
	residual: Float64Array,
	result: Ft8bResult,
	toneCache: Map<string, number[]>,
): void {
	if (result.snr < MIN_SUBTRACTION_SNR) return;

	const msgKey = normalizeMessageKey(result.msg);
	let tones = toneCache.get(msgKey);
	if (!tones) {
		try {
			tones = encodeMessage(result.msg);
		} catch {
			return;
		}
		toneCache.set(msgKey, tones);
	}

	const waveI = generateFT8Waveform(tones, {
		sampleRate: SAMPLE_RATE,
		samplesPerSymbol: NSPS,
		baseFrequency: result.freq,
		initialPhase: 0,
	});
	const waveQ = generateFT8Waveform(tones, {
		sampleRate: SAMPLE_RATE,
		samplesPerSymbol: NSPS,
		baseFrequency: result.freq,
		initialPhase: SUBTRACTION_PHASE_SHIFT,
	});

	const start = Math.round(result.dt * SAMPLE_RATE);
	let srcStart = start;
	let tplStart = 0;
	if (srcStart < 0) {
		tplStart = -srcStart;
		srcStart = 0;
	}
	const maxLen = Math.min(
		residual.length - srcStart,
		waveI.length - tplStart,
		waveQ.length - tplStart,
	);
	if (maxLen <= 0) return;

	let sii = 0;
	let sqq = 0;
	let siq = 0;
	let sri = 0;
	let srq = 0;
	for (let i = 0; i < maxLen; i++) {
		const wi = waveI[tplStart + i]!;
		const wq = waveQ[tplStart + i]!;
		const rv = residual[srcStart + i]!;
		sii += wi * wi;
		sqq += wq * wq;
		siq += wi * wq;
		sri += rv * wi;
		srq += rv * wq;
	}

	const det = sii * sqq - siq * siq;
	if (det <= 1e-9) return;

	const ampI = (sri * sqq - srq * siq) / det;
	const ampQ = (srq * sii - sri * siq) / det;

	for (let i = 0; i < maxLen; i++) {
		const wi = waveI[tplStart + i]!;
		const wq = waveQ[tplStart + i]!;
		const idx = srcStart + i;
		residual[idx] = residual[idx]! - SUBTRACTION_GAIN * (ampI * wi + ampQ * wq);
	}
}

function buildTaper(size: number): Float64Array {
	const taper = new Float64Array(size);
	const last = size - 1;
	for (let i = 0; i < size; i++) taper[i] = 0.5 * (1.0 + Math.cos((i * Math.PI) / last));
	return taper;
}

function buildCostasSyncTemplates(): { re: Float64Array; im: Float64Array } {
	const re = new Float64Array(COSTAS_BLOCKS * COSTAS_SYMBOL_LEN);
	const im = new Float64Array(COSTAS_BLOCKS * COSTAS_SYMBOL_LEN);
	for (let i = 0; i < COSTAS_BLOCKS; i++) {
		let phi = 0;
		const dphi = (TWO_PI * COSTAS[i]!) / COSTAS_SYMBOL_LEN;
		for (let j = 0; j < COSTAS_SYMBOL_LEN; j++) {
			re[i * COSTAS_SYMBOL_LEN + j] = Math.cos(phi);
			im[i * COSTAS_SYMBOL_LEN + j] = Math.sin(phi);
			phi = (phi + dphi) % TWO_PI;
		}
	}
	return { re, im };
}

function buildFrequencyShiftSyncTemplates(): FrequencyShiftSyncTemplate[] {
	const templates: FrequencyShiftSyncTemplate[] = [];

	for (let ifr = -5; ifr <= 5; ifr++) {
		const delf = ifr * 0.5;
		const dphi = TWO_PI * delf * DT2;
		const twkRe = new Float64Array(COSTAS_SYMBOL_LEN);
		const twkIm = new Float64Array(COSTAS_SYMBOL_LEN);

		let phi = 0;
		for (let j = 0; j < COSTAS_SYMBOL_LEN; j++) {
			twkRe[j] = Math.cos(phi);
			twkIm[j] = Math.sin(phi);
			phi = (phi + dphi) % TWO_PI;
		}

		const re = new Float64Array(COSTAS_BLOCKS * COSTAS_SYMBOL_LEN);
		const im = new Float64Array(COSTAS_BLOCKS * COSTAS_SYMBOL_LEN);
		for (let i = 0; i < COSTAS_BLOCKS; i++) {
			const base = i * COSTAS_SYMBOL_LEN;
			for (let j = 0; j < COSTAS_SYMBOL_LEN; j++) {
				const idx = base + j;
				const csRe = COSTAS_SYNC.re[idx]!;
				const csIm = COSTAS_SYNC.im[idx]!;
				const tRe = twkRe[j]! * csRe - twkIm[j]! * csIm;
				const tIm = twkRe[j]! * csIm + twkIm[j]! * csRe;
				re[idx] = tRe;
				im[idx] = tIm;
			}
		}
		templates.push({ delf, re, im });
	}

	return templates;
}
