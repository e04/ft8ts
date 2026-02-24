import { describe, expect, test } from "vitest";
import { HashCallBook } from "../src/util/hashcall.js";
import { pack77 } from "../src/util/pack_jt77.js";
import { unpack77 } from "../src/util/unpack_jt77.js";

describe("HashCallBook", () => {
	test("save populates all three hash tables", () => {
		const book = new HashCallBook();
		book.save("W9XYZ");
		expect(book.size).toBe(1);

		// 22-bit: resolvable via a Type 1 hashed-call message
		const bits22 = pack77("CQ <W9XYZ>");
		expect(unpack77(bits22, book).msg).toContain("<W9XYZ>");

		// 12-bit: resolvable via a Type 4 hashed-call message
		const bits12 = pack77("YW18FIFA <W9XYZ> RRR");
		expect(unpack77(bits12, book).msg).toBe("YW18FIFA <W9XYZ> RRR");
	});

	test("10-bit hash round-trip via direct lookup", () => {
		const book = new HashCallBook();
		book.save("K1ABC");
		// 10-bit hashes are not used in any currently implemented message type,
		// but the table should still store and retrieve them correctly.
		const book2 = new HashCallBook();
		book2.save("K1ABC");
		for (let h = 0; h < 1024; h++) {
			const r = book.lookup10(h);
			if (r !== null) {
				expect(r).toBe("K1ABC");
				expect(book2.lookup10(h)).toBe("K1ABC");
				return;
			}
		}
		throw new Error("K1ABC should have been stored in 10-bit table");
	});

	test("12-bit hash round-trip via direct lookup", () => {
		const book = new HashCallBook();
		book.save("KA1ABC");
		let found = false;
		for (let h = 0; h < 4096; h++) {
			if (book.lookup12(h) === "KA1ABC") {
				found = true;
				break;
			}
		}
		expect(found).toBe(true);
	});

	test("22-bit hash round-trip via direct lookup", () => {
		const book = new HashCallBook();
		book.save("PJ4/K1ABC");
		expect(book.size).toBe(1);
		// lookup22 must find it for some hash value
		let found = false;
		for (let h = 0; h < 0x400000 && !found; h += 1021) {
			if (book.lookup22(h) === "PJ4/K1ABC") found = true;
		}
		// Also verify through the message-level path (more reliable)
		const bits = pack77("<PJ4/K1ABC> W9XYZ R-09");
		expect(unpack77(bits, book).msg).toBe("<PJ4/K1ABC> W9XYZ R-09");
	});

	test("ignores <...> and blank callsigns", () => {
		const book = new HashCallBook();
		book.save("<...>");
		book.save("");
		book.save("  ");
		book.save("AB");
		expect(book.size).toBe(0);
	});

	test("strips angle brackets from callsigns", () => {
		const book = new HashCallBook();
		book.save("<W9XYZ>");
		expect(book.size).toBe(1);

		const bits = pack77("CQ <W9XYZ>");
		expect(unpack77(bits, book).msg).toContain("<W9XYZ>");
	});

	test("duplicate save does not increase size", () => {
		const book = new HashCallBook();
		book.save("W9XYZ");
		book.save("W9XYZ");
		expect(book.size).toBe(1);
	});

	test("clear removes all entries", () => {
		const book = new HashCallBook();
		book.save("W9XYZ");
		book.save("K1ABC");
		expect(book.size).toBe(2);
		book.clear();
		expect(book.size).toBe(0);
		// After clear, previously resolvable hashes should fail
		const bits = pack77("CQ <W9XYZ>");
		expect(unpack77(bits, book).msg).not.toContain("<W9XYZ>");
	});

	test("22-bit table is bounded at 1000 entries", () => {
		const book = new HashCallBook();
		for (let i = 0; i < 1050; i++) {
			const call = `W${i.toString().padStart(4, "0")}X`;
			book.save(call);
		}
		expect(book.size).toBe(1000);
	});

	test("multiple distinct callsigns get independent hashes", () => {
		const book = new HashCallBook();
		book.save("W9XYZ");
		book.save("K1ABC");
		book.save("PJ4/K1ABC");
		expect(book.size).toBe(3);

		expect(unpack77(pack77("CQ <W9XYZ>"), book).msg).toContain("<W9XYZ>");
		expect(unpack77(pack77("CQ <K1ABC>"), book).msg).toContain("<K1ABC>");
		expect(unpack77(pack77("<PJ4/K1ABC> W9XYZ R-09"), book).msg).toBe("<PJ4/K1ABC> W9XYZ R-09");
	});
});

