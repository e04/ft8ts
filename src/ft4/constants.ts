/** FT4-specific constants (lib/ft4/ft4_params.f90). */

import { SAMPLE_RATE } from "../util/constants.js";

export const COSTAS_A = [0, 1, 3, 2] as const;
export const COSTAS_B = [1, 0, 2, 3] as const;
export const COSTAS_C = [2, 3, 1, 0] as const;
export const COSTAS_D = [3, 2, 0, 1] as const;
export const GRAYMAP = [0, 1, 3, 2] as const;

// Message scrambling vector (rvec) from WSJT-X.
export const RVEC = [
	0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1,
	0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0,
	1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1,
] as const;

export const NSPS = 576;
export const NFFT1 = 4 * NSPS; // 2304
export const NH1 = NFFT1 / 2; // 1152
export const NSTEP = NSPS;
export const NMAX = 21 * 3456; // 72576
export const NHSYM = Math.floor((NMAX - NFFT1) / NSTEP); // 122
export const NDOWN = 18;
export const ND = 87;
export const NS = 16;
export const NN = NS + ND; // 103

export const NFFT2 = NMAX / NDOWN; // 4032
export const NSS = NSPS / NDOWN; // 32
export const FS2 = SAMPLE_RATE / NDOWN; // 666.67 Hz
export const MAX_FREQ = 4910;
export const SYNC_PASS_MIN = 1.2;
export const TWO_PI = 2 * Math.PI;

export const HARD_SYNC_PATTERNS = [
	{ offset: 0, bits: [0, 0, 0, 1, 1, 0, 1, 1] as const },
	{ offset: 66, bits: [0, 1, 0, 0, 1, 1, 1, 0] as const },
	{ offset: 132, bits: [1, 1, 1, 0, 0, 1, 0, 0] as const },
	{ offset: 198, bits: [1, 0, 1, 1, 0, 0, 0, 1] as const },
] as const;
