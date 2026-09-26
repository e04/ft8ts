/**
 * Hash call table – TypeScript port of the hash call storage from packjt77.f90
 *
 * In FT8, nonstandard callsigns are transmitted as hashes (10-, 12-, or 22-bit).
 * When a full callsign is decoded from a standard message, it is stored in this
 * table so that future hashed references to it can be resolved.
 *
 * Mirrors Fortran: save_hash_call, hash10, hash12, hash22, ihashcall
 */
/** Contents of a `HashCallBook`, as plain data that can be sent to a worker. */
interface HashCallBookSnapshot {
    calls10: [number, string][];
    calls12: [number, string][];
    hash22: {
        hash: number;
        call: string;
    }[];
}
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
    /** The contents of the book, to be restored with `restore`. */
    snapshot(): HashCallBookSnapshot;
    /** Replace the contents of the book with a `snapshot`. */
    restore(snapshot: HashCallBookSnapshot): void;
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
    /** Minimum sync threshold, default 1.18 */
    syncMin?: number;
    /** Decoding depth: 1=fast BP only, 2=BP+OSD, 3=deep */
    depth?: number;
    /** Maximum candidates to process, default 200 */
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

/** A decode saved for a7: "call_1 call_2" plus the grid, if the message had one. */
interface A7Entry {
    dt: number;
    freq: number;
    msg: string;
}
/**
 * Decodes of recent FT8 slots, used for "a7" decoding: a station decoded 30 s
 * earlier is looked for again at the same frequency with the messages it is
 * likely to send next.
 *
 * Pass the same instance to consecutive `decodeFT8` calls together with
 * `slotStart`:
 * ```ts
 * const history = new FT8History();
 * const decoded = decodeFT8(samples, { depth: 3, history, slotStart: Date.now() });
 * ```
 */
declare class FT8History {
    /** Saved decodes keyed by slot number, floor(ms since epoch / 15000). */
    private readonly slots;
    /** Remove all saved decodes. */
    clear(): void;
    /**
     * Start a new tally for `slot`, replacing one saved by an earlier decode of
     * the same slot, and return the tally of the previous slot of the same
     * sequence (30 s earlier).
     */
    beginSlot(slot: number): readonly A7Entry[];
    /** Save a decode of `slot` (ft8_a7_save). `dt` and `freq` are as reported to the user. */
    save(slot: number, dt: number, freq: number, msg: string): void;
    /**
     * Whether a decode already saved for `slot` comes from the station of
     * `entry` (saved for slot - 2), so that no a7 decode should be tried for it.
     */
    supersedes(slot: number, entry: A7Entry): boolean;
}

/** WSJT-X "Special operating activity" (ncontest) settings that affect FT8 decoding. */
type FT8Contest = "NA_VHF" | "EU_VHF" | "FIELD_DAY" | "RTTY" | "WW_DIGI" | "ARRL_DIGI";
interface DecodedMessage {
    freq: number;
    dt: number;
    snr: number;
    msg: string;
    /** Sync power of the candidate; 0 for a7 decodes, which are not found by the sync search */
    sync: number;
    /**
     * A priori (AP) decoding type as in WSJT-X, absent for ordinary decodes:
     * 1 = "CQ ??? ???" AP pass (depth 3), 7 = a7 decode of a station decoded 30 s
     * earlier (depth 3 with `history`). These are more likely to be false decodes.
     */
    ap?: number;
}
interface DecodeOptions {
    /** Sample rate (Hz), default 12000 */
    sampleRate?: number;
    /** Lower frequency bound (Hz), default 200 */
    freqLow?: number;
    /** Upper frequency bound (Hz), default 3000 */
    freqHigh?: number;
    /** Minimum sync threshold, default 2.1 for depth <= 2 and 1.3 for depth >= 3 (as in WSJT-X) */
    syncMin?: number;
    /** Decoding depth: 1=fast BP only, 2=BP+OSD, 3=deep (values above 3 behave like 3) */
    depth?: number;
    /** Maximum candidates to process per pass, default 1000 */
    maxCandidates?: number;
    /**
     * WSJT-X "Special operating activity". Outside a contest (the default),
     * standard messages containing "/R" or starting with "TU;" are rejected as
     * likely false decodes, as in WSJT-X 3. It also selects the CQ form
     * ("CQ TEST", "CQ FD", "CQ RU", "CQ WW") used for a priori decoding at depth 3.
     */
    contest?: FT8Contest;
    /**
     * Hash call book for resolving hashed callsigns.
     * When provided, decoded standard callsigns are saved into the book,
     * and hashed callsigns (e.g. `<...>`) are resolved from it.
     * Pass the same instance across multiple `decode` calls to accumulate
     * callsign knowledge over time.
     */
    hashCallBook?: HashCallBook;
    /**
     * Decodes of recent slots for "a7" decoding. Decodes are saved into it at
     * any depth; at depth 3, stations decoded in the slot 30 s earlier and not
     * decoded in this one are looked for with the messages they are likely to
     * send next. Pass the same instance for consecutive slots, with `slotStart`.
     */
    history?: FT8History;
    /** Start of (or any time within) the 15 s slot being decoded, as a Date or ms since epoch. Required with `history`. */
    slotStart?: Date | number;
}
/**
 * Decode all FT8 signals in an audio buffer.
 * Input: mono audio samples at `sampleRate` Hz, duration ~15s.
 */
