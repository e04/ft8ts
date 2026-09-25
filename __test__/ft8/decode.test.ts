import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { type DecodeOptions, decode, type FT8Contest } from "../../src/ft8/decode.js";
import { encode174_91, getTones } from "../../src/ft8/encode.js";
import { A1, A2, A3, A4, MAX22, NTOKENS } from "../../src/util/constants.js";
import { pack77 } from "../../src/util/pack_jt77.js";
import { unpack77 } from "../../src/util/unpack_jt77.js";
import { parseWavBuffer } from "../../src/util/wav.js";
import { generateFT8Waveform } from "../../src/util/waveform.js";
import { makeBookWithKnownCalls, ROUND_TRIP_MESSAGES } from "../test-messages.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_RATE = 12_000;

function bitsToUint(bits: number[], start: number, len: number): number {
	let n = 0;
	for (let i = 0; i < len; i++) n = n * 2 + (bits[start + i] ?? 0);
	return n;
}

function uintToBits(n: number, len: number): number[] {
	return Array.from({ length: len }, (_, i) => Math.floor(n / 2 ** (len - 1 - i)) % 2);
}

/** n28 of a standard callsign given as its raw 6-character field (pack28 layout). */
function standardCallN28(field: string): number {
	const idx = [
		A1.indexOf(field[0]!),
		A2.indexOf(field[1]!),
		A3.indexOf(field[2]!),
		A4.indexOf(field[3]!),
		A4.indexOf(field[4]!),
		A4.indexOf(field[5]!),
	];
	const n = ((((idx[0]! * 36 + idx[1]!) * 10 + idx[2]!) * 27 + idx[3]!) * 27 + idx[4]!) * 27;
	return NTOKENS + MAX22 + n + idx[5]!;
}

/** Messages that WSJT-X 3 decodes only when a special operating activity is selected. */
const CONTEST_ONLY_MESSAGES = ROUND_TRIP_MESSAGES.filter(
	(msg) => msg.includes("/R") || msg.startsWith("TU; "),
);

function contestFor(msg: string): FT8Contest | undefined {
	if (msg.startsWith("TU; ")) return "RTTY";
	if (msg.includes("/R")) return "NA_VHF";
	return undefined;
}

/** Encode `msg` at 1000 Hz, 0.5 s into a 15 s buffer, and decode it at depth 2. */
function roundTrip(msg: string, options: DecodeOptions = {}) {
	const bits77 = pack77(msg);
	const codeword = encode174_91(bits77);
	const tones = getTones(codeword);
	const waveform = generateFT8Waveform(tones, {
		sampleRate: SAMPLE_RATE,
		samplesPerSymbol: 1920,
		bt: 2.0,
		baseFrequency: 1000,
	});

	// Place signal in a 15-second buffer at t=0.5s (standard FT8 timing)
	const nmax = 15 * SAMPLE_RATE;
	const fullBuffer = new Float32Array(nmax);
	const offset = Math.round(0.5 * SAMPLE_RATE);
	for (let i = 0; i < waveform.length && offset + i < nmax; i++) {
		fullBuffer[offset + i] = waveform[i]!;
	}

	return decode(fullBuffer, {
		sampleRate: SAMPLE_RATE,
		freqLow: 500,
		freqHigh: 1500,
		syncMin: 1.0,
		depth: 2,
		...options,
	});
}

describe("Unpack77", () => {
	test.each(ROUND_TRIP_MESSAGES)('unpack matches original: "%s"', (msg) => {
		const book = makeBookWithKnownCalls();
		const bits77 = pack77(msg);
		const { msg: unpacked, success } = unpack77(bits77, book);
		expect(success).toBe(true);
		expect(unpacked).toBe(msg);
	});

	test.each([
		["GH", 16],
		["NS", 25],
		["TER", 44],
		["NB", 86],
	])("packs Field Day section %s using the WSJT-X section index", (section, expectedIndex) => {
		const msg = `K1ABC W9XYZ 1A ${section}`;
		const bits77 = pack77(msg);
		expect(bitsToUint(bits77, 74, 3)).toBe(0);
		expect(bitsToUint(bits77, 71, 3)).toBe(3);
		expect(bitsToUint(bits77, 64, 7)).toBe(expectedIndex);
		expect(unpack77(bits77).msg).toBe(msg);
	});

	test.each([
		[" K1ABC", true],
		["KA1   ", true],
		["2E0XYZ", true],
		["QA1ABC", false], // starts with Q
		["12ABC ", false], // prefix without a letter
		[" K1A B", false], // blank inside the suffix
		[" K1   ", false], // shorter than three characters
	])("checks standard callsign field %j with callok", (field, ok) => {
		const grid = pack77("CQ K1ABC FN42").slice(58);
		const bits77 = [...uintToBits(2, 28), 0, ...uintToBits(standardCallN28(field), 28), 0, ...grid];
		const { msg, success } = unpack77(bits77);
		expect(success).toBe(ok);
		if (ok) expect(msg).toBe(`CQ ${field.trim()} FN42`);
	});
});

describe("FT8 Round Trip", () => {
	test.each(ROUND_TRIP_MESSAGES)('encode then decode: "%s"', (msg) => {
		const contest = contestFor(msg);
		const decoded = roundTrip(msg, {
			hashCallBook: makeBookWithKnownCalls(),
			...(contest && { contest }),
		});

		const found = decoded.find((d) => d.msg.trim().toUpperCase() === msg);
		expect(found).toBeDefined();
		if (found) {
			expect(Math.abs(found.freq - 1000)).toBeLessThan(10);
		}
	}, 30_000);

	test.each(CONTEST_ONLY_MESSAGES)('rejects "%s" outside a contest', (msg) => {
		const decoded = roundTrip(msg, { hashCallBook: makeBookWithKnownCalls() });
		expect(decoded.find((d) => d.msg === msg)).toBeUndefined();
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
		const decoded = decode(samples, { sampleRate, depth: 3 });

		expect(decoded.length).toBeGreaterThanOrEqual(27);
	}, 15_000);
});

/**
  Downloaded from: https://sourceforge.net/projects/wsjt/files/samples/FT8/210703_133430.wav/download
*/
describe("WAV decode: 210703_133430.wav", () => {
	test("decodes at least 16 messages matching expected results at depth 3", () => {
		const wavPath = join(__dirname, "210703_133430.wav");
		const buf = readFileSync(wavPath);
		const { sampleRate, samples } = parseWavBuffer(buf);
		const decoded = decode(samples, { sampleRate, depth: 3 });

		expect(decoded.length).toBeGreaterThanOrEqual(16);
	}, 15_000);
});
