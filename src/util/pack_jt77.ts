/**
 * FT8 message packing – TypeScript port of packjt77.f90
 *
 * Implemented message types
 * ─────────────────────────
 *  0.0  Free text (≤13 chars from the 42-char FT8 alphabet)
 *  0.1  DXpedition
 *  0.3/0.4 ARRL Field Day
 *  0.5  Telemetry
 *  0.6  WSPR-style callsign/grid/power payloads
 *  1    Standard (two callsigns + grid/report/RR73/73)
 *       /R and /P suffixes on either callsign → ipa/ipb = 1 (triggers i3=2 for /P)
 *  3    ARRL RTTY Roundup
 *  4    One nonstandard (<hash>) call + one standard call
 *       e.g.  <YW18FIFA> KA1ABC 73
 *             KA1ABC <YW18FIFA> -11
 *             CQ YW18FIFA
 *  5    EU VHF contest with two hashed calls
 *
 * Reference: lib/77bit/packjt77.f90 (subroutines pack77, pack28, pack77_1,
 *            pack77_3, pack77_4, pack77_5, packtext77, ihashcall)
 */

import { A1, A2, A3, A4, C38, FTALPH, MAX22, MAX28, MAXGRID4, NTOKENS } from "./constants.js";

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

/** 9-limb big-integer (base 256, big-endian in limbs[0..8]) */
type MP = Uint8Array; // length 9

function mpZero(): MP {
	return new Uint8Array(9);
}

/** qa = 42 * qb + carry from high limbs, working with 9 limbs (indices 0..8) */
function mpMult42(a: MP): MP {
	const b = mpZero();
	let carry = 0;
	for (let i = 8; i >= 0; i--) {
		const v = 42 * (a[i] ?? 0) + carry;
		b[i] = v & 0xff;
		carry = v >>> 8;
	}
	return b;
}

/** qa = qb + j */
function mpAdd(a: MP, j: number): MP {
	const b = new Uint8Array(a);
	let carry = j;
	for (let i = 8; i >= 0 && carry > 0; i--) {
		const v = (b[i] ?? 0) + carry;
		b[i] = v & 0xff;
		carry = v >>> 8;
	}
	return b;
}

/**
 * Pack a 13-char free-text string (42-char alphabet) into 71 bits.
 * Mirrors Fortran packtext77 / mp_short_* logic.
 * Alphabet: ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+-./?' (42 chars)
 */
function packtext77(c13: string): number[] {
	// Right-justify in 13 chars
	const w = c13.padStart(13, " ");

	let qa = mpZero();
	for (let i = 0; i < 13; i++) {
		let j = FTALPH.indexOf(w[i] ?? " ");
		if (j < 0) j = 0;
		qa = mpMult42(qa);
		qa = mpAdd(qa, j);
	}

	// Extract 71 bits: first 7 then 8*8
	const bits: number[] = [];
	// limb 0 gives 7 bits (high), limbs 1..8 give 8 bits each → 7 + 64 = 71
	// But we need exactly 71 bits.  The Fortran writes b7.7 then 8*b8.8 for 71 total.
	// That equals: 7 + 8*8 = 71 bits from the 9 bytes (72 bits), skipping the top bit of byte 0.
	const byte0 = qa[0] ?? 0;
	for (let b = 6; b >= 0; b--) bits.push((byte0 >> b) & 1);
	for (let li = 1; li <= 8; li++) {
		const byte = qa[li] ?? 0;
		for (let b = 7; b >= 0; b--) bits.push((byte >> b) & 1);
	}
	return bits; // 71 bits
}

/**
 * ihashcall(c0, m): compute a hash of c0 and return bits [m-1 .. 63-m] of
 * (47055833459n * n8) shifted right by (64 - m).
 *
 * Fortran: ishft(47055833459_8 * n8, m - 64)
 *  → arithmetic right-shift of 64-bit product by (64 - m), keeping low m bits.
 *
 * Here we use m=10/12/22 for message types that carry hashed callsigns.
 */
