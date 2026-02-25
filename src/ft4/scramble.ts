import { RVEC } from "./constants.js";

export function xorWithScrambler(bits77: readonly number[]): number[] {
	const out = new Array<number>(77);
	for (let i = 0; i < 77; i++) {
		out[i] = ((bits77[i] ?? 0) + RVEC[i]!) & 1;
	}
	return out;
}
