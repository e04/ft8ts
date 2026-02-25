import {
	graymap,
	icos7,
	N_LDPC,
	NDOWN,
	NFFT1,
	NHSYM,
	NMAX,
	NN,
	NSPS,
	NSTEP,
	SAMPLE_RATE,
} from "../util/constants.js";
import { decode174_91 } from "../util/decode174_91.js";
import { fftComplex, nextPow2 } from "../util/fft.js";
import type { HashCallBook } from "../util/hashcall.js";
import { unpack77 } from "../util/unpack_jt77.js";

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

	// Resample to 12000 Hz if needed
	let dd: Float64Array;
	if (sampleRate === SAMPLE_RATE) {
		dd = new Float64Array(NMAX);
		const len = Math.min(samples.length, NMAX);
		for (let i = 0; i < len; i++) dd[i] = samples[i]!;
	} else {
		dd = resample(samples, sampleRate, SAMPLE_RATE, NMAX);
	}

	// Compute huge FFT for downsampling caching
	const NFFT1_LONG = 192000;
	const cxRe = new Float64Array(NFFT1_LONG);
	const cxIm = new Float64Array(NFFT1_LONG);
	for (let i = 0; i < NMAX; i++) {
		cxRe[i] = dd[i] ?? 0;
	}
	fftComplex(cxRe, cxIm, false);

	// Compute spectrogram and find sync candidates
	const { candidates, sbase } = sync8(dd, nfa, nfb, syncmin, maxCandidates);

	const decoded: DecodedMessage[] = [];
	const seenMessages = new Set<string>();

	for (const cand of candidates) {
		const result = ft8b(dd, cxRe, cxIm, cand.freq, cand.dt, sbase, depth, book);
		if (!result) continue;

		if (seenMessages.has(result.msg)) continue;
		seenMessages.add(result.msg);

		decoded.push({
			freq: result.freq,
			dt: result.dt - 0.5,
			snr: result.snr,
			msg: result.msg,
			sync: cand.sync,
		});
	}

	return decoded;
}

interface Candidate {
	freq: number;
	dt: number;
	sync: number;
}