function ihashcall(c0: string, width: 10 | 12 | 22): number {
	const C = C38;
	let n8 = 0n;
	const s = c0.padEnd(11, " ").slice(0, 11).toUpperCase();
	for (let i = 0; i < 11; i++) {
		const j = C.indexOf(s[i] ?? " ");
		n8 = 38n * n8 + BigInt(j < 0 ? 0 : j);
	}
	const MAGIC = 47055833459n;
	const prod = BigInt.asUintN(64, MAGIC * n8);
	return Number(prod >> BigInt(64 - width)) & ((1 << width) - 1);
}

function ihashcall22(c0: string): number {
	return ihashcall(c0, 22);
}

/**
 * Checks whether c0 is a valid standard callsign (may also have /R or /P suffix).
 * Returns { basecall, isStandard, hasSuffix: '/R'|'/P'|null }
 */
function parseCallsign(raw: string): {
	basecall: string;
	isStandard: boolean;
	suffix: "/R" | "/P" | null;
} {
	let call = raw.trim().toUpperCase();
	let suffix: "/R" | "/P" | null = null;
	if (call.endsWith("/R")) {
		suffix = "/R";
		call = call.slice(0, -2);
	}
	if (call.endsWith("/P")) {
		suffix = "/P";
		call = call.slice(0, -2);
	}

	const isLetter = (c: string) => c >= "A" && c <= "Z";
	const isDigit = (c: string) => c >= "0" && c <= "9";

	// Find the call-area digit (last digit in the call)
	let iarea = -1;
	for (let i = call.length - 1; i >= 1; i--) {
		if (isDigit(call[i] ?? "")) {
			iarea = i;
			break;
		}
	}
	if (iarea < 1) return { basecall: call, isStandard: false, suffix };

	// Count letters/digits before the call-area digit
	let npdig = 0,
		nplet = 0;
	for (let i = 0; i < iarea; i++) {
		if (isDigit(call[i] ?? "")) npdig++;
		if (isLetter(call[i] ?? "")) nplet++;
	}
	// Count suffix letters after call-area digit
	let nslet = 0;
	for (let i = iarea + 1; i < call.length; i++) {
		if (isLetter(call[i] ?? "")) nslet++;
	}

	const standard =
		iarea >= 1 &&
		iarea <= 2 && // Fortran: iarea (1-indexed) must be 2 or 3 → 0-indexed: 1 or 2
		nplet >= 1 && // at least one letter before area digit
		npdig < iarea && // not all digits before area
		nslet <= 3; // at most 3 suffix letters

	return { basecall: call, isStandard: standard, suffix };
}

/**
 * pack28: pack a single callsign/token to a 28-bit integer.
 * Mirrors Fortran pack28 subroutine.
 */
