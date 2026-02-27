import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { decode } from "../../src/ft4/decode.js";
import { encode } from "../../src/ft4/encode.js";
import { parseWavBuffer } from "../../src/util/wav.js";
import { makeBookWithKnownCalls, ROUND_TRIP_MESSAGES } from "../test-messages.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SAMPLE_RATE = 12_000;
const BASE_FREQ = 1_000;
const NMAX = 21 * 3456; // FT4 decode window length (72576 samples)

describe("FT4 All Message Types (ft4_testmsg.f90)", () => {
	test.each(ROUND_TRIP_MESSAGES)('encode then decode: "%s"', (msg) => {
		const book = makeBookWithKnownCalls();
		const waveform = encode(msg, {
			sampleRate: SAMPLE_RATE,
			baseFrequency: BASE_FREQ,
		});

		const fullBuffer = new Float32Array(NMAX);
		const offset = Math.round(0.5 * SAMPLE_RATE);
		for (let i = 0; i < waveform.length && offset + i < fullBuffer.length; i++) {
			fullBuffer[offset + i] = waveform[i]!;
		}

		const decoded = decode(fullBuffer, {
			sampleRate: SAMPLE_RATE,
			hashCallBook: book,
		});

		const expected = msg.trim().toUpperCase();
		const found = decoded.find((d) => d.msg.trim().toUpperCase() === expected);
		expect(found).toBeDefined();
		if (found) {
			expect(Math.abs(found.freq - BASE_FREQ)).toBeLessThan(10);
		}
	}, 30_000);
});

describe("WAV decode: 000000_000002.wav", () => {
	test("decodes expected message", () => {
		const wavPath = join(__dirname, "000000_000002.wav");
		const buf = readFileSync(wavPath);
		const { sampleRate, samples } = parseWavBuffer(buf);
		const decoded = decode(samples, { sampleRate });

		expect(decoded.length).toBeGreaterThanOrEqual(7);
	}, 15_000);
});
