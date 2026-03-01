import { HashCallBook } from "../src/util/hashcall.js";

/** Callsigns that appear as hashes (in angle brackets) in test messages. */
export const KNOWN_CALLSIGNS = ["PJ4/K1ABC", "YW18FIFA", "W9XYZ", "KA1ABC"] as const;

export function makeBookWithKnownCalls(): HashCallBook {
	const book = new HashCallBook();
	for (const call of KNOWN_CALLSIGNS) book.save(call);
	return book;
}

/** All test messages for round-trip (encode→decode). Union of FT4 and FT8 cases. */
export const ROUND_TRIP_MESSAGES: readonly string[] = [
	// Type 0 – Free text
	"TNX BOB 73 GL",
	// Type 1 – Standard (two callsigns + grid/RR73/73/report)
	"CQ K1ABC FN42",
	"CQ K1FM FN30",
	`K1ABC ${KNOWN_CALLSIGNS[2]} EN37`,
	`${KNOWN_CALLSIGNS[2]} K1ABC -11`,
	`K1ABC ${KNOWN_CALLSIGNS[2]} R-09`,
	`${KNOWN_CALLSIGNS[2]} K1ABC RRR`,
	`K1ABC ${KNOWN_CALLSIGNS[2]} 73`,
	`K1ABC ${KNOWN_CALLSIGNS[2]} RR73`,
	"CQ FD K1ABC FN42",
	"CQ TEST K1ABC/R FN42",
	`K1ABC/R ${KNOWN_CALLSIGNS[2]} EN37`,
	`${KNOWN_CALLSIGNS[2]} K1ABC/R R FN42`,
	`K1ABC/R ${KNOWN_CALLSIGNS[2]} RR73`,
	"CQ TEST K1ABC FN42",
	`${KNOWN_CALLSIGNS[2]} <${KNOWN_CALLSIGNS[0]}> -11`,
	`<${KNOWN_CALLSIGNS[0]}> ${KNOWN_CALLSIGNS[2]} R-09`,
	`CQ ${KNOWN_CALLSIGNS[2]} EN37`,
	`<${KNOWN_CALLSIGNS[1]}> ${KNOWN_CALLSIGNS[2]} -11`,
	`${KNOWN_CALLSIGNS[2]} <${KNOWN_CALLSIGNS[1]}> R-09`,
	`<${KNOWN_CALLSIGNS[1]}> ${KNOWN_CALLSIGNS[3]}`,
	`${KNOWN_CALLSIGNS[3]} <${KNOWN_CALLSIGNS[1]}> -11`,
	`<${KNOWN_CALLSIGNS[1]}> ${KNOWN_CALLSIGNS[3]} R-17`,
	`<${KNOWN_CALLSIGNS[1]}> ${KNOWN_CALLSIGNS[3]} 73`,
	"KC8JXH K1FM FN30",
	"CQ W1AW FN31",
	"CQ 3B8MM IN97",
	"K1FM W1AW 73",
	"CQ N0SS EN34",
	"CQ AA1A FN20",
	"CQ F4WBN JN18",
	"CQ JA1ABC PM95",
	"CQ 9A1A JN75",
	"CQ 2E0XYZ IO91",
	"DL7ABC 9A1A -03",
	"AA1A N0SS R-07",
	"JA1ABC DL7ABC 73",
	"2E0XYZ F4WBN FN31",
	// Type 2 – /P portable
	"CQ G4ABC/P IO91",
	"G4ABC/P PA9XYZ JO22",
	"PA9XYZ G4ABC/P RR73",
	// Type 4 – One nonstandard callsign (hash) + one standard call
	"CQ KH1/KH7Z",
	`CQ ${KNOWN_CALLSIGNS[0]}`,
	`${KNOWN_CALLSIGNS[0]} <${KNOWN_CALLSIGNS[2]}>`,
	`<${KNOWN_CALLSIGNS[2]}> ${KNOWN_CALLSIGNS[0]} RRR`,
	`${KNOWN_CALLSIGNS[0]} <${KNOWN_CALLSIGNS[2]}> 73`,
	`<${KNOWN_CALLSIGNS[2]}> ${KNOWN_CALLSIGNS[1]}`,
	`${KNOWN_CALLSIGNS[1]} <${KNOWN_CALLSIGNS[2]}> RRR`,
	`<${KNOWN_CALLSIGNS[2]}> ${KNOWN_CALLSIGNS[1]} 73`,
	`CQ ${KNOWN_CALLSIGNS[1]}`,
	`<${KNOWN_CALLSIGNS[3]}> ${KNOWN_CALLSIGNS[1]} RR73`,
];