function pack28(token: string): number {
	const t = token.trim().toUpperCase();

	// Special tokens
	if (t === "DE") return 0;
	if (t === "QRZ") return 1;
	if (t === "CQ") return 2;

	// CQ_nnn (CQ with frequency offset in kHz)
	if (t.startsWith("CQ_")) {
		const rest = t.slice(3);
		const nqsy = parseInt(rest, 10);
		if (!Number.isNaN(nqsy) && /^\d{3}$/.test(rest)) return 3 + nqsy;
		// CQ_aaaa (up to 4 letters)
		if (/^[A-Z]{1,4}$/.test(rest)) {
			const padded = rest.padStart(4, " ");
			let m = 0;
			for (let i = 0; i < 4; i++) {
				const c = padded[i] ?? " ";
				const j = c >= "A" && c <= "Z" ? c.charCodeAt(0) - 64 : 0;
				m = 27 * m + j;
			}
			return 3 + 1000 + m;
		}
	}

	// <...> hash calls
	if (t.startsWith("<") && t.endsWith(">")) {
		const inner = t.slice(1, -1);
		const n22 = ihashcall22(inner);
		return (NTOKENS + n22) & (MAX28 - 1);
	}

	// Standard callsign
	const { basecall, isStandard } = parseCallsign(t);
	if (isStandard) {
		// Fortran pack28 layout:
		//   iarea==2 (0-based 1): callsign=' '//c13(1:5)
		//   iarea==3 (0-based 2): callsign=     c13(1:6)
		let iareaD = -1;
		for (let ii = basecall.length - 1; ii >= 1; ii--) {
			const c = basecall[ii] ?? "";
			if (c >= "0" && c <= "9") {
				iareaD = ii;
				break;
			}
		}
		let cs = basecall;
		if (iareaD === 1) cs = ` ${basecall.slice(0, 5)}`;
		if (iareaD === 2) cs = basecall.slice(0, 6);
		const i1 = A1.indexOf(cs[0] ?? " ");
		const i2 = A2.indexOf(cs[1] ?? "0");
		const i3 = A3.indexOf(cs[2] ?? "0");
		const i4 = A4.indexOf(cs[3] ?? " ");
		const i5 = A4.indexOf(cs[4] ?? " ");
		const i6 = A4.indexOf(cs[5] ?? " ");
		const n28 =
			36 * 10 * 27 * 27 * 27 * i1 +
			10 * 27 * 27 * 27 * i2 +
			27 * 27 * 27 * i3 +
			27 * 27 * i4 +
			27 * i5 +
			i6;
		return (n28 + NTOKENS + MAX22) & (MAX28 - 1);
	}

	// Non-standard → 22-bit hash
	const n22 = ihashcall22(basecall);
	return (NTOKENS + n22) & (MAX28 - 1);
}

function packgrid4(s: string): number {
	if (s === "RRR") return MAXGRID4 + 2;
	if (s === "73") return MAXGRID4 + 4;
	// Numeric report (+NN / -NN)
	const r = /^(R?)([+-]\d+)$/.exec(s);
	if (r) {
		let irpt = parseInt(r[2]!, 10);
		if (irpt >= -50 && irpt <= -31) irpt += 101;
		irpt += 35; // encode in range 5..85
		return MAXGRID4 + irpt;
	}
	// 4-char grid locator
	const j1 = (s.charCodeAt(0) - 65) * 18 * 10 * 10;
	const j2 = (s.charCodeAt(1) - 65) * 10 * 10;
	const j3 = (s.charCodeAt(2) - 48) * 10;
	const j4 = s.charCodeAt(3) - 48;
	return j1 + j2 + j3 + j4;
}

function appendBits(bits: number[], val: number, width: number): void {
	for (let i = width - 1; i >= 0; i--) {
		bits.push(Math.floor(val / 2 ** i) % 2);
	}
}

function appendType0Suffix(bits: number[], n3: number): void {
	appendBits(bits, n3, 3);
	appendBits(bits, 0, 3);
}

/**
 * Pack an FT8 message into 77 bits.
 * Returns an array of 0/1 values, length 77.
 *
 * Supported message types:
 *   Type 1/2  Standard two-callsign messages including /R and /P suffixes
 *   Type 4    One nonstandard (<hash>) call + one standard or nonstandard call
 *   Type 0.0  Free text (≤13 chars from FTALPH)
 */
/**
 * Preprocess a message in the same way as Fortran split77:
 * - Collapse multiple spaces, force uppercase
 * - If the first word is "CQ" and there are ≥3 words and the 3rd word is a
 *   valid base callsign, merge words 1+2 into "CQ_<word2>" and shift the rest.
 */
function split77(msg: string): string[] {
	const parts = msg.trim().toUpperCase().replace(/\s+/g, " ").split(" ").filter(Boolean);
	if (parts.length >= 3 && parts[0] === "CQ") {
		// Check if word 3 (index 2) is a valid base callsign
		const w3 = parts[2]!.replace(/\/[RP]$/, ""); // strip /R or /P for check
		const { isStandard } = parseCallsign(w3);
		if (isStandard) {
			// merge CQ + word2 → CQ_word2
			const merged = [`CQ_${parts[1]!}`, ...parts.slice(2)];
			return merged;
		}
	}
	return parts;
}

