import { HashCallBook } from "../util/hashcall.js";
import { pack77 } from "../util/pack_jt77.js";
import { unpack77 } from "../util/unpack_jt77.js";
import { encode174_91, getTones } from "./encode.js";

// Port of the "a7" decode table and candidate messages of WSJT-X v3.0.1
// (ft8_a7.f90: ft8_a7_save and the message list of ft8_a7d).

/** Maximum number of decodes saved per slot (MAXDEC). */
const MAX_ENTRIES = 200;
const SLOT_MS = 15_000;
/** Number of candidate messages tried for each saved decode. */
const NUM_MESSAGES = 206;

/** A decode saved for a7: "call_1 call_2" plus the grid, if the message had one. */
export interface A7Entry {
	dt: number;
	freq: number;
	msg: string;
}

/** A candidate message for an a7 decode, with its codeword and channel tones. */
export interface A7Candidate {
	bits77: number[];
	cw: number[];
	tones: number[];
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
export class FT8History {
	/** Saved decodes keyed by slot number, floor(ms since epoch / 15000). */
	private readonly slots = new Map<number, A7Entry[]>();

	/** Remove all saved decodes. */
	clear(): void {
		this.slots.clear();
	}

	/**
	 * Start a new tally for `slot`, replacing one saved by an earlier decode of
	 * the same slot, and return the tally of the previous slot of the same
	 * sequence (30 s earlier).
	 */
	beginSlot(slot: number): readonly A7Entry[] {
		for (const key of this.slots.keys()) {
			if (key < slot - 2) this.slots.delete(key);
		}
		this.slots.set(slot, []);
		return this.slots.get(slot - 2) ?? [];
	}

	/** Save a decode of `slot` (ft8_a7_save). `dt` and `freq` are as reported to the user. */
	save(slot: number, dt: number, freq: number, msg: string): void {
		if (msg.includes("/") || msg.includes("<")) return;
		const { words, lengths } = split77(msg);
		if (words.length < 1 || words[0]!.startsWith("CQ_")) return;

		const tally = this.slots.get(slot);
		if (!tally || tally.length >= MAX_ENTRIES) return;

		const [w1, w2 = "", w3 = ""] = words;
		let entry = `${w1} ${w2}`.trim();
		if (w1 === "CQ" && lengths[1]! <= 2) entry = `CQ ${w2} ${w3}`.trim();
		const last = words[words.length - 1]!;
		if (isGrid4(last.slice(0, 4))) entry = `${entry} ${last}`;
		tally.push({ dt, freq, msg: entry });
	}

