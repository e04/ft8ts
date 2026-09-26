import type { A7Entry } from "./ft8/a7.js";
import {
	affectsBand,
	DecodeCollector,
	type DecodedMessage,
	type DecodeOptions,
	decode,
	historySlot,
	type PassDecode,
	prepareSamples,
	resolveDecodeSettings,
	toDecodedMessage,
} from "./ft8/decode.js";
import type { WorkerRequest, WorkerResponse } from "./ft8/worker-core.js";
import { SAMPLE_RATE } from "./util/constants.js";

// Multi-threaded FT8 decoding with Web Workers (browsers) or worker_threads
// (Node.js), after the FT8 decoding threads of WSJT-X 3 (decoder.f90): the
// band is split into one sub-band per thread, and the threads meet after
// every decoding pass.

/**
 * The part of a `Worker` that `FT8DecoderPool` uses. Events are typed loosely
 * so that a DOM `Worker` fits; `onmessage` receives `{ data: WorkerResponse }`.
 */
export interface DecoderWorker {
	postMessage(message: WorkerRequest, transfer: ArrayBuffer[]): void;
	// biome-ignore lint/suspicious/noExplicitAny: a DOM Worker passes a MessageEvent
	onmessage: ((event: any) => void) | null;
	// biome-ignore lint/suspicious/noExplicitAny: a DOM Worker passes an ErrorEvent
	onerror: ((event: any) => void) | null;
	terminate(): void;
}

export interface FT8DecoderPoolOptions {
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

declare const Worker: (new (url: URL, options: { type: "module" }) => DecoderWorker) | undefined;
declare const navigator: { hardwareConcurrency?: number } | undefined;

// Kept out of sight of bundlers, which would otherwise try to resolve it when
// bundling for the browser.
const WORKER_THREADS = "node:worker_threads";

function isNode(): boolean {
	return typeof process !== "undefined" && typeof process.versions?.node === "string";
}

/** Number of logical cores, or 1 if unknown. */
function coreCount(): number {
	const cores = typeof navigator === "undefined" ? undefined : navigator.hardwareConcurrency;
	if (cores) return cores;
	if (isNode()) {
		const os = process.getBuiltinModule?.("node:os");
		if (os) return os.availableParallelism();
	}
	return 1;
}

function defaultWorker(): DecoderWorker | Promise<DecoderWorker> {
	if (typeof Worker !== "undefined") {
		return new Worker(new URL("./ft8ts-worker.mjs", import.meta.url), { type: "module" });
	}
	return nodeDecoderWorker(new URL("./ft8ts-worker-node.mjs", import.meta.url));
}

/**
 * Starts the Node.js worker script at `url` (such as `dist/ft8ts-worker-node.mjs`)
 * in a worker thread, as a `DecoderWorker`. The thread does not keep the
 * process alive while it is idle.
 */
export async function nodeDecoderWorker(
	url: URL,
	options: { execArgv?: string[] } = {},
): Promise<DecoderWorker> {
	const { Worker: NodeWorker }: typeof import("node:worker_threads") = await import(
		/* webpackIgnore: true */ /* @vite-ignore */ WORKER_THREADS
	);
	const thread = new NodeWorker(url, options.execArgv ? { execArgv: options.execArgv } : {});
	thread.unref();
	let outstanding = 0;
	let terminated = false;
	const worker: DecoderWorker = {
		onmessage: null,
		onerror: null,
		postMessage(message, transfer) {
			// Keep the process alive until the answer arrives.
			if (outstanding++ === 0) thread.ref();
			thread.postMessage(message, transfer);
		},
		terminate() {
			terminated = true;
			void thread.terminate();
		},
	};
	thread.on("message", (data: WorkerResponse) => {
		if (--outstanding === 0) thread.unref();
		worker.onmessage?.({ data });
	});
	thread.on("error", (error) => worker.onerror?.(error));
	thread.on("exit", (code) => {
		if (!terminated) worker.onerror?.({ message: `decoder worker exited with code ${code}` });
	});
	return worker;
}

/** Narrowest sub-band (Hz) given to a thread; narrower bands use fewer threads. */
const MIN_BAND_WIDTH = 100;

/** Number of decoding threads for `cores` logical cores, as WSJT-X 3 chooses it. */
export function defaultThreadCount(cores: number): number {
	if (cores <= 1) return 1;
	if (cores <= 4) return cores - 1;
	if (cores <= 8) return cores - 2;
	if (cores <= 15) return cores - 3;
	return 12;
}

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
export class FT8DecoderPool {
	readonly threads: number;
	private readonly workerFactory: () => DecoderWorker | Promise<DecoderWorker>;
	private readonly customFactory: boolean;
	private readonly workers: WorkerChannel[] = [];
	private queue: Promise<unknown> = Promise.resolve();

	constructor(options: FT8DecoderPoolOptions = {}) {
		this.threads = Math.max(1, Math.floor(options.threads ?? defaultThreadCount(coreCount())));
		this.customFactory = options.workerFactory !== undefined;
		this.workerFactory = options.workerFactory ?? defaultWorker;
	}

	/**
	 * Decode all FT8 signals in an audio buffer, like `decodeFT8`. Calls are
	 * run one after another. With one thread, or without any kind of worker, the
	 * buffer is decoded on the calling thread.
	 */
	decode(
		samples: Float32Array | Float64Array,
		options: DecodeOptions = {},
	): Promise<DecodedMessage[]> {
		const run = this.queue.then(() => this.run(samples, options));
		this.queue = run.catch(() => {});
		return run;
	}

	/** Stop the workers. The pool starts new ones if it is used again. */
	terminate(): void {
		for (const w of this.workers) w.terminate();
		this.workers.length = 0;
	}