export function pack77(msg: string): number[] {
	const parts = split77(msg);
	if (parts.length < 1) throw new Error("Empty message");

	const dxpedition = tryPackType01(parts);
	if (dxpedition) return dxpedition;

	const fieldDay = tryPackType03(parts);
	if (fieldDay) return fieldDay;

	if (parts.length === 1) {
		const telemetry = tryPackType05(parts[0]!);
		if (telemetry) return telemetry;
	}

	const wspr = tryPackType06(parts);
	if (wspr) return wspr;

	// ── Try Type 1/2: standard message ────────────────────────────────────────
	const t1 = tryPackType1(parts);
	if (t1) return t1;

	const rtty = tryPackType3(parts);
	if (rtty) return rtty;

	// ── Try Type 4: one hash call ──────────────────────────────────────────────
	const t4 = tryPackType4(parts);
	if (t4) return t4;

	const vhf = tryPackType5(parts);
	if (vhf) return vhf;

	// ── Default: Type 0.0 free text ───────────────────────────────────────────
	return packFreeText(msg);
}

function tryPackType01(parts: string[]): number[] | null {
	if (parts.length !== 5) return null;
	if (parts[1] !== "RR73;") return null;
	const hashed = parts[3]!;
	if (!hashed.startsWith("<") || !hashed.endsWith(">")) return null;

	const p1 = parseCallsign(parts[0]!);
	const p2 = parseCallsign(parts[2]!);
	if (!p1.isStandard || !p2.isStandard) return null;

	const report = parseInt(parts[4]!, 10);
	if (Number.isNaN(report)) return null;
	let n5 = Math.trunc((report + 30) / 2);
	if (n5 < 0) n5 = 0;
	if (n5 > 31) n5 = 31;

	const bits: number[] = [];
	appendBits(bits, pack28(p1.basecall), 28);
	appendBits(bits, pack28(p2.basecall), 28);
	appendBits(bits, ihashcall(hashed.slice(1, -1), 10), 10);
	appendBits(bits, n5, 5);
	appendType0Suffix(bits, 1);
	return bits;
}

function tryPackType03(parts: string[]): number[] | null {
	if (parts.length < 4 || parts.length > 5) return null;
	const p1 = parseCallsign(parts[0]!);
	const p2 = parseCallsign(parts[1]!);
	if (!p1.isStandard || !p2.isStandard) return null;

	const section = parts[parts.length - 1]!;
	const isec = FIELD_DAY_SECTIONS.indexOf(section as (typeof FIELD_DAY_SECTIONS)[number]);
	if (isec < 0) return null;
	if (parts.length === 5 && parts[2] !== "R") return null;

	const ntxClass = /^(\d{1,2})([A-Z])$/.exec(parts[parts.length - 2]!);
	if (!ntxClass) return null;
	const ntx = parseInt(ntxClass[1]!, 10);
	if (ntx < 1 || ntx > 32) return null;
	const nclass = ntxClass[2]!.charCodeAt(0) - 65;
	if (nclass < 0 || nclass > 7) return null;

	let n3 = 3;
	let intx = ntx - 1;
	if (intx >= 16) {
		n3 = 4;
		intx = ntx - 17;
	}

	const bits: number[] = [];
	appendBits(bits, pack28(p1.basecall), 28);
	appendBits(bits, pack28(p2.basecall), 28);
	appendBits(bits, parts[2] === "R" ? 1 : 0, 1);
	appendBits(bits, intx, 4);
	appendBits(bits, nclass, 3);
	appendBits(bits, isec + 1, 7);
	appendType0Suffix(bits, n3);
	return bits;
}

