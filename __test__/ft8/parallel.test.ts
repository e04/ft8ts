import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { FT8History } from "../../src/ft8/a7.js";
import { decode } from "../../src/ft8/decode.js";
import { encode } from "../../src/ft8/encode.js";
import { createWorkerHandler } from "../../src/ft8/worker-core.js";
import {
	type DecoderWorker,
	defaultThreadCount,
	FT8DecoderPool,
	nodeDecoderWorker,
} from "../../src/parallel.js";
import { HashCallBook } from "../../src/util/hashcall.js";
import { parseWavBuffer } from "../../src/util/wav.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_RATE = 12_000;
const SLOT_MS = 15_000;
const T0 = Date.UTC(2026, 0, 1, 0, 0, 0);

/**
 * A worker running the worker code on this thread, asynchronously, with
 * messages copied (and buffers transferred) as `postMessage` does.
 */
function inProcessWorker(): DecoderWorker {
	const handle = createWorkerHandler();
	const worker: DecoderWorker = {
		onmessage: null,
		onerror: null,
		postMessage(message, transfer) {
			const copy = structuredClone(message, { transfer });
			setTimeout(() => worker.onmessage?.({ data: structuredClone(handle(copy)) }), 0);
		},
		terminate() {},
	};
	return worker;
}

function readWav(name: string) {
	return parseWavBuffer(readFileSync(join(__dirname, name)));
}

