import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmdirSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { encodeFT4 } from "../src/index.js";
import { writeMono16WavFile } from "../src/util/wav.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(__dirname, "../dist/cli.js");
const BASE_FREQ = 1_000;

function runCli(
	args: string[],
	cwd?: string,
): { stdout: string; stderr: string; status: number | null } {
	const result = spawnSync("node", [CLI_PATH, ...args], {
		encoding: "utf8",
		cwd: cwd ?? join(__dirname, ".."),
	});
	return {
		stdout: result.stdout ?? "",
		stderr: result.stderr ?? "",
		status: result.status,
	};
}

describe("CLI", () => {
	test("--help prints usage and exits 0", () => {
		const { stdout, stderr, status } = runCli(["--help"]);
		expect(status).toBe(0);
		const out = stdout + stderr;
		expect(out).toContain("ft8ts - FT8 encoder/decoder");
		expect(out).toContain("ft8ts decode");
		expect(out).toContain("ft8ts encode");
	});

	test("-h prints usage and exits 0", () => {
		const { status } = runCli(["-h"]);
		expect(status).toBe(0);
	});

	test("unknown subcommand exits 1", () => {
		const { stderr, status } = runCli(["unknown"]);
		expect(status).toBe(1);
		expect(stderr).toContain("unknown subcommand");
	});

	test("decode with missing file exits 1", () => {
		const { stderr, status } = runCli(["decode"]);
		expect(status).toBe(1);
		expect(stderr).toContain("missing input file");
	});

	test("decode with non-existent file exits 1", () => {
		const { stderr, status } = runCli(["decode", "/nonexistent/file.wav"]);
		expect(status).toBe(1);
		expect(stderr).toContain("Error");
	});

	test("encode with missing message exits 1", () => {
		const { stderr, status } = runCli(["encode"]);
		expect(status).toBe(1);
		expect(stderr).toContain("missing message");
	});

	test("encode creates WAV file and decode finds message", () => {
		const msg = "CQ TEST PM95";
		const wavPath = join(tmpdir(), `ft8ts-cli-test-${process.pid}-${Date.now()}.wav`);

		try {
			const encodeResult = runCli(["encode", msg, "--out", wavPath, "--df", String(BASE_FREQ)]);
			expect(encodeResult.status).toBe(0);
			expect(encodeResult.stdout).toContain("Wrote");
			expect(encodeResult.stdout).toContain(wavPath);
			expect(existsSync(wavPath)).toBe(true);

			const decodeResult = runCli(["decode", wavPath, "--low", "500", "--high", "1500"]);
			expect(decodeResult.status).toBe(0);
			expect(decodeResult.stdout).toContain("Decoded");
			expect(decodeResult.stdout).toContain(msg);
		} finally {
			if (existsSync(wavPath)) unlinkSync(wavPath);
		}
	}, 30_000);

	test("encode --out defaults to output.wav in cwd", () => {
		const cwd = join(tmpdir(), `ft8ts-cli-cwd-${process.pid}-${Date.now()}`);
		const outputPath = join(cwd, "output.wav");

		mkdirSync(cwd, { recursive: true });

		try {
			const { status } = runCli(["encode", "CQ TEST", "--df", "1000"], cwd);
			expect(status).toBe(0);
			expect(existsSync(outputPath)).toBe(true);
		} finally {
			if (existsSync(outputPath)) unlinkSync(outputPath);
			try {
				rmdirSync(cwd);
			} catch {
				// ignore
			}
		}
	});

	test("encode with invalid --df exits 1", () => {
		const wavPath = join(tmpdir(), `ft8ts-cli-invalid-${process.pid}.wav`);
		const { stderr, status } = runCli(["encode", "CQ TEST", "--df", "-1", "--out", wavPath]);
		expect(status).toBe(1);
		expect(stderr).toContain("Invalid --df");
	});

	test("decode with invalid --mode exits 1", () => {
		// Use any path; option parsing fails before file is read
		const { stderr, status } = runCli(["decode", "/tmp/dummy.wav", "--mode", "invalid"]);
		expect(status).toBe(1);
		expect(stderr).toContain("Invalid --mode");
	});

	test("decode with --mode ft4 finds message in FT4 WAV", () => {
		const msg = "CQ K1ABC FN42";
		const wavPath = join(tmpdir(), `ft8ts-cli-ft4-${process.pid}-${Date.now()}.wav`);

		try {
			const waveform = encodeFT4(msg, {
				sampleRate: 12_000,
				baseFrequency: BASE_FREQ,
			});
			writeMono16WavFile(wavPath, waveform, 12_000);
			expect(existsSync(wavPath)).toBe(true);

			const decodeResult = runCli([
				"decode",
				wavPath,
				"--mode",
				"ft4",
				"--low",
				"500",
				"--high",
				"1500",
			]);
			expect(decodeResult.status).toBe(0);
			expect(decodeResult.stdout).toContain("Decoded");
			expect(decodeResult.stdout).toContain(msg);
		} finally {
			if (existsSync(wavPath)) unlinkSync(wavPath);
		}
	}, 30_000);

	test("decode with --mode ft8 (explicit) works like default", () => {
		const msg = "CQ TEST PM95";
		const wavPath = join(tmpdir(), `ft8ts-cli-ft8-mode-${process.pid}-${Date.now()}.wav`);

		try {
			const encodeResult = runCli(["encode", msg, "--out", wavPath, "--df", String(BASE_FREQ)]);
			expect(encodeResult.status).toBe(0);

			const decodeResult = runCli([
				"decode",
				wavPath,
				"--mode",
				"ft8",
				"--low",
				"500",
				"--high",
				"1500",
			]);
			expect(decodeResult.status).toBe(0);
			expect(decodeResult.stdout).toContain(msg);
		} finally {
			if (existsSync(wavPath)) unlinkSync(wavPath);
		}
	}, 30_000);

	test("decode 190227_155815.wav", () => {
		const wavPath = join(__dirname, "ft8", "190227_155815.wav");
		expect(
			existsSync(wavPath),
			"Test file 190227_155815.wav not found. Place it in __test__/ft8/",
		).toBe(true);
		const { stdout, status } = runCli(["decode", wavPath]);
		expect(status).toBe(0);
		expect(stdout).toContain("Decoded");
		expect(stdout).toContain("messages");
		expect(stdout).toMatch(/\d+ messages/);
	}, 15_000);
});