function tryPackType05(word: string): number[] | null {
	if (!/^[0-9A-F]{18}$/.test(word)) return null;
	const hex = word.padStart(18, "0");
	const n23 = parseInt(hex.slice(0, 6), 16);
	if (n23 >= 2 ** 23) return null;

	const bits: number[] = [];
	appendBits(bits, n23, 23);
	appendBits(bits, parseInt(hex.slice(6, 12), 16), 24);
	appendBits(bits, parseInt(hex.slice(12, 18), 16), 24);
	appendType0Suffix(bits, 5);
	return bits;
}

function tryPackType06(parts: string[]): number[] | null {
	const type1 = tryPackWsprType1(parts);
	if (type1) return type1;
	const type2 = tryPackWsprType2(parts);
	if (type2) return type2;
	return null;
}

function packDbm(dbmWord: string): number | null {
	if (!/^\d{1,2}$/.test(dbmWord)) return null;
	let dbm = parseInt(dbmWord, 10);
	if (dbm < 0) dbm = 0;
	if (dbm > 60) dbm = 60;
	return Math.round(0.3 * dbm);
}

function tryPackWsprType1(parts: string[]): number[] | null {
	if (parts.length !== 3) return null;
	const [call, grid4, dbmWord] = parts as [string, string, string];
	if (call.length < 3 || call.length > 6) return null;
	if (!parseCallsign(call).isStandard) return null;
	if (!isGrid4(grid4)) return null;
	const idbm = packDbm(dbmWord);
	if (idbm === null) return null;

	const bits: number[] = [];
	appendBits(bits, pack28(call), 28);
	appendBits(bits, packgrid4(grid4), 15);
	appendBits(bits, idbm, 5);
	appendBits(bits, 0, 2);
	appendBits(bits, 0, 21);
	appendType0Suffix(bits, 6);
	return bits;
}

function tryPackWsprType2(parts: string[]): number[] | null {
	if (parts.length !== 2) return null;
	const [compound, dbmWord] = parts as [string, string];
	if (compound.length < 5 || compound.length > 10) return null;
	const slash = compound.indexOf("/");
	if (slash < 1 || slash === compound.length - 1) return null;
	const idbm = packDbm(dbmWord);
	if (idbm === null) return null;

	const left = compound.slice(0, slash);
	const right = compound.slice(slash + 1);
	let baseCall: string;
	let npfx: number;

	if (left.length <= 3) {
		if (left.length < 1 || left.length > 3 || !/^[0-9A-Z]+$/.test(left)) return null;
		if (!parseCallsign(right).isStandard) return null;
		baseCall = right;
		npfx = 0;
		for (const ch of left) {
			const idx = A2.indexOf(ch);
			if (idx < 0) return null;
			npfx = 36 * npfx + idx;
		}
	} else {
		if (right.length < 1 || right.length > 3 || !/^[0-9A-Z]+$/.test(right)) return null;
		if (right.length === 3 && !/^\d$/.test(right[2]!)) return null;
		if (!parseCallsign(left).isStandard) return null;
		baseCall = left;
		if (right.length === 1) {
			npfx = A2.indexOf(right[0]!);
		} else if (right.length === 2) {
			npfx = 36 * A2.indexOf(right[0]!) + A2.indexOf(right[1]!);
		} else {
			npfx = 360 * A2.indexOf(right[0]!) + 10 * A2.indexOf(right[1]!) + A2.indexOf(right[2]!);
		}
		if (npfx < 0) return null;
		npfx += WSPR_NZZZ;
	}

	const bits: number[] = [];
	appendBits(bits, pack28(baseCall), 28);
	appendBits(bits, npfx, 16);
	appendBits(bits, idbm, 5);
	appendBits(bits, 1, 1);
	appendBits(bits, 0, 21);
	appendType0Suffix(bits, 6);
	return bits;
}

