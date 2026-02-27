import { SAMPLE_RATE } from "../util/constants.js";
import { decode174_91 } from "../util/decode174_91.js";
import { fftComplex } from "../util/fft.js";
import type { HashCallBook } from "../util/hashcall.js";
import { unpack77 } from "../util/unpack_jt77.js";
import { GRAYMAP } from "./constants.js";
import { xorWithScrambler } from "./scramble.js";

const COSTAS_A = [0, 1, 3, 2] as const;
const COSTAS_B = [1, 0, 2, 3] as const;
const COSTAS_C = [2, 3, 1, 0] as const;
const COSTAS_D = [3, 2, 0, 1] as const;
const NSPS = 576;
const NFFT1 = 4 * NSPS; // 2304
const NH1 = NFFT1 / 2; // 1152
const NMAX = 21 * 3456; // 72576
const NHSYM = Math.floor((NMAX - NFFT1) / NSPS); // 122
const NDOWN = 18;
const NN = 103;
const NFFT2 = NMAX / NDOWN; // 4032
const NSS = NSPS / NDOWN; // 32
const FS2 = SAMPLE_RATE / NDOWN; // 666.67 Hz
const MAX_FREQ = 4910;
const SYNC_PASS_MIN = 1.2;
const TWO_PI = 2 * Math.PI;
const HARD_SYNC_PATTERNS = [
	{ offset: 0, bits: [0, 0, 0, 1, 1, 0, 1, 1] as const },
	{ offset: 66, bits: [0, 1, 0, 0, 1, 1, 1, 0] as const },
	{ offset: 132, bits: [1, 1, 1, 0, 0, 1, 0, 0] as const },
	{ offset: 198, bits: [1, 0, 1, 1, 0, 0, 0, 1] as const },
] as const;

const COSTAS_BLOCKS = 4;
const FT4_SYNC_STRIDE = 33 * NSS;
const FT4_MAX_TWEAK = 16;
const LDPC_BITS = 174;
const BITMETRIC_LEN = 2 * NN;
const FRAME_LEN = NN * NSS;

const NUTTALL_WINDOW = makeNuttallWindow(NFFT1);
const DOWNSAMPLE_CTX = createDownsampleContext();
const TWEAKED_SYNC_TEMPLATES = createTweakedSyncTemplates();

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
	/** Minimum sync threshold, default 1.2 */
	syncMin?: number;
	/** Decoding depth: 1=fast BP only, 2=BP+OSD, 3=deep */
	depth?: number;
	/** Maximum candidates to process */
	maxCandidates?: number;
	/**
	 * Hash call book for resolving hashed callsigns.
	 * Reuse the same instance across frames to accumulate callsign knowledge.
	 */
	hashCallBook?: HashCallBook;
}

interface Candidate {
	freq: number;
	sync: number;
}

interface DownsampleContext {
	df: number;
	window: Float64Array;
}

interface SyncTemplate {
	re: Float64Array;
	im: Float64Array;
}

type SyncTemplates = [SyncTemplate, SyncTemplate, SyncTemplate, SyncTemplate];

interface DecodeWorkspace {
	coarseRe: Float64Array;
	coarseIm: Float64Array;
	fineRe: Float64Array;
	fineIm: Float64Array;
	frameRe: Float64Array;
	frameIm: Float64Array;
	symbRe: Float64Array;
	symbIm: Float64Array;
	csRe: Float64Array;
	csIm: Float64Array;
	s4: Float64Array;
	s2: Float64Array;
	bitmetrics1: Float64Array;
	bitmetrics2: Float64Array;
	bitmetrics3: Float64Array;
	llra: Float64Array;
	llrb: Float64Array;
	llrc: Float64Array;
	llr: Float64Array;
	apmask: Int8Array;
}

interface CandidateSearchResult {
	ibest: number;
	idfbest: number;
	smax: number;
}

/**
 * Decode all FT4 signals in a buffer.
 * Input: mono audio samples at `sampleRate` Hz, duration ~6s.
 */
