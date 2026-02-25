/**
 * FT4 encode tests.
 *
 * Reference: ./gen_ft8 "MESSAGE" /tmp/out.wav 1000 -ft4
 * - Packed data uses pack77 (shared with FT8)
 * - FT4 produces 103 tones (4-FSK, values 0-3) per lib/ft4/genft4.f90
 * - gen_ft8 outputs 105 chars: ramp(0) + 103 tones + ramp(0)
 */
import { describe, expect, test } from "vitest";
import { encodeMessage, getTones } from "../../src/ft4/encode.js";
import { xorWithScrambler } from "../../src/ft4/scramble.js";
import { encode174_91 } from "../../src/ft8/encode.js";
import { pack77 } from "../../src/util/pack_jt77.js";
import { FT4_VECTORS } from "./test-vectors.js";

/** Convert 77 bits to packed hex (MSB-first, 10 bytes). */
function bitsToPackedHex(bits: number[]): string {
	const bytes: number[] = [];
	for (let i = 0; i < 77; i += 8) {
		let byte = 0;
		for (let b = 0; b < 8 && i + b < 77; b++) {
			byte = (byte << 1) | (bits[i + b] ?? 0);
		}
		if (i + 8 <= 77) {
			bytes.push(byte);
		} else {
			bytes.push(byte << (8 - (77 - i)));
		}
	}
	return bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ");
}

describe("FT4 encode", () => {
	test.each(FT4_VECTORS)('packed data matches gen_ft8 for "$msg"', ({ msg, packed }) => {
		const bits77 = pack77(msg);
		expect(bitsToPackedHex(bits77)).toBe(packed);
	});

	test.each(FT4_VECTORS)('FSK tones match gen_ft8 for "$msg"', ({ msg, tones }) => {
		const refTones = tones;
		const tsTones = encodeMessage(msg).join("");
		expect(refTones.length).toBe(105);
		expect(tsTones.length).toBe(103);
		expect(tsTones).toBe(refTones.slice(1, 104));
	});

	test("FT4 produces 103 tones (4+29+4+29+4+29+4)", () => {
		const tones = encodeMessage("CQ JA1ABC FN42");
		expect(tones).toHaveLength(103);
		for (const t of tones) {
			expect(t).toBeGreaterThanOrEqual(0);
			expect(t).toBeLessThanOrEqual(3);
		}
		const costasA = [0, 1, 3, 2],
			costasB = [1, 0, 2, 3],
			costasC = [2, 3, 1, 0],
			costasD = [3, 2, 0, 1];
		expect(tones.slice(0, 4)).toEqual(costasA);
		expect(tones.slice(33, 37)).toEqual(costasB);
		expect(tones.slice(66, 70)).toEqual(costasC);
		expect(tones.slice(99, 103)).toEqual(costasD);
	});

	test("encode pipeline: pack77 -> scramble -> encode174_91 -> getTones", () => {
		const msg = "CQ JA1ABC FN42";
		const bits77 = pack77(msg);
		const scrambled = xorWithScrambler(bits77);
		const codeword = encode174_91(scrambled);
		const tones = getTones(codeword);
		expect(tones).toEqual(encodeMessage(msg));
	});
});
