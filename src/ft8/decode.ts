import { N_LDPC, SAMPLE_RATE } from "../util/constants.js";
import { type DecodeResult, decode174_91 } from "../util/decode174_91.js";
import { fftComplex } from "../util/fft.js";
import type { HashCallBook } from "../util/hashcall.js";
import { unpack77 } from "../util/unpack_jt77.js";
import { COSTAS, GRAY_MAP } from "./constants.js";

// Port of the WSJT-X v2.7.0 FT8 decoder (ft8_decode.f90, sync8.f90, ft8b.f90,
// subtractft8.f90, get_spectrum_baseline.f90).

const NSPS = 1920;
const NFFT1 = 2 * NSPS; // 3840
const NH1 = NFFT1 / 2; // 1920
const NSTEP = NSPS / 4; // 480
const NMAX = 15 * 12_000; // 180000
const NHSYM = Math.floor(NMAX / NSTEP) - 3; // 372
const NDOWN = 60;
const NN = 79;
const NP2 = 2812;
const NFRAME = NSPS * NN; // 151680

const NFFT1_LONG = 192000;
const NFFT2 = 3200;
const COSTAS_BLOCKS = 7;
const COSTAS_SYMBOL_LEN = 32;
const SYNC_TIME_SHIFTS = [0, 36, 72] as const;
const TAPER_SIZE = 101;
const TAPER_LAST = TAPER_SIZE - 1;
const TWO_PI = 2 * Math.PI;

const SYNC_DF = SAMPLE_RATE / NFFT1; // 3.125 Hz
const SYNC_TSTEP = NSTEP / SAMPLE_RATE; // 0.04 s
const SYNC_JZ = 62;
const SYNC_MLAG = 10;
const SYNC_NSSY = NSPS / NSTEP; // 4
const SYNC_NFOS = NFFT1 / NSPS; // 2
const SYNC_JSTRT = Math.trunc(0.5 / SYNC_TSTEP); // 12
const MAX_PRECANDIDATES = 1000;

const FS2 = SAMPLE_RATE / NDOWN; // 200 Hz
const DT2 = 1.0 / FS2;
const DOWNSAMPLE_DF = SAMPLE_RATE / NFFT1_LONG;
const DOWNSAMPLE_BAUD = SAMPLE_RATE / NSPS;
const DOWNSAMPLE_SCALE = Math.sqrt(NFFT2 / NFFT1_LONG);

/** Extent of an FT8 signal around its base frequency (8 tones plus GFSK skirts). */
const SIGNAL_BAND_BELOW = DOWNSAMPLE_BAUD;
const SIGNAL_BAND_ABOVE = 8 * DOWNSAMPLE_BAUD;

/** ft8b time/frequency search grid: ±10 downsampled samples, ±2.5 Hz in 0.5 Hz steps. */
const SEARCH_TIME_HALF = 10;
const SEARCH_TIME_STEPS = 2 * SEARCH_TIME_HALF + 1;
const SEARCH_FREQ_HALF = 5;
const SEARCH_FREQ_STEP = 0.5;
const SEARCH_FREQ_STEPS = 2 * SEARCH_FREQ_HALF + 1;

const LLR_SCALE = 2.83;
const MAX_HARD_ERRORS = 36;

const SUBTRACT_NFILT = 4000;
const SUBTRACT_HALF = SUBTRACT_NFILT / 2;
const SUBTRACT_BLOCK = 20;
const SUBTRACT_NBLOCKS = NFRAME / SUBTRACT_BLOCK; // 7584

/** CQ in the first 29 bits (i3=1 standard message), ft8b.f90 `mcq`. */
const MCQ = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0];

const TAPER = buildTaper(TAPER_SIZE);
const COSTAS_SYNC = buildCostasSyncTemplates();
const {
	rotRe: SLIDE_ROT_RE,
	rotIm: SLIDE_ROT_IM,
	endRe: SLIDE_END_RE,
	endIm: SLIDE_END_IM,
	phaseRe: SLIDE_PHASE_RE,
	phaseIm: SLIDE_PHASE_IM,
} = buildSlidingDftTables();
const BASELINE_WINDOW = buildBaselineWindow();
const GFSK_PULSE = buildGfskPulse(2.0);
const LPF = buildSubtractionFilter();

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
	/** Minimum sync threshold, default 1.6 for depth <= 2 and 1.3 for depth >= 3 (as in WSJT-X) */
	syncMin?: number;
	/** Decoding depth: 1=fast BP only, 2=BP+OSD, 3=deep (values above 3 behave like 3) */
	depth?: number;
	/** Maximum candidates to process per pass, default 600 */
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

interface Candidate {
	freq: number;
	dt: number;
	sync: number;
}

interface Ft8bResult {
	msg: string;
	freq: number;
	/** Start time (s) as reported by WSJT-X, (ibest-1)*dt2 */
	dt: number;
	/** Refined start time (s) used for signal subtraction */
	dtSubtract: number;
	snr: number;
	tones: number[];
}

interface SyncTemplate {
	re: Float64Array;
	im: Float64Array;
}

interface DecodeWorkspace {
	/** Spectrum of the whole (residual) signal, recomputed at the start of each pass. */
	cxRe: Float64Array;
	cxIm: Float64Array;
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
	syncGrid: Float64Array;
	/** Subtraction buffers */
	crefRe: Float64Array;
	crefIm: Float64Array;
	/** Block prefix sums of camp, camp*e^{+iθm}, camp*e^{-iθm} */
	sum0Re: Float64Array;
	sum0Im: Float64Array;
	sumPlusRe: Float64Array;
	sumPlusIm: Float64Array;
	sumMinusRe: Float64Array;
	sumMinusIm: Float64Array;
	/** Filtered complex amplitude at block boundaries */
	cfiltRe: Float64Array;
	cfiltIm: Float64Array;
	dphi: Float64Array;
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
	// Depths above 3 are accepted and behave like 3.
	const depth = Math.min(options.depth ?? 2, 3);
	const syncmin = options.syncMin ?? (depth <= 2 ? 1.6 : 1.3);
	const maxCandidates = options.maxCandidates ?? 600;
	const book = options.hashCallBook;

