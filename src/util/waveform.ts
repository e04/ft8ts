const TWO_PI = 2 * Math.PI;
const FT8_DEFAULT_SAMPLE_RATE = 12_000;
const FT8_DEFAULT_SAMPLES_PER_SYMBOL = 1_920;
const FT8_DEFAULT_BT = 2.0;

const FT4_DEFAULT_SAMPLE_RATE = 12_000;
const FT4_DEFAULT_SAMPLES_PER_SYMBOL = 576;
const FT4_DEFAULT_BT = 1.0;
const MODULATION_INDEX = 1.0;

export interface WaveformOptions {
	sampleRate?: number;
	samplesPerSymbol?: number;
	bt?: number;
	baseFrequency?: number;
	initialPhase?: number;
}

interface WaveformDefaults {
	sampleRate: number;
	samplesPerSymbol: number;
	bt: number;
}

interface WaveformShape {
	includeRampSymbols: boolean;
	fullSymbolRamp: boolean;
}

function assertPositiveFinite(value: number, name: string): void {
	if (!Number.isFinite(value) || value <= 0) {
		throw new Error(`${name} must be a positive finite number`);
	}
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

function gfskPulse(bt: number, tt: number): number {
	// Same expression used by lib/ft2/gfsk_pulse.f90.
	const scale = Math.PI * Math.sqrt(2 / Math.log(2)) * bt;
	return 0.5 * (erfApprox(scale * (tt + 0.5)) - erfApprox(scale * (tt - 0.5)));
}

function generateGfskWaveform(
	tones: readonly number[],
	options: WaveformOptions,
	defaults: WaveformDefaults,
	shape: WaveformShape,
): Float32Array {
	const nsym = tones.length;
	if (nsym === 0) {
		return new Float32Array(0);
	}

	const sampleRate = options.sampleRate ?? defaults.sampleRate;
	const nsps = options.samplesPerSymbol ?? defaults.samplesPerSymbol;
	const bt = options.bt ?? defaults.bt;
	const f0 = options.baseFrequency ?? 0;
	const initialPhase = options.initialPhase ?? 0;

	assertPositiveFinite(sampleRate, "sampleRate");
	assertPositiveFinite(nsps, "samplesPerSymbol");
	assertPositiveFinite(bt, "bt");
	if (!Number.isFinite(f0)) {
		throw new Error("baseFrequency must be finite");
	}
	if (!Number.isFinite(initialPhase)) {
		throw new Error("initialPhase must be finite");
	}
	if (!Number.isInteger(nsps)) {
		throw new Error("samplesPerSymbol must be an integer");
	}

	const nwave = (shape.includeRampSymbols ? nsym + 2 : nsym) * nsps;
	const pulse = new Float64Array(3 * nsps);
	for (let i = 0; i < pulse.length; i++) {
		const tt = (i + 1 - 1.5 * nsps) / nsps;
		pulse[i] = gfskPulse(bt, tt);
	}

	const dphi = new Float64Array((nsym + 2) * nsps);
	const dphiPeak = (TWO_PI * MODULATION_INDEX) / nsps;

	for (let j = 0; j < nsym; j++) {
		const tone = tones[j]!;
		const ib = j * nsps;
		for (let i = 0; i < pulse.length; i++) {
			dphi[ib + i]! += dphiPeak * pulse[i]! * tone;
		}
	}

	const firstTone = tones[0]!;
	const lastTone = tones[nsym - 1]!;
	const tailBase = nsym * nsps;
	for (let i = 0; i < 2 * nsps; i++) {
		dphi[i]! += dphiPeak * firstTone * pulse[nsps + i]!;
		dphi[tailBase + i]! += dphiPeak * lastTone * pulse[i]!;
	}

	const carrierDphi = (TWO_PI * f0) / sampleRate;
	for (let i = 0; i < dphi.length; i++) {
		dphi[i]! += carrierDphi;
	}

	const wave = new Float32Array(nwave);
	let phi = initialPhase % TWO_PI;
	if (phi < 0) phi += TWO_PI;
	const phaseStart = shape.includeRampSymbols ? 0 : nsps;
	for (let k = 0; k < nwave; k++) {
		const j = phaseStart + k;
		wave[k] = Math.sin(phi);
		phi += dphi[j]!;
		phi %= TWO_PI;
		if (phi < 0) {
			phi += TWO_PI;
		}
	}

	if (shape.fullSymbolRamp) {
		for (let i = 0; i < nsps; i++) {
			const up = (1 - Math.cos((TWO_PI * i) / (2 * nsps))) / 2;
			wave[i]! *= up;
		}

		const tailStart = (nsym + 1) * nsps;
		for (let i = 0; i < nsps; i++) {
			const down = (1 + Math.cos((TWO_PI * i) / (2 * nsps))) / 2;
			wave[tailStart + i]! *= down;
		}
	} else {
		const nramp = Math.round(nsps / 8);
		for (let i = 0; i < nramp; i++) {
			const up = (1 - Math.cos((TWO_PI * i) / (2 * nramp))) / 2;
			wave[i]! *= up;
		}

		const tailStart = nwave - nramp;
		for (let i = 0; i < nramp; i++) {
			const down = (1 + Math.cos((TWO_PI * i) / (2 * nramp))) / 2;
			wave[tailStart + i]! *= down;
		}
	}

	return wave;
}

export function generateFT8Waveform(
	tones: readonly number[],
	options: WaveformOptions = {},
): Float32Array {
	// Mirrors the FT8 path in lib/ft8/gen_ft8wave.f90.
	return generateGfskWaveform(
		tones,
		options,
		{
			sampleRate: FT8_DEFAULT_SAMPLE_RATE,
			samplesPerSymbol: FT8_DEFAULT_SAMPLES_PER_SYMBOL,
			bt: FT8_DEFAULT_BT,
		},
		{
			includeRampSymbols: false,
			fullSymbolRamp: false,
		},
	);
}

export function generateFT4Waveform(
	tones: readonly number[],
	options: WaveformOptions = {},
): Float32Array {
	// Mirrors lib/ft4/gen_ft4wave.f90.
	return generateGfskWaveform(
		tones,
		options,
		{
			sampleRate: FT4_DEFAULT_SAMPLE_RATE,
			samplesPerSymbol: FT4_DEFAULT_SAMPLES_PER_SYMBOL,
			bt: FT4_DEFAULT_BT,
		},
		{
			includeRampSymbols: true,
			fullSymbolRamp: true,
		},
	);
}