function tryPackType1(parts: string[]): number[] | null {
	// Minimum 2 words, maximum 4
	if (parts.length < 2 || parts.length > 4) return null;

	const w1 = parts[0]!;
	const w2 = parts[1]!;
	const wLast = parts[parts.length - 1]!;

	// Neither word may be a hash call if the other has a slash
	if (w1.startsWith("<") && w2.includes("/")) return null;
	if (w2.startsWith("<") && w1.includes("/")) return null;

	// Parse callsign 1
	let call1: string;
	let ipa = 0;
	let ok1: boolean;

	if (w1 === "CQ" || w1 === "DE" || w1 === "QRZ" || w1.startsWith("CQ_")) {
		call1 = w1;
		ok1 = true;
		ipa = 0;
	} else if (w1.startsWith("<") && w1.endsWith(">")) {
		call1 = w1;
		ok1 = true;
		ipa = 0;
	} else {
		const p1 = parseCallsign(w1);
		call1 = p1.basecall;
		ok1 = p1.isStandard;
		if (p1.suffix === "/R" || p1.suffix === "/P") ipa = 1;
	}

	// Parse callsign 2
	let call2: string;
	let ipb = 0;
	let ok2: boolean;

	if (w2.startsWith("<") && w2.endsWith(">")) {
		call2 = w2;
		ok2 = true;
		ipb = 0;
	} else {
		const p2 = parseCallsign(w2);
		call2 = p2.basecall;
		ok2 = p2.isStandard;
		if (p2.suffix === "/R" || p2.suffix === "/P") ipb = 1;
	}

	if (!ok1 || !ok2) return null;

	// Determine message type (1 or 2)
	const i1psfx = ipa === 1 && (w1.endsWith("/P") || w1.includes("/P "));
	const i2psfx = ipb === 1 && (w2.endsWith("/P") || w2.includes("/P "));
	const i3 = i1psfx || i2psfx ? 2 : 1;

	// Decode the grid/report/special from the last word
	let igrid4: number;
	let ir = 0;

	if (parts.length === 2) {
		// Two-word message: <call1> <call2>  → special irpt=1
		igrid4 = MAXGRID4 + 1;
		ir = 0;
	} else {
		// Check whether wLast is a grid, report, or special
		const lastUpper = wLast.toUpperCase();
		if (isGrid4(lastUpper)) {
			igrid4 = packgrid4(lastUpper);
			ir = parts.length === 4 && parts[2] === "R" ? 1 : 0;
		} else if (lastUpper === "RRR") {
			igrid4 = MAXGRID4 + 2;
			ir = 0;
		} else if (lastUpper === "RR73") {
			igrid4 = MAXGRID4 + 3;
			ir = 0;
		} else if (lastUpper === "73") {
			igrid4 = MAXGRID4 + 4;
			ir = 0;
		} else if (/^R[+-]\d+$/.test(lastUpper)) {
			ir = 1;
			const reportStr = lastUpper.slice(1); // strip leading R
			let irpt = parseInt(reportStr, 10);
			if (irpt >= -50 && irpt <= -31) irpt += 101;
			irpt += 35;
			igrid4 = MAXGRID4 + irpt;
		} else if (/^[+-]\d+$/.test(lastUpper)) {
			ir = 0;
			let irpt = parseInt(lastUpper, 10);
			if (irpt >= -50 && irpt <= -31) irpt += 101;
			irpt += 35;
			igrid4 = MAXGRID4 + irpt;
		} else {
			return null; // Not a valid Type 1 last word
		}
	}

	const n28a = pack28(call1);
	const n28b = pack28(call2);

	const bits: number[] = [];
	appendBits(bits, n28a, 28);
	appendBits(bits, ipa, 1);
	appendBits(bits, n28b, 28);
	appendBits(bits, ipb, 1);
	appendBits(bits, ir, 1);
	appendBits(bits, igrid4, 15);
	appendBits(bits, i3, 3);
	return bits;
}

function isGrid4(s: string): boolean {
	return (
		s.length === 4 &&
		s[0]! >= "A" &&
		s[0]! <= "R" &&
		s[1]! >= "A" &&
		s[1]! <= "R" &&
		s[2]! >= "0" &&
		s[2]! <= "9" &&
		s[3]! >= "0" &&
		s[3]! <= "9"
	);
}