	const dd =
		sampleRate === SAMPLE_RATE
			? copySamplesToDecodeWindow(samples)
			: resample(samples, sampleRate, SAMPLE_RATE, NMAX);

	const workspace = createDecodeWorkspace();
	const decoded: DecodedMessage[] = [];
	const seenMessages = new Set<string>();

	const npass = depth <= 1 ? 2 : 3;
	let n2 = 0;
	for (let ipass = 1; ipass <= npass; ipass++) {
		let ndeep = depth;
		if (ipass === 1) {
			if (depth === 3) ndeep = 2;
		} else if (ipass === 2) {
			n2 = decoded.length;
			if (decoded.length === 0) break;
		} else if (decoded.length - n2 === 0) {
			break;
		}

		const { candidates, sbase } = sync8(dd, nfa, nfb, syncmin, maxCandidates);
		computeLongSpectrum(dd, workspace);
		// Bands [lo, hi] (Hz) of signals subtracted since the spectrum was computed.
		const staleBands: number[] = [];

		for (const cand of candidates) {
			// WSJT-X keeps using the spectrum computed at the start of the pass. A
			// candidate overlapping a just-subtracted signal would then re-decode
			// that signal (and subtract it a second time with worse parameters),
			// so refresh the spectrum first.
			if (overlapsBands(cand.freq, staleBands)) {
				computeLongSpectrum(dd, workspace);
				staleBands.length = 0;
			}

			const ibin = Math.max(1, Math.round(cand.freq / SYNC_DF));
			const xbase = 10.0 ** (0.1 * (sbase[ibin]! - 40.0));
			const result = ft8b(cand.freq, cand.dt, xbase, ndeep, book, workspace);
			if (!result) continue;

			subtractft8(dd, result.tones, result.freq, result.dtSubtract, workspace);
			staleBands.push(result.freq - SIGNAL_BAND_BELOW, result.freq + SIGNAL_BAND_ABOVE);

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
		}
	}

	return decoded;
}

function normalizeMessageKey(msg: string): string {
	return msg.trim().replace(/\s+/g, " ").toUpperCase();
}

/** Whether the band ft8b would use for a candidate at `freq` overlaps any of `bands`. */
function overlapsBands(freq: number, bands: number[]): boolean {
	const search = SEARCH_FREQ_HALF * SEARCH_FREQ_STEP;
	const lo = freq - search - 1.5 * DOWNSAMPLE_BAUD;
	const hi = freq + search + 8.5 * DOWNSAMPLE_BAUD;
	for (let i = 0; i < bands.length; i += 2) {
		if (lo < bands[i + 1]! && hi > bands[i]!) return true;
	}
	return false;
}

function createDecodeWorkspace(): DecodeWorkspace {
	return {
		cxRe: new Float64Array(NFFT1_LONG),
		cxIm: new Float64Array(NFFT1_LONG),
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
		syncGrid: new Float64Array(SEARCH_TIME_STEPS * SEARCH_FREQ_STEPS),
		crefRe: new Float64Array(NFRAME),
		crefIm: new Float64Array(NFRAME),
		sum0Re: new Float64Array(SUBTRACT_NBLOCKS + 1),
		sum0Im: new Float64Array(SUBTRACT_NBLOCKS + 1),
		sumPlusRe: new Float64Array(SUBTRACT_NBLOCKS + 1),
		sumPlusIm: new Float64Array(SUBTRACT_NBLOCKS + 1),
		sumMinusRe: new Float64Array(SUBTRACT_NBLOCKS + 1),
		sumMinusIm: new Float64Array(SUBTRACT_NBLOCKS + 1),
		cfiltRe: new Float64Array(SUBTRACT_NBLOCKS + 1),
		cfiltIm: new Float64Array(SUBTRACT_NBLOCKS + 1),
		dphi: new Float64Array((NN + 2) * NSPS),
	};
}

function copySamplesToDecodeWindow(samples: Float32Array | Float64Array): Float64Array {
	const out = new Float64Array(NMAX);
	const len = Math.min(samples.length, NMAX);
	for (let i = 0; i < len; i++) out[i] = samples[i]!;
	return out;
}

function computeLongSpectrum(dd: Float64Array, workspace: DecodeWorkspace): void {
	const { cxRe, cxIm } = workspace;
	cxRe.fill(0);
	cxIm.fill(0);
	cxRe.set(dd);
	fftComplex(cxRe, cxIm, false);
}

// ── Candidate search (sync8.f90) ────────────────────────────────────────────

/**
 * Power spectra of 3840-sample FFTs of `x * scale`, stepping `step` samples.
 * Two real frames are transformed per complex FFT.
 * Returns s[bin * nframes + frame] for bins 0..NH1.
 */
function frameSpectra(
	dd: Float64Array,
	nframes: number,
	step: number,
	frameLen: number,
	window: Float64Array | null,
	scale: number,
): Float64Array {
	const s = new Float64Array((NH1 + 1) * nframes);
	const re = new Float64Array(NFFT1);
	const im = new Float64Array(NFFT1);

	for (let j = 0; j < nframes; j += 2) {
		re.fill(0);
		im.fill(0);
		const ia = j * step;
		const ib = (j + 1) * step;
		const hasSecond = j + 1 < nframes;
		for (let i = 0; i < frameLen; i++) {
			const w = window ? window[i]! : scale;
			if (ia + i < dd.length) re[i] = w * dd[ia + i]!;
			if (hasSecond && ib + i < dd.length) im[i] = w * dd[ib + i]!;
		}
		fftComplex(re, im, false);
		for (let k = 1; k <= NH1; k++) {
			const nk = (NFFT1 - k) % NFFT1;
			// X = A + iB with A, B real-input spectra.
			const aRe = 0.5 * (re[k]! + re[nk]!);
			const aIm = 0.5 * (im[k]! - im[nk]!);
			s[k * nframes + j] = aRe * aRe + aIm * aIm;
			if (hasSecond) {
				const bRe = 0.5 * (im[k]! + im[nk]!);
				const bIm = -0.5 * (re[k]! - re[nk]!);
				s[k * nframes + j + 1] = bRe * bRe + bIm * bIm;
			}
		}
	}
	return s;
}