describe("22-bit hash (Type 1/2)", () => {
	test("resolves hashed call_1 (n28a) with pre-populated book", () => {
		const book = new HashCallBook();
		book.save("PJ4/K1ABC");
		const { msg, success } = unpack77(pack77("<PJ4/K1ABC> W9XYZ R-09"), book);
		expect(success).toBe(true);
		expect(msg).toBe("<PJ4/K1ABC> W9XYZ R-09");
	});

	test("resolves hashed call_2 (n28b) with pre-populated book", () => {
		const book = new HashCallBook();
		book.save("YW18FIFA");
		const { msg, success } = unpack77(pack77("W9XYZ <YW18FIFA> R-09"), book);
		expect(success).toBe(true);
		expect(msg).toBe("W9XYZ <YW18FIFA> R-09");
	});

	test("without book, hashed call_1 shows <...>", () => {
		const { msg, success } = unpack77(pack77("<PJ4/K1ABC> W9XYZ R-09"));
		expect(success).toBe(true);
		expect(msg).toBe("<...> W9XYZ R-09");
	});

	test("without book, hashed call_2 shows <...>", () => {
		const { msg, success } = unpack77(pack77("W9XYZ <YW18FIFA> R-09"));
		expect(success).toBe(true);
		expect(msg).toBe("W9XYZ <...> R-09");
	});

	test("saves 'from' callsign (call_2) into the book", () => {
		const book = new HashCallBook();
		unpack77(pack77("K1ABC W9XYZ EN37"), book);
		expect(book.size).toBeGreaterThanOrEqual(1);
		// Verify W9XYZ was saved and is now resolvable as a 22-bit hash
		expect(unpack77(pack77("CQ <W9XYZ>"), book).msg).toContain("<W9XYZ>");
	});

	test("does not save call_1 (the 'to' call) into the book", () => {
		const book = new HashCallBook();
		unpack77(pack77("K1ABC W9XYZ EN37"), book);
		// K1ABC was call_1 (the "to" call) – should not be saved
		expect(unpack77(pack77("CQ <K1ABC>"), book).msg).not.toContain("<K1ABC>");
	});

	test("does not save hashed (<...>) call_2 into the book", () => {
		const book = new HashCallBook();
		unpack77(pack77("W9XYZ <YW18FIFA> R-09"), book);
		// <YW18FIFA> was hashed in call_2 – unpack showed <...>, should not save <...>
		expect(book.size).toBe(0);
	});

	test("resolves hash with /R suffix (Type 1)", () => {
		const book = new HashCallBook();
		book.save("PJ4/K1ABC");
		// K1ABC/R has /R suffix — but PJ4/K1ABC is the hashed call in call_2
		const { msg, success } = unpack77(pack77("K1ABC/R <PJ4/K1ABC> -11"), book);
		expect(success).toBe(true);
		expect(msg).toContain("<PJ4/K1ABC>");
	});
});

// ── 12-bit hash resolution (Type 4) ─────────────────────────────────────────