export function decode(
	samples: Float32Array | Float64Array,
	options: DecodeOptions = {},
): DecodedMessage[] {
	const sampleRate = options.sampleRate ?? SAMPLE_RATE;
	const freqLow = options.freqLow ?? 200;
	const freqHigh = options.freqHigh ?? 3000;
	const syncMin = options.syncMin ?? 1.2;
	const depth = options.depth ?? 2;
	const maxCandidates = options.maxCandidates ?? 100;
	const book = options.hashCallBook;

	const dd =
		sampleRate === SAMPLE_RATE
			? copySamplesToDecodeWindow(samples)
			: resample(samples, sampleRate, SAMPLE_RATE, NMAX);

	const cxRe = new Float64Array(NMAX);
	const cxIm = new Float64Array(NMAX);
	for (let i = 0; i < NMAX; i++) cxRe[i] = dd[i] ?? 0;
	fftComplex(cxRe, cxIm, false);

	const candidates = getCandidates4(dd, freqLow, freqHigh, syncMin, maxCandidates);
	if (candidates.length === 0) return [];

	const workspace = createDecodeWorkspace();
	const decoded: DecodedMessage[] = [];
	const seenMessages = new Set<string>();

	for (const candidate of candidates) {
		const one = decodeCandidate(candidate, cxRe, cxIm, depth, book, workspace);
		if (!one) continue;
		if (seenMessages.has(one.msg)) continue;

		seenMessages.add(one.msg);
		decoded.push(one);
	}

	return decoded;
}

function createDecodeWorkspace(): DecodeWorkspace {
	return {
		coarseRe: new Float64Array(NFFT2),
		coarseIm: new Float64Array(NFFT2),
		fineRe: new Float64Array(NFFT2),
		fineIm: new Float64Array(NFFT2),
		frameRe: new Float64Array(FRAME_LEN),
		frameIm: new Float64Array(FRAME_LEN),
		symbRe: new Float64Array(NSS),
		symbIm: new Float64Array(NSS),
		csRe: new Float64Array(4 * NN),
		csIm: new Float64Array(4 * NN),
		s4: new Float64Array(4 * NN),
		s2: new Float64Array(1 << 8),
		bitmetrics1: new Float64Array(BITMETRIC_LEN),
		bitmetrics2: new Float64Array(BITMETRIC_LEN),
		bitmetrics3: new Float64Array(BITMETRIC_LEN),
		llra: new Float64Array(LDPC_BITS),
		llrb: new Float64Array(LDPC_BITS),
		llrc: new Float64Array(LDPC_BITS),
		llr: new Float64Array(LDPC_BITS),
		apmask: new Int8Array(LDPC_BITS),
	};
}

function copySamplesToDecodeWindow(samples: Float32Array | Float64Array): Float64Array {
	const out = new Float64Array(NMAX);
	const len = Math.min(samples.length, NMAX);
	for (let i = 0; i < len; i++) out[i] = samples[i]!;
	return out;
}

function decodeCandidate(
	candidate: Candidate,
	cxRe: Float64Array,
	cxIm: Float64Array,
	depth: number,
	book: HashCallBook | undefined,
	workspace: DecodeWorkspace,
): DecodedMessage | null {
	ft4Downsample(cxRe, cxIm, candidate.freq, DOWNSAMPLE_CTX, workspace.coarseRe, workspace.coarseIm);
	normalizeComplexPower(workspace.coarseRe, workspace.coarseIm, NMAX / NDOWN);

	for (let segment = 1; segment <= 3; segment++) {
		const coarse = findBestSyncLocation(workspace.coarseRe, workspace.coarseIm, segment);
		if (coarse.smax < SYNC_PASS_MIN) continue;

		const f1 = candidate.freq + coarse.idfbest;
		if (f1 <= 10 || f1 >= 4990) continue;

		ft4Downsample(cxRe, cxIm, f1, DOWNSAMPLE_CTX, workspace.fineRe, workspace.fineIm);
		normalizeComplexPower(workspace.fineRe, workspace.fineIm, NSS * NN);
		extractFrame(
			workspace.fineRe,
			workspace.fineIm,
			coarse.ibest,
			workspace.frameRe,
			workspace.frameIm,
		);

		const badsync = buildBitMetrics(workspace.frameRe, workspace.frameIm, workspace);
		if (badsync) continue;
		if (!passesHardSyncQuality(workspace.bitmetrics1)) continue;

		buildLlrs(workspace);
		const result = tryDecodePasses(workspace, depth);
		if (!result) continue;

		const message77Scrambled = result.message91.slice(0, 77);
		if (!hasNonZeroBit(message77Scrambled)) continue;

		const message77 = xorWithScrambler(message77Scrambled);
		const { msg, success } = unpack77(message77, book);
		if (!success || msg.trim().length === 0) continue;

		return {
			freq: f1,
			dt: coarse.ibest / FS2 - 0.5,
			snr: toFt4Snr(candidate.sync - 1.0),
			msg,
			sync: coarse.smax,
		};
	}

	return null;
}

