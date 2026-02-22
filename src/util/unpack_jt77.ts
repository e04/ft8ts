/**
 * FT8 message unpacking – TypeScript port of unpack77 from packjt77.f90
 *
 * Supported message types:
 *   Type 0.0  Free text
 *   Type 1    Standard (two callsigns + grid/report/RR73/73)
 *   Type 2    /P form for EU VHF contest
 *   Type 4    One nonstandard call and one hashed call
 */

import { A1, A2, A3, A4, C38, FTALPH, MAX22, MAXGRID4, NTOKENS } from "./constants.js";

function bitsToUint(bits: number[], start: number, len: number): number {
	let val = 0;
	for (let i = 0; i < len; i++) {
		val = val * 2 + (bits[start + i] ?? 0);
	}
	return val;
}

function unpack28(n28: number): { call: string; success: boolean } {
	if (n28 < 0 || n28 >= 268435456) return { call: "", success: false };

	if (n28 === 0) return { call: "DE", success: true };
	if (n28 === 1) return { call: "QRZ", success: true };
	if (n28 === 2) return { call: "CQ", success: true };

	if (n28 >= 3 && n28 < 3 + 1000) {
		const nqsy = n28 - 3;
		return { call: `CQ ${nqsy.toString().padStart(3, "0")}`, success: true };
	}

	if (n28 >= 1003 && n28 < NTOKENS) {
		// CQ with 4-letter directed call
		let m = n28 - 1003;
		let chars = "";
		for (let i = 3; i >= 0; i--) {
			const j = m % 27;
			m = Math.floor(m / 27);
			chars = (j === 0 ? " " : String.fromCharCode(64 + j)) + chars;
		}
		const directed = chars.trim();
		if (directed.length > 0) return { call: `CQ ${directed}`, success: true };
		return { call: "CQ", success: true };
	}

	if (n28 >= NTOKENS && n28 < NTOKENS + MAX22) {
		// Hashed call – we don't have a hash table, so show <...>
		return { call: "<...>", success: true };
	}

	// Standard callsign
	let n = n28 - NTOKENS - MAX22;
	if (n < 0) return { call: "", success: false };

	const i6 = n % 27;
	n = Math.floor(n / 27);
	const i5 = n % 27;
	n = Math.floor(n / 27);
	const i4 = n % 27;
	n = Math.floor(n / 27);
	const i3 = n % 10;
	n = Math.floor(n / 10);
	const i2 = n % 36;
	n = Math.floor(n / 36);
	const i1 = n;

	if (i1 < 0 || i1 >= A1.length) return { call: "", success: false };
	if (i2 < 0 || i2 >= A2.length) return { call: "", success: false };
	if (i3 < 0 || i3 >= A3.length) return { call: "", success: false };
	if (i4 < 0 || i4 >= A4.length) return { call: "", success: false };
	if (i5 < 0 || i5 >= A4.length) return { call: "", success: false };
	if (i6 < 0 || i6 >= A4.length) return { call: "", success: false };

	const call = (A1[i1]! + A2[i2]! + A3[i3]! + A4[i4]! + A4[i5]! + A4[i6]!).trim();

	return { call, success: call.length > 0 };
}

function toGrid4(igrid4: number): { grid: string; success: boolean } {
	if (igrid4 < 0 || igrid4 > MAXGRID4) return { grid: "", success: false };
	let n = igrid4;
	const j4 = n % 10;
	n = Math.floor(n / 10);
	const j3 = n % 10;
	n = Math.floor(n / 10);
	const j2 = n % 18;
	n = Math.floor(n / 18);
	const j1 = n;
	if (j1 < 0 || j1 > 17 || j2 < 0 || j2 > 17) return { grid: "", success: false };
	const grid =
		String.fromCharCode(65 + j1) + String.fromCharCode(65 + j2) + j3.toString() + j4.toString();
	return { grid, success: true };
}

function unpackText77(bits71: number[]): string {
	// Reconstruct 9 bytes from 71 bits (7 + 8*8)
	const qa = new Uint8Array(9);
	let val = 0;
	for (let b = 6; b >= 0; b--) {
		val = (val << 1) | (bits71[6 - b] ?? 0);
	}
	qa[0] = val;
	for (let li = 1; li <= 8; li++) {
		val = 0;
		for (let b = 7; b >= 0; b--) {
			val = (val << 1) | (bits71[7 + (li - 1) * 8 + (7 - b)] ?? 0);
		}
		qa[li] = val;
	}

	// Decode from base-42 big-endian
	// Convert qa (9 bytes) to a bigint, then repeatedly divide by 42
	let n = 0n;
	for (let i = 0; i < 9; i++) {
		n = (n << 8n) | BigInt(qa[i]!);
	}

	const chars: string[] = [];
	for (let i = 0; i < 13; i++) {
		const j = Number(n % 42n);
		n = n / 42n;
		chars.unshift(FTALPH[j] ?? " ");
	}
	return chars.join("").trimStart();
}