function sync8(
	dd: Float64Array,
	nfa: number,
	nfb: number,
	syncmin: number,
	maxcand: number,
): { candidates: Candidate[]; sbase: Float64Array } {
	const s = frameSpectra(dd, NHSYM, NSTEP, NSPS, null, 1.0 / 300.0);
	const sbase = getSpectrumBaseline(dd, nfa, nfb);

	const ia = Math.max(1, Math.round(nfa / SYNC_DF));
	const ib = Math.min(NH1 - SYNC_NFOS * 7, Math.round(nfb / SYNC_DF));
	if (ib < ia) return { candidates: [], sbase };
	const iz = ib - ia + 1;
	const width = 2 * SYNC_JZ + 1;

	// Sum over the 7 tone bins of each Costas symbol, per frequency and time.
	const t0s = new Float64Array(iz * NHSYM);
	for (let i = ia; i <= ib; i++) {
		const row = (i - ia) * NHSYM;
		for (let tone = 0; tone <= 6; tone++) {
			const src = (i + SYNC_NFOS * tone) * NHSYM;
			for (let m = 0; m < NHSYM; m++) t0s[row + m] = t0s[row + m]! + s[src + m]!;
		}
	}

	const sync2d = new Float64Array(iz * width);
	for (let i = ia; i <= ib; i++) {
		const row = (i - ia) * NHSYM;
		for (let j = -SYNC_JZ; j <= SYNC_JZ; j++) {
			let ta = 0;
			let tb = 0;
			let tc = 0;
			let t0a = 0;
			let t0b = 0;
			let t0c = 0;
			for (let n = 0; n < COSTAS_BLOCKS; n++) {
				// 0-based time index of Costas symbol n (Fortran m-1)
				const m = j + SYNC_JSTRT + SYNC_NSSY * n - 1;
				const sc = (i + SYNC_NFOS * COSTAS[n]!) * NHSYM;
				if (m >= 0 && m < NHSYM) {
					ta += s[sc + m]!;
					t0a += t0s[row + m]!;
				}
				const mb = m + SYNC_NSSY * 36;
				if (mb >= 0 && mb < NHSYM) {
					tb += s[sc + mb]!;
					t0b += t0s[row + mb]!;
				}
				const mc = m + SYNC_NSSY * 72;
				if (mc >= 0 && mc < NHSYM) {
					tc += s[sc + mc]!;
					t0c += t0s[row + mc]!;
				}
			}
			let t = ta + tb + tc;
			let t0 = (t0a + t0b + t0c - t) / 6.0;
			const syncAbc = t0 > 0 ? t / t0 : 0;
			t = tb + tc;
			t0 = (t0b + t0c - t) / 6.0;
			const syncBc = t0 > 0 ? t / t0 : 0;
			sync2d[(i - ia) * width + j + SYNC_JZ] = Math.max(syncAbc, syncBc);
		}
	}

	const red = new Float64Array(iz);
	const red2 = new Float64Array(iz);
	const jpeak = new Int32Array(iz);
	const jpeak2 = new Int32Array(iz);
	for (let k = 0; k < iz; k++) {
		const row = k * width + SYNC_JZ;
		let best = -Infinity;
		for (let j = -SYNC_MLAG; j <= SYNC_MLAG; j++) {
			const v = sync2d[row + j]!;
			if (v > best) {
				best = v;
				jpeak[k] = j;
			}
		}
		red[k] = best;
		best = -Infinity;
		for (let j = -SYNC_JZ; j <= SYNC_JZ; j++) {
			const v = sync2d[row + j]!;
			if (v > best) {
				best = v;
				jpeak2[k] = j;
			}
		}
		red2[k] = best;
	}

	const npctile = Math.round(0.4 * iz);
	if (npctile < 1) return { candidates: [], sbase };
	const order = Array.from({ length: iz }, (_, k) => k).sort((a, b) => red[a]! - red[b]!);
	const base = red[order[npctile - 1]!]!;
	const order2 = Array.from({ length: iz }, (_, k) => k).sort((a, b) => red2[a]! - red2[b]!);
	const base2 = red2[order2[npctile - 1]!]!;
	for (let k = 0; k < iz; k++) {
		red[k] = red[k]! / base;
		red2[k] = red2[k]! / base2;
	}

	const candidates0: Candidate[] = [];
	for (let i = 0; i < Math.min(MAX_PRECANDIDATES, iz); i++) {
		const k = order[iz - 1 - i]!;
		const freq = (ia + k) * SYNC_DF;
		if (candidates0.length >= MAX_PRECANDIDATES) break;
		if (red[k]! >= syncmin) {
			candidates0.push({ freq, dt: (jpeak[k]! - 0.5) * SYNC_TSTEP, sync: red[k]! });
		}
		if (jpeak2[k] === jpeak[k]) continue;
		if (candidates0.length >= MAX_PRECANDIDATES) break;
		if (red2[k]! >= syncmin) {
			candidates0.push({ freq, dt: (jpeak2[k]! - 0.5) * SYNC_TSTEP, sync: red2[k]! });
		}
	}

	// Save only the best of near-dupe freqs.
	for (let i = 1; i < candidates0.length; i++) {
		const ci = candidates0[i]!;
		for (let j = 0; j < i; j++) {
			const cj = candidates0[j]!;
			if (Math.abs(ci.freq - cj.freq) < 4.0 && Math.abs(ci.dt - cj.dt) < 0.04) {
				if (ci.sync >= cj.sync) cj.sync = 0;
				if (ci.sync < cj.sync) ci.sync = 0;
			}
		}
	}

	const candidates = candidates0.filter((c) => c.sync >= syncmin);
	candidates.sort((a, b) => b.sync - a.sync);
	return { candidates: candidates.slice(0, maxcand), sbase };
}