function findBestSyncLocation(
	cdRe: Float64Array,
	cdIm: Float64Array,
	segment: number,
): CandidateSearchResult {
	let ibest = -1;
	let idfbest = 0;
	let smax = -99;

	for (let isync = 1; isync <= 2; isync++) {
		let idfmin: number;
		let idfmax: number;
		let idfstp: number;
		let ibmin: number;
		let ibmax: number;
		let ibstp: number;

		if (isync === 1) {
			idfmin = -12;
			idfmax = 12;
			idfstp = 3;
			ibmin = -344;
			ibmax = 1012;
			if (segment === 1) {
				ibmin = 108;
				ibmax = 560;
			} else if (segment === 2) {
				ibmin = 560;
				ibmax = 1012;
			} else {
				ibmin = -344;
				ibmax = 108;
			}
			ibstp = 4;
		} else {
			idfmin = idfbest - 4;
			idfmax = idfbest + 4;
			idfstp = 1;
			ibmin = ibest - 5;
			ibmax = ibest + 5;
			ibstp = 1;
		}

		for (let idf = idfmin; idf <= idfmax; idf += idfstp) {
			const templates = TWEAKED_SYNC_TEMPLATES.get(idf);
			if (!templates) continue;

			for (let istart = ibmin; istart <= ibmax; istart += ibstp) {
				const sync = sync4d(cdRe, cdIm, istart, templates);
				if (sync > smax) {
					smax = sync;
					ibest = istart;
					idfbest = idf;
				}
			}
		}
	}

	return { ibest, idfbest, smax };
}

function getCandidates4(
	dd: Float64Array,
	freqLow: number,
	freqHigh: number,
	syncMin: number,
	maxCandidates: number,
): Candidate[] {
	const df = SAMPLE_RATE / NFFT1;
	const fac = 1 / 300;
	const savg = new Float64Array(NH1);
	const s = new Float64Array(NH1 * NHSYM);
	const savsm = new Float64Array(NH1);

	const xRe = new Float64Array(NFFT1);
	const xIm = new Float64Array(NFFT1);

	for (let j = 0; j < NHSYM; j++) {
		const ia = j * NSPS;
		const ib = ia + NFFT1;
		if (ib > NMAX) break;

		xIm.fill(0);
		for (let i = 0; i < NFFT1; i++) xRe[i] = fac * dd[ia + i]! * NUTTALL_WINDOW[i]!;
		fftComplex(xRe, xIm, false);

		for (let bin = 1; bin <= NH1; bin++) {
			const idx = bin - 1;
			const re = xRe[bin] ?? 0;
			const im = xIm[bin] ?? 0;
			const power = re * re + im * im;
			s[idx * NHSYM + j] = power;
			savg[idx] = (savg[idx] ?? 0) + power;
		}
	}

	for (let i = 0; i < NH1; i++) savg[i] = (savg[i] ?? 0) / NHSYM;

	for (let i = 7; i < NH1 - 7; i++) {
		let sum = 0;
		for (let j = i - 7; j <= i + 7; j++) sum += savg[j]!;
		savsm[i] = sum / 15;
	}

	let nfa = Math.round(freqLow / df);
	if (nfa < Math.round(200 / df)) nfa = Math.round(200 / df);
	let nfb = Math.round(freqHigh / df);
	if (nfb > Math.round(MAX_FREQ / df)) nfb = Math.round(MAX_FREQ / df);

	const sbase = ft4Baseline(savg, nfa, nfb, df);
	for (let bin = nfa; bin <= nfb; bin++) {
		if ((sbase[bin - 1] ?? 0) <= 0) return [];
	}

	for (let bin = nfa; bin <= nfb; bin++) {
		const idx = bin - 1;
		savsm[idx] = (savsm[idx] ?? 0) / sbase[idx]!;
	}

	const fOffset = (-1.5 * SAMPLE_RATE) / NSPS;
	const candidates: Candidate[] = [];

	for (let i = nfa + 1; i <= nfb - 1; i++) {
		const left = savsm[i - 2] ?? 0;
		const center = savsm[i - 1] ?? 0;
		const right = savsm[i] ?? 0;
		if (center >= left && center >= right && center >= syncMin) {
			const den = left - 2 * center + right;
			const del = den !== 0 ? (0.5 * (left - right)) / den : 0;
			const fpeak = (i + del) * df + fOffset;
			if (fpeak < 200 || fpeak > MAX_FREQ) continue;
			const speak = center - 0.25 * (left - right) * del;
			candidates.push({ freq: fpeak, sync: speak });
		}
	}

	candidates.sort((a, b) => b.sync - a.sync);
	return candidates.slice(0, maxCandidates);
}