/**
 * Unpack a 77-bit FT8 message into a human-readable string.
 */
export function unpack77(bits77: number[]): { msg: string; success: boolean } {
	const n3 = bitsToUint(bits77, 71, 3);
	const i3 = bitsToUint(bits77, 74, 3);

	if (i3 === 0 && n3 === 0) {
		// Type 0.0: Free text
		const msg = unpackText77(bits77.slice(0, 71));
		if (msg.trim().length === 0) return { msg: "", success: false };
		return { msg: msg.trim(), success: true };
	}

	if (i3 === 1 || i3 === 2) {
		// Type 1/2: Standard message
		const n28a = bitsToUint(bits77, 0, 28);
		const ipa = bits77[28]!;
		const n28b = bitsToUint(bits77, 29, 28);
		const ipb = bits77[57]!;
		const ir = bits77[58]!;
		const igrid4 = bitsToUint(bits77, 59, 15);

		const { call: call1, success: ok1 } = unpack28(n28a);
		const { call: call2Raw, success: ok2 } = unpack28(n28b);
		if (!ok1 || !ok2) return { msg: "", success: false };

		let c1 = call1;
		let c2 = call2Raw;

		if (c1.startsWith("CQ_")) c1 = c1.replace("_", " ");

		if (c1.indexOf("<") < 0) {
			if (ipa === 1 && i3 === 1 && c1.length >= 3) c1 += "/R";
			if (ipa === 1 && i3 === 2 && c1.length >= 3) c1 += "/P";
		}
		if (c2.indexOf("<") < 0) {
			if (ipb === 1 && i3 === 1 && c2.length >= 3) c2 += "/R";
			if (ipb === 1 && i3 === 2 && c2.length >= 3) c2 += "/P";
		}

		if (igrid4 <= MAXGRID4) {
			const { grid, success: gridOk } = toGrid4(igrid4);
			if (!gridOk) return { msg: "", success: false };
			const msg = ir === 0 ? `${c1} ${c2} ${grid}` : `${c1} ${c2} R ${grid}`;
			return { msg, success: true };
		} else {
			const irpt = igrid4 - MAXGRID4;
			if (irpt === 1) return { msg: `${c1} ${c2}`, success: true };
			if (irpt === 2) return { msg: `${c1} ${c2} RRR`, success: true };
			if (irpt === 3) return { msg: `${c1} ${c2} RR73`, success: true };
			if (irpt === 4) return { msg: `${c1} ${c2} 73`, success: true };
			if (irpt >= 5) {
				let isnr = irpt - 35;
				if (isnr > 50) isnr -= 101;
				const absStr = Math.abs(isnr).toString().padStart(2, "0");
				const crpt = (isnr >= 0 ? "+" : "-") + absStr;
				const msg = ir === 0 ? `${c1} ${c2} ${crpt}` : `${c1} ${c2} R${crpt}`;
				return { msg, success: true };
			}
			return { msg: "", success: false };
		}
	}

	if (i3 === 4) {
		// Type 4: One nonstandard call
		let n58 = 0n;
		for (let i = 0; i < 58; i++) {
			n58 = n58 * 2n + BigInt(bits77[12 + i] ?? 0);
		}
		const iflip = bits77[70]!;
		const nrpt = bitsToUint(bits77, 71, 2);
		const icq = bits77[73]!;

		// Decode n58 to 11-char string using C38 alphabet
		const c11chars: string[] = [];
		let remain = n58;
		for (let i = 10; i >= 0; i--) {
			const j = Number(remain % 38n);
			remain = remain / 38n;
			c11chars.unshift(C38[j] ?? " ");
		}
		const c11 = c11chars.join("").trim();

		const call3 = "<...>"; // We don't have a hash table for n12

		let call1: string;
		let call2: string;
		if (iflip === 0) {
			call1 = call3;
			call2 = c11;
		} else {
			call1 = c11;
			call2 = call3;
		}

		let msg: string;
		if (icq === 1) {
			msg = `CQ ${call2}`;
		} else {
			if (nrpt === 0) msg = `${call1} ${call2}`;
			else if (nrpt === 1) msg = `${call1} ${call2} RRR`;
			else if (nrpt === 2) msg = `${call1} ${call2} RR73`;
			else msg = `${call1} ${call2} 73`;
		}
		return { msg, success: true };
	}

	return { msg: "", success: false };
}