/** get_spectrum_baseline.f90 + baseline.f90: spectrum baseline in dB, indexed by bin (3.125 Hz). */
function getSpectrumBaseline(dd: Float64Array, nfaIn: number, nfbIn: number): Float64Array {
	const nst = NFFT1 / 2;
	let nframes = 0;
	while (nframes < 93 && nframes * nst + NFFT1 <= NMAX) nframes++;
	const s = frameSpectra(dd, nframes, nst, NFFT1, BASELINE_WINDOW, 1);
	const savg = new Float64Array(NH1 + 1);
	for (let k = 1; k <= NH1; k++) {
		let sum = 0;
		for (let j = 0; j < nframes; j++) sum += s[k * nframes + j]!;
		savg[k] = sum;
	}

	let nfa = nfaIn;
	let nfb = nfbIn;
	const nwin = nfb - nfa;
	if (nfa < 100) {
		nfa = 100;
		if (nwin < 100) nfb = nfa + nwin;
	}
	if (nfb > 4910) {
		nfb = 4910;
		if (nwin < 100) nfa = nfb - nwin;
	}
	return baseline(savg, nfa, nfb);
}

function baseline(savg: Float64Array, nfa: number, nfb: number): Float64Array {
	const sbase = new Float64Array(NH1 + 1);
	const nseg = 10;
	const npct = 10;
	const ia = Math.max(1, Math.round(nfa / SYNC_DF));
	const ib = Math.min(NH1, Math.round(nfb / SYNC_DF));
	if (ib <= ia) return sbase;

	const sdb = new Float64Array(NH1 + 1);
	for (let i = ia; i <= ib; i++) sdb[i] = 10.0 * Math.log10(Math.max(savg[i]!, 1e-30));

	const nlen = Math.trunc((ib - ia + 1) / nseg);
	const i0 = Math.trunc((ib - ia + 1) / 2);
	const xs: number[] = [];
	const ys: number[] = [];
	for (let n = 0; n < nseg; n++) {
		const ja = ia + n * nlen;
		const jb = ja + nlen - 1;
		const seg = Array.from(sdb.subarray(ja, jb + 1)).sort((a, b) => a - b);
		let jp = Math.round(nlen * 0.01 * npct);
		if (jp < 1) jp = 1;
		if (jp > nlen) jp = nlen;
		const base = seg[jp - 1]!;
		for (let i = ja; i <= jb; i++) {
			if (sdb[i]! <= base && xs.length < 1000) {
				xs.push(i - i0);
				ys.push(sdb[i]!);
			}
		}
	}

	const a = polyfit(xs, ys, 5);
	for (let i = ia; i <= ib; i++) {
		const t = i - i0;
		sbase[i] = a[0]! + t * (a[1]! + t * (a[2]! + t * (a[3]! + t * a[4]!))) + 0.65;
	}
	return sbase;
}

/** Least-squares polynomial fit y ≈ Σ a[n] x^n (n < nterms). */
function polyfit(xs: number[], ys: number[], nterms: number): number[] {
	const a = new Array<number>(nterms).fill(0);
	if (xs.length < nterms) return a;
	// Fit in a scaled variable for numerical stability, then rescale.
	let scale = 1;
	for (const x of xs) scale = Math.max(scale, Math.abs(x));
	const mat: number[][] = Array.from({ length: nterms }, () =>
		new Array<number>(nterms + 1).fill(0),
	);
	for (let p = 0; p < xs.length; p++) {
		const u = xs[p]! / scale;
		const pw = new Array<number>(2 * nterms - 1);
		pw[0] = 1;
		for (let n = 1; n < pw.length; n++) pw[n] = pw[n - 1]! * u;
		for (let r = 0; r < nterms; r++) {
			for (let c = 0; c < nterms; c++) mat[r]![c] = mat[r]![c]! + pw[r + c]!;
			mat[r]![nterms] = mat[r]![nterms]! + pw[r]! * ys[p]!;
		}
	}
	for (let col = 0; col < nterms; col++) {
		let piv = col;
		for (let r = col + 1; r < nterms; r++) {
			if (Math.abs(mat[r]![col]!) > Math.abs(mat[piv]![col]!)) piv = r;
		}
		if (Math.abs(mat[piv]![col]!) < 1e-300) return a;
		[mat[col], mat[piv]] = [mat[piv]!, mat[col]!];
		for (let r = 0; r < nterms; r++) {
			if (r === col) continue;
			const f = mat[r]![col]! / mat[col]![col]!;
			if (f === 0) continue;
			for (let c = col; c <= nterms; c++) mat[r]![c] = mat[r]![c]! - f * mat[col]![c]!;
		}
	}
	let sp = 1;
	for (let n = 0; n < nterms; n++) {
		a[n] = mat[n]![nterms]! / mat[n]![n]! / sp;
		sp *= scale;
	}
	return a;
}

// ── Per-candidate decoding (ft8b.f90) ───────────────────────────────────────