function makeNuttallWindow(n: number): Float64Array {
	const out = new Float64Array(n);
	const a0 = 0.3635819;
	const a1 = -0.4891775;
	const a2 = 0.1365995;
	const a3 = -0.0106411;
	for (let i = 0; i < n; i++) {
		out[i] =
			a0 +
			a1 * Math.cos((2 * Math.PI * i) / n) +
			a2 * Math.cos((4 * Math.PI * i) / n) +
			a3 * Math.cos((6 * Math.PI * i) / n);
	}
	return out;
}

function ft4Baseline(savg: Float64Array, nfa: number, nfb: number, df: number): Float64Array {
	const sbase = new Float64Array(NH1);
	sbase.fill(1);

	const ia = Math.max(Math.round(200 / df), nfa);
	const ib = Math.min(NH1, nfb);
	if (ib <= ia) return sbase;

	const sDb = new Float64Array(NH1);
	for (let i = ia; i <= ib; i++) sDb[i - 1] = 10 * Math.log10(Math.max(1e-30, savg[i - 1]!));

	const nseg = 10;
	const npct = 10;
	const nlen = Math.max(1, Math.trunc((ib - ia + 1) / nseg));
	const i0 = Math.trunc((ib - ia + 1) / 2);

	const x: number[] = [];
	const y: number[] = [];
	for (let seg = 0; seg < nseg; seg++) {
		const ja = ia + seg * nlen;
		if (ja > ib) break;
		const jb = Math.min(ib, ja + nlen - 1);

		const vals: number[] = [];
		for (let i = ja; i <= jb; i++) vals.push(sDb[i - 1]!);
		const base = percentile(vals, npct);

		for (let i = ja; i <= jb; i++) {
			const v = sDb[i - 1]!;
			if (v <= base) {
				x.push(i - i0);
				y.push(v);
			}
		}
	}

	const coeff = x.length >= 5 ? polyfitLeastSquares(x, y, 4) : null;
	if (coeff) {
		for (let i = ia; i <= ib; i++) {
			const t = i - i0;
			const db =
				coeff[0]! + t * (coeff[1]! + t * (coeff[2]! + t * (coeff[3]! + t * coeff[4]!))) + 0.65;
			sbase[i - 1] = 10 ** (db / 10);
		}
	} else {
		const halfWindow = 25;
		for (let i = ia; i <= ib; i++) {
			const lo = Math.max(ia, i - halfWindow);
			const hi = Math.min(ib, i + halfWindow);
			let sum = 0;
			let count = 0;
			for (let j = lo; j <= hi; j++) {
				sum += savg[j - 1]!;
				count++;
			}
			sbase[i - 1] = count > 0 ? sum / count : 1;
		}
	}

	return sbase;
}

function percentile(values: readonly number[], pct: number): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const idx = Math.max(
		0,
		Math.min(sorted.length - 1, Math.floor((pct / 100) * (sorted.length - 1))),
	);
	return sorted[idx]!;
}

