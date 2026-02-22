import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { decode } from "../src/ft8/decode.js";
import { encode174_91, getTones } from "../src/ft8/encode.js";
import { pack77 } from "../src/util/pack_jt77.js";
import { unpack77 } from "../src/util/unpack_jt77.js";
import { parseWavBuffer } from "../src/util/wav.js";
import { generateFT8Waveform } from "../src/util/waveform.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_RATE = 12_000;

/** Hashed callsigns (<CALL>) become <...> when unpacking. Normalize expected value. */
function replaceHashedCallsign(msg: string): string {
	return msg.replace(/<[^>]+>/g, "<...>").trim().toUpperCase();
}

const ROUND_TRIP_MESSAGES = [
	"CQ JK1IFA PM95",
	"K1ABC W9XYZ EN37",
	"W9XYZ K1ABC -11",
	"K1ABC W9XYZ R-09",
	"W9XYZ K1ABC RRR",
	"K1ABC W9XYZ 73",
	"K1ABC W9XYZ RR73",
	"TNX BOB 73 GL",
	"G4ABC/P PA9XYZ JO22",
	"PA9XYZ G4ABC/P RR73",
	"PJ4/K1ABC <W9XYZ>",
	"PJ4/K1ABC <W9XYZ> 73",
	"YW18FIFA <W9XYZ> RRR",
	"<KA1ABC> YW18FIFA RR73",
];

describe("Unpack77", () => {
	test.each(ROUND_TRIP_MESSAGES)('unpack matches original: "%s"', (msg) => {
		const bits77 = pack77(msg);
		const { msg: unpacked, success } = unpack77(bits77);
		expect(success).toBe(true);
		// Hashed callsigns (<CALL>) become <...> when unpacking
		expect(unpacked.trim().toUpperCase()).toBe(replaceHashedCallsign(msg));
	});
});

describe("FT8 Round Trip", () => {
	test.each(ROUND_TRIP_MESSAGES)('encode then decode: "%s"', (msg) => {
		const bits77 = pack77(msg);
		const codeword = encode174_91(bits77);
		const tones = getTones(codeword);
		const baseFreq = 1000;
		const waveform = generateFT8Waveform(tones, {
			sampleRate: SAMPLE_RATE,
			samplesPerSymbol: 1920,
			bt: 2.0,
			baseFrequency: baseFreq,
		});

		// Place signal in a 15-second buffer at t=0.5s (standard FT8 timing)
		const nmax = 15 * SAMPLE_RATE;
		const fullBuffer = new Float32Array(nmax);
		const offset = Math.round(0.5 * SAMPLE_RATE);
		for (let i = 0; i < waveform.length && offset + i < nmax; i++) {
			fullBuffer[offset + i] = waveform[i]!;
		}

		const decoded = decode(fullBuffer, SAMPLE_RATE, {
			freqLow: 500,
			freqHigh: 1500,
			syncMin: 1.0,
			depth: 2,
		});

		const expected = replaceHashedCallsign(msg);
		const found = decoded.find((d) => d.msg.trim().toUpperCase() === expected);
		expect(found).toBeDefined();
		if (found) {
			expect(Math.abs(found.freq - baseFreq)).toBeLessThan(10);
		}
	}, 30_000);
});

/**
  Downloaded from: https://sourceforge.net/projects/jtdx/files/samples/16bit_audio/FT8/190227_155815.wav/download
*/
describe("WAV decode: 190227_155815.wav", () => {
	test("decodes at least 27 messages matching expected results", () => {
		const wavPath = join(__dirname, "190227_155815.wav");
		const buf = readFileSync(wavPath);
		const { sampleRate, samples } = parseWavBuffer(buf);
		const decoded = decode(samples, sampleRate);

		expect(decoded.length).toBeGreaterThanOrEqual(27);
	}, 15_000);
});

/**
  Downloaded from: https://sourceforge.net/projects/wsjt/files/samples/FT8/210703_133430.wav/download
*/
describe("WAV decode: 210703_133430.wav", () => {
	test("decodes at least 13 messages matching expected results", () => {
		const wavPath = join(__dirname, "210703_133430.wav");
		const buf = readFileSync(wavPath);
		const { sampleRate, samples } = parseWavBuffer(buf);
		const decoded = decode(samples, sampleRate);

		expect(decoded.length).toBeGreaterThanOrEqual(13);
	}, 15_000);
});