function ft8b(
	f1In: number,
	xdtIn: number,
	xbase: number,
	ndepth: number,
	book: HashCallBook | undefined,
	workspace: DecodeWorkspace,
): Ft8bResult | null {
	const { cd0Re, cd0Im, ss, s8 } = workspace;
	let f1 = f1In;

	ft8Downsample(f1, workspace);

	// WSJT-X searches time at the candidate frequency and then frequency at
	// that time. The candidate frequency can be off by up to half a 3.125 Hz
	// bin, which biases the time search, so search time and frequency jointly.
	const i0 = Math.round((xdtIn + 0.5) * FS2);
	const search = searchTimeFrequency(cd0Re, cd0Im, i0, workspace.syncGrid);
	let ibest = search.ibest;
	f1 += search.delf;

	ft8Downsample(f1, workspace);

	for (let idt = -4; idt <= 4; idt++) {
		ss[idt + 4] = sync8d(cd0Re, cd0Im, ibest + idt, COSTAS_SYNC.re, COSTAS_SYNC.im);
	}
	let iloc = 0;
	for (let i = 1; i < 9; i++) if (ss[i]! > ss[iloc]!) iloc = i;
	ibest += iloc - 4;
	const xdt = (ibest - 1) * DT2;

	// Sub-sample time estimate for signal subtraction
	let dx = 0;
	if (iloc > 0 && iloc < 8) {
		const ym = ss[iloc - 1]!;
		const y0 = ss[iloc]!;
		const yp = ss[iloc + 1]!;
		const c = yp + ym - 2 * y0;
		if (c < 0) dx = Math.max(-0.5, Math.min(0.5, (-(yp - ym) / 2 / c) * 1));
	}
	const dtSubtract = (ibest + dx - 0.5) * DT2;

	extractSoftSymbols(ibest, workspace);

	// Sync quality check: hard sync sum, max 21
	let nsync = 0;
	for (let k = 0; k < COSTAS_BLOCKS; k++) {
		for (const offset of SYNC_TIME_SHIFTS) {
			let ip = 0;
			for (let t = 1; t < 8; t++) {
				if (s8[t * NN + k + offset]! > s8[ip * NN + k + offset]!) ip = t;
			}
			if (ip === COSTAS[k]) nsync++;
		}
	}
	if (nsync <= 6) return null;

	buildBitMetrics(workspace);

	const { bmeta, bmetb, bmetc, bmetd, llr, apmask } = workspace;
	const apmag = maxAbs(bmeta) * LLR_SCALE * 1.01;
	const maxosd = ndepth <= 1 ? -1 : ndepth === 2 ? 0 : 2;
	const npasses = ndepth >= 3 ? 5 : 4;

	for (let ipass = 1; ipass <= npasses; ipass++) {
		const metric = ipass === 2 ? bmetb : ipass === 3 ? bmetc : ipass === 4 ? bmetd : bmeta;
		for (let i = 0; i < N_LDPC; i++) llr[i] = LLR_SCALE * metric[i]!;
		apmask.fill(0);
		if (ipass === 5) {
			// AP pass: CQ ??? ??? (iaptype=1)
			for (let i = 0; i < 29; i++) {
				apmask[i] = 1;
				llr[i] = apmag * (2 * MCQ[i]! - 1);
			}
			apmask[74] = 1;
			apmask[75] = 1;
			apmask[76] = 1;
			llr[74] = -apmag;
			llr[75] = -apmag;
			llr[76] = apmag;
		}

		const result = decode174_91(llr, apmask, maxosd, 2);
		if (!result) continue;
		const accepted = acceptCodeword(result, book);
		if (!accepted) continue;

		// SNR relative to the spectrum baseline (WSJT-X xsnr2).
		const tones = getTones(result.cw);
		let xsig = 0;
		for (let i = 0; i < NN; i++) xsig += s8[tones[i]! * NN + i]! ** 2;
		let xsnr = 0.001;
		const arg = xsig / xbase / 3.0e6 - 1.0;
		if (arg > 0.1) xsnr = arg;
		xsnr = 10.0 * Math.log10(xsnr) - 27.0;
		// Likely false decode
		if (nsync <= 10 && xsnr < -24.0) return null;
		if (xsnr < -24.0) xsnr = -24.0;

		return { msg: accepted, freq: f1, dt: xdt, dtSubtract, snr: xsnr, tones };
	}

	return null;
}

function acceptCodeword(result: DecodeResult, book: HashCallBook | undefined): string | null {
	if (result.nharderrors < 0 || result.nharderrors > MAX_HARD_ERRORS) return null;
	if (result.cw.every((b) => b === 0)) return null;
	const message77 = result.message91.slice(0, 77);
	const n3 = (message77[71]! << 2) | (message77[72]! << 1) | message77[73]!;
	const i3 = (message77[74]! << 2) | (message77[75]! << 1) | message77[76]!;
	if (i3 > 5 || (i3 === 0 && n3 > 6)) return null;
	if (i3 === 0 && n3 === 2) return null;
	const { msg, success } = unpack77(message77, book);
	if (!success || msg.trim().length === 0) return null;
	return msg;
}