function polyfitLeastSquares(
	x: readonly number[],
	y: readonly number[],
	degree: number,
): number[] | null {
	const n = degree + 1;
	const mat = Array.from({ length: n }, () => new Float64Array(n + 1));

	const xPows = new Float64Array(2 * degree + 1);
	for (let p = 0; p <= 2 * degree; p++) {
		let sum = 0;
		for (let i = 0; i < x.length; i++) sum += x[i]! ** p;
		xPows[p] = sum;
	}

	for (let row = 0; row < n; row++) {
		for (let col = 0; col < n; col++) mat[row]![col] = xPows[row + col]!;
		let rhs = 0;
		for (let i = 0; i < x.length; i++) rhs += y[i]! * x[i]! ** row;
		mat[row]![n] = rhs;
	}

	for (let col = 0; col < n; col++) {
		let pivot = col;
		let maxAbs = Math.abs(mat[col]![col]!);
		for (let row = col + 1; row < n; row++) {
			const a = Math.abs(mat[row]![col]!);
			if (a > maxAbs) {
				maxAbs = a;
				pivot = row;
			}
		}
		if (maxAbs < 1e-12) return null;
		if (pivot !== col) {
			const tmp = mat[col]!;
			mat[col] = mat[pivot]!;
			mat[pivot] = tmp;
		}

		const pivotVal = mat[col]![col]!;
		for (let c = col; c <= n; c++) mat[col]![c] = mat[col]![c]! / pivotVal;

		for (let row = 0; row < n; row++) {
			if (row === col) continue;
			const factor = mat[row]![col]!;
			if (factor === 0) continue;
			for (let c = col; c <= n; c++) mat[row]![c] = mat[row]![c]! - factor * mat[col]![c]!;
		}
	}

	const coeff = new Array<number>(n);
	for (let i = 0; i < n; i++) coeff[i] = mat[i]![n]!;
	return coeff;
}

function createDownsampleContext(): DownsampleContext {
	const df = SAMPLE_RATE / NMAX;
	const baud = SAMPLE_RATE / NSPS;
	const bwTransition = 0.5 * baud;
	const bwFlat = 4 * baud;
	const iwt = Math.max(1, Math.trunc(bwTransition / df));
	const iwf = Math.max(1, Math.trunc(bwFlat / df));
	const iws = Math.trunc(baud / df);

	const raw = new Float64Array(NFFT2);
	for (let i = 0; i < iwt && i < raw.length; i++) {
		raw[i] = 0.5 * (1 + Math.cos((Math.PI * (iwt - 1 - i)) / iwt));
	}
	for (let i = iwt; i < iwt + iwf && i < raw.length; i++) raw[i] = 1;
	for (let i = iwt + iwf; i < 2 * iwt + iwf && i < raw.length; i++) {
		raw[i] = 0.5 * (1 + Math.cos((Math.PI * (i - (iwt + iwf))) / iwt));
	}

	const window = new Float64Array(NFFT2);
	for (let i = 0; i < NFFT2; i++) {
		const src = (i + iws) % NFFT2;
		window[i] = raw[src]!;
	}

	return { df, window };
}

function ft4Downsample(
	cxRe: Float64Array,
	cxIm: Float64Array,
	f0: number,
	ctx: DownsampleContext,
	outRe: Float64Array,
	outIm: Float64Array,
): void {
	outRe.fill(0);
	outIm.fill(0);
	const i0 = Math.round(f0 / ctx.df);

	if (i0 >= 0 && i0 <= NMAX / 2) {
		outRe[0] = cxRe[i0] ?? 0;
		outIm[0] = cxIm[i0] ?? 0;
	}

	for (let i = 1; i <= NFFT2 / 2; i++) {
		const hi = i0 + i;
		if (hi >= 0 && hi <= NMAX / 2) {
			outRe[i] = cxRe[hi] ?? 0;
			outIm[i] = cxIm[hi] ?? 0;
		}
		const lo = i0 - i;
		if (lo >= 0 && lo <= NMAX / 2) {
			const idx = NFFT2 - i;
			outRe[idx] = cxRe[lo] ?? 0;
			outIm[idx] = cxIm[lo] ?? 0;
		}
	}

	const scale = 1 / NFFT2;
	for (let i = 0; i < NFFT2; i++) {
		const w = (ctx.window[i] ?? 0) * scale;
		outRe[i] = outRe[i]! * w;
		outIm[i] = outIm[i]! * w;
	}

	fftComplex(outRe, outIm, true);
}

