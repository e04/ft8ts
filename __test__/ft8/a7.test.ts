import { describe, expect, test } from "vitest";
import { a7Candidates, a7MessageText, FT8History } from "../../src/ft8/a7.js";
import { decode } from "../../src/ft8/decode.js";
import { encode } from "../../src/ft8/encode.js";

const SAMPLE_RATE = 12_000;
const T0 = Date.UTC(2026, 0, 1, 0, 0, 0);
const SLOT_MS = 15_000;

/** Deterministic PRNG (mulberry32). */
function rng(seed: number): () => number {
	let s = seed;
	return () => {
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** A 15 s slot of unit-variance Gaussian noise plus FT8 signals at the given SNR (2500 Hz bandwidth). */
function makeSlot(
	signals: { msg: string; freq: number; snr: number }[],
	seed: number,
): Float32Array {
	const random = rng(seed);
	const n = 15 * SAMPLE_RATE;
	const out = new Float32Array(n);
	for (let i = 0; i < n; i += 2) {
		const m = Math.sqrt(-2 * Math.log(Math.max(random(), 1e-12)));
		const phi = 2 * Math.PI * random();
		out[i] = m * Math.cos(phi);
		out[i + 1] = m * Math.sin(phi);
	}
	for (const { msg, freq, snr } of signals) {
		const wave = encode(msg, { baseFrequency: freq });
		let power = 0;
		for (const x of wave) power += x * x;
		power /= wave.length;
		const amp = Math.sqrt((10 ** (snr / 10) * 2500) / (SAMPLE_RATE / 2) / power);
		const offset = Math.round(0.5 * SAMPLE_RATE);
		for (let i = 0; i < wave.length && offset + i < n; i++) out[offset + i]! += amp * wave[i]!;
	}
	return out;
}

const FIRST = { msg: "K1ABC W9XYZ -10", freq: 1200, snr: -10 };
const FOLLOW_UP = "K1ABC W9XYZ RR73";

describe("FT8History", () => {
	test("saves callsigns and grid, and skips messages a7 cannot use", () => {
		const history = new FT8History();
		history.beginSlot(0);
		history.save(0, 0.1, 1000, "K1ABC W9XYZ -10");
		history.save(0, 0.1, 1100, "CQ W9XYZ EN37");
		history.save(0, 0.1, 1200, "K1ABC W9XYZ R EN37");
		history.save(0, 0.1, 1300, "CQ DX W9XYZ EN37");
		history.save(0, 0.1, 1400, "K1ABC/R W9XYZ EN37");
		history.save(0, 0.1, 1500, "<PJ4/K1ABC> W9XYZ");
		expect(history.beginSlot(2).map((e) => e.msg)).toEqual([
			"K1ABC W9XYZ",
			"CQ W9XYZ EN37",
			"K1ABC W9XYZ EN37",
		]);
	});

	test("returns the tally of the slot 30 s earlier only", () => {
		const history = new FT8History();
		history.beginSlot(10);
		history.save(10, 0.1, 1000, "K1ABC W9XYZ -10");
		expect(history.beginSlot(11)).toEqual([]);
		expect(history.beginSlot(12)).toHaveLength(1);
		// Decoding slot 12 again starts its tally afresh.
		history.save(12, 0.1, 1000, "K1ABC W9XYZ RR73");
		history.beginSlot(12);
		expect(history.beginSlot(14)).toEqual([]);
	});

	test("knows when a station was decoded again near the same frequency", () => {
		const history = new FT8History();
		history.beginSlot(0);
		history.save(0, 0.1, 1000, "K1ABC W9XYZ -10");
		const [entry] = history.beginSlot(2);
		expect(history.supersedes(2, entry!)).toBe(false);
		history.save(2, 0.1, 1010, "K1ABC W9XYZ RR73");
		expect(history.supersedes(2, entry!)).toBe(false);
		history.save(2, 0.1, 1002, "K1ABC W9XYZ RR73");
		expect(history.supersedes(2, entry!)).toBe(true);
	});
});

describe("a7 candidate messages", () => {
	test("covers the likely next messages of a standard QSO", () => {
		const { call1, call2, candidates } = a7Candidates({
			dt: 0,
			freq: 1000,
			msg: "K1ABC W9XYZ EN37",
		});
		expect(candidates).toHaveLength(206);
		const texts = candidates.map((c) => (c ? a7MessageText(c, call1, call2) : null));
		expect(texts).not.toContain(null);
		expect(texts.slice(0, 6)).toEqual([
			"K1ABC W9XYZ",
			"K1ABC W9XYZ RRR",
			"K1ABC W9XYZ RR73",
			"K1ABC W9XYZ 73",
			"CQ W9XYZ EN37",
			"K1ABC W9XYZ EN37",
		]);
		expect(texts[6]).toBe("K1ABC W9XYZ -50");
		expect(texts[7]).toBe("K1ABC W9XYZ R-50");
		expect(texts[205]).toBe("K1ABC W9XYZ R+49");
	});

	test("hashes a nonstandard callsign", () => {
		const { call1, call2, candidates } = a7Candidates({ dt: 0, freq: 1000, msg: "W9XYZ YW18FIFA" });
		const texts = candidates.map((c) => (c ? a7MessageText(c, call1, call2) : null));
		expect(texts[0]).toBe("<W9XYZ> YW18FIFA");
		expect(texts[2]).toBe("<W9XYZ> YW18FIFA RR73");
		expect(texts[4]).toBe("CQ YW18FIFA");
		expect(texts[6]).toBe("W9XYZ <YW18FIFA> -50");
	});
});

describe("FT8 a7 decoding", () => {
	test("finds a weak follow-up of a station decoded 30 s earlier", () => {
		let withA7 = 0;
		let without = 0;
		for (let seed = 1; seed <= 5; seed++) {
			const history = new FT8History();
			const first = decode(makeSlot([FIRST], 100 * seed), { depth: 3, history, slotStart: T0 });
			expect(first.map((d) => d.msg)).toContain(FIRST.msg);

			const weak = makeSlot([{ msg: FOLLOW_UP, freq: 1202, snr: -22 }], 100 * seed + 2);
			if (decode(weak, { depth: 3 }).some((d) => d.msg === FOLLOW_UP)) without++;
			const found = decode(weak, { depth: 3, history, slotStart: T0 + 2 * SLOT_MS }).find(
				(d) => d.msg === FOLLOW_UP,
			);
			if (found) {
				withA7++;
				if (found.ap === 7) {
					expect(found.sync).toBe(0);
					expect(Math.abs(found.freq - 1202)).toBeLessThan(1.5);
					expect(Math.abs(found.dt)).toBeLessThan(0.05);
				}
			}
		}
		expect(without).toBeLessThanOrEqual(1);
		expect(withA7).toBeGreaterThanOrEqual(4);
	}, 60_000);

	test("runs only at depth 3, using decodes saved at any depth", () => {
		const history = new FT8History();
		decode(makeSlot([FIRST], 300), { depth: 2, history, slotStart: T0 });
		const weak = makeSlot([{ msg: FOLLOW_UP, freq: 1202, snr: -22 }], 302);
		const slotStart = T0 + 2 * SLOT_MS;
		expect(decode(weak, { depth: 2, history, slotStart }).some((d) => d.ap === 7)).toBe(false);
		const deep = decode(weak, { depth: 3, history, slotStart });
		expect(deep.find((d) => d.msg === FOLLOW_UP)?.ap).toBe(7);
	}, 30_000);

	test("ignores decodes older than 30 s", () => {
		const history = new FT8History();
		decode(makeSlot([FIRST], 300), { depth: 3, history, slotStart: T0 });
		const weak = makeSlot([{ msg: FOLLOW_UP, freq: 1202, snr: -22 }], 302);
		const decoded = decode(weak, { depth: 3, history, slotStart: T0 + 4 * SLOT_MS });
		expect(decoded.some((d) => d.ap === 7)).toBe(false);
	}, 30_000);

	test("decodes nothing from noise", () => {
		const history = new FT8History();
		const signals = [FIRST, { msg: "CQ JA1ABC PM95", freq: 1700, snr: -8 }];
		expect(decode(makeSlot(signals, 400), { depth: 3, history, slotStart: T0 })).toHaveLength(2);
		const decoded = decode(makeSlot([], 402), { depth: 3, history, slotStart: T0 + 2 * SLOT_MS });
		expect(decoded).toEqual([]);
	}, 30_000);

	test("requires slotStart with history", () => {
		expect(() => decode(new Float32Array(15 * SAMPLE_RATE), { history: new FT8History() })).toThrow(
			/slotStart/,
		);
	});
});
