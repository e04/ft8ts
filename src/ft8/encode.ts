import { gHex } from "../util/constants.js";
import { pack77 } from "../util/pack_jt77.js";
import { generateFT8Waveform, type WaveformOptions } from "../util/waveform.js";
import { COSTAS, GRAY_MAP } from "./constants.js";

function generateLdpcGMatrix(): number[][] {
	const K = 91;
	const M = 83; // 174 - 91
	const gen: number[][] = Array.from({ length: M }, () => new Array(K).fill(0));

	for (let i = 0; i < M; i++) {
		const hexStr = gHex[i]!;
		for (let j = 0; j < 23; j++) {
			const val = parseInt(hexStr[j]!, 16);
			const limit = j === 22 ? 3 : 4;
			for (let jj = 1; jj <= limit; jj++) {
				const col = j * 4 + jj - 1; // 0-indexed
				if ((val & (1 << (4 - jj))) !== 0) {
					gen[i]![col] = 1;
				}
			}
		}
	}
	return gen;
}

const G = generateLdpcGMatrix();

export function encode174_91(msg77: number[]): number[] {
	const poly = 0x2757;
	let crc = 0;
	// padded with 19 zeros (3 zeros + 16 zero-bits for flush)
	const bitArray = [...msg77, 0, 0, 0, ...new Array(16).fill(0)];
	for (let bit = 0; bit < 96; bit++) {
		const nextBit = bitArray[bit]!;
		if ((crc & 0x2000) !== 0) {
			crc = ((crc << 1) | nextBit) ^ poly;
		} else {
			crc = (crc << 1) | nextBit;
		}
		crc &= 0x3fff;
	}

	const msg91 = [...msg77];
	for (let i = 0; i < 14; i++) {
		msg91.push((crc >> (13 - i)) & 1);
	}

	const codeword = [...msg91];
	for (let i = 0; i < 83; i++) {
		let sum = 0;
		for (let j = 0; j < 91; j++) {
			sum += msg91[j]! * G[i]![j]!;
		}
		codeword.push(sum % 2);
	}
	return codeword;
}

export function getTones(codeword: number[]): number[] {
	const tones = new Array(79).fill(0);

	for (let i = 0; i < 7; i++) tones[i] = COSTAS[i]!;
	for (let i = 0; i < 7; i++) tones[36 + i] = COSTAS[i]!;
	for (let i = 0; i < 7; i++) tones[72 + i] = COSTAS[i]!;

	let k = 7;
	for (let j = 1; j <= 58; j++) {
		const i = j * 3 - 3; // codeword is 0-indexed in JS, but the loop was j=1 to 58
		if (j === 30) k += 7;
		const indx = codeword[i]! * 4 + codeword[i + 1]! * 2 + codeword[i + 2]!;
		tones[k] = GRAY_MAP[indx]!;
		k++;
	}
	return tones;
}

export function encodeMessage(msg: string): number[] {
	const bits77 = pack77(msg);
	const codeword = encode174_91(bits77);
	return getTones(codeword);
}

export function encode(msg: string, options: WaveformOptions = {}): Float32Array {
	return generateFT8Waveform(encodeMessage(msg), options);
}