function isGrid6(s: string): boolean {
	return (
		s.length === 6 &&
		s[0]! >= "A" &&
		s[0]! <= "R" &&
		s[1]! >= "A" &&
		s[1]! <= "R" &&
		s[2]! >= "0" &&
		s[2]! <= "9" &&
		s[3]! >= "0" &&
		s[3]! <= "9" &&
		s[4]! >= "A" &&
		s[4]! <= "X" &&
		s[5]! >= "A" &&
		s[5]! <= "X"
	);
}

function packgrid6(s: string): number {
	const j1 = (s.charCodeAt(0) - 65) * 18 * 10 * 10 * 24 * 24;
	const j2 = (s.charCodeAt(1) - 65) * 10 * 10 * 24 * 24;
	const j3 = (s.charCodeAt(2) - 48) * 10 * 24 * 24;
	const j4 = (s.charCodeAt(3) - 48) * 24 * 24;
	const j5 = (s.charCodeAt(4) - 65) * 24;
	const j6 = s.charCodeAt(5) - 65;
	return j1 + j2 + j3 + j4 + j5 + j6;
}

function tryPackType3(parts: string[]): number[] | null {
	if (parts.length < 4 || parts.length > 6) return null;
	if (parts[0]?.startsWith("<") && parts[1]?.startsWith("<")) return null;

	const itu = parts[0] === "TU;" ? 1 : 0;
	const call1 = parts[itu]!;
	const call2 = parts[itu + 1]!;
	const p1 = parseCallsign(call1);
	const p2 = parseCallsign(call2);
	if (!p1.isStandard || !p2.isStandard) return null;

	const reportIndex = itu + 2 + (parts[itu + 2] === "R" ? 1 : 0);
	if (reportIndex !== parts.length - 2) return null;
	const report = parts[reportIndex];
	const exchange = parts[parts.length - 1]!;
	if (!report || !/^5[2-9]9$/.test(report)) return null;

	let nexch = 0;
	const serial = parseInt(exchange, 10);
	if (/^\d+$/.test(exchange) && serial > 0 && serial <= 7999) {
		nexch = serial;
	} else {
		const imult = RTTY_MULTIPLIERS.indexOf(exchange as (typeof RTTY_MULTIPLIERS)[number]);
		if (imult < 0) return null;
		nexch = 8000 + imult + 1;
	}

	let irpt = Math.trunc((parseInt(report, 10) - 509) / 10) - 2;
	if (irpt < 0) irpt = 0;
	if (irpt > 7) irpt = 7;

	const bits: number[] = [];
	appendBits(bits, itu, 1);
	appendBits(bits, pack28(p1.basecall), 28);
	appendBits(bits, pack28(p2.basecall), 28);
	appendBits(bits, parts[itu + 2] === "R" ? 1 : 0, 1);
	appendBits(bits, irpt, 3);
	appendBits(bits, nexch, 13);
	appendBits(bits, 3, 3);
	return bits;
}

/**
 * Type 4: one nonstandard (or hashed <...>) call + one standard call.
 * Format:  <HASH> CALL [RRR|RR73|73]
 *          CALL <HASH> [RRR|RR73|73]
 *          CQ NONSTDCALL
 *
 * Bit layout: n12(12) n58(58) iflip(1) nrpt(2) icq(1) i3=4(3)  → 77 bits
 */
