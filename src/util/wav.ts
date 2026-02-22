/// <reference types="node" />

import { writeFileSync } from "node:fs";

export interface WavData {
	sampleRate: number;
	samples: Float32Array;
}

/**
 * Parse a WAV file buffer into sample rate and normalized float samples.
 * Supports PCM format 1, 8/16/32-bit samples.
 */
export function parseWavBuffer(buf: Buffer): WavData {
	if (buf.length < 44) throw new Error("File too small for WAV");

	const riff = buf.toString("ascii", 0, 4);
	const wave = buf.toString("ascii", 8, 12);
	if (riff !== "RIFF" || wave !== "WAVE") throw new Error("Not a WAV file");

	let offset = 12;
	let fmtFound = false;
	let sampleRate = 0;
	let bitsPerSample = 0;
	let numChannels = 1;
	let audioFormat = 0;
	let dataOffset = 0;
	let dataSize = 0;

	while (offset < buf.length - 8) {
		const chunkId = buf.toString("ascii", offset, offset + 4);
		const chunkSize = buf.readUInt32LE(offset + 4);
		offset += 8;

		if (chunkId === "fmt ") {
			audioFormat = buf.readUInt16LE(offset);
			numChannels = buf.readUInt16LE(offset + 2);
			sampleRate = buf.readUInt32LE(offset + 4);
			bitsPerSample = buf.readUInt16LE(offset + 14);
			fmtFound = true;
		} else if (chunkId === "data") {
			dataOffset = offset;
			dataSize = chunkSize;
			break;
		}
		offset += chunkSize;
	}

	if (!fmtFound) throw new Error("No fmt chunk found");
	if (audioFormat !== 1) throw new Error(`Unsupported audio format: ${audioFormat} (only PCM=1)`);
	if (dataOffset === 0) throw new Error("No data chunk found");

	const bytesPerSample = bitsPerSample / 8;
	const totalSamples = Math.floor(dataSize / (bytesPerSample * numChannels));
	const samples = new Float32Array(totalSamples);

	for (let i = 0; i < totalSamples; i++) {
		const pos = dataOffset + i * numChannels * bytesPerSample;
		let val: number;
		if (bitsPerSample === 16) {
			val = buf.readInt16LE(pos) / 32768;
		} else if (bitsPerSample === 32) {
			val = buf.readInt32LE(pos) / 2147483648;
		} else if (bitsPerSample === 8) {
			val = (buf.readUInt8(pos) - 128) / 128;
		} else {
			throw new Error(`Unsupported bits per sample: ${bitsPerSample}`);
		}
		samples[i] = val;
	}

	return { sampleRate, samples };
}

function floatToInt16(sample: number): number {
	const clamped = Math.max(-1, Math.min(1, sample));
	return clamped < 0 ? Math.round(clamped * 0x8000) : Math.round(clamped * 0x7fff);
}

/**
 * Write mono 16-bit PCM WAV file from normalized float samples (-1..1).
 */
export function writeMono16WavFile(
	filePath: string,
	samples: Float32Array,
	sampleRate: number,
): void {
	const numChannels = 1;
	const bitsPerSample = 16;
	const blockAlign = numChannels * (bitsPerSample / 8);
	const dataSize = samples.length * blockAlign;
	const wav = Buffer.alloc(44 + dataSize);

	let offset = 0;
	wav.write("RIFF", offset);
	offset += 4;
	wav.writeUInt32LE(36 + dataSize, offset);
	offset += 4;
	wav.write("WAVE", offset);
	offset += 4;

	wav.write("fmt ", offset);
	offset += 4;
	wav.writeUInt32LE(16, offset);
	offset += 4; // PCM chunk size
	wav.writeUInt16LE(1, offset);
	offset += 2; // PCM format
	wav.writeUInt16LE(numChannels, offset);
	offset += 2;
	wav.writeUInt32LE(sampleRate, offset);
	offset += 4;
	wav.writeUInt32LE(sampleRate * blockAlign, offset);
	offset += 4;
	wav.writeUInt16LE(blockAlign, offset);
	offset += 2;
	wav.writeUInt16LE(bitsPerSample, offset);
	offset += 2;

	wav.write("data", offset);
	offset += 4;
	wav.writeUInt32LE(dataSize, offset);
	offset += 4;

	for (let i = 0; i < samples.length; i++) {
		wav.writeInt16LE(floatToInt16(samples[i]!), offset + i * 2);
	}

	writeFileSync(filePath, wav);
}
