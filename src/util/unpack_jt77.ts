/**
 * FT8 message unpacking – TypeScript port of unpack77 from packjt77.f90
 *
 * Supported message types:
 *   Type 0.0  Free text
 *   Type 0.1  DXpedition
 *   Type 0.3/0.4 ARRL Field Day
 *   Type 0.5  Telemetry
 *   Type 0.6  WSPR-style callsign/grid/power payloads
 *   Type 1    Standard (two callsigns + grid/report/RR73/73)
 *   Type 2    /P form for EU VHF contest
 *   Type 3    ARRL RTTY Roundup
 *   Type 4    One nonstandard call and one hashed call
 *   Type 5    EU VHF contest with two hashed calls
 */

import { A1, A2, A3, A4, C38, FTALPH, MAX22, MAXGRID4, NTOKENS } from "./constants.js";
import type { HashCallBook } from "./hashcall.js";

const FIELD_DAY_SECTIONS = [
	"AB",
	"AK",
	"AL",
	"AR",
	"AZ",
	"BC",
	"CO",
	"CT",
	"DE",
	"EB",
	"EMA",
	"ENY",
	"EPA",
	"EWA",
	"GA",
	"GTA",
	"IA",
	"ID",
	"IL",
	"IN",
	"KS",
	"KY",
	"LA",
	"LAX",
	"MAR",
	"MB",
	"MDC",
	"ME",
	"MI",
	"MN",
	"MO",
	"MS",
	"MT",
	"NC",
	"ND",
	"NE",
	"NFL",
	"NH",
	"NL",
	"NLI",
	"NM",
	"NNJ",
	"NNY",
	"NT",
	"NTX",
	"NV",
	"OH",
	"OK",
	"ONE",
	"ONN",
	"ONS",
	"OR",
	"ORG",
	"PAC",
	"PR",
	"QC",
	"RI",
	"SB",
	"SC",
	"SCV",
	"SD",
	"SDG",
	"SF",
	"SFL",
	"SJV",
	"SK",
	"SNJ",
	"STX",
	"SV",
	"TN",
	"UT",
	"VA",
	"VI",
	"VT",
	"WCF",
	"WI",
	"WMA",
	"WNY",
	"WPA",
	"WTX",
	"WV",
	"WWA",
	"WY",
	"DX",
	"PE",
] as const;

const RTTY_MULTIPLIERS = [
	"AL",
	"AK",
	"AZ",
	"AR",
	"CA",
	"CO",
	"CT",
	"DE",
	"FL",
	"GA",
	"HI",
	"ID",
	"IL",
	"IN",
	"IA",
	"KS",
	"KY",
	"LA",
	"ME",
	"MD",
	"MA",
	"MI",
	"MN",
	"MS",
	"MO",
	"MT",
	"NE",
	"NV",
	"NH",
	"NJ",
	"NM",
	"NY",
	"NC",
	"ND",
	"OH",
	"OK",
	"OR",
	"PA",
	"RI",
	"SC",
	"SD",
	"TN",
	"TX",
	"UT",
	"VT",
	"VA",
	"WA",
	"WV",
	"WI",
	"WY",
	"NB",
	"NS",
	"QC",
	"ON",
	"MB",
	"SK",
	"AB",
	"BC",
	"NWT",
	"NF",
	"LB",
	"NU",
	"YT",
	"PEI",
	"DC",
] as const;

const WSPR_NZZZ = 36 * 36 * 36;

function bitsToUint(bits: number[], start: number, len: number): number {
	let val = 0;
	for (let i = 0; i < len; i++) {
		val = val * 2 + (bits[start + i] ?? 0);
	}
	return val;
}

function formatSignedReport(value: number): string {
	const absStr = Math.abs(value).toString().padStart(2, "0");
	return (value >= 0 ? "+" : "-") + absStr;
}