function sync8(
	dd: Float64Array,
	nfa: number,
	nfb: number,
	syncmin: number,
	maxcand: number,
): { candidates: Candidate[]; sbase: Float64Array } {
	const JZ = 62;
	// Fortran uses NFFT1=3840 for the spectrogram FFT; we need a power of 2
	const fftSize = nextPow2(NFFT1); // 4096
	const halfSize = fftSize / 2; // 2048
	const tstep = NSTEP / SAMPLE_RATE;
	const df = SAMPLE_RATE / fftSize;
	const fac = 1.0 / 300.0;

	// Compute symbol spectra, stepping by NSTEP
	const s = new Float64Array(halfSize * NHSYM);
	const savg = new Float64Array(halfSize);

	const xRe = new Float64Array(fftSize);
	const xIm = new Float64Array(fftSize);

	for (let j = 0; j < NHSYM; j++) {
		const ia = j * NSTEP;
		xRe.fill(0);
		xIm.fill(0);
		for (let i = 0; i < NSPS && ia + i < dd.length; i++) {
			xRe[i] = fac * dd[ia + i]!;
		}
		fftComplex(xRe, xIm, false);
		for (let i = 0; i < halfSize; i++) {
			const power = xRe[i]! * xRe[i]! + xIm[i]! * xIm[i]!;
			s[i * NHSYM + j] = power;
			savg[i] = (savg[i] ?? 0) + power;
		}
	}

	// Compute baseline
	const sbase = computeBaseline(savg, nfa, nfb, df, halfSize);

	const ia = Math.max(1, Math.round(nfa / df));
	const ib = Math.min(halfSize - 14, Math.round(nfb / df));
	const nssy = Math.floor(NSPS / NSTEP);
	const nfos = Math.round(SAMPLE_RATE / NSPS / df); // ~2 bins per tone spacing
	const jstrt = Math.round(0.5 / tstep);

	// 2D sync correlation
	const sync2d = new Float64Array((ib - ia + 1) * (2 * JZ + 1));
	const width = 2 * JZ + 1;

	for (let i = ia; i <= ib; i++) {
		for (let jj = -JZ; jj <= JZ; jj++) {
			let ta = 0,
				tb = 0,
				tc = 0;
			let t0a = 0,
				t0b = 0,
				t0c = 0;

			for (let n = 0; n < 7; n++) {
				const m = jj + jstrt + nssy * n;
				const iCostas = i + nfos * icos7[n]!;

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
			const t0total = t0a + t0b + t0c;
			const t0 = (t0total - t) / 6.0;
			const syncVal = t0 > 0 ? t / t0 : 0;

			const tbc = tb + tc;
			const t0bc = t0b + t0c;
			const t0bc2 = (t0bc - tbc) / 6.0;
			const syncBc = t0bc2 > 0 ? tbc / t0bc2 : 0;

			sync2d[(i - ia) * width + (jj + JZ)] = Math.max(syncVal, syncBc);
		}
	}

	// Find peaks
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
		// Also check wider range
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
		if (Math.abs(bestJ2 - bestJ) > 0 && bestSync2 >= syncmin) {
			candidates0.push({
				freq: i * df,
				dt: (bestJ2 - 0.5) * tstep,
				sync: bestSync2,
			});
		}
	}

	// Compute baseline normalization for sync values
	const syncValues = candidates0.map((c) => c.sync);
	syncValues.sort((a, b) => a - b);
	const pctileIdx = Math.max(0, Math.round(0.4 * syncValues.length) - 1);
	const base = syncValues[pctileIdx] ?? 1;
	if (base > 0) {
		for (const c of candidates0) c.sync /= base;
	}

	// Remove near-duplicate candidates
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

	// Sort by sync descending, take top maxcand
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

	// Smooth the spectrum to get baseline
	const window = 50; // bins
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

interface Ft8bResult {
	msg: string;
	freq: number;
	dt: number;
	snr: number;
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
): Ft8bResult | null {
	const NFFT2 = 3200;
	const NP2 = 2812;
	const _NFFT1_LONG = 192000;
	const fs2 = SAMPLE_RATE / NDOWN;
	const dt2 = 1.0 / fs2;
	const twopi = 2 * Math.PI;

	// Downsample: mix to baseband and filter
	const cd0Re = new Float64Array(NFFT2);
	const cd0Im = new Float64Array(NFFT2);
	ft8Downsample(cxRe, cxIm, f1, cd0Re, cd0Im);

	// Find best time offset
	const i0 = Math.round((xdt + 0.5) * fs2);
	let smax = 0;
	let ibest = i0;

	for (let idt = i0 - 10; idt <= i0 + 10; idt++) {
		const sync = sync8d(cd0Re, cd0Im, idt, null, null, false);
		if (sync > smax) {
			smax = sync;
			ibest = idt;
		}
	}

	// Fine frequency search
	smax = 0;
	let delfbest = 0;
	for (let ifr = -5; ifr <= 5; ifr++) {
		const delf = ifr * 0.5;
		const dphi = twopi * delf * dt2;
		const twkRe = new Float64Array(32);
		const twkIm = new Float64Array(32);
		let phi = 0;
		for (let i = 0; i < 32; i++) {
			twkRe[i] = Math.cos(phi);
			twkIm[i] = Math.sin(phi);
			phi = (phi + dphi) % twopi;
		}
		const sync = sync8d(cd0Re, cd0Im, ibest, twkRe, twkIm, true);
		if (sync > smax) {
			smax = sync;
			delfbest = delf;
		}
	}

	// Apply frequency correction and re-downsample
	f1 += delfbest;
	ft8Downsample(cxRe, cxIm, f1, cd0Re, cd0Im);

	// Refine time offset
	const ss = new Float64Array(9);
	for (let idt = -4; idt <= 4; idt++) {
		ss[idt + 4] = sync8d(cd0Re, cd0Im, ibest + idt, null, null, false);
	}
	let maxss = -1;
	let maxIdx = 4;
	for (let i = 0; i < 9; i++) {
		if (ss[i]! > maxss) {
			maxss = ss[i]!;
			maxIdx = i;
		}
	}
	ibest = ibest + maxIdx - 4;
	xdt = (ibest - 1) * dt2;

	// Extract 8-tone soft symbols for each of NN=79 symbols
	const s8 = new Float64Array(8 * NN);
	const csRe = new Float64Array(8 * NN);
	const csIm = new Float64Array(8 * NN);

	const symbRe = new Float64Array(32);
	const symbIm = new Float64Array(32);

	for (let k = 0; k < NN; k++) {
		const i1 = ibest + k * 32;
		symbRe.fill(0);
		symbIm.fill(0);
		if (i1 >= 0 && i1 + 31 < NP2) {
			for (let j = 0; j < 32; j++) {
				symbRe[j] = cd0Re[i1 + j]!;
				symbIm[j] = cd0Im[i1 + j]!;
			}
		}
		fftComplex(symbRe, symbIm, false);
		for (let tone = 0; tone < 8; tone++) {
			const re = symbRe[tone]! / 1000;
			const im = symbIm[tone]! / 1000;
			csRe[tone * NN + k] = re;
			csIm[tone * NN + k] = im;
			s8[tone * NN + k] = Math.sqrt(re * re + im * im);
		}
	}

	// Sync quality check
	let nsync = 0;
	for (let k = 0; k < 7; k++) {
		for (const offset of [0, 36, 72]) {
			let maxTone = 0;
			let maxVal = -1;
			for (let t = 0; t < 8; t++) {
				const v = s8[t * NN + k + offset]!;
				if (v > maxVal) {
					maxVal = v;
					maxTone = t;
				}
			}
			if (maxTone === icos7[k]) nsync++;
		}
	}
	if (nsync <= 6) return null;

	// Compute soft bit metrics for multiple nsym values (1, 2, 3)
	// and a normalized version, matching the Fortran ft8b passes 1-4
	const bmeta = new Float64Array(N_LDPC); // nsym=1
	const bmetb = new Float64Array(N_LDPC); // nsym=2
	const bmetc = new Float64Array(N_LDPC); // nsym=3
	const bmetd = new Float64Array(N_LDPC); // nsym=1 normalized

	for (let nsym = 1; nsym <= 3; nsym++) {
		const nt = 1 << (3 * nsym); // 8, 64, 512
		const ibmax = nsym === 1 ? 2 : nsym === 2 ? 5 : 8;

		for (let ihalf = 1; ihalf <= 2; ihalf++) {
			for (let k = 1; k <= 29; k += nsym) {
				const ks = ihalf === 1 ? k + 7 : k + 43;
				const s2 = new Float64Array(nt);

				for (let i = 0; i < nt; i++) {
					const i1 = Math.floor(i / 64);
					const i2 = Math.floor((i & 63) / 8);
					const i3 = i & 7;
					if (nsym === 1) {
						const re = csRe[graymap[i3]! * NN + ks - 1]!;
						const im = csIm[graymap[i3]! * NN + ks - 1]!;
						s2[i] = Math.sqrt(re * re + im * im);
					} else if (nsym === 2) {
						const sRe = csRe[graymap[i2]! * NN + ks - 1]! + csRe[graymap[i3]! * NN + ks]!;
						const sIm = csIm[graymap[i2]! * NN + ks - 1]! + csIm[graymap[i3]! * NN + ks]!;
						s2[i] = Math.sqrt(sRe * sRe + sIm * sIm);
					} else {
						const sRe =
							csRe[graymap[i1]! * NN + ks - 1]! +
							csRe[graymap[i2]! * NN + ks]! +
							csRe[graymap[i3]! * NN + ks + 1]!;
						const sIm =
							csIm[graymap[i1]! * NN + ks - 1]! +
							csIm[graymap[i2]! * NN + ks]! +
							csIm[graymap[i3]! * NN + ks + 1]!;
						s2[i] = Math.sqrt(sRe * sRe + sIm * sIm);
					}
				}

				// Fortran: i32 = 1 + (k-1)*3 + (ihalf-1)*87  (1-based)
				const i32 = 1 + (k - 1) * 3 + (ihalf - 1) * 87;

				for (let ib = 0; ib <= ibmax; ib++) {
					// max of s2 where bit (ibmax-ib) of index is 1
					let max1 = -1e30,
						max0 = -1e30;
					for (let i = 0; i < nt; i++) {
						const bitSet = (i & (1 << (ibmax - ib))) !== 0;
						if (bitSet) {
							if (s2[i]! > max1) max1 = s2[i]!;
						} else {
							if (s2[i]! > max0) max0 = s2[i]!;
						}
					}
					const idx = i32 + ib - 1; // Convert to 0-based
					if (idx >= 0 && idx < N_LDPC) {
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
	}

	normalizeBmet(bmeta);
	normalizeBmet(bmetb);
	normalizeBmet(bmetc);
	normalizeBmet(bmetd);

	const bmetrics = [bmeta, bmetb, bmetc, bmetd];

	const scalefac = 2.83;
	const maxosd = depth >= 3 ? 2 : depth >= 2 ? 0 : -1;
	const apmask = new Int8Array(N_LDPC);

	// Try 4 passes with different soft-symbol metrics (matching Fortran)
	let result: import("../util/decode174_91.js").DecodeResult | null = null;
	for (let ipass = 0; ipass < 4; ipass++) {
		const llr = new Float64Array(N_LDPC);
		for (let i = 0; i < N_LDPC; i++) llr[i] = scalefac * bmetrics[ipass]![i]!;
		result = decode174_91(llr, apmask, maxosd);
		if (result && result.nharderrors >= 0 && result.nharderrors <= 36) break;
		result = null;
	}

	if (!result || result.nharderrors < 0 || result.nharderrors > 36) return null;

	// Check for all-zero codeword
	if (result.cw.every((b) => b === 0)) return null;

	const message77 = result.message91.slice(0, 77);

	// Validate message type
	const n3v = (message77[71]! << 2) | (message77[72]! << 1) | message77[73]!;
	const i3v = (message77[74]! << 2) | (message77[75]! << 1) | message77[76]!;
	if (i3v > 5 || (i3v === 0 && n3v > 6)) return null;
	if (i3v === 0 && n3v === 2) return null;

	// Unpack
	const { msg, success } = unpack77(message77, book);
	if (!success || msg.trim().length === 0) return null;

	// Estimate SNR
	let xsig = 0;
	let xnoi = 0;
	const itone = getTones(result.cw);
	for (let i = 0; i < 79; i++) {
		xsig += s8[itone[i]! * NN + i]! ** 2;
		const ios = (itone[i]! + 4) % 7;
		xnoi += s8[ios * NN + i]! ** 2;
	}
	let snr = 0.001;
	const arg = xsig / Math.max(xnoi, 1e-30) - 1.0;
	if (arg > 0.1) snr = arg;
	snr = 10 * Math.log10(snr) - 27.0;
	if (snr < -24) snr = -24;

	return { msg, freq: f1, dt: xdt, snr };
}

function getTones(cw: number[]): number[] {
	const tones = new Array(79).fill(0) as number[];
	for (let i = 0; i < 7; i++) tones[i] = icos7[i]!;
	for (let i = 0; i < 7; i++) tones[36 + i] = icos7[i]!;
	for (let i = 0; i < 7; i++) tones[72 + i] = icos7[i]!;
	let k = 7;
	for (let j = 1; j <= 58; j++) {
		const i = (j - 1) * 3;
		if (j === 30) k += 7;
		const indx = cw[i]! * 4 + cw[i + 1]! * 2 + cw[i + 2]!;
		tones[k] = graymap[indx]!;
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
	c1Re: Float64Array,
	c1Im: Float64Array,
): void {
	const NFFT1 = 192000;
	const NFFT2 = 3200;

	const df = 12000.0 / NFFT1;
	// NSPS is imported, should be 1920
	const baud = 12000.0 / NSPS; // 6.25
	const i0 = Math.round(f0 / df);
	const ft = f0 + 8.5 * baud;
	const it = Math.min(Math.round(ft / df), NFFT1 / 2);
	const fb = f0 - 1.5 * baud;
	const ib = Math.max(1, Math.round(fb / df));

	c1Re.fill(0);
	c1Im.fill(0);
	let k = 0;
	for (let i = ib; i <= it; i++) {
		if (k >= NFFT2) break;
		c1Re[k] = cxRe[i] ?? 0;
		c1Im[k] = cxIm[i] ?? 0;
		k++;
	}

	// Taper
	const pi = Math.PI;
	const taper = new Float64Array(101);
	for (let i = 0; i <= 100; i++) {
		taper[i] = 0.5 * (1.0 + Math.cos((i * pi) / 100));
	}

	for (let i = 0; i <= 100; i++) {
		if (i >= NFFT2) break;
		const tap = taper[100 - i]!;
		c1Re[i] = c1Re[i]! * tap;
		c1Im[i] = c1Im[i]! * tap;
	}

	const endTap = k - 1;
	for (let i = 0; i <= 100; i++) {
		const idx = endTap - 100 + i;
		if (idx >= 0 && idx < NFFT2) {
			const tap = taper[i]!;
			c1Re[idx] = c1Re[idx]! * tap;
			c1Im[idx] = c1Im[idx]! * tap;
		}
	}

	// CSHIFT
	const shift = i0 - ib;
	const tempRe = new Float64Array(NFFT2);
	const tempIm = new Float64Array(NFFT2);
	for (let i = 0; i < NFFT2; i++) {
		let srcIdx = (i + shift) % NFFT2;
		if (srcIdx < 0) srcIdx += NFFT2;
		tempRe[i] = c1Re[srcIdx]!;
		tempIm[i] = c1Im[srcIdx]!;
	}
	for (let i = 0; i < NFFT2; i++) {
		c1Re[i] = tempRe[i]!;
		c1Im[i] = tempIm[i]!;
	}

	// iFFT
	fftComplex(c1Re, c1Im, true);

	// Scale
	// Fortran uses 1.0/sqrt(NFFT1 * NFFT2), but our fftComplex(true) scales by 1/NFFT2
	const scale = Math.sqrt(NFFT2 / NFFT1);
	for (let i = 0; i < NFFT2; i++) {
		c1Re[i] = c1Re[i]! * scale;
		c1Im[i] = c1Im[i]! * scale;
	}
}

function sync8d(
	cd0Re: Float64Array,
	cd0Im: Float64Array,
	i0: number,
	twkRe: Float64Array | null,
	twkIm: Float64Array | null,
	useTwk: boolean,
): number {
	const NP2 = 2812;
	const twopi = 2 * Math.PI;

	// Precompute Costas sync waveforms
	const csyncRe = new Float64Array(7 * 32);
	const csyncIm = new Float64Array(7 * 32);
	for (let i = 0; i < 7; i++) {
		let phi = 0;
		const dphi = (twopi * icos7[i]!) / 32;
		for (let j = 0; j < 32; j++) {
			csyncRe[i * 32 + j] = Math.cos(phi);
			csyncIm[i * 32 + j] = Math.sin(phi);
			phi = (phi + dphi) % twopi;
		}
	}

	let sync = 0;
	for (let i = 0; i < 7; i++) {
		const i1 = i0 + i * 32;
		const i2 = i1 + 36 * 32;
		const i3 = i1 + 72 * 32;

		for (const iStart of [i1, i2, i3]) {
			let zRe = 0,
				zIm = 0;
			if (iStart >= 0 && iStart + 31 < NP2) {
				for (let j = 0; j < 32; j++) {
					let sRe = csyncRe[i * 32 + j]!;
					let sIm = csyncIm[i * 32 + j]!;
					if (useTwk && twkRe && twkIm) {
						const tRe = twkRe[j]! * sRe - twkIm[j]! * sIm;
						const tIm = twkRe[j]! * sIm + twkIm[j]! * sRe;
						sRe = tRe;
						sIm = tIm;
					}
					// Conjugate multiply: cd0 * conj(csync)
					const dRe = cd0Re[iStart + j]!;
					const dIm = cd0Im[iStart + j]!;
					zRe += dRe * sRe + dIm * sIm;
					zIm += dIm * sRe - dRe * sIm;
				}
			}
			sync += zRe * zRe + zIm * zIm;
		}
	}

	return sync;
}

function normalizeBmet(bmet: Float64Array): void {
	const n = bmet.length;
	let sum = 0,
		sum2 = 0;
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
