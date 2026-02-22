/**
 * CRC-14 computation and checking, shared between encoder and decoder.
 * Polynomial: 0x2757 (x^14 + x^13 + x^10 + x^9 + x^8 + x^6 + x^4 + x^2 + x + 1)
 */

export function computeCRC14(msg77: number[]): number {
	const poly = 0x2757;
	let crc = 0;
	const bitArray = [...msg77, 0, 0, 0, ...(new Array(16).fill(0) as number[])];
	for (let bit = 0; bit < 96; bit++) {
		const nextBit = bitArray[bit]!;
		if ((crc & 0x2000) !== 0) {
			crc = ((crc << 1) | nextBit) ^ poly;
		} else {
			crc = (crc << 1) | nextBit;
		}
		crc &= 0x3fff;
	}
	return crc;
}

/**
 * Check CRC-14 of a 91-bit decoded message (77 message + 14 CRC).
 * Returns true if CRC is valid.
 */
export function checkCRC14(bits91: number[]): boolean {
	const msg77 = bits91.slice(0, 77);
	const receivedCRC = bitsToInt(bits91, 77, 14);
	const computedCRC = computeCRC14(msg77);
	return receivedCRC === computedCRC;
}

function bitsToInt(bits: number[], offset: number, count: number): number {
	let val = 0;
	for (let i = 0; i < count; i++) {
		val = (val << 1) | (bits[offset + i] ?? 0);
	}
	return val;
}