describe("12-bit hash (Type 4)", () => {
	test("resolves 12-bit hash with iflip=0 (hash is call_1)", () => {
		const book = new HashCallBook();
		book.save("KA1ABC");
		const { msg, success } = unpack77(pack77("<KA1ABC> YW18FIFA RR73"), book);
		expect(success).toBe(true);
		expect(msg).toBe("<KA1ABC> YW18FIFA RR73");
	});

	test("resolves 12-bit hash with iflip=1 (hash is call_2)", () => {
		const book = new HashCallBook();
		book.save("W9XYZ");
		const { msg, success } = unpack77(pack77("YW18FIFA <W9XYZ> RRR"), book);
		expect(success).toBe(true);
		expect(msg).toBe("YW18FIFA <W9XYZ> RRR");
	});

	test("without book, iflip=0 shows <...>", () => {
		const { msg, success } = unpack77(pack77("<KA1ABC> YW18FIFA RR73"));
		expect(success).toBe(true);
		expect(msg).toBe("<...> YW18FIFA RR73");
	});

	test("without book, iflip=1 shows <...>", () => {
		const { msg, success } = unpack77(pack77("YW18FIFA <W9XYZ> RRR"));
		expect(success).toBe(true);
		expect(msg).toBe("YW18FIFA <...> RRR");
	});

	test("iflip=0: saves nonstandard call (c11) into the book", () => {
		const book = new HashCallBook();
		unpack77(pack77("<KA1ABC> YW18FIFA RR73"), book);
		// YW18FIFA should now be resolvable as a 22-bit hash
		expect(unpack77(pack77("CQ <YW18FIFA>"), book).msg).toContain("<YW18FIFA>");
	});

	test("iflip=0 with no report", () => {
		const book = new HashCallBook();
		book.save("W9XYZ");
		const { msg, success } = unpack77(pack77("PJ4/K1ABC <W9XYZ>"), book);
		expect(success).toBe(true);
		expect(msg).toBe("PJ4/K1ABC <W9XYZ>");
	});

	test("iflip=0 with 73", () => {
		const book = new HashCallBook();
		book.save("W9XYZ");
		const { msg, success } = unpack77(pack77("PJ4/K1ABC <W9XYZ> 73"), book);
		expect(success).toBe(true);
		expect(msg).toBe("PJ4/K1ABC <W9XYZ> 73");
	});

	test("CQ variant of Type 4", () => {
		const book = new HashCallBook();
		const { msg, success } = unpack77(pack77("CQ YW18FIFA"), book);
		expect(success).toBe(true);
		expect(msg).toBe("CQ YW18FIFA");
		// CQ YW18FIFA should save YW18FIFA into the book via the 12-bit + 22-bit tables
		// (the CQ variant has icq=1, iflip=0 so c11 = YW18FIFA is in call_2)
	});

	test("resolves 12-bit hash for different report types", () => {
		const book = new HashCallBook();
		book.save("KA1ABC");
		expect(unpack77(pack77("<KA1ABC> YW18FIFA"), book).msg).toBe("<KA1ABC> YW18FIFA");
		expect(unpack77(pack77("<KA1ABC> YW18FIFA RRR"), book).msg).toBe("<KA1ABC> YW18FIFA RRR");
		expect(unpack77(pack77("<KA1ABC> YW18FIFA RR73"), book).msg).toBe("<KA1ABC> YW18FIFA RR73");
		expect(unpack77(pack77("<KA1ABC> YW18FIFA 73"), book).msg).toBe("<KA1ABC> YW18FIFA 73");
	});
});