function tryPackType4(parts: string[]): number[] | null {
	if (parts.length < 2 || parts.length > 3) return null;

	const w1 = parts[0]!;
	const w2 = parts[1]!;
	const w3 = parts[2]; // optional

	let icq = 0;
	let iflip = 0;
	let n12 = 0;
	let n58 = 0n;
	let nrpt = 0;

	const parsedW1 = parseCallsign(w1);
	const parsedW2 = parseCallsign(w2);

	// If both are standard callsigns (no hash), type 4 doesn't apply
	if (parsedW1.isStandard && parsedW2.isStandard && !w1.startsWith("<") && !w2.startsWith("<"))
		return null;

	if (w1 === "CQ") {
		// CQ <nonstdcall>
		if (w2.length <= 4) return null; // too short for type 4
		icq = 1;
		iflip = 0;
		// save_hash_call updates n12 with ihashcall12 of the callsign
		n12 = ihashcall12(w2);
		const c11 = w2.padStart(11, " ");
		n58 = encodeC11(c11);
		nrpt = 0;
	} else if (w1.startsWith("<") && w1.endsWith(">")) {
		// <HASH> CALL [rpt]
		iflip = 0;
		const inner = w1.slice(1, -1);
		n12 = ihashcall12(inner);
		const c11 = w2.padStart(11, " ");
		n58 = encodeC11(c11);
		nrpt = decodeRpt(w3);
	} else if (w2.startsWith("<") && w2.endsWith(">")) {
		// CALL <HASH> [rpt]
		iflip = 1;
		const inner = w2.slice(1, -1);
		n12 = ihashcall12(inner);
		const c11 = w1.padStart(11, " ");
		n58 = encodeC11(c11);
		nrpt = decodeRpt(w3);
	} else {
		return null;
	}

	const i3 = 4;

	const bits: number[] = [];
	appendBits(bits, n12, 12);
	// n58 is a BigInt, need 58 bits
	for (let b = 57; b >= 0; b--) {
		bits.push(Number((n58 >> BigInt(b)) & 1n));
	}
	appendBits(bits, iflip, 1);
	appendBits(bits, nrpt, 2);
	appendBits(bits, icq, 1);
	appendBits(bits, i3, 3);
	return bits;
}

function tryPackType5(parts: string[]): number[] | null {
	if (parts.length < 4 || parts.length > 5) return null;
	if (parts.length === 5 && parts[2] !== "R") return null;
	const w1 = parts[0]!;
	const w2 = parts[1]!;
	if (!w1.startsWith("<") || !w1.endsWith(">")) return null;
	if (!w2.startsWith("<") || !w2.endsWith(">")) return null;

	const exchange = parts[parts.length - 2]!;
	const grid6 = parts[parts.length - 1]!;
	if (!isGrid6(grid6)) return null;
	const nx = parseInt(exchange, 10);
	if (Number.isNaN(nx) || nx < 520001 || nx > 594095) return null;

	const ir = parts[2] === "R" ? 1 : 0;
	const irpt = Math.trunc(nx / 10000) - 52;
	let iserial = nx % 10000;
	if (iserial > 2047) iserial = 2047;

	const bits: number[] = [];
	appendBits(bits, ihashcall(w1.slice(1, -1), 12), 12);
	appendBits(bits, ihashcall(w2.slice(1, -1), 22), 22);
	appendBits(bits, ir, 1);
	appendBits(bits, irpt, 3);
	appendBits(bits, iserial, 11);
	appendBits(bits, packgrid6(grid6), 25);
	appendBits(bits, 5, 3);
	return bits;
}

function ihashcall12(c0: string): number {
	return ihashcall(c0, 12);
}

function encodeC11(c11: string): bigint {
	const padded = c11.padStart(11, " ");
	let n = 0n;
	for (let i = 0; i < 11; i++) {
		const j = C38.indexOf(padded[i]!.toUpperCase());
		n = n * 38n + BigInt(j < 0 ? 0 : j);
	}
	return n;
}

function decodeRpt(w: string | undefined): number {
	if (!w) return 0;
	if (w === "RRR") return 1;
	if (w === "RR73") return 2;
	if (w === "73") return 3;
	return 0;
}

function packFreeText(msg: string): number[] {
	// Truncate to 13 chars, only characters from FTALPH
	const raw = msg.slice(0, 13).toUpperCase();
	const bits71 = packtext77(raw);

	// Type 0.0: n3=0, i3=0 → last 6 bits are 000 000
	const bits: number[] = [...bits71, 0, 0, 0, 0, 0, 0];
	return bits; // 77 bits
}