function normalizeComplexPower(re: Float64Array, im: Float64Array, denom: number): void {
	let sum = 0;
	for (let i = 0; i < re.length; i++) sum += re[i]! * re[i]! + im[i]! * im[i]!;
	if (sum <= 0) return;

	const scale = 1 / Math.sqrt(sum / denom);
	for (let i = 0; i < re.length; i++) {
		re[i] = re[i]! * scale;
		im[i] = im[i]! * scale;
	}
}

function extractFrame(
	cbRe: Float64Array,
	cbIm: Float64Array,
	ibest: number,
	outRe: Float64Array,
	outIm: Float64Array,
): void {
	for (let i = 0; i < outRe.length; i++) {
		const src = ibest + i;
		if (src >= 0 && src < cbRe.length) {
			outRe[i] = cbRe[src]!;
			outIm[i] = cbIm[src]!;
		} else {
			outRe[i] = 0;
			outIm[i] = 0;
		}
	}
}

function createTweakedSyncTemplates(): Map<number, SyncTemplates> {
	const base = createBaseSyncTemplates();
	const fsample = FS2 / 2;
	const out = new Map<number, SyncTemplates>();

	for (let idf = -FT4_MAX_TWEAK; idf <= FT4_MAX_TWEAK; idf++) {
		const tweak = createFrequencyTweak(idf, 2 * NSS, fsample);
		out.set(idf, [
			applyTweak(base[0], tweak),
			applyTweak(base[1], tweak),
			applyTweak(base[2], tweak),
			applyTweak(base[3], tweak),
		]);
	}

	return out;
}

function createBaseSyncTemplates(): SyncTemplates {
	return [
		buildSyncTemplate(COSTAS_A),
		buildSyncTemplate(COSTAS_B),
		buildSyncTemplate(COSTAS_C),
		buildSyncTemplate(COSTAS_D),
	];
}

function buildSyncTemplate(tones: readonly number[]): SyncTemplate {
	const re = new Float64Array(2 * NSS);
	const im = new Float64Array(2 * NSS);
	let k = 0;
	let phi = 0;

	for (const tone of tones) {
		const dphi = (TWO_PI * tone * 2) / NSS;
		for (let j = 0; j < NSS / 2; j++) {
			re[k] = Math.cos(phi);
			im[k] = Math.sin(phi);
			phi = (phi + dphi) % TWO_PI;
			k++;
		}
	}

	return { re, im };
}

function createFrequencyTweak(idf: number, npts: number, fsample: number): SyncTemplate {
	const re = new Float64Array(npts);
	const im = new Float64Array(npts);
	const dphi = (TWO_PI * idf) / fsample;
	const stepRe = Math.cos(dphi);
	const stepIm = Math.sin(dphi);
	let wRe = 1;
	let wIm = 0;

	for (let i = 0; i < npts; i++) {
		const newRe = wRe * stepRe - wIm * stepIm;
		const newIm = wRe * stepIm + wIm * stepRe;
		wRe = newRe;
		wIm = newIm;
		re[i] = wRe;
		im[i] = wIm;
	}

	return { re, im };
}

function applyTweak(template: SyncTemplate, tweak: SyncTemplate): SyncTemplate {
	const re = new Float64Array(template.re.length);
	const im = new Float64Array(template.im.length);
	for (let i = 0; i < template.re.length; i++) {
		const sr = template.re[i]!;
		const si = template.im[i]!;
		const tr = tweak.re[i]!;
		const ti = tweak.im[i]!;
		re[i] = tr * sr - ti * si;
		im[i] = tr * si + ti * sr;
	}
	return { re, im };
}

function sync4d(
	cdRe: Float64Array,
	cdIm: Float64Array,
	i0: number,
	templates: SyncTemplates,
): number {
	let sync = 0;
	for (let i = 0; i < COSTAS_BLOCKS; i++) {
		const start = i0 + i * FT4_SYNC_STRIDE;
		const z = correlateStride2(cdRe, cdIm, start, templates[i]!.re, templates[i]!.im);
		if (z.count <= 16) continue;
		sync += Math.hypot(z.re, z.im) / (2 * NSS);
	}
	return sync;
}