function unpack28(n28: number, book: HashCallBook | undefined): { call: string; success: boolean } {
	if (n28 < 0 || n28 >= 268435456) return { call: "", success: false };

	if (n28 === 0) return { call: "DE", success: true };
	if (n28 === 1) return { call: "QRZ", success: true };
	if (n28 === 2) return { call: "CQ", success: true };

	if (n28 >= 3 && n28 < 3 + 1000) {
		const nqsy = n28 - 3;
		return { call: `CQ ${nqsy.toString().padStart(3, "0")}`, success: true };
	}

	if (n28 >= 1003 && n28 < NTOKENS) {
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
		const n22 = n28 - NTOKENS;
		const resolved = book?.lookup22(n22);
		if (resolved) return { call: `<${resolved}>`, success: true };
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

function toGrid6(igrid6: number): { grid: string; success: boolean } {
	if (igrid6 < 0 || igrid6 > 18 * 18 * 10 * 10 * 24 * 24 - 1) return { grid: "", success: false };
	let n = igrid6;
	const j6 = n % 24;
	n = Math.floor(n / 24);
	const j5 = n % 24;
	n = Math.floor(n / 24);
	const j4 = n % 10;
	n = Math.floor(n / 10);
	const j3 = n % 10;
	n = Math.floor(n / 10);
	const j2 = n % 18;
	n = Math.floor(n / 18);
	const j1 = n;
	if (j1 < 0 || j1 > 17 || j2 < 0 || j2 > 17) return { grid: "", success: false };
	const grid =
		String.fromCharCode(65 + j1) +
		String.fromCharCode(65 + j2) +
		j3.toString() +
		j4.toString() +
		String.fromCharCode(65 + j5) +
		String.fromCharCode(65 + j6);
	return { grid, success: true };
}

function toGrid(igrid6: number): { grid: string; success: boolean } {
	if (igrid6 < 0 || igrid6 > 18 * 18 * 10 * 10 * 25 * 25 - 1) return { grid: "", success: false };
	let n = igrid6;
	const j6 = n % 25;
	n = Math.floor(n / 25);
	const j5 = n % 25;
	n = Math.floor(n / 25);
	const j4 = n % 10;
	n = Math.floor(n / 10);
	const j3 = n % 10;
	n = Math.floor(n / 10);
	const j2 = n % 18;
	n = Math.floor(n / 18);
	const j1 = n;
	if (j1 < 0 || j1 > 17 || j2 < 0 || j2 > 17 || j5 > 24 || j6 > 24)
		return { grid: "", success: false };
	let grid =
		String.fromCharCode(65 + j1) + String.fromCharCode(65 + j2) + j3.toString() + j4.toString();
	if (j5 !== 24 || j6 !== 24) grid += String.fromCharCode(65 + j5) + String.fromCharCode(65 + j6);
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
 *
 * When a {@link HashCallBook} is provided, hashed callsigns are resolved from
 * the book, and newly decoded standard callsigns are saved into it.
 */
export function unpack77(bits77: number[], book?: HashCallBook): { msg: string; success: boolean } {
	const n3 = bitsToUint(bits77, 71, 3);
	const i3 = bitsToUint(bits77, 74, 3);

	if (i3 === 0 && n3 === 0) {
		// Type 0.0: Free text
		const msg = unpackText77(bits77.slice(0, 71));
		if (msg.trim().length === 0) return { msg: "", success: false };
		return { msg: msg.trim(), success: true };
	}

	if (i3 === 0 && n3 === 1) {
		const n28a = bitsToUint(bits77, 0, 28);
		const n28b = bitsToUint(bits77, 28, 28);
		const n10 = bitsToUint(bits77, 56, 10);
		const n5 = bitsToUint(bits77, 66, 5);
		const { call: call1, success: ok1 } = unpack28(n28a, book);
		const { call: call2, success: ok2 } = unpack28(n28b, book);
		if (!ok1 || !ok2 || n28a <= 2 || n28b <= 2) return { msg: "", success: false };
		const resolved = book?.lookup10(n10);
		const call3 = resolved ? `<${resolved}>` : "<...>";
		const report = formatSignedReport(2 * n5 - 30);
		return { msg: `${call1} RR73; ${call2} ${call3} ${report}`, success: true };
	}

	if (i3 === 0 && (n3 === 3 || n3 === 4)) {
		const n28a = bitsToUint(bits77, 0, 28);
		const n28b = bitsToUint(bits77, 28, 28);
		const ir = bits77[56]!;
		const intx = bitsToUint(bits77, 57, 4);
		const nclass = bitsToUint(bits77, 61, 3);
		const isec = bitsToUint(bits77, 64, 7);
		if (isec < 1 || isec > FIELD_DAY_SECTIONS.length || nclass > 7)
			return { msg: "", success: false };
		const { call: call1, success: ok1 } = unpack28(n28a, book);
		const { call: call2, success: ok2 } = unpack28(n28b, book);
		if (!ok1 || !ok2 || n28a <= 2 || n28b <= 2) return { msg: "", success: false };
		const ntx = intx + 1 + (n3 === 4 ? 16 : 0);
		const exchange = `${ntx}${String.fromCharCode(65 + nclass)}`;
		const section = FIELD_DAY_SECTIONS[isec - 1]!;
		const msg =
			ir === 0
				? `${call1} ${call2} ${exchange} ${section}`
				: `${call1} ${call2} R ${exchange} ${section}`;
		return { msg, success: true };
	}

	if (i3 === 0 && n3 === 5) {
		const n23 = bitsToUint(bits77, 0, 23);
		const n24a = bitsToUint(bits77, 23, 24);
		const n24b = bitsToUint(bits77, 47, 24);
		const msg = [
			n23.toString(16).padStart(6, "0"),
			n24a.toString(16).padStart(6, "0"),
			n24b.toString(16).padStart(6, "0"),
		]
			.join("")
			.replace(/^0+/, "")
			.toUpperCase();
		return { msg: msg.length > 0 ? msg : "0", success: true };
	}

	if (i3 === 0 && n3 === 6) {
		const j2a = bits77[48]!;
		const j2b = bits77[49]!;
		let itype = 2;
		if (j2b === 0 && j2a === 0) itype = 1;
		if (j2b === 0 && j2a === 1) itype = 3;

		if (itype === 1) {
			const n28 = bitsToUint(bits77, 0, 28);
			const igrid4 = bitsToUint(bits77, 28, 15);
			const idbm = Math.round((bitsToUint(bits77, 43, 5) * 10) / 3);
			const { call, success: callOk } = unpack28(n28, book);
			const { grid, success: gridOk } = toGrid4(igrid4);
			if (!callOk || !gridOk) return { msg: "", success: false };
			if (book) book.save(call);
			return { msg: `${call} ${grid} ${idbm}`, success: true };
		}

		if (itype === 2) {
			const n28 = bitsToUint(bits77, 0, 28);
			let npfx = bitsToUint(bits77, 28, 16);
			const idbm = Math.round((bitsToUint(bits77, 44, 5) * 10) / 3);
			const { call, success: callOk } = unpack28(n28, book);
			if (!callOk) return { msg: "", success: false };

			let compound: string;
			if (npfx < WSPR_NZZZ) {
				let prefix = "";
				for (let i = 2; i >= 0; i--) {
					const j = npfx % 36;
					prefix = `${A2[j] ?? "0"}${prefix}`;
					npfx = Math.floor(npfx / 36);
					if (npfx === 0) break;
				}
				compound = `${prefix}/${call}`;
			} else {
				npfx -= WSPR_NZZZ;
				let suffix: string;
				if (npfx <= 35) {
					suffix = A2[npfx] ?? "";
				} else if (npfx <= 1295) {
					suffix = `${A2[Math.floor(npfx / 36)] ?? ""}${A2[npfx % 36] ?? ""}`;
				} else if (npfx <= 12959) {
					suffix = `${A2[Math.floor(npfx / 360)] ?? ""}${A2[Math.floor(npfx / 10) % 36] ?? ""}${
						A2[npfx % 10] ?? ""
					}`;
				} else {
					return { msg: "", success: false };
				}
				compound = `${call}/${suffix}`;
			}
			if (book) book.save(compound);
			return { msg: `${compound} ${idbm}`, success: true };
		}

		const n22 = bitsToUint(bits77, 0, 22);
		const igrid6 = bitsToUint(bits77, 22, 25);
		const n28 = NTOKENS + n22;
		const { call, success: callOk } = unpack28(n28, book);
		const { grid, success: gridOk } = toGrid(igrid6);
		if (!callOk || !gridOk) return { msg: "", success: false };
		return { msg: `${call} ${grid}`, success: true };
	}

	if (i3 === 1 || i3 === 2) {
		// Type 1/2: Standard message
		const n28a = bitsToUint(bits77, 0, 28);
		const ipa = bits77[28]!;
		const n28b = bitsToUint(bits77, 29, 28);
		const ipb = bits77[57]!;
		const ir = bits77[58]!;
		const igrid4 = bitsToUint(bits77, 59, 15);

		const { call: call1, success: ok1 } = unpack28(n28a, book);
		const { call: call2Raw, success: ok2 } = unpack28(n28b, book);
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
			// Save the "from" call (call_2) into the hash book
			if (book && c2.length >= 3) book.save(c2);
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

	if (i3 === 3) {
		const itu = bits77[0]!;
		const n28a = bitsToUint(bits77, 1, 28);
		const n28b = bitsToUint(bits77, 29, 28);
		const ir = bits77[57]!;
		const irpt = bitsToUint(bits77, 58, 3);
		const nexch = bitsToUint(bits77, 61, 13);
		const { call: call1, success: ok1 } = unpack28(n28a, book);
		const { call: call2, success: ok2 } = unpack28(n28b, book);
		if (!ok1 || !ok2) return { msg: "", success: false };

		let exchange: string | null = null;
		if (nexch > 8000) {
			const imult = nexch - 8000;
			if (imult >= 1 && imult <= RTTY_MULTIPLIERS.length) exchange = RTTY_MULTIPLIERS[imult - 1]!;
		} else if (nexch >= 1 && nexch <= 7999) {
			exchange = nexch.toString().padStart(4, "0");
		}
		if (!exchange) return { msg: "", success: false };

		const report = `5${irpt + 2}9`;
		const prefix = itu === 1 ? "TU; " : "";
		const roger = ir === 1 ? " R" : "";
		return { msg: `${prefix}${call1} ${call2}${roger} ${report} ${exchange}`, success: true };
	}

	if (i3 === 4) {
		// Type 4: One nonstandard call
		const n12 = bitsToUint(bits77, 0, 12);
		let n58 = 0n;
		for (let i = 0; i < 58; i++) {
			n58 = n58 * 2n + BigInt(bits77[12 + i] ?? 0);
		}
		const iflip = bits77[70]!;
		const nrpt = bitsToUint(bits77, 71, 2);
		const icq = bits77[73]!;

		const c11chars: string[] = [];
		let remain = n58;
		for (let i = 10; i >= 0; i--) {
			const j = Number(remain % 38n);
			remain = remain / 38n;
			c11chars.unshift(C38[j] ?? " ");
		}
		const c11 = c11chars.join("").trim();

		const resolved = book?.lookup12(n12);
		const call3 = resolved ? `<${resolved}>` : "<...>";

		let call1: string;
		let call2: string;
		if (iflip === 0) {
			call1 = call3;
			call2 = c11;
			if (book) book.save(c11);
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

	if (i3 === 5) {
		const n12 = bitsToUint(bits77, 0, 12);
		const n22 = bitsToUint(bits77, 12, 22);
		const ir = bits77[34]!;
		const irpt = bitsToUint(bits77, 35, 3);
		const iserial = bitsToUint(bits77, 38, 11);
		const igrid6 = bitsToUint(bits77, 49, 25);
		const call1Resolved = book?.lookup12(n12);
		const call2Resolved = book?.lookup22(n22);
		const call1 = call1Resolved ? `<${call1Resolved}>` : "<...>";
		const call2 = call2Resolved ? `<${call2Resolved}>` : "<...>";
		const { grid, success: gridOk } = toGrid6(igrid6);
		if (!gridOk) return { msg: "", success: false };
		const exchange = `${52 + irpt}${iserial.toString().padStart(4, "0")}`;
		const msg =
			ir === 0
				? `${call1} ${call2} ${exchange} ${grid}`
				: `${call1} ${call2} R ${exchange} ${grid}`;
		return { msg, success: true };
	}

	return { msg: "", success: false };
}
