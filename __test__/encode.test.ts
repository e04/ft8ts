/**
 * Full pipeline test: verifies that the TypeScript FT8 encoder matches the
 * reference output produced by:
 *   /Applications/wsjtx.app/Contents/MacOS/ft8code "<message>"
 *
 * Run with:
 *   npx tsx src/test_full.ts
 */
import { describe, expect, test } from "vitest";
import { encode174_91, getTones } from "../src/ft8/encode.js";
import { pack77 } from "../src/util/pack_jt77.js";
import { FT8_VECTORS } from "./test_vectors.js";

function bitsToString(bits: number[]): string {
	return bits.join("");
}

/** Format tones as the ft8code display line */
function formatTones(tones: number[]): string {
	const sync = tones.slice(0, 7).join("");
	const data1 = tones.slice(7, 36).join("");
	const sync2 = tones.slice(36, 43).join("");
	const data2 = tones.slice(43, 72).join("");
	const sync3 = tones.slice(72, 79).join("");
	return `${sync} ${data1} ${sync2} ${data2} ${sync3}`;
}

describe("FT8 Full Pipeline", () => {
	test.each(FT8_VECTORS)('encodes message: "$msg"', (v) => {
		const bits77 = pack77(v.msg);
		expect(bitsToString(bits77)).toBe(v.bits77);

		const codeword = encode174_91(bits77);
		const crc14 = codeword.slice(77, 91);
		const parity83 = codeword.slice(91, 174);

		expect(bitsToString(crc14)).toBe(v.crc14);
		expect(bitsToString(parity83)).toBe(v.parity83);

		const tones = getTones(codeword);
		const tonesStr = formatTones(tones);

		expect(tonesStr).toBe(v.tones);
	});
});
