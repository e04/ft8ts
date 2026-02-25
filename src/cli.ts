import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
	type DecodedMessage,
	type DecodeOptions,
	decodeFT8,
	encodeFT8,
} from "./index.js";
import { parseWavBuffer, writeMono16WavFile } from "./util/wav.js";

const SAMPLE_RATE = 12_000;
const DEFAULT_OUTPUT = "output.wav";
const DEFAULT_DF_HZ = 1_000;

function printUsage(): void {
	console.error(`ft8ts - FT8 encoder/decoder

Usage:
  ft8ts decode <file.wav> [options]
  ft8ts encode "<message>" [options]

Decode options:
  --low <hz>     Lower frequency bound (default: 200)
  --high <hz>    Upper frequency bound (default: 3000)
  --depth <1|2|3>  Decoding depth (default: 2)

Encode options:
  --out <file>   Output WAV file (default: output.wav)
  --df <hz>      Base frequency in Hz (default: 1000)
`);
}

function formatMessage(d: DecodedMessage): string {
	const freq = d.freq.toFixed(0).padStart(5);
	const dt = (d.dt >= 0 ? "+" : "") + d.dt.toFixed(1);
	const snr = (d.snr >= 0 ? "+" : "") + Math.round(d.snr).toString().padStart(3);
	return `${dt.padStart(5)}  ${snr}  ${freq}  ${d.msg}`;
}

function runDecode(argv: string[]): void {
	if (argv.length === 0) {
		console.error("Error: missing input file");
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
}

function runEncode(argv: string[]): void {
	if (argv.length === 0) {
		console.error("Error: missing message");
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
			if (!value) throw new Error("Missing value for --out");
			outputFile = value;
		} else if (arg === "--df") {
			i++;
			const value = argv[i];
			if (!value) throw new Error("Missing value for --df");
			const parsed = Number(value);
			if (!Number.isFinite(parsed) || parsed < 0) {
				throw new Error(`Invalid --df value: ${value}`);
			}
			dfHz = parsed;
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}

	const waveform = encodeFT8(message, {
		sampleRate: SAMPLE_RATE,
		samplesPerSymbol: 1_920,
		baseFrequency: dfHz,
	});

	const outPath = resolve(process.cwd(), outputFile);
	writeMono16WavFile(outPath, waveform, SAMPLE_RATE);

	console.log(
		`Wrote ${outPath} (${waveform.length} samples, ${(waveform.length / SAMPLE_RATE).toFixed(3)} s)`,
	);
}

function main(): void {
	const args = process.argv.slice(2);
	const subcommand = args[0];
	const subArgs = args.slice(1);

	if (!subcommand || subcommand === "--help" || subcommand === "-h") {
		printUsage();
		process.exit(0);
	}

	try {
		if (subcommand === "decode") {
			runDecode(subArgs);
		} else if (subcommand === "encode") {
			runEncode(subArgs);
		} else {
			console.error(`Error: unknown subcommand '${subcommand}'`);
			printUsage();
			process.exit(1);
		}
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		console.error(`Error: ${msg}`);
		printUsage();
		process.exit(1);
	}
}

main();
