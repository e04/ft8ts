import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { decode } from "../ft8/decode.js";
import { encode174_91, getTones } from "../ft8/encode.js";
import { pack77 } from "../util/pack_jt77.js";
import { unpack77 } from "../util/unpack_jt77.js";
import { parseWavBuffer } from "../util/wav.js";
import { generateFT8Waveform } from "../util/waveform.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_RATE = 12_000;

const ROUND_TRIP_MESSAGES = [
	"CQ K1ABC FN42",
	"K1ABC W9XYZ EN37",
	"W9XYZ K1ABC -11",
	"K1ABC W9XYZ R-09",
	"W9XYZ K1ABC RRR",
	"K1ABC W9XYZ 73",
	"K1ABC W9XYZ RR73",
	"CQ W9XYZ EN37",
	"CQ JK1IFA PM95",
	"TNX BOB 73 GL",
];

describe("Unpack77", () => {
	test.each(ROUND_TRIP_MESSAGES)('unpack matches original: "%s"', (msg) => {
		const bits77 = pack77(msg);
		const { msg: unpacked, success } = unpack77(bits77);
		expect(success).toBe(true);
		expect(unpacked.trim().toUpperCase()).toBe(msg.trim().toUpperCase());
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

		const found = decoded.find((d) => d.msg.trim().toUpperCase() === msg.trim().toUpperCase());
		expect(found).toBeDefined();
		if (found) {
			expect(Math.abs(found.freq - baseFreq)).toBeLessThan(10);
		}
	}, 30_000);
});

/*
  Downloaded from: https://sourceforge.net/projects/jtdx/files/samples/16bit_audio/FT8/190227_155815.wav/
*/
describe("WAV decode: 190227_155815.wav", () => {
	test("decodes 17 messages matching expected results", () => {
		const wavPath = join(__dirname, "190227_155815.wav");
		const buf = readFileSync(wavPath);
		const { sampleRate, samples } = parseWavBuffer(buf);
		const decoded = decode(samples, sampleRate);

		expect(decoded).toHaveLength(17);

		/** Expected decode results for 190227_155815.wav */
		const EXPECTED_190227_155815 = [
			{ dt: 0.6, snr: -10, freq: 2568, msg: "UA6LIK SP3AVS R+00" },
			{ dt: 0.7, snr: -11, freq: 822, msg: "YB3BBF SV2HXX R-20" },
			{ dt: 0.6, snr: 2, freq: 200, msg: "R9AA IK5EEA 73" },
			{ dt: 1.5, snr: -5, freq: 1149, msg: "UA3AIU UR5GCK -03" },
			{ dt: 0.5, snr: -6, freq: 2512, msg: "GD3YUM UT7ZA KN57" },
			{ dt: 0.6, snr: -11, freq: 523, msg: "CQ RD3FC KO95" },
			{ dt: 0.7, snr: -7, freq: 424, msg: "R1BEQ UN7FU 73" },
			{ dt: 0.7, snr: 3, freq: 1005, msg: "LB8ZH R2FAQ KO04" },
			{ dt: 0.6, snr: -11, freq: 1892, msg: "EA7DGC IK8DYE 73" },
			{ dt: 0.6, snr: 4, freq: 1659, msg: "UN7LZ RV3DQC -01" },
			{ dt: 0.2, snr: 0, freq: 2378, msg: "CQ UA3QNE LO01" },
			{ dt: 1.5, snr: -2, freq: 961, msg: "EA3HRU R6LCM RR73" },
			{ dt: 0.7, snr: -3, freq: 2106, msg: "KA7RLM R7NW R-23" },
			{ dt: 2.1, snr: -6, freq: 1294, msg: "G3VAO UA3GDJ KO92" },
			{ dt: 0.8, snr: -15, freq: 1495, msg: "YD1GNL UA8CW MO07" },
			{ dt: 0.4, snr: -11, freq: 2170, msg: "CQ ES6DO KO27" },
			{ dt: 0.7, snr: -13, freq: 1433, msg: "YD1GNL R3KAB LN09" },
		];

		for (const exp of EXPECTED_190227_155815) {
			const found = decoded.find(
				(d) =>
					d.msg === exp.msg &&
					Math.round(d.freq) === exp.freq &&
					Math.round(d.dt * 10) / 10 === exp.dt &&
					Math.round(d.snr) === exp.snr,
			);
			expect(found, `Expected message not found: ${exp.msg}`).toBeDefined();
		}
	}, 15_000);
});
