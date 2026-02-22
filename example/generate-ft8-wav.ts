/// <reference types="node" />

import { resolve } from "node:path";

import { encodeFT8 } from "../src/index.js";
import { writeMono16WavFile } from "../src/util/wav.js";

const SAMPLE_RATE = 12_000;
const DEFAULT_OUTPUT = "output.wav";
const DEFAULT_DF_HZ = 1_000;

function printUsage(): void {
	console.error('Usage: npx tsx example/generate-wav.ts "<message>" [--out output.wav] [--df hz]');
}

function parseArgs(argv: string[]): { message: string; outputFile: string; dfHz: number } {
	if (argv.length === 0) {
		printUsage();
		process.exit(1);
	}

	const message = argv[0]!;
	let outputFile = DEFAULT_OUTPUT;
	let dfHz = DEFAULT_DF_HZ;

	for (let i = 1; i < argv.length; i++) {
		const arg = argv[i]!;
		if (arg === "--out") {
			i++;
			const value = argv[i];
			if (!value) {
				throw new Error("Missing value for --out");
			}
			outputFile = value;
			continue;
		}

		if (arg === "--df") {
			i++;
			const value = argv[i];
			if (!value) {
				throw new Error("Missing value for --df");
			}
			const parsed = Number(value);
			if (!Number.isFinite(parsed) || parsed < 0) {
				throw new Error(`Invalid --df value: ${value}`);
			}
			dfHz = parsed;
			continue;
		}

		throw new Error(`Unknown argument: ${arg}`);
	}

	return { message, outputFile, dfHz };
}

function main(): void {
	try {
		const { message, outputFile, dfHz } = parseArgs(process.argv.slice(2));
		const waveform = encodeFT8(message, {
			sampleRate: SAMPLE_RATE,
			samplesPerSymbol: 1_920,
			bt: 2.0,
			baseFrequency: dfHz,
		});

		const outPath = resolve(process.cwd(), outputFile);
		writeMono16WavFile(outPath, waveform, SAMPLE_RATE);

		console.log(
			`Wrote ${outPath} (${waveform.length} samples, ${(waveform.length / SAMPLE_RATE).toFixed(3)} s)`,
		);
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		console.error(msg);
		printUsage();
		process.exit(1);
	}
}

main();
