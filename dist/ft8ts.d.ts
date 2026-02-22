interface DecodedMessage {
    freq: number;
    dt: number;
    snr: number;
    msg: string;
    sync: number;
}
interface DecodeOptions {
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
}
/**
 * Decode all FT8 signals in an audio buffer.
 * Input: mono audio samples at `sampleRate` Hz, duration ~15s.
 */
declare function decode(samples: Float32Array | Float64Array, sampleRate?: number, options?: DecodeOptions): DecodedMessage[];

interface WaveformOptions {
    sampleRate?: number;
    samplesPerSymbol?: number;
    bt?: number;
    baseFrequency?: number;
}

declare function encode(msg: string, options?: WaveformOptions): Float32Array;

export { decode as decodeFT8, encode as encodeFT8 };
export type { DecodeOptions, DecodedMessage };
