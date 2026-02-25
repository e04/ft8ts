/// <reference types="node" />

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type DecodedMessage, type DecodeOptions, decodeFT8 } from "../src/index.js";
import { parseWavBuffer } from "../src/util/wav.js";

function printUsage(): void {
	console.error(
		"Usage: npx tsx example/decode-wav.ts <file.wav> [--low hz] [--high hz] [--depth 1|2|3]",
	);
}

function parseArgs(argv: string[]): {
	wavFile: string;
	options: DecodeOptions;
} {
	if (argv.length === 0) {
		printUsage();
		process.exit(1);
	}

	const wavFile = argv[0]!;
	const options: DecodeOptions = {};

	for (let i = 1; i < argv.length; i++) {
		const arg = argv[i]!;
		if (arg === "--low") {
			options.freqLow = Number(argv[++i]);
		} else if (arg === "--high") {
			options.freqHigh = Number(argv[++i]);
		} else if (arg === "--depth") {
			options.depth = Number(argv[++i]);
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}

	return { wavFile, options };
}

function formatMessage(d: DecodedMessage): string {
	const freq = d.freq.toFixed(0).padStart(5);
	const dt = (d.dt >= 0 ? "+" : "") + d.dt.toFixed(1);
	const snr = (d.snr >= 0 ? "+" : "") + Math.round(d.snr).toString().padStart(3);
	return `${dt.padStart(5)}  ${snr}  ${freq}  ${d.msg}`;
}

function main(): void {
	try {
		const { wavFile, options } = parseArgs(process.argv.slice(2));
		const filePath = resolve(process.cwd(), wavFile);
		console.log(`Reading ${filePath}...`);

		const { sampleRate, samples } = parseWavBuffer(readFileSync(filePath));
		console.log(
			`WAV: ${sampleRate} Hz, ${samples.length} samples, ${(samples.length / sampleRate).toFixed(1)}s`,
		);

		const startTime = performance.now();
		const decoded = decodeFT8(samples, { ...options, sampleRate });
		const elapsed = performance.now() - startTime;

		console.log(`\nDecoded ${decoded.length} messages in ${(elapsed / 1000).toFixed(2)}s:\n`);
		console.log("   dt  snr   freq  message");
		console.log("  ---  ---  -----  -------");
		for (const d of decoded) {
			console.log(formatMessage(d));
		}
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		console.error(`Error: ${msg}`);
		printUsage();
		process.exit(1);
	}
}

main();