declare function decode(samples: Float32Array | Float64Array, options?: DecodeOptions): DecodedMessage[];
/** A decode of `runPass`, with what is needed to subtract its signal elsewhere. */
interface PassDecode extends DecodedMessage {
    tones: number[];
    /** Base frequency (Hz) of the subtracted signal (equals `freq`) */
    freq: number;
    /** Start time (s) used for signal subtraction */
    dtSubtract: number;
}

declare function encode(msg: string, options?: WaveformOptions): Float32Array;

type WorkerRequest = {
    type: "init";
    /** Decode window at 12 kHz */
    dd: Float64Array;
    nfa: number;
    nfb: number;
    depth: number;
    syncmin: number;
    maxCandidates: number;
    contest: FT8Contest | undefined;
    /** Contents of the hash call book, `null` when decoding without one */
    book: HashCallBookSnapshot | null;
} | {
    type: "pass";
    ipass: number;
    /** Signals decoded by the other workers since the last request */
    subtract: PassDecode[];
    /** Callsigns saved into the hash call books of the other workers */
    calls: string[];
} | {
    type: "a7";
    subtract: PassDecode[];
    entries: A7Entry[];
};

/**
 * The part of a `Worker` that `FT8DecoderPool` uses. Events are typed loosely
 * so that a DOM `Worker` fits; `onmessage` receives `{ data: WorkerResponse }`.
 */
interface DecoderWorker {
    postMessage(message: WorkerRequest, transfer: ArrayBuffer[]): void;
    onmessage: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    terminate(): void;
}
interface FT8DecoderPoolOptions {
    /**
     * Number of decoding threads. The default follows WSJT-X 3 ("auto"): one
     * less than the number of logical cores for 2-4 cores, two less for 5-8,
     * three less for 9-15, and 12 for 16 or more.
     */
    threads?: number;
    /**
     * Creates a decoder worker. By default, `ft8ts-worker.mjs` next to this
     * module is started as a module Web Worker, or, in Node.js,
     * `ft8ts-worker-node.mjs` in a worker thread (see `nodeDecoderWorker`).
     */
    workerFactory?: () => DecoderWorker | Promise<DecoderWorker>;
}
/** Number of decoding threads for `cores` logical cores, as WSJT-X 3 chooses it. */
declare function defaultThreadCount(cores: number): number;
/**
 * Decodes FT8 in several threads at once: Web Workers in browsers,
 * worker_threads in Node.js. Create one pool and use it for
 * every slot; the workers are started on first use and kept until
 * `terminate()`.
 *
 * ```ts
 * const pool = new FT8DecoderPool();
 * const decoded = await pool.decode(samples, { sampleRate: 48000, depth: 3 });
 * ```
 *
 * Results are those of `decodeFT8` with the same options, up to small
 * differences: as in WSJT-X, each thread finds candidates in its own
 * sub-band, and sees the signals decoded by the other threads only from the
 * next pass on.
 */
declare class FT8DecoderPool {
    readonly threads: number;
    private readonly workerFactory;
    private readonly customFactory;
    private readonly workers;
    private queue;
    constructor(options?: FT8DecoderPoolOptions);
    /**
     * Decode all FT8 signals in an audio buffer, like `decodeFT8`. Calls are
     * run one after another. With one thread, or without any kind of worker, the
     * buffer is decoded on the calling thread.
     */
    decode(samples: Float32Array | Float64Array, options?: DecodeOptions): Promise<DecodedMessage[]>;
    /** Stop the workers. The pool starts new ones if it is used again. */
    terminate(): void;
    private run;
    private canStartWorkers;
}

export { FT8DecoderPool, FT8History, HashCallBook, decode$1 as decodeFT4, decode as decodeFT8, defaultThreadCount, encode$1 as encodeFT4, encode as encodeFT8 };
export type { DecodeOptions$1 as DecodeFT4Options, DecodeOptions, DecodedMessage$1 as DecodedFT4Message, DecodedMessage, DecoderWorker, FT8Contest, FT8DecoderPoolOptions, HashCallBookSnapshot };
