/** FT8-specific constants (lib/ft8/ft8_params.f90). */

export const NSPS = 1920;
export const NFFT1 = 2 * NSPS; // 3840
export const NH1 = NFFT1 / 2; // 1920
export const NSTEP = NSPS / 4; // 480
export const NMAX = 15 * 12_000; // 180000
export const NHSYM = Math.floor(NMAX / NSTEP) - 3; // 372
export const NDOWN = 60;
export const NN = 79;
export const NS = 21;
export const ND = 58;

/** 7-symbol Costas array for sync. */
export const COSTAS = [3, 1, 4, 0, 6, 5, 2] as const;

/** 8-tone Gray mapping. */
export const GRAY_MAP = [0, 1, 3, 2, 5, 6, 4, 7] as const;
