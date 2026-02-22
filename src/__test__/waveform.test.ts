import { describe, expect, test } from "vitest";
import { encode, encodeMessage } from "../ft8/encode.js";
import { generateFT8Waveform } from "../util/waveform.js";

describe("FT8 waveform generator", () => {
	test("generates a Float32Array waveform with FT8 default length", () => {
		const tones = encodeMessage("CQ K1ABC FN42");
		const waveform = generateFT8Waveform(tones, { baseFrequency: 1000 });

		expect(waveform).toBeInstanceOf(Float32Array);
		expect(waveform.length).toBe(79 * 1920);
		expect(waveform[0]).toBeCloseTo(0, 6);
		expect(Number.isFinite(waveform[waveform.length - 1])).toBe(true);
	});

	test("message helper produces the same waveform as manual two-step generation", () => {
		const msg = "CQ K1ABC FN42";
		const options = { baseFrequency: 1500 };

		const manual = generateFT8Waveform(encodeMessage(msg), options);
		const viaHelper = encode(msg, options);

		expect(viaHelper.length).toBe(manual.length);
		expect(viaHelper[0]).toBeCloseTo(manual[0]!, 7);
		expect(viaHelper[12345]).toBeCloseTo(manual[12345]!, 7);
		expect(viaHelper[viaHelper.length - 1]).toBeCloseTo(manual[manual.length - 1]!, 7);
	});
});
