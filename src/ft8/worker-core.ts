import { HashCallBook, type HashCallBookSnapshot } from "../util/hashcall.js";
import type { A7Entry } from "./a7.js";
import {
	computeLongSpectrum,
	createDecodeWorkspace,
	type DecodedMessage,
	type DecodeWorkspace,
	type FT8Contest,
	type PassDecode,
	type PassParams,
	runA7Entry,
	runPass,
	subtractDecodes,
} from "./decode.js";

// Message handling of a decoder worker (parallel.ts). Each worker decodes one
// frequency band of its own copy of the signal, as a thread of the
// multi-threaded FT8 decoder of WSJT-X 3 (decoder.f90) does. Between passes
// the main thread hands every worker the signals the others decoded, so that
// all copies have the same signals subtracted, like the OpenMP barriers of
// ft8_decodevar.f90.

export type WorkerRequest =
	| {
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
	  }
	| {
			type: "pass";
			ipass: number;
			/** Signals decoded by the other workers since the last request */
			subtract: PassDecode[];
			/** Callsigns saved into the hash call books of the other workers */
			calls: string[];
	  }
	| {
			type: "a7";
			subtract: PassDecode[];
			entries: A7Entry[];
	  };

export type WorkerResponse =
	| { type: "init" }
	| { type: "pass"; decodes: PassDecode[]; calls: string[] }
	| { type: "a7"; results: (DecodedMessage | null)[] }
	| { type: "error"; message: string };

/** A hash call book that records the callsigns saved into it. */
class RecordingHashCallBook extends HashCallBook {
	saved: string[] = [];

	override save(callsign: string): void {
		this.saved.push(callsign);
		super.save(callsign);
	}

	/** Save callsigns of other workers without recording them. */
	saveUnrecorded(calls: readonly string[]): void {
		for (const call of calls) super.save(call);
	}
}

interface WorkerState {
	dd: Float64Array;
	nfa: number;
	nfb: number;
	params: PassParams;
	book: RecordingHashCallBook | undefined;
	sbase: Float64Array;
}

/** Returns a function handling the requests of one worker, in order. */
export function createWorkerHandler(): (request: WorkerRequest) => WorkerResponse {
	let workspace: DecodeWorkspace | undefined;
	let state: WorkerState | undefined;

	return (request) => {
		try {
			if (request.type === "init") {
				workspace ??= createDecodeWorkspace();
				let book: RecordingHashCallBook | undefined;
				if (request.book) {
					book = new RecordingHashCallBook();
					book.restore(request.book);
				}
				state = {
					dd: request.dd,
					nfa: request.nfa,
					nfb: request.nfb,
					params: {
						depth: request.depth,
						syncmin: request.syncmin,
						maxCandidates: request.maxCandidates,
						contest: request.contest,
						book,
					},
					book,
					sbase: new Float64Array(0),
				};
				return { type: "init" };
			}

			if (!state || !workspace) throw new Error("decoder worker used before init");
			subtractDecodes(state.dd, request.subtract, workspace);

			if (request.type === "pass") {
				const { book } = state;
				book?.saveUnrecorded(request.calls);
				if (book) book.saved = [];
				const pass = runPass(
					state.dd,
					state.nfa,
					state.nfb,
					request.ipass,
					state.params,
					workspace,
				);
				state.sbase = pass.sbase;
				return { type: "pass", decodes: pass.decodes, calls: book?.saved ?? [] };
			}

			computeLongSpectrum(state.dd, workspace);
			const ws = workspace;
			const { sbase } = state;
			return { type: "a7", results: request.entries.map((e) => runA7Entry(e, sbase, ws)) };
		} catch (err) {
			return { type: "error", message: err instanceof Error ? err.message : String(err) };
		}
	};
}
