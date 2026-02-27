import { encode174_91 } from "../ft8/encode.js";
import { pack77 } from "../util/pack_jt77.js";
import { generateFT4Waveform, type WaveformOptions } from "../util/waveform.js";
import { GRAYMAP } from "./constants.js";
import { xorWithScrambler } from "./scramble.js";

const COSTAS_A = [0, 1, 3, 2] as const;
const COSTAS_B = [1, 0, 2, 3] as const;
const COSTAS_C = [2, 3, 1, 0] as const;
const COSTAS_D = [3, 2, 0, 1] as const;

/**
 * Convert FT4 LDPC codeword bits into 103 channel tones.
 * Port of lib/ft4/genft4.f90.
 */
export function getTones(codeword: readonly number[]): number[] {
	const dataTones = new Array<number>(87);
	for (let i = 0; i < 87; i++) {
		const b0 = codeword[2 * i] ?? 0;
		const b1 = codeword[2 * i + 1] ?? 0;
		const symbol = b1 + 2 * b0;
		dataTones[i] = GRAYMAP[symbol]!;
	}

	const tones = new Array<number>(103);
	tones.splice(0, 4, ...COSTAS_A);
	tones.splice(4, 29, ...dataTones.slice(0, 29));
	tones.splice(33, 4, ...COSTAS_B);
	tones.splice(37, 29, ...dataTones.slice(29, 58));
	tones.splice(66, 4, ...COSTAS_C);
	tones.splice(70, 29, ...dataTones.slice(58, 87));
	tones.splice(99, 4, ...COSTAS_D);
	return tones;
}

export function encodeMessage(msg: string): number[] {
	const bits77 = pack77(msg);
	const scrambled = xorWithScrambler(bits77);
	const codeword = encode174_91(scrambled);
	return getTones(codeword);
}

export function encode(msg: string, options: WaveformOptions = {}): Float32Array {
	return generateFT4Waveform(encodeMessage(msg), options);
}