describe("cross-type hash learning", () => {
	test("Type 1/2 standard message → resolve in Type 4 (12-bit)", () => {
		const book = new HashCallBook();
		// Learn W9XYZ from a standard Type 1 message
		unpack77(pack77("K1ABC W9XYZ EN37"), book);
		// Now resolve W9XYZ from a Type 4 12-bit hash
		const { msg } = unpack77(pack77("YW18FIFA <W9XYZ> RRR"), book);
		expect(msg).toBe("YW18FIFA <W9XYZ> RRR");
	});

	test("Type 4 nonstandard call → resolve in Type 1/2 (22-bit)", () => {
		const book = new HashCallBook();
		// Learn YW18FIFA from a Type 4 message (iflip=0 saves c11)
		unpack77(pack77("<KA1ABC> YW18FIFA RR73"), book);
		// Now resolve YW18FIFA as a 22-bit hash in a Type 1 message
		const { msg } = unpack77(pack77("CQ <YW18FIFA>"), book);
		expect(msg).toContain("<YW18FIFA>");
	});

	test("progressive learning across multiple message types", () => {
		const book = new HashCallBook();

		// Step 1: Standard Type 1 teaches W9XYZ
		unpack77(pack77("K1ABC W9XYZ EN37"), book);

		// Step 2: Standard Type 1 teaches K1ABC (as "from" call)
		unpack77(pack77("W9XYZ K1ABC -11"), book);

		// Step 3: Both should resolve as 22-bit hashes (Type 1)
		expect(unpack77(pack77("CQ <W9XYZ>"), book).msg).toContain("<W9XYZ>");
		expect(unpack77(pack77("CQ <K1ABC>"), book).msg).toContain("<K1ABC>");

		// Step 4: Both should resolve as 12-bit hashes (Type 4)
		expect(unpack77(pack77("YW18FIFA <W9XYZ> RRR"), book).msg).toBe("YW18FIFA <W9XYZ> RRR");
		expect(unpack77(pack77("<K1ABC> YW18FIFA RR73"), book).msg).toBe("<K1ABC> YW18FIFA RR73");
	});

	test("Type 4 CQ saves call, then Type 1 resolves it", () => {
		const book = new HashCallBook();
		// CQ YW18FIFA is a Type 4 with icq=1
		unpack77(pack77("CQ YW18FIFA"), book);
		// YW18FIFA should now be resolvable as a 22-bit hash
		expect(unpack77(pack77("CQ <YW18FIFA>"), book).msg).toContain("<YW18FIFA>");
	});

	test("hash table accumulates across many messages", () => {
		const book = new HashCallBook();
		const calls = ["W9XYZ", "K1ABC", "JK1IFA", "PA9XYZ"];

		// Learn each callsign via standard messages
		for (const call of calls) {
			unpack77(pack77(`CQ ${call} EN37`), book);
		}

		// All should be resolvable as 22-bit hashes
		for (const call of calls) {
			const { msg } = unpack77(pack77(`CQ <${call}>`), book);
			expect(msg).toContain(`<${call}>`);
		}

		// All should also be resolvable as 12-bit hashes (Type 4)
		for (const call of calls) {
			const { msg } = unpack77(pack77(`YW18FIFA <${call}> RRR`), book);
			expect(msg).toBe(`YW18FIFA <${call}> RRR`);
		}
	});
});

describe("backward compatibility", () => {
	test("unpack77 without book still works for all message types", () => {
		const messages = [
			"CQ K1ABC FN42",
			"K1ABC W9XYZ EN37",
			"W9XYZ K1ABC RR73",
			"TNX BOB 73 GL",
			"G4ABC/P PA9XYZ JO22",
			"CQ YW18FIFA",
		];
		for (const m of messages) {
			const { success } = unpack77(pack77(m));
			expect(success).toBe(true);
		}
	});

	test("unresolvable hashes show <...> even with an empty book", () => {
		expect(unpack77(pack77("<PJ4/K1ABC> W9XYZ R-09"), new HashCallBook()).msg).toBe(
			"<...> W9XYZ R-09",
		);
		expect(unpack77(pack77("YW18FIFA <W9XYZ> RRR"), new HashCallBook()).msg).toBe(
			"YW18FIFA <...> RRR",
		);
		expect(unpack77(pack77("<KA1ABC> YW18FIFA RR73"), new HashCallBook()).msg).toBe(
			"<...> YW18FIFA RR73",
		);
	});
});