function extractSoftSymbols(ibest: number, workspace: DecodeWorkspace): void {
	const { cd0Re, cd0Im, s8, csRe, csIm, symbRe, symbIm } = workspace;

	for (let k = 0; k < NN; k++) {
		const i1 = ibest + k * COSTAS_SYMBOL_LEN;
		symbRe.fill(0);
		symbIm.fill(0);
		if (i1 >= 0 && i1 + COSTAS_SYMBOL_LEN - 1 <= NP2 - 1) {
			for (let j = 0; j < COSTAS_SYMBOL_LEN; j++) {
				symbRe[j] = cd0Re[i1 + j]!;
				symbIm[j] = cd0Im[i1 + j]!;
			}
		}
		fftComplex(symbRe, symbIm, false);
		for (let tone = 0; tone < 8; tone++) {
			const re = symbRe[tone]!;
			const im = symbIm[tone]!;
			const idx = tone * NN + k;
			csRe[idx] = re / 1000;
			csIm[idx] = im / 1000;
			s8[idx] = Math.sqrt(re * re + im * im);
		}
	}
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
					const i1 = i >> 6;
					const i2 = (i & 63) >> 3;
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
					const idx = i32 + ib - 1;
					if (idx >= N_LDPC) continue;
					const bit = 1 << (ibmax - ib);
					let max1 = -1e30;
					let max0 = -1e30;
					for (let i = 0; i < nt; i++) {
						const v = s2[i]!;
						if ((i & bit) !== 0) {
							if (v > max1) max1 = v;
						} else if (v > max0) {
							max0 = v;
						}
					}

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

function maxAbs(values: Float64Array): number {
	let max = 0;
	for (let i = 0; i < values.length; i++) {
		const v = Math.abs(values[i]!);
		if (v > max) max = v;
	}
	return max;
}

function getTones(cw: number[]): number[] {
	const tones = new Array<number>(NN).fill(0);
	for (let i = 0; i < 7; i++) {
		tones[i] = COSTAS[i]!;
		tones[36 + i] = COSTAS[i]!;
		tones[72 + i] = COSTAS[i]!;
	}
	let k = 7;
	for (let j = 1; j <= 58; j++) {
		const i = (j - 1) * 3;
		if (j === 30) k += 7;
		tones[k] = GRAY_MAP[cw[i]! * 4 + cw[i + 1]! * 2 + cw[i + 2]!]!;
		k++;
	}
	return tones;
}

/**
 * Mix f0 to baseband and decimate by NDOWN (60x) by extracting frequency bins
 * of the long spectrum (ft8_downsample.f90).
 */
function ft8Downsample(f0: number, workspace: DecodeWorkspace): void {
	const { cxRe, cxIm, cd0Re, cd0Im, shiftRe, shiftIm } = workspace;
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
	for (let i = ib; i <= it && k < NFFT2; i++) {
		cd0Re[k] = cxRe[i]!;
		cd0Im[k] = cxIm[i]!;
		k++;
	}

	for (let i = 0; i <= TAPER_LAST; i++) {
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
		let src = (i + shift) % NFFT2;
		if (src < 0) src += NFFT2;
		shiftRe[i] = cd0Re[src]!;
		shiftIm[i] = cd0Im[src]!;
	}
	cd0Re.set(shiftRe);
	cd0Im.set(shiftIm);

	fftComplex(cd0Re, cd0Im, true);

	for (let i = 0; i < NFFT2; i++) {
		cd0Re[i] = cd0Re[i]! * DOWNSAMPLE_SCALE;
		cd0Im[i] = cd0Im[i]! * DOWNSAMPLE_SCALE;
	}
}

/** Sync power for a complex, downsampled FT8 signal (sync8d.f90). */
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

/**
 * Joint search over start time (i0±10 downsampled samples) and frequency
 * offset (±2.5 Hz in 0.5 Hz steps) maximizing the sync8d Costas power.
 *
 * sync8d with a frequency tweak is the sum over the 21 Costas symbols of
 * |DFT of a 32-sample window at (tone*6.25 + delf) Hz|², so each window's DFT
 * is updated recursively (sliding DFT) as the start time advances.
 */
function searchTimeFrequency(
	cd0Re: Float64Array,
	cd0Im: Float64Array,
	i0: number,
	grid: Float64Array,
): { ibest: number; delf: number } {
	const nt = SEARCH_TIME_STEPS;
	const nf = SEARCH_FREQ_STEPS;
	const first = i0 - SEARCH_TIME_HALF;
	grid.fill(0);

	for (let block = 0; block < 3 * COSTAS_BLOCKS; block++) {
		const n = block % COSTAS_BLOCKS;
		const offset =
			n * COSTAS_SYMBOL_LEN + SYNC_TIME_SHIFTS[(block / COSTAS_BLOCKS) | 0]! * COSTAS_SYMBOL_LEN;
		const tone = COSTAS[n]!;
		for (let d = 0; d < nf; d++) {
			const w = tone * nf + d;
			const rotRe = SLIDE_ROT_RE[w]!;
			const rotIm = SLIDE_ROT_IM[w]!;
			const endRe = SLIDE_END_RE[w]!;
			const endIm = SLIDE_END_IM[w]!;
			const phase = w * COSTAS_SYMBOL_LEN;
			let valid = false;
			let xr = 0;
			let xi = 0;
			for (let k = 0; k < nt; k++) {
				const i1 = first + k + offset;
				if (i1 < 0 || i1 + COSTAS_SYMBOL_LEN - 1 >= NP2) {
					valid = false;
					continue;
				}
				if (!valid) {
					xr = 0;
					xi = 0;
					for (let j = 0; j < COSTAS_SYMBOL_LEN; j++) {
						const c = SLIDE_PHASE_RE[phase + j]!;
						const s = SLIDE_PHASE_IM[phase + j]!;
						const dr = cd0Re[i1 + j]!;
						const di = cd0Im[i1 + j]!;
						xr += dr * c - di * s;
						xi += dr * s + di * c;
					}
					valid = true;
				} else {
					// X_{i} = e^{iω} (X_{i-1} - x_{i-1} + x_{i+31} e^{-iω32})
					const lr = cd0Re[i1 + COSTAS_SYMBOL_LEN - 1]!;
					const li = cd0Im[i1 + COSTAS_SYMBOL_LEN - 1]!;
					const tr = xr - cd0Re[i1 - 1]! + lr * endRe - li * endIm;
					const ti = xi - cd0Im[i1 - 1]! + lr * endIm + li * endRe;
					xr = tr * rotRe - ti * rotIm;
					xi = tr * rotIm + ti * rotRe;
				}
				grid[d * nt + k] = grid[d * nt + k]! + xr * xr + xi * xi;
			}
		}
	}

	let smax = 0;
	let best = 0;
	for (let idx = 0; idx < nf * nt; idx++) {
		if (grid[idx]! > smax) {
			smax = grid[idx]!;
			best = idx;
		}
	}
	const d = (best / nt) | 0;
	return { ibest: first + (best % nt), delf: (d - SEARCH_FREQ_HALF) * SEARCH_FREQ_STEP };
}

// ── Signal subtraction (subtractft8.f90) ────────────────────────────────────

/**
 * Subtract a decoded FT8 signal from `dd`.
 *
 * The complex amplitude of the signal relative to an ideal reference waveform
 * is estimated with a low-pass filter (cos² window, 4000 samples), so slow
 * amplitude/phase drifts and small frequency errors are tracked:
 *   camp(t)  = dd(t) * conj(cref(t))
 *   cfilt(t) = LPF[camp(t)]
 *   dd(t)   -= 2 * Re{cref(t) * cfilt(t)}
 * The filter output is evaluated exactly (running sums) every SUBTRACT_BLOCK
 * samples and linearly interpolated in between.
 */
function subtractft8(
	dd: Float64Array,
	tones: number[],
	f0: number,
	dt: number,
	workspace: DecodeWorkspace,
): void {
	const { crefRe, crefIm } = workspace;
	genFt8Cwave(tones, f0, workspace);

	const nstart = Math.round(dt * SAMPLE_RATE);
	const { cosTab, sinTab, sumw, massStart } = LPF;

	// Block prefix sums of camp, camp*e^{+iθm} and camp*e^{-iθm} (θ = 2π/NFILT).
	const nb = SUBTRACT_NBLOCKS;
	const p0Re = workspace.sum0Re;
	const p0Im = workspace.sum0Im;
	const ppRe = workspace.sumPlusRe;
	const ppIm = workspace.sumPlusIm;
	const pmRe = workspace.sumMinusRe;
	const pmIm = workspace.sumMinusIm;
	let a0r = 0;
	let a0i = 0;
	let apr = 0;
	let api = 0;
	let amr = 0;
	let ami = 0;
	p0Re[0] = 0;
	p0Im[0] = 0;
	ppRe[0] = 0;
	ppIm[0] = 0;
	pmRe[0] = 0;
	pmIm[0] = 0;
	for (let b = 0; b < nb; b++) {
		const iStart = b * SUBTRACT_BLOCK;
		for (let i = iStart; i < iStart + SUBTRACT_BLOCK; i++) {
			const j = nstart + i;
			if (j < 0 || j >= NMAX) continue;
			const d = dd[j]!;
			const xr = d * crefRe[i]!;
			const xi = -d * crefIm[i]!;
			const t = i % SUBTRACT_NFILT;
			const c = cosTab[t]!;
			const s = sinTab[t]!;
			const xrc = xr * c;
			const xis = xi * s;
			const xrs = xr * s;
			const xic = xi * c;
			a0r += xr;
			a0i += xi;
			apr += xrc - xis;
			api += xrs + xic;
			amr += xrc + xis;
			ami += xic - xrs;
		}
		p0Re[b + 1] = a0r;
		p0Im[b + 1] = a0i;
		ppRe[b + 1] = apr;
		ppIm[b + 1] = api;
		pmRe[b + 1] = amr;
		pmIm[b + 1] = ami;
	}

	// Filter output at block boundaries i = b*BLOCK: window covers [i-HALF, i+HALF).
	const hb = SUBTRACT_HALF / SUBTRACT_BLOCK;
	const outRe = workspace.cfiltRe;
	const outIm = workspace.cfiltIm;
	for (let b = 0; b <= nb; b++) {
		const lo = Math.max(0, b - hb);
		const hi = Math.min(nb, b + hb);
		const s0r = p0Re[hi]! - p0Re[lo]!;
		const s0i = p0Im[hi]! - p0Im[lo]!;
		const spr = ppRe[hi]! - ppRe[lo]!;
		const spi = ppIm[hi]! - ppIm[lo]!;
		const smr = pmRe[hi]! - pmRe[lo]!;
		const smi = pmIm[hi]! - pmIm[lo]!;
		const t = (b * SUBTRACT_BLOCK) % SUBTRACT_NFILT;
		const c = cosTab[t]!;
		const s = sinTab[t]!;
		// 0.5*S0 + 0.25*e^{-iθi}*S+ + 0.25*e^{+iθi}*S-
		let yr = 0.5 * s0r + 0.25 * (c * spr + s * spi) + 0.25 * (c * smr - s * smi);
		let yi = 0.5 * s0i + 0.25 * (c * spi - s * spr) + 0.25 * (c * smi + s * smr);
		// Normalize by the window mass inside the frame (end correction).
		let mass = sumw;
		if (b < hb) mass = massStart[b]!;
		else if (b > nb - hb) mass = massStart[nb - b]!;
		yr /= mass;
		yi /= mass;
		outRe[b] = yr;
		outIm[b] = yi;
	}

	for (let b = 0; b < nb; b++) {
		const y0r = outRe[b]!;
		const y0i = outIm[b]!;
		const dyr = (outRe[b + 1]! - y0r) / SUBTRACT_BLOCK;
		const dyi = (outIm[b + 1]! - y0i) / SUBTRACT_BLOCK;
		const iStart = b * SUBTRACT_BLOCK;
		for (let q = 0; q < SUBTRACT_BLOCK; q++) {
			const i = iStart + q;
			const j = nstart + i;
			if (j < 0 || j >= NMAX) continue;
			const yr = y0r + dyr * q;
			const yi = y0i + dyi * q;
			dd[j] = dd[j]! - 2.0 * (yr * crefRe[i]! - yi * crefIm[i]!);
		}
	}
}

/** Complex FT8 reference waveform (gen_ft8wave.f90 with icmplx=1). */
function genFt8Cwave(tones: number[], f0: number, workspace: DecodeWorkspace): void {
	const { crefRe, crefIm, dphi } = workspace;
	const nsym = NN;
	const nsps = NSPS;
	const dphiPeak = TWO_PI / nsps;
	const pulse = GFSK_PULSE;

	dphi.fill(0);
	for (let j = 0; j < nsym; j++) {
		const ib = j * nsps;
		const tone = tones[j]!;
		if (tone === 0) continue;
		const f = dphiPeak * tone;
		for (let i = 0; i < 3 * nsps; i++) dphi[ib + i] = dphi[ib + i]! + f * pulse[i]!;
	}
	const first = dphiPeak * tones[0]!;
	const last = dphiPeak * tones[nsym - 1]!;
	for (let i = 0; i < 2 * nsps; i++) {
		dphi[i] = dphi[i]! + first * pulse[nsps + i]!;
		dphi[nsym * nsps + i] = dphi[nsym * nsps + i]! + last * pulse[i]!;
	}

	const carrier = (TWO_PI * f0) / SAMPLE_RATE;
	let phi = 0;
	for (let k = 0; k < NFRAME; k++) {
		crefRe[k] = Math.cos(phi);
		crefIm[k] = Math.sin(phi);
		phi += dphi[nsps + k]! + carrier;
		if (phi > TWO_PI) phi -= TWO_PI;
	}

	const nramp = Math.round(nsps / 8);
	for (let i = 0; i < nramp; i++) {
		const up = (1 - Math.cos((TWO_PI * i) / (2 * nramp))) / 2;
		crefRe[i] = crefRe[i]! * up;
		crefIm[i] = crefIm[i]! * up;
		const k1 = nsym * nsps - nramp + i;
		const down = (1 + Math.cos((TWO_PI * i) / (2 * nramp))) / 2;
		crefRe[k1] = crefRe[k1]! * down;
		crefIm[k1] = crefIm[k1]! * down;
	}
}

// ── Tables ──────────────────────────────────────────────────────────────────

function buildTaper(size: number): Float64Array {
	const taper = new Float64Array(size);
	const last = size - 1;
	for (let i = 0; i < size; i++) taper[i] = 0.5 * (1.0 + Math.cos((i * Math.PI) / last));
	return taper;
}

function buildCostasSyncTemplates(): SyncTemplate {
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

function buildSlidingDftTables(): {
	rotRe: Float64Array;
	rotIm: Float64Array;
	endRe: Float64Array;
	endIm: Float64Array;
	phaseRe: Float64Array;
	phaseIm: Float64Array;
} {
	const n = 8 * SEARCH_FREQ_STEPS;
	const rotRe = new Float64Array(n);
	const rotIm = new Float64Array(n);
	const endRe = new Float64Array(n);
	const endIm = new Float64Array(n);
	const phaseRe = new Float64Array(n * COSTAS_SYMBOL_LEN);
	const phaseIm = new Float64Array(n * COSTAS_SYMBOL_LEN);
	for (let tone = 0; tone < 8; tone++) {
		for (let d = 0; d < SEARCH_FREQ_STEPS; d++) {
			const w = tone * SEARCH_FREQ_STEPS + d;
			const delf = (d - SEARCH_FREQ_HALF) * SEARCH_FREQ_STEP;
			const omega = (TWO_PI * (tone * DOWNSAMPLE_BAUD + delf)) / FS2;
			rotRe[w] = Math.cos(omega);
			rotIm[w] = Math.sin(omega);
			endRe[w] = Math.cos(-omega * COSTAS_SYMBOL_LEN);
			endIm[w] = Math.sin(-omega * COSTAS_SYMBOL_LEN);
			for (let j = 0; j < COSTAS_SYMBOL_LEN; j++) {
				phaseRe[w * COSTAS_SYMBOL_LEN + j] = Math.cos(-omega * j);
				phaseIm[w * COSTAS_SYMBOL_LEN + j] = Math.sin(-omega * j);
			}
		}
	}
	return { rotRe, rotIm, endRe, endIm, phaseRe, phaseIm };
}

/** Nuttall window normalized as in get_spectrum_baseline.f90. */
function buildBaselineWindow(): Float64Array {
	const w = new Float64Array(NFFT1);
	const a0 = 0.3635819;
	const a1 = -0.4891775;
	const a2 = 0.1365995;
	const a3 = -0.0106411;
	let sum = 0;
	for (let i = 0; i < NFFT1; i++) {
		w[i] =
			a0 +
			a1 * Math.cos((TWO_PI * i) / NFFT1) +
			a2 * Math.cos((2 * TWO_PI * i) / NFFT1) +
			a3 * Math.cos((3 * TWO_PI * i) / NFFT1);
		sum += w[i]!;
	}
	for (let i = 0; i < NFFT1; i++) w[i] = ((w[i]! / sum) * NSPS * 2) / 300.0;
	return w;
}

// Abramowitz and Stegun 7.1.26 approximation.
function erfApprox(x: number): number {
	const sign = x < 0 ? -1 : 1;
	const ax = Math.abs(x);
	const t = 1 / (1 + 0.3275911 * ax);
	const y =
		1 -
		((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
			t *
			Math.exp(-ax * ax);
	return sign * y;
}

function buildGfskPulse(bt: number): Float64Array {
	const pulse = new Float64Array(3 * NSPS);
	const c = Math.PI * Math.sqrt(2 / Math.log(2)) * bt;
	for (let i = 0; i < pulse.length; i++) {
		const tt = (i + 1 - 1.5 * NSPS) / NSPS;
		pulse[i] = 0.5 * (erfApprox(c * (tt + 0.5)) - erfApprox(c * (tt - 0.5)));
	}
	return pulse;
}

function buildSubtractionFilter(): {
	cosTab: Float64Array;
	sinTab: Float64Array;
	sumw: number;
	massStart: Float64Array;
} {
	const cosTab = new Float64Array(SUBTRACT_NFILT);
	const sinTab = new Float64Array(SUBTRACT_NFILT);
	for (let t = 0; t < SUBTRACT_NFILT; t++) {
		cosTab[t] = Math.cos((TWO_PI * t) / SUBTRACT_NFILT);
		sinTab[t] = Math.sin((TWO_PI * t) / SUBTRACT_NFILT);
	}
	const w = (j: number) => Math.cos((Math.PI * j) / SUBTRACT_NFILT) ** 2;
	let sumw = 0;
	for (let j = -SUBTRACT_HALF; j < SUBTRACT_HALF; j++) sumw += w(j);
	// Window mass available b blocks from the frame edge: offsets [-b*BLOCK, HALF).
	const hb = SUBTRACT_HALF / SUBTRACT_BLOCK;
	const massStart = new Float64Array(hb + 1);
	for (let b = 0; b <= hb; b++) {
		let m = 0;
		for (let j = -b * SUBTRACT_BLOCK; j < SUBTRACT_HALF; j++) m += w(j);
		massStart[b] = m;
	}
	return { cosTab, sinTab, sumw, massStart };
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
