import { readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { decode } from "../src/ft8/decode.js";
import { encode } from "../src/ft8/encode.js";
import { parseWavBuffer, writeMono16WavFile } from "../src/util/wav.js";

const SAMPLE_RATE = 12_000;
const BASE_FREQ = 1_000;

const ROUND_TRIP_MESSAGES = ["CQ K1ABC FN42", "CQ TEST KO01", "K1ABC W9XYZ EN37"];

describe("WAV round-trip", () => {
	test.each(ROUND_TRIP_MESSAGES)('write WAV, read, decode: "%s"', (msg) => {
		const waveform = encode(msg, {
			sampleRate: SAMPLE_RATE,
			samplesPerSymbol: 1_920,
			bt: 2.0,
			baseFrequency: BASE_FREQ,
		});

		const wavPath = join(tmpdir(), `ft8js2-roundtrip-${process.pid}-${Date.now()}.wav`);
		writeMono16WavFile(wavPath, waveform, SAMPLE_RATE);

		try {
			const buf = readFileSync(wavPath);
			const { sampleRate, samples } = parseWavBuffer(buf);
			const decoded = decode(samples, {
				sampleRate,
				freqLow: 500,
				freqHigh: 1500,
				syncMin: 1.0,
				depth: 2,
			});

			const found = decoded.find((d) => d.msg.trim().toUpperCase() === msg.trim().toUpperCase());
			expect(found).toBeDefined();
			if (found) {
				expect(Math.abs(found.freq - BASE_FREQ)).toBeLessThan(10);
			}
		} finally {
			unlinkSync(wavPath);
		}
	}, 30_000);
});
