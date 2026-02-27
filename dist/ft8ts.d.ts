/**
 * Hash call table – TypeScript port of the hash call storage from packjt77.f90
 *
 * In FT8, nonstandard callsigns are transmitted as hashes (10-, 12-, or 22-bit).
 * When a full callsign is decoded from a standard message, it is stored in this
 * table so that future hashed references to it can be resolved.
 *
 * Mirrors Fortran: save_hash_call, hash10, hash12, hash22, ihashcall
 */
/**
 * Maintains a callsign ↔ hash lookup table for resolving hashed FT8 callsigns.
 *
 * Usage:
 * ```ts
 * const book = new HashCallBook();
 * const decoded = decodeFT8(samples, { sampleRate, hashCallBook: book });
 * // `book` now contains callsigns learned from decoded messages.
 * // Subsequent calls reuse the same book to resolve hashed callsigns:
 * const decoded2 = decodeFT8(samples2, { sampleRate, hashCallBook: book });
 * ```
 *
 * You can also pre-populate the book with known callsigns:
 * ```ts
 * book.save("W9XYZ");
 * book.save("PJ4/K1ABC");
 * ```
 */
declare class HashCallBook {
    private readonly calls10;
    private readonly calls12;
    private readonly hash22Entries;
    /**
     * Store a callsign in all three hash tables (10, 12, 22-bit).
     * Strips angle brackets if present. Ignores `<...>` and blank/short strings.
     */
    save(callsign: string): void;
    /** Look up a callsign by its 10-bit hash. Returns `null` if not found. */
    lookup10(n10: number): string | null;
    /** Look up a callsign by its 12-bit hash. Returns `null` if not found. */
    lookup12(n12: number): string | null;
    /** Look up a callsign by its 22-bit hash. Returns `null` if not found. */
    lookup22(n22: number): string | null;
    /** Number of entries in the 22-bit hash table. */
    get size(): number;
    /** Remove all stored entries. */
    clear(): void;
}

interface DecodedMessage$1 {
    freq: number;
    dt: number;
    snr: number;
    msg: string;
    sync: number;
}
interface DecodeOptions$1 {
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
/**
 * Decode all FT4 signals in a buffer.
 * Input: mono audio samples at `sampleRate` Hz, duration ~6s.
 */
declare function decode$1(samples: Float32Array | Float64Array, options?: DecodeOptions$1): DecodedMessage$1[];

interface WaveformOptions {
    sampleRate?: number;
    samplesPerSymbol?: number;
    bt?: number;
    baseFrequency?: number;
    initialPhase?: number;
}

declare function encode$1(msg: string, options?: WaveformOptions): Float32Array;

interface DecodedMessage {
    freq: number;
    dt: number;
    snr: number;
    msg: string;
    sync: number;
}
interface DecodeOptions {
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
declare function decode(samples: Float32Array | Float64Array, options?: DecodeOptions): DecodedMessage[];

declare function encode(msg: string, options?: WaveformOptions): Float32Array;

export { HashCallBook, decode$1 as decodeFT4, decode as decodeFT8, encode$1 as encodeFT4, encode as encodeFT8 };
export type { DecodeOptions$1 as DecodeFT4Options, DecodeOptions, DecodedMessage$1 as DecodedFT4Message, DecodedMessage };
