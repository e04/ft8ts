// Message scrambling vector (rvec) from WSJT-X.
const RVEC = [
	0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1,
	0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0,
	1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1,
] as const;

export function xorWithScrambler(bits77: readonly number[]): number[] {
	const out = new Array<number>(77);
	for (let i = 0; i < 77; i++) {
		out[i] = ((bits77[i] ?? 0) + RVEC[i]!) & 1;
	}
	return out;
}
