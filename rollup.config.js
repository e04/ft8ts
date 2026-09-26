import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

export default [
	{
		input: "src/cli.ts",
		output: {
			file: "dist/cli.js",
			format: "es",
			sourcemap: true,
			banner: "#!/usr/bin/env node",
		},
		plugins: [
			resolve(),
			typescript({
				tsconfig: "./tsconfig.json",
				compilerOptions: {
					declaration: false,
					declarationMap: false,
				},
			}),
		],
	},
	{
		input: "src/index.ts",
		output: [
			{
				file: "dist/ft8ts.mjs",
				format: "es",
				sourcemap: true,
			},
			{
				file: "dist/ft8ts.cjs",
				format: "cjs",
				sourcemap: true,
			},
		],
		plugins: [
			resolve(),
			typescript({
				tsconfig: "./tsconfig.json",
				compilerOptions: {
					declaration: false,
					declarationMap: false,
				},
			}),
		],
	},
	{
		input: "src/index.ts",
		output: [{ file: "dist/ft8ts.d.ts" }],
		plugins: [dts()],
	},
	// Worker scripts of FT8DecoderPool (browser and Node.js), which it loads
	// from the same directory.
	...[
		["src/ft8/worker.ts", "dist/ft8ts-worker.mjs"],
		["src/ft8/worker-node.ts", "dist/ft8ts-worker-node.mjs"],
	].map(([input, file]) => ({
		input,
		output: { file, format: "es", sourcemap: true },
		external: ["node:worker_threads"],
		plugins: [
			resolve(),
			typescript({
				tsconfig: "./tsconfig.json",
				compilerOptions: {
					declaration: false,
					declarationMap: false,
				},
			}),
		],
	})),
];