function correlateStride2(
	cdRe: Float64Array,
	cdIm: Float64Array,
	start: number,
	templateRe: Float64Array,
	templateIm: Float64Array,
): { re: number; im: number; count: number } {
	let zRe = 0;
	let zIm = 0;
	let count = 0;
	for (let i = 0; i < templateRe.length; i++) {
		const idx = start + 2 * i;
		if (idx < 0 || idx >= cdRe.length) continue;
		const sRe = templateRe[i]!;
		const sIm = templateIm[i]!;
		const dRe = cdRe[idx]!;
		const dIm = cdIm[idx]!;
		zRe += dRe * sRe + dIm * sIm;
		zIm += dIm * sRe - dRe * sIm;
		count++;
	}
	return { re: zRe, im: zIm, count };
}

function buildBitMetrics(
	cdRe: Float64Array,
	cdIm: Float64Array,
	workspace: DecodeWorkspace,
): boolean {
	const { csRe, csIm, s4, symbRe, symbIm, bitmetrics1, bitmetrics2, bitmetrics3, s2 } = workspace;

	for (let k = 0; k < NN; k++) {
		const i1 = k * NSS;
		for (let i = 0; i < NSS; i++) {
			symbRe[i] = cdRe[i1 + i]!;
			symbIm[i] = cdIm[i1 + i]!;
		}
		fftComplex(symbRe, symbIm, false);

		for (let tone = 0; tone < 4; tone++) {
			const idx = tone * NN + k;
			const re = symbRe[tone]!;
			const im = symbIm[tone]!;
			csRe[idx] = re;
			csIm[idx] = im;
			s4[idx] = Math.hypot(re, im);
		}
	}

	let nsync = 0;
	for (let k = 0; k < 4; k++) {
		if (maxTone(s4, k) === COSTAS_A[k]) nsync++;
		if (maxTone(s4, 33 + k) === COSTAS_B[k]) nsync++;
		if (maxTone(s4, 66 + k) === COSTAS_C[k]) nsync++;
		if (maxTone(s4, 99 + k) === COSTAS_D[k]) nsync++;
	}

	bitmetrics1.fill(0);
	bitmetrics2.fill(0);
	bitmetrics3.fill(0);
	if (nsync < 6) return true;

	for (let nseq = 1; nseq <= 3; nseq++) {
		const nsym = nseq === 1 ? 1 : nseq === 2 ? 2 : 4;
		const nt = 1 << (2 * nsym);
		const ibmax = nseq === 1 ? 1 : nseq === 2 ? 3 : 7;

		for (let ks = 1; ks <= NN - nsym + 1; ks += nsym) {
			for (let i = 0; i < nt; i++) {
				const i1 = Math.floor(i / 64);
				const i2 = Math.floor((i & 63) / 16);
				const i3 = Math.floor((i & 15) / 4);
				const i4 = i & 3;

				if (nsym === 1) {
					const t = GRAYMAP[i4]!;
					const idx = t * NN + (ks - 1);
					s2[i] = Math.hypot(csRe[idx]!, csIm[idx]!);
				} else if (nsym === 2) {
					const t3 = GRAYMAP[i3]!;
					const t4 = GRAYMAP[i4]!;
					const iA = t3 * NN + (ks - 1);
					const iB = t4 * NN + ks;
					const re = csRe[iA]! + csRe[iB]!;
					const im = csIm[iA]! + csIm[iB]!;
					s2[i] = Math.hypot(re, im);
				} else {
					const t1 = GRAYMAP[i1]!;
					const t2 = GRAYMAP[i2]!;
					const t3 = GRAYMAP[i3]!;
					const t4 = GRAYMAP[i4]!;
					const iA = t1 * NN + (ks - 1);
					const iB = t2 * NN + ks;
					const iC = t3 * NN + (ks + 1);
					const iD = t4 * NN + (ks + 2);
					const re = csRe[iA]! + csRe[iB]! + csRe[iC]! + csRe[iD]!;
					const im = csIm[iA]! + csIm[iB]! + csIm[iC]! + csIm[iD]!;
					s2[i] = Math.hypot(re, im);
				}
			}

			const ipt = 1 + (ks - 1) * 2;
			for (let ib = 0; ib <= ibmax; ib++) {
				const mask = 1 << (ibmax - ib);
				let max1 = -1e30;
				let max0 = -1e30;
				for (let i = 0; i < nt; i++) {
					const v = s2[i]!;
					if ((i & mask) !== 0) {
						if (v > max1) max1 = v;
					} else if (v > max0) {
						max0 = v;
					}
				}

				const idx = ipt + ib;
				if (idx > BITMETRIC_LEN) continue;

				const bm = max1 - max0;
				if (nseq === 1) {
					bitmetrics1[idx - 1] = bm;
				} else if (nseq === 2) {
					bitmetrics2[idx - 1] = bm;
				} else {
					bitmetrics3[idx - 1] = bm;
				}
			}
		}
	}

	bitmetrics2[208] = bitmetrics1[208]!;
	bitmetrics2[209] = bitmetrics1[209]!;
	bitmetrics3[208] = bitmetrics1[208]!;
	bitmetrics3[209] = bitmetrics1[209]!;

	normalizeBitMetrics(bitmetrics1);
	normalizeBitMetrics(bitmetrics2);
	normalizeBitMetrics(bitmetrics3);
	return false;
}

