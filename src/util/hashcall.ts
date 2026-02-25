/**
 * Hash call table – TypeScript port of the hash call storage from packjt77.f90
 *
 * In FT8, nonstandard callsigns are transmitted as hashes (10-, 12-, or 22-bit).
 * When a full callsign is decoded from a standard message, it is stored in this
 * table so that future hashed references to it can be resolved.
 *
 * Mirrors Fortran: save_hash_call, hash10, hash12, hash22, ihashcall
 */

import { C38 } from "./constants.js";

const MAGIC = 47055833459n;
const MAX_HASH22_ENTRIES = 1000;

function ihashcall(c0: string, m: number): number {
	const s = c0.padEnd(11, " ").slice(0, 11).toUpperCase();
	let n8 = 0n;
	for (let i = 0; i < 11; i++) {
		const j = C38.indexOf(s[i] ?? " ");
		n8 = 38n * n8 + BigInt(j < 0 ? 0 : j);
	}
	const prod = BigInt.asUintN(64, MAGIC * n8);
	return Number(prod >> BigInt(64 - m)) & ((1 << m) - 1);
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
export class HashCallBook {
	private readonly calls10 = new Map<number, string>();
	private readonly calls12 = new Map<number, string>();
	private readonly hash22Entries: { hash: number; call: string }[] = [];

	/**
	 * Store a callsign in all three hash tables (10, 12, 22-bit).
	 * Strips angle brackets if present. Ignores `<...>` and blank/short strings.
	 */
	save(callsign: string): void {
		let cw = callsign.trim().toUpperCase();
		if (cw === "" || cw === "<...>") return;
		if (cw.startsWith("<")) cw = cw.slice(1);
		const gt = cw.indexOf(">");
		if (gt >= 0) cw = cw.slice(0, gt);
		cw = cw.trim();
		if (cw.length < 3) return;

		const n10 = ihashcall(cw, 10);
		if (n10 >= 0 && n10 <= 1023) this.calls10.set(n10, cw);

		const n12 = ihashcall(cw, 12);
		if (n12 >= 0 && n12 <= 4095) this.calls12.set(n12, cw);

		const n22 = ihashcall(cw, 22);
		const existing = this.hash22Entries.findIndex((e) => e.hash === n22);
		if (existing >= 0) {
			this.hash22Entries[existing]!.call = cw;
		} else {
			if (this.hash22Entries.length >= MAX_HASH22_ENTRIES) {
				this.hash22Entries.pop();
			}
			this.hash22Entries.unshift({ hash: n22, call: cw });
		}
	}

	/** Look up a callsign by its 10-bit hash. Returns `null` if not found. */
	lookup10(n10: number): string | null {
		if (n10 < 0 || n10 > 1023) return null;
		return this.calls10.get(n10) ?? null;
	}

	/** Look up a callsign by its 12-bit hash. Returns `null` if not found. */
	lookup12(n12: number): string | null {
		if (n12 < 0 || n12 > 4095) return null;
		return this.calls12.get(n12) ?? null;
	}

	/** Look up a callsign by its 22-bit hash. Returns `null` if not found. */
	lookup22(n22: number): string | null {
		const entry = this.hash22Entries.find((e) => e.hash === n22);
		return entry?.call ?? null;
	}

	/** Number of entries in the 22-bit hash table. */
	get size(): number {
		return this.hash22Entries.length;
	}

	/** Remove all stored entries. */
	clear(): void {
		this.calls10.clear();
		this.calls12.clear();
		this.hash22Entries.length = 0;
	}
}