/** Deterministic PRNG (mulberry32). */
function rng(seed: number): () => number {
	let s = seed;
	return () => {
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** A 15 s slot of unit-variance Gaussian noise plus FT8 signals at `snr` dB (default -10). */
function makeSlot(
	signals: { msg: string; freq: number; snr?: number }[],
	seed: number,
): Float32Array {
	const random = rng(seed);
	const out = new Float32Array(15 * SAMPLE_RATE);
	for (let i = 0; i < out.length; i += 2) {
		const m = Math.sqrt(-2 * Math.log(Math.max(random(), 1e-12)));
		const phi = 2 * Math.PI * random();
		out[i] = m * Math.cos(phi);
		out[i + 1] = m * Math.sin(phi);
	}
	for (const { msg, freq, snr = -10 } of signals) {
		const wave = encode(msg, { baseFrequency: freq });
		let power = 0;
		for (const x of wave) power += x * x;
		power /= wave.length;
		const amp = Math.sqrt((10 ** (snr / 10) * 2500) / (SAMPLE_RATE / 2) / power);
		const offset = Math.round(0.5 * SAMPLE_RATE);
		for (let i = 0; i < wave.length && offset + i < out.length; i++) {
			out[offset + i]! += amp * wave[i]!;
		}
	}
	return out;
}

describe("FT8DecoderPool", () => {
	test("chooses the number of threads as WSJT-X 3 does", () => {
		expect([1, 2, 4, 5, 8, 9, 15, 16, 64].map(defaultThreadCount)).toEqual([
			1, 1, 3, 3, 6, 6, 12, 12, 12,
		]);
	});

	test.each([
		["190227_155815.wav", 2],
		["190227_155815.wav", 4],
		["210703_133430.wav", 3],
		["210703_133430.wav", 8],
	])(
		"decodes %s with %i threads like the single-threaded decoder",
		async (name, threads) => {
			const { sampleRate, samples } = readWav(name);
			const single = decode(samples, { sampleRate, depth: 3 }).map((d) => d.msg);
			const pool = new FT8DecoderPool({ threads, workerFactory: inProcessWorker });
			const parallel = (await pool.decode(samples, { sampleRate, depth: 3 })).map((d) => d.msg);
			expect(parallel.filter((m) => !single.includes(m))).toEqual([]);
			expect(single.filter((m) => !parallel.includes(m)).length).toBeLessThanOrEqual(1);
		},
		30_000,
	);

	test("decodes a signal on the border of two sub-bands once", async () => {
		// With 2 threads over 200-3000 Hz, the sub-bands meet at 1600 Hz.
		const samples = makeSlot(
			[
				{ msg: "CQ K1ABC FN42", freq: 1590 },
				{ msg: "K1ABC W9XYZ EN37", freq: 800 },
				{ msg: "W9XYZ K1ABC -12", freq: 2400 },
			],
			1,
		);
		const pool = new FT8DecoderPool({ threads: 2, workerFactory: inProcessWorker });
		const msgs = (await pool.decode(samples)).map((d) => d.msg);
		expect(msgs.sort()).toEqual(["CQ K1ABC FN42", "K1ABC W9XYZ EN37", "W9XYZ K1ABC -12"]);
	});

	test("resolves hashed callsigns from the book and saves new ones into it", async () => {
		const book = new HashCallBook();
		book.save("PJ4/K1ABC");
		const samples = makeSlot(
			[
				{ msg: "<PJ4/K1ABC> W9XYZ -10", freq: 700 },
				{ msg: "CQ JA1ABC PM95", freq: 2500 },
			],
			2,
		);
		const pool = new FT8DecoderPool({ threads: 3, workerFactory: inProcessWorker });
		const msgs = (await pool.decode(samples, { hashCallBook: book })).map((d) => d.msg);
		expect(msgs).toContain("<PJ4/K1ABC> W9XYZ -10");
		expect(msgs).toContain("CQ JA1ABC PM95");
		expect(book.lookup22(new HashCallBookProbe("JA1ABC").hash22)).toBe("JA1ABC");
	});

	test("runs a7 decoding in the workers", async () => {
		const first = makeSlot([{ msg: "K1ABC W9XYZ -10", freq: 1200 }], 300);
		const weak = makeSlot([{ msg: "K1ABC W9XYZ RR73", freq: 1202, snr: -22 }], 302);
		const slotStart = T0 + 2 * SLOT_MS;

		const singleHistory = new FT8History();
		decode(first, { depth: 3, history: singleHistory, slotStart: T0 });
		const single = decode(weak, { depth: 3, history: singleHistory, slotStart });
		expect(single.find((d) => d.msg === "K1ABC W9XYZ RR73")?.ap).toBe(7);

		const history = new FT8History();
		const pool = new FT8DecoderPool({ threads: 4, workerFactory: inProcessWorker });
		await pool.decode(first, { depth: 3, history, slotStart: T0 });
		const parallel = await pool.decode(weak, { depth: 3, history, slotStart });
		// SNRs differ a little: each worker fits the spectrum baseline of its sub-band.
		const withoutSnr = (ds: typeof single) => ds.map(({ snr: _snr, ...d }) => d);
		expect(withoutSnr(parallel)).toEqual(withoutSnr(single));
		expect(Math.abs(parallel[0]!.snr - single[0]!.snr)).toBeLessThan(1);
	}, 30_000);

	test("falls back to the calling thread with one thread", async () => {
		const { sampleRate, samples } = readWav("210703_133430.wav");
		let started = 0;
		const pool = new FT8DecoderPool({
			threads: 1,
			workerFactory: () => {
				started++;
				return inProcessWorker();
			},
		});
		expect(await pool.decode(samples, { sampleRate })).toEqual(decode(samples, { sampleRate }));
		expect(started).toBe(0);
	}, 15_000);

	test("reports errors of a worker", async () => {
		const pool = new FT8DecoderPool({
			threads: 2,
			workerFactory: () => {
				const worker: DecoderWorker = {
					onmessage: null,
					onerror: null,
					postMessage() {
						setTimeout(() => worker.onmessage?.({ data: { type: "error", message: "boom" } }), 0);
					},
					terminate() {},
				};
				return worker;
			},
		});
		await expect(pool.decode(new Float32Array(15 * SAMPLE_RATE))).rejects.toThrow("boom");
	});
});

/** Finds the 22-bit hash of a callsign through a book of its own. */
class HashCallBookProbe {
	readonly hash22: number;
	constructor(call: string) {
		const book = new HashCallBook();
		book.save(call);
		this.hash22 = book.snapshot().hash22[0]!.hash;
	}
}

describe("FT8DecoderPool with Node.js worker threads", () => {
	// The TypeScript worker entry, run through tsx.
	const threadWorker = () => nodeDecoderWorker(new URL("./worker-node-tsx.mjs", import.meta.url));

	test("decodes in worker threads like the single-threaded decoder", async () => {
		const { sampleRate, samples } = readWav("190227_155815.wav");
		const single = decode(samples, { sampleRate, depth: 3 }).map((d) => d.msg);
		const pool = new FT8DecoderPool({ threads: 4, workerFactory: threadWorker });
		try {
			const book = new HashCallBook();
			const first = await pool.decode(samples, { sampleRate, depth: 3, hashCallBook: book });
			expect(first.map((d) => d.msg).sort()).toEqual([...single].sort());
			expect(book.size).toBeGreaterThan(0);
			// The same threads decode the next slot.
			const second = await pool.decode(samples, { sampleRate, depth: 3 });
			expect(second.map((d) => d.msg).sort()).toEqual([...single].sort());
		} finally {
			pool.terminate();
		}
	}, 60_000);

	test("rejects when a worker thread fails to start", async () => {
		const pool = new FT8DecoderPool({
			threads: 2,
			workerFactory: () => nodeDecoderWorker(new URL("./no-such-worker.mjs", import.meta.url)),
		});
		await expect(pool.decode(new Float32Array(15 * SAMPLE_RATE))).rejects.toThrow();
		pool.terminate();
	}, 30_000);
});