function maxTone(s4: Float64Array, symbolIndex: number): number {
	let bestTone = 0;
	let bestValue = -1;
	for (let tone = 0; tone < 4; tone++) {
		const v = s4[tone * NN + symbolIndex]!;
		if (v > bestValue) {
			bestValue = v;
			bestTone = tone;
		}
	}
	return bestTone;
}

function normalizeBitMetrics(bmet: Float64Array): void {
	let sum = 0;
	let sum2 = 0;
	for (let i = 0; i < bmet.length; i++) {
		sum += bmet[i]!;
		sum2 += bmet[i]! * bmet[i]!;
	}
	const avg = sum / bmet.length;
	const avg2 = sum2 / bmet.length;
	const variance = avg2 - avg * avg;
	const sigma = variance > 0 ? Math.sqrt(variance) : Math.sqrt(avg2);
	if (sigma <= 0) return;
	for (let i = 0; i < bmet.length; i++) bmet[i] = bmet[i]! / sigma;
}

function passesHardSyncQuality(bitmetrics1: Float64Array): boolean {
	const hard = new Uint8Array(bitmetrics1.length);
	for (let i = 0; i < bitmetrics1.length; i++) hard[i] = bitmetrics1[i]! >= 0 ? 1 : 0;

	let score = 0;
	for (const pattern of HARD_SYNC_PATTERNS) {
		for (let i = 0; i < pattern.bits.length; i++) {
			if (hard[pattern.offset + i] === pattern.bits[i]) score++;
		}
	}
	return score >= 10;
}

function buildLlrs(workspace: DecodeWorkspace): void {
	const { bitmetrics1, bitmetrics2, bitmetrics3, llra, llrb, llrc } = workspace;
	for (let i = 0; i < 58; i++) {
		llra[i] = bitmetrics1[8 + i]!;
		llra[58 + i] = bitmetrics1[74 + i]!;
		llra[116 + i] = bitmetrics1[140 + i]!;

		llrb[i] = bitmetrics2[8 + i]!;
		llrb[58 + i] = bitmetrics2[74 + i]!;
		llrb[116 + i] = bitmetrics2[140 + i]!;

		llrc[i] = bitmetrics3[8 + i]!;
		llrc[58 + i] = bitmetrics3[74 + i]!;
		llrc[116 + i] = bitmetrics3[140 + i]!;
	}
}

function tryDecodePasses(
	workspace: DecodeWorkspace,
	depth: number,
): import("../util/decode174_91.js").DecodeResult | null {
	const maxosd = depth >= 3 ? 2 : depth >= 2 ? 0 : -1;
	const scalefac = 2.83;
	const sources = [workspace.llra, workspace.llrb, workspace.llrc];

	workspace.apmask.fill(0);
	for (const src of sources) {
		for (let i = 0; i < LDPC_BITS; i++) workspace.llr[i] = scalefac * src[i]!;
		const result = decode174_91(workspace.llr, workspace.apmask, maxosd);
		if (result) return result;
	}

	return null;
}

function hasNonZeroBit(bits: readonly number[]): boolean {
	for (const bit of bits) {
		if (bit !== 0) return true;
	}
	return false;
}

function toFt4Snr(syncMinusOne: number): number {
	if (syncMinusOne > 0) {
		return Math.round(Math.max(-21, 10 * Math.log10(syncMinusOne) - 14.8));
	}
	return -21;
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