	/**
	 * Whether a decode already saved for `slot` comes from the station of
	 * `entry` (saved for slot - 2), so that no a7 decode should be tried for it.
	 */
	supersedes(slot: number, entry: A7Entry): boolean {
		for (const cur of this.slots.get(slot) ?? []) {
			const call2 = split77(cur.msg).words[1] ?? "";
			if (Math.abs(cur.freq - entry.freq) <= 3.0 && entry.msg.indexOf(` ${call2}`) >= 2) {
				return true;
			}
		}
		return false;
	}
}

/** Slot number of a time within a 15 s FT8 slot. */
export function slotNumber(time: Date | number): number {
	const ms = typeof time === "number" ? time : time.getTime();
	return Math.floor(ms / SLOT_MS);
}

/**
 * The message candidates for an a7 decode of `entry` (ft8_a7d), with the
 * callsigns and grid they were built from. Messages that cannot be packed are
 * `null`.
 */
export function a7Candidates(entry: A7Entry): {
	call1: string;
	call2: string;
	grid4: string;
	candidates: (A7Candidate | null)[];
} {
	const i1 = entry.msg.indexOf(" ");
	const call1 = (i1 < 0 ? entry.msg : entry.msg.slice(0, i1)).slice(0, 12);
	const rest = i1 < 0 ? "" : entry.msg.slice(i1 + 1);
	const i2 = rest.indexOf(" ");
	const call2 = (i2 < 0 ? rest : rest.slice(0, i2)).slice(0, 12);
	let grid4 = i2 < 0 ? "" : rest.slice(i2 + 1, i2 + 5);
	if (grid4 === "RR73" || grid4.includes("+") || grid4.includes("-")) grid4 = "";

	const candidates = a7Messages(call1, call2, grid4).map((msg) => {
		try {
			const bits77 = pack77(msg);
			const cw = encode174_91(bits77);
			return { bits77, cw, tones: getTones(cw) };
		} catch {
			return null;
		}
	});
	return { call1, call2, grid4, candidates };
}

/** The message a candidate decodes to, with hashed callsigns resolved (genft8 `msgsent`). */
export function a7MessageText(candidate: A7Candidate, call1: string, call2: string): string | null {
	const book = new HashCallBook();
	for (const call of [call1, call2, "QU1RK"]) book.save(call);
	const { msg, success } = unpack77(candidate.bits77, book);
	return success ? msg : null;
}

/** Whether `call` is a standard callsign (stdcall in WSJT-X). */
export function isStandardCall(call: string): boolean {
	const n = call.length;
	let iarea = n - 1;
	while (iarea >= 1 && !isDigit(call[iarea]!)) iarea--;
	if (iarea < 1 || iarea > 2) return false;
	let npdig = 0;
	let nplet = 0;
	for (let i = 0; i < iarea; i++) {
		if (isDigit(call[i]!)) npdig++;
		if (isLetter(call[i]!)) nplet++;
	}
	let nslet = 0;
	for (let i = iarea + 1; i < n; i++) {
		if (isLetter(call[i]!)) nslet++;
	}
	return nplet > 0 && npdig < iarea && nslet <= 3;
}

/**
 * The 206 messages tried for an a7 decode: "call_1 call_2" alone and with RRR,
 * RR73, 73, the grid and every report from -50 to +49 (with and without R),
 * plus "CQ call_2 grid".
 */
function a7Messages(call1: string, call2: string, grid4: string): string[] {
	const std1 = call1 === "CQ" || isStandardCall(call1);
	const std2 = isStandardCall(call2);
	const msgs: string[] = [];
	for (let i = 1; i <= NUM_MESSAGES; i++) {
		let msg = `${call1} ${call2}`;
		if (call1 === "CQ" && i !== 5) msg = `QU1RK ${call2}`;
		if (!std1) {
			if (i === 1 || i >= 6) msg = `<${call1}> ${call2}`;
			if (i >= 2 && i <= 4) msg = `${call1} <${call2}>`;
		} else if (!std2) {
			if (i <= 4 || i === 6) msg = `<${call1}> ${call2}`;
			if (i >= 7) msg = `${call1} <${call2}>`;
		}
		if (i === 2) msg += " RRR";
		if (i === 3) msg += " RR73";
		if (i === 4) msg += " 73";
		if (i === 5) {
			if (std2) {
				msg = `CQ ${call2}`;
				if (call1[2] === "_") msg = `${call1} ${call2}`;
				msg += ` ${grid4}`;
			} else {
				msg = `CQ ${call2}`;
			}
		}
		if (i === 6 && std2) msg += ` ${grid4}`;
		if (i >= 7) {
			const isnr = -50 + Math.trunc((i - 7) / 2);
			const report = (isnr >= 0 ? "+" : "-") + Math.abs(isnr).toString().padStart(2, "0");
			msg += i % 2 === 1 ? ` ${report}` : ` R${report}`;
		}
		msgs.push(msg.trim());
	}
	return msgs;
}

/**
 * Split a message into upper-case words, merging "CQ xxx" into "CQ_xxx" when
 * the third word is a callsign (split77 in packjt77.f90). `lengths` are the
 * word lengths before merging.
 */
function split77(msg: string): { words: string[]; lengths: number[] } {
	const words = msg.toUpperCase().split(" ").filter(Boolean);
	const lengths = words.map((w) => w.length);
	if (words.length >= 3 && words[0] === "CQ" && chkcall(words[2]!)) {
		words.splice(0, 2, `CQ_${words[1]!.slice(0, 10)}`);
	}
	return { words, lengths };
}

/** Whether `w` could be a standard or compound callsign (chkcall.f90). */
function chkcall(w: string): boolean {
	const n1 = w.length;
	if (n1 > 11 || /[.+\-?]/.test(w)) return false;
	const i0 = w.indexOf("/");
	if (n1 > 6 && i0 < 0) return false;
	// Base call of a compound call: the longer part
	if (Math.max(i0, n1 - i0 - 1) > 6) return false;
	let bc = w.slice(0, 6);
	if (i0 >= 1 && i0 <= n1 - 2) bc = i0 <= n1 - i0 - 1 ? w.slice(i0 + 1) : w.slice(0, i0);
	const nbc = bc.length;
	if (nbc > 6) return false;

	if (!isLetter(bc[0] ?? "") && !isLetter(bc[1] ?? "")) return false;
	if (bc[0] === "Q" && !bc.startsWith("QU1RK")) return false;

	// Call area digit in the second or third position, followed by 1-3 letters
	let i1 = -1;
	if (isDigit(bc[1] ?? "")) i1 = 1;
	if (isDigit(bc[2] ?? "")) i1 = 2;
	if (i1 < 0 || i1 === nbc - 1) return false;
	for (let i = i1 + 1; i < nbc; i++) {
		if (!isLetter(bc[i]!)) return false;
	}
	return nbc - i1 - 1 <= 3;
}

function isGrid4(g: string): boolean {
	return /^[A-R]{2}[0-9]{2}$/.test(g);
}

function isDigit(c: string): boolean {
	return c >= "0" && c <= "9";
}

function isLetter(c: string): boolean {
	return c >= "A" && c <= "Z";
}
