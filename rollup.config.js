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
];