	private async run(
		samples: Float32Array | Float64Array,
		options: DecodeOptions,
	): Promise<DecodedMessage[]> {
		const { nfa, nfb, npass, params } = resolveDecodeSettings(options);
		const nthreads = Math.min(this.threads, Math.floor((nfb - nfa) / MIN_BAND_WIDTH));
		if (nthreads <= 1 || !this.canStartWorkers()) return decode(samples, options);

		const history = options.history;
		const slot = historySlot(options);
		const previous = history?.beginSlot(slot) ?? [];
		const dd = prepareSamples(samples, options.sampleRate ?? SAMPLE_RATE);
		const bands = splitBand(nfa, nfb, nthreads);
		const started = await Promise.all(
			Array.from({ length: nthreads - this.workers.length }, () => this.workerFactory()),
		);
		for (const w of started) this.workers.push(new WorkerChannel(w));
		const workers = this.workers.slice(0, nthreads);

		const book = params.book;
		const snapshot = book?.snapshot() ?? null;
		await Promise.all(
			workers.map((w, i) => {
				const copy = dd.slice();
				return w.request(
					{
						type: "init",
						dd: copy,
						nfa: bands[i]![0],
						nfb: bands[i]![1],
						depth: params.depth,
						syncmin: params.syncmin,
						maxCandidates: params.maxCandidates,
						contest: params.contest,
						book: snapshot,
					},
					[copy.buffer],
				);
			}),
		);

		const collector = new DecodeCollector(history, slot);
		// Signals near its sub-band and callsigns that each worker has yet to hear
		// about from the others.
		let subtract: PassDecode[][] = workers.map(() => []);
		let calls: string[][] = workers.map(() => []);

		for (let ipass = 1; ipass <= npass; ipass++) {
			if (ipass === 3 && collector.decoded.length === 0) break;
			const responses = await Promise.all(
				workers.map((w, i) =>
					w.request({ type: "pass", ipass, subtract: subtract[i]!, calls: calls[i]! }),
				),
			);
			subtract = workers.map(() => []);
			calls = workers.map(() => []);
			responses.forEach((r, i) => {
				if (r.type !== "pass") return;
				for (const d of r.decodes) collector.add(toDecodedMessage(d));
				for (const call of r.calls) book?.save(call);
				for (let j = 0; j < workers.length; j++) {
					if (j === i) continue;
					const [lo, hi] = bands[j]!;
					subtract[j]!.push(...r.decodes.filter((d) => affectsBand(d.freq, lo, hi)));
					calls[j]!.push(...r.calls);
				}
			});
		}

		// a7: each station decoded 30 s earlier is looked for by the worker of
		// its frequency. Supersession is checked again in order, as a7 decodes
		// saved into the history can supersede later entries.
		if (history && params.depth >= 3 && previous.length > 0) {
			const entries = previous.filter((e) => !history.supersedes(slot, e));
			const byWorker: A7Entry[][] = workers.map(() => []);
			const owner = entries.map((e) => bandIndex(bands, e.freq));
			entries.forEach((e, k) => {
				byWorker[owner[k]!]!.push(e);
			});
			const responses = await Promise.all(
				workers.map((w, i) =>
					w.request({ type: "a7", subtract: subtract[i]!, entries: byWorker[i]! }),
				),
			);
			const next = workers.map(() => 0);
			entries.forEach((entry, k) => {
				const i = owner[k]!;
				const r = responses[i]!;
				const result = r.type === "a7" ? r.results[next[i]!++] : null;
				if (!result || history.supersedes(slot, entry)) return;
				collector.add(result);
			});
		}

		return collector.decoded;
	}

	private canStartWorkers(): boolean {
		return this.customFactory || typeof Worker !== "undefined" || isNode();
	}
}

/**
 * Split [nfa, nfb] Hz into `n` sub-bands as decoder.f90 does: widths of
 * round((nfb - nfa) / n), each starting 1 Hz above the end of the previous one.
 */
function splitBand(nfa: number, nfb: number, n: number): [number, number][] {
	const nfdelta = Math.round(Math.abs(nfb - nfa) / n);
	const bands: [number, number][] = [];
	let lo = nfa;
	for (let i = 0; i < n; i++) {
		const hi = i === n - 1 ? nfb : Math.min(nfa + (i + 1) * nfdelta, nfb - 1);
		bands.push([lo, hi]);
		lo = hi + 1;
	}
	return bands;
}

/** Index of the sub-band containing `freq`, or of the nearest one. */
function bandIndex(bands: [number, number][], freq: number): number {
	for (let i = 0; i < bands.length - 1; i++) if (freq <= bands[i]![1]) return i;
	return bands.length - 1;
}

/** Requests to one worker, answered in order. */
class WorkerChannel {
	private readonly pending: {
		resolve: (r: WorkerResponse) => void;
		reject: (e: Error) => void;
	}[] = [];

	constructor(private readonly worker: DecoderWorker) {
		worker.onmessage = (event: { data: WorkerResponse }) => {
			this.pending.shift()?.resolve(event.data);
		};
		worker.onerror = (event: unknown) => {
			const message =
				typeof event === "object" && event !== null && "message" in event
					? String(event.message)
					: "decoder worker failed";
			for (const p of this.pending.splice(0)) p.reject(new Error(message));
		};
	}

	request(message: WorkerRequest, transfer: ArrayBuffer[] = []): Promise<WorkerResponse> {
		return new Promise((resolve, reject) => {
			this.pending.push({
				resolve: (r) => (r.type === "error" ? reject(new Error(r.message)) : resolve(r)),
				reject,
			});
			this.worker.postMessage(message, transfer);
		});
	}

	terminate(): void {
		this.worker.terminate();
		for (const p of this.pending.splice(0)) p.reject(new Error("decoder pool terminated"));
	}
}
