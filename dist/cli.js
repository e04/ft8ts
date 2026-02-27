#!/usr/bin/env node
import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Shared constants used by FT8, FT4, pack77, etc. */
const SAMPLE_RATE$1 = 12_000;
/** LDPC(174,91) code (shared by FT8 and FT4). */
const N_LDPC = 174;
const gHex = [
    "8329ce11bf31eaf509f27fc",
    "761c264e25c259335493132",
    "dc265902fb277c6410a1bdc",
    "1b3f417858cd2dd33ec7f62",
    "09fda4fee04195fd034783a",
    "077cccc11b8873ed5c3d48a",
    "29b62afe3ca036f4fe1a9da",
    "6054faf5f35d96d3b0c8c3e",
    "e20798e4310eed27884ae90",
    "775c9c08e80e26ddae56318",
    "b0b811028c2bf997213487c",
    "18a0c9231fc60adf5c5ea32",
    "76471e8302a0721e01b12b8",
    "ffbccb80ca8341fafb47b2e",
    "66a72a158f9325a2bf67170",
    "c4243689fe85b1c51363a18",
    "0dff739414d1a1b34b1c270",
    "15b48830636c8b99894972e",
    "29a89c0d3de81d665489b0e",
    "4f126f37fa51cbe61bd6b94",
    "99c47239d0d97d3c84e0940",
    "1919b75119765621bb4f1e8",
    "09db12d731faee0b86df6b8",
    "488fc33df43fbdeea4eafb4",
    "827423ee40b675f756eb5fe",
    "abe197c484cb74757144a9a",
    "2b500e4bc0ec5a6d2bdbdd0",
    "c474aa53d70218761669360",
    "8eba1a13db3390bd6718cec",
    "753844673a27782cc42012e",
    "06ff83a145c37035a5c1268",
    "3b37417858cc2dd33ec3f62",
    "9a4a5a28ee17ca9c324842c",
    "bc29f465309c977e89610a4",
    "2663ae6ddf8b5ce2bb29488",
    "46f231efe457034c1814418",
    "3fb2ce85abe9b0c72e06fbe",
    "de87481f282c153971a0a2e",
    "fcd7ccf23c69fa99bba1412",
    "f0261447e9490ca8e474cec",
    "4410115818196f95cdd7012",
    "088fc31df4bfbde2a4eafb4",
    "b8fef1b6307729fb0a078c0",
    "5afea7acccb77bbc9d99a90",
    "49a7016ac653f65ecdc9076",
    "1944d085be4e7da8d6cc7d0",
    "251f62adc4032f0ee714002",
    "56471f8702a0721e00b12b8",
    "2b8e4923f2dd51e2d537fa0",
    "6b550a40a66f4755de95c26",
    "a18ad28d4e27fe92a4f6c84",
    "10c2e586388cb82a3d80758",
    "ef34a41817ee02133db2eb0",
    "7e9c0c54325a9c15836e000",
    "3693e572d1fde4cdf079e86",
    "bfb2cec5abe1b0c72e07fbe",
    "7ee18230c583cccc57d4b08",
    "a066cb2fedafc9f52664126",
    "bb23725abc47cc5f4cc4cd2",
    "ded9dba3bee40c59b5609b4",
    "d9a7016ac653e6decdc9036",
    "9ad46aed5f707f280ab5fc4",
    "e5921c77822587316d7d3c2",
    "4f14da8242a8b86dca73352",
    "8b8b507ad467d4441df770e",
    "22831c9cf1169467ad04b68",
    "213b838fe2ae54c38ee7180",
    "5d926b6dd71f085181a4e12",
    "66ab79d4b29ee6e69509e56",
    "958148682d748a38dd68baa",
    "b8ce020cf069c32a723ab14",
    "f4331d6d461607e95752746",
    "6da23ba424b9596133cf9c8",
    "a636bcbc7b30c5fbeae67fe",
    "5cb0d86a07df654a9089a20",
    "f11f106848780fc9ecdd80a",
    "1fbb5364fb8d2c9d730d5ba",
    "fcb86bc70a50c9d02a5d034",
    "a534433029eac15f322e34c",
    "c989d9c7c3d3b8c55d75130",
    "7bb38b2f0186d46643ae962",
    "2644ebadeb44b9467d1f42c",
    "608cc857594bfbb55d69600",
];
const FTALPH = " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+-./?";
const A1 = " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const A2 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const A3 = "0123456789";
const A4 = " ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const C38 = " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ/";
const NTOKENS = 2063592;
const MAX22 = 4194304; // 2^22
const MAX28 = 268435456; // 2^28
const MAXGRID4 = 32400;

/**
 * CRC-14 computation and checking, shared between encoder and decoder.
 * Polynomial: 0x2757 (x^14 + x^13 + x^10 + x^9 + x^8 + x^6 + x^4 + x^2 + x + 1)
 */
function computeCRC14(msg77) {
    const poly = 0x2757;
    let crc = 0;
    const bitArray = [...msg77, 0, 0, 0, ...new Array(16).fill(0)];
    for (let bit = 0; bit < 96; bit++) {
        const nextBit = bitArray[bit];
        if ((crc & 0x2000) !== 0) {
            crc = ((crc << 1) | nextBit) ^ poly;
        }
        else {
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
function checkCRC14(bits91) {
    const msg77 = bits91.slice(0, 77);
    const receivedCRC = bitsToInt(bits91, 77, 14);
    const computedCRC = computeCRC14(msg77);
    return receivedCRC === computedCRC;
}
function bitsToInt(bits, offset, count) {
    let val = 0;
    for (let i = 0; i < count; i++) {
        val = (val << 1) | (bits[offset + i] ?? 0);
    }
    return val;
}

/**
 * LDPC (174,91) parity check matrix data from ldpc_174_91_c_parity.f90
 *
 * Mn[j] = list of 3 check-node indices (1-based) for bit j  (j=0..173)
 * Nm[i] = list of variable-node indices (1-based) for check i (i=0..82), padded with 0
 * nrw[i] = row weight for check i
 * ncw = 3  (column weight – every bit participates in exactly 3 checks)
 */
// Mn: 174 rows, each with 3 check-node indices (1-based, from Fortran)
const MnFlat = [
    16, 45, 73, 25, 51, 62, 33, 58, 78, 1, 44, 45, 2, 7, 61, 3, 6, 54, 4, 35, 48, 5, 13, 21, 8, 56,
    79, 9, 64, 69, 10, 19, 66, 11, 36, 60, 12, 37, 58, 14, 32, 43, 15, 63, 80, 17, 28, 77, 18, 74, 83,
    22, 53, 81, 23, 30, 34, 24, 31, 40, 26, 41, 76, 27, 57, 70, 29, 49, 65, 3, 38, 78, 5, 39, 82, 46,
    50, 73, 51, 52, 74, 55, 71, 72, 44, 67, 72, 43, 68, 78, 1, 32, 59, 2, 6, 71, 4, 16, 54, 7, 65, 67,
    8, 30, 42, 9, 22, 31, 10, 18, 76, 11, 23, 82, 12, 28, 61, 13, 52, 79, 14, 50, 51, 15, 81, 83, 17,
    29, 60, 19, 33, 64, 20, 26, 73, 21, 34, 40, 24, 27, 77, 25, 55, 58, 35, 53, 66, 36, 48, 68, 37,
    46, 75, 38, 45, 47, 39, 57, 69, 41, 56, 62, 20, 49, 53, 46, 52, 63, 45, 70, 75, 27, 35, 80, 1, 15,
    30, 2, 68, 80, 3, 36, 51, 4, 28, 51, 5, 31, 56, 6, 20, 37, 7, 40, 82, 8, 60, 69, 9, 10, 49, 11,
    44, 57, 12, 39, 59, 13, 24, 55, 14, 21, 65, 16, 71, 78, 17, 30, 76, 18, 25, 80, 19, 61, 83, 22,
    38, 77, 23, 41, 50, 7, 26, 58, 29, 32, 81, 33, 40, 73, 18, 34, 48, 13, 42, 64, 5, 26, 43, 47, 69,
    72, 54, 55, 70, 45, 62, 68, 10, 63, 67, 14, 66, 72, 22, 60, 74, 35, 39, 79, 1, 46, 64, 1, 24, 66,
    2, 5, 70, 3, 31, 65, 4, 49, 58, 1, 4, 5, 6, 60, 67, 7, 32, 75, 8, 48, 82, 9, 35, 41, 10, 39, 62,
    11, 14, 61, 12, 71, 74, 13, 23, 78, 11, 35, 55, 15, 16, 79, 7, 9, 16, 17, 54, 63, 18, 50, 57, 19,
    30, 47, 20, 64, 80, 21, 28, 69, 22, 25, 43, 13, 22, 37, 2, 47, 51, 23, 54, 74, 26, 34, 72, 27, 36,
    37, 21, 36, 63, 29, 40, 44, 19, 26, 57, 3, 46, 82, 14, 15, 58, 33, 52, 53, 30, 43, 52, 6, 9, 52,
    27, 33, 65, 25, 69, 73, 38, 55, 83, 20, 39, 77, 18, 29, 56, 32, 48, 71, 42, 51, 59, 28, 44, 79,
    34, 60, 62, 31, 45, 61, 46, 68, 77, 6, 24, 76, 8, 10, 78, 40, 41, 70, 17, 50, 53, 42, 66, 68, 4,
    22, 72, 36, 64, 81, 13, 29, 47, 2, 8, 81, 56, 67, 73, 5, 38, 50, 12, 38, 64, 59, 72, 80, 3, 26,
    79, 45, 76, 81, 1, 65, 74, 7, 18, 77, 11, 56, 59, 14, 39, 54, 16, 37, 66, 10, 28, 55, 15, 60, 70,
    17, 25, 82, 20, 30, 31, 12, 67, 68, 23, 75, 80, 27, 32, 62, 24, 69, 75, 19, 21, 71, 34, 53, 61,
    35, 46, 47, 33, 59, 76, 40, 43, 83, 41, 42, 63, 49, 75, 83, 20, 44, 48, 42, 49, 57,
];
// Nm: 83 rows, each with up to 7 variable-node indices (1-based, 0-padded)
const NmFlat = [
    4, 31, 59, 91, 92, 96, 153, 5, 32, 60, 93, 115, 146, 0, 6, 24, 61, 94, 122, 151, 0, 7, 33, 62, 95,
    96, 143, 0, 8, 25, 63, 83, 93, 96, 148, 6, 32, 64, 97, 126, 138, 0, 5, 34, 65, 78, 98, 107, 154,
    9, 35, 66, 99, 139, 146, 0, 10, 36, 67, 100, 107, 126, 0, 11, 37, 67, 87, 101, 139, 158, 12, 38,
    68, 102, 105, 155, 0, 13, 39, 69, 103, 149, 162, 0, 8, 40, 70, 82, 104, 114, 145, 14, 41, 71, 88,
    102, 123, 156, 15, 42, 59, 106, 123, 159, 0, 1, 33, 72, 106, 107, 157, 0, 16, 43, 73, 108, 141,
    160, 0, 17, 37, 74, 81, 109, 131, 154, 11, 44, 75, 110, 121, 166, 0, 45, 55, 64, 111, 130, 161,
    173, 8, 46, 71, 112, 119, 166, 0, 18, 36, 76, 89, 113, 114, 143, 19, 38, 77, 104, 116, 163, 0, 20,
    47, 70, 92, 138, 165, 0, 2, 48, 74, 113, 128, 160, 0, 21, 45, 78, 83, 117, 121, 151, 22, 47, 58,
    118, 127, 164, 0, 16, 39, 62, 112, 134, 158, 0, 23, 43, 79, 120, 131, 145, 0, 19, 35, 59, 73, 110,
    125, 161, 20, 36, 63, 94, 136, 161, 0, 14, 31, 79, 98, 132, 164, 0, 3, 44, 80, 124, 127, 169, 0,
    19, 46, 81, 117, 135, 167, 0, 7, 49, 58, 90, 100, 105, 168, 12, 50, 61, 118, 119, 144, 0, 13, 51,
    64, 114, 118, 157, 0, 24, 52, 76, 129, 148, 149, 0, 25, 53, 69, 90, 101, 130, 156, 20, 46, 65, 80,
    120, 140, 170, 21, 54, 77, 100, 140, 171, 0, 35, 82, 133, 142, 171, 174, 0, 14, 30, 83, 113, 125,
    170, 0, 4, 29, 68, 120, 134, 173, 0, 1, 4, 52, 57, 86, 136, 152, 26, 51, 56, 91, 122, 137, 168,
    52, 84, 110, 115, 145, 168, 0, 7, 50, 81, 99, 132, 173, 0, 23, 55, 67, 95, 172, 174, 0, 26, 41,
    77, 109, 141, 148, 0, 2, 27, 41, 61, 62, 115, 133, 27, 40, 56, 124, 125, 126, 0, 18, 49, 55, 124,
    141, 167, 0, 6, 33, 85, 108, 116, 156, 0, 28, 48, 70, 85, 105, 129, 158, 9, 54, 63, 131, 147, 155,
    0, 22, 53, 68, 109, 121, 174, 0, 3, 13, 48, 78, 95, 123, 0, 31, 69, 133, 150, 155, 169, 0, 12, 43,
    66, 89, 97, 135, 159, 5, 39, 75, 102, 136, 167, 0, 2, 54, 86, 101, 135, 164, 0, 15, 56, 87, 108,
    119, 171, 0, 10, 44, 82, 91, 111, 144, 149, 23, 34, 71, 94, 127, 153, 0, 11, 49, 88, 92, 142, 157,
    0, 29, 34, 87, 97, 147, 162, 0, 30, 50, 60, 86, 137, 142, 162, 10, 53, 66, 84, 112, 128, 165, 22,
    57, 85, 93, 140, 159, 0, 28, 32, 72, 103, 132, 166, 0, 28, 29, 84, 88, 117, 143, 150, 1, 26, 45,
    80, 128, 147, 0, 17, 27, 89, 103, 116, 153, 0, 51, 57, 98, 163, 165, 172, 0, 21, 37, 73, 138, 152,
    169, 0, 16, 47, 76, 130, 137, 154, 0, 3, 24, 30, 72, 104, 139, 0, 9, 40, 90, 106, 134, 151, 0, 15,
    58, 60, 74, 111, 150, 163, 18, 42, 79, 144, 146, 152, 0, 25, 38, 65, 99, 122, 160, 0, 17, 42, 75,
    129, 170, 172, 0,
];
const nrwData = [
    7, 6, 6, 6, 7, 6, 7, 6, 6, 7, 6, 6, 7, 7, 6, 6, 6, 7, 6, 7, 6, 7, 6, 6, 6, 7, 6, 6, 6, 7, 6, 6, 6,
    6, 7, 6, 6, 6, 7, 7, 6, 6, 6, 6, 7, 7, 6, 6, 6, 6, 7, 6, 6, 6, 7, 6, 6, 6, 6, 7, 6, 6, 6, 7, 6, 6,
    6, 7, 7, 6, 6, 7, 6, 6, 6, 6, 6, 6, 6, 7, 6, 6, 6,
];
const ncw = 3;
/** Mn[j] = check indices (0-based) for bit j (0..173). Each entry has exactly 3 elements. */
const Mn = [];
for (let j = 0; j < 174; j++) {
    Mn.push([MnFlat[j * 3] - 1, MnFlat[j * 3 + 1] - 1, MnFlat[j * 3 + 2] - 1]);
}
/** Nm[i] = bit indices (0-based) for check i (0..82). Variable length (nrw[i] elements). */
const Nm = [];
/** nrw[i] = row weight for check i */
const nrw = nrwData.slice();
for (let i = 0; i < 83; i++) {
    const row = [];
    for (let k = 0; k < 7; k++) {
        const v = NmFlat[i * 7 + k];
        if (v !== 0)
            row.push(v - 1);
    }
    Nm.push(row);
}

/**
 * LDPC (174,91) Belief Propagation decoder for FT8.
 * Port of bpdecode174_91.f90 and decode174_91.f90.
 */
const KK = 91;
const M_LDPC = N_LDPC - KK; // 83
function platanh(x) {
    if (x > 0.9999999)
        return 18.71;
    if (x < -0.9999999)
        return -18.71;
    return 0.5 * Math.log((1 + x) / (1 - x));
}
/**
 * BP decoder for (174,91) LDPC code.
 * llr: log-likelihood ratios (174 values, positive = bit more likely 0)
 * apmask: AP mask (174 values, 1 = a priori bit, don't update from check messages)
 * maxIterations: max BP iterations
 * Returns null if decoding fails, otherwise { message91, cw, nharderrors }
 */
function bpDecode174_91(llr, apmask, maxIterations) {
    const N = N_LDPC;
    const M = M_LDPC;
    const tov = new Float64Array(ncw * N);
    const toc = new Float64Array(7 * M);
    const tanhtoc = new Float64Array(7 * M);
    const zn = new Float64Array(N);
    const cw = new Int8Array(N);
    // Initialize messages to checks
    for (let j = 0; j < M; j++) {
        const w = nrw[j];
        for (let i = 0; i < w; i++) {
            toc[i * M + j] = llr[Nm[j][i]];
        }
    }
    let nclast = 0;
    let ncnt = 0;
    for (let iter = 0; iter <= maxIterations; iter++) {
        // Update bit LLRs
        for (let i = 0; i < N; i++) {
            if (apmask[i] !== 1) {
                let sum = 0;
                for (let k = 0; k < ncw; k++)
                    sum += tov[k * N + i];
                zn[i] = llr[i] + sum;
            }
            else {
                zn[i] = llr[i];
            }
        }
        // Hard decision
        for (let i = 0; i < N; i++)
            cw[i] = zn[i] > 0 ? 1 : 0;
        // Check parity
        let ncheck = 0;
        for (let i = 0; i < M; i++) {
            const w = nrw[i];
            let s = 0;
            for (let k = 0; k < w; k++)
                s += cw[Nm[i][k]];
            if (s % 2 !== 0)
                ncheck++;
        }
        if (ncheck === 0) {
            const bits91 = Array.from(cw.slice(0, KK));
            if (checkCRC14(bits91)) {
                let nharderrors = 0;
                for (let i = 0; i < N; i++) {
                    if ((2 * cw[i] - 1) * llr[i] < 0)
                        nharderrors++;
                }
                return {
                    message91: bits91,
                    cw: Array.from(cw),
                    nharderrors,
                    dmin: 0,
                    ntype: 1,
                };
            }
        }
        // Early stopping
        if (iter > 0) {
            const nd = ncheck - nclast;
            if (nd < 0) {
                ncnt = 0;
            }
            else {
                ncnt++;
            }
            if (ncnt >= 5 && iter >= 10 && ncheck > 15)
                return null;
        }
        nclast = ncheck;
        // Send messages from bits to check nodes
        for (let j = 0; j < M; j++) {
            const w = nrw[j];
            for (let i = 0; i < w; i++) {
                const ibj = Nm[j][i];
                let val = zn[ibj];
                for (let kk = 0; kk < ncw; kk++) {
                    if (Mn[ibj][kk] === j) {
                        val -= tov[kk * N + ibj];
                    }
                }
                toc[i * M + j] = val;
            }
        }
        // Send messages from check nodes to variable nodes
        for (let i = 0; i < M; i++) {
            for (let k = 0; k < 7; k++) {
                tanhtoc[k * M + i] = Math.tanh(-toc[k * M + i] / 2);
            }
        }
        for (let j = 0; j < N; j++) {
            for (let i = 0; i < ncw; i++) {
                const ichk = Mn[j][i];
                const w = nrw[ichk];
                let Tmn = 1.0;
                for (let k = 0; k < w; k++) {
                    if (Nm[ichk][k] !== j) {
                        Tmn *= tanhtoc[k * M + ichk];
                    }
                }
                tov[i * N + j] = 2 * platanh(-Tmn);
            }
        }
    }
    return null;
}
/**
 * Hybrid BP + OSD-like decoder for (174,91) code.
 * Tries BP first, then falls back to OSD approach for deeper decoding.
 */
function decode174_91(llr, apmask, maxosd) {
    const maxIterations = 30;
    // Try BP decoding
    const bpResult = bpDecode174_91(llr, apmask, maxIterations);
    if (bpResult)
        return bpResult;
    // OSD-0 fallback: try hard-decision with bit flipping for most unreliable bits
    if (maxosd >= 0) {
        return osdDecode174_91(llr, apmask, maxosd >= 1 ? 2 : 1);
    }
    return null;
}
/**
 * Simplified OSD decoder for (174,91) code.
 * Uses ordered statistics approach: sort bits by reliability,
 * do Gaussian elimination, try flipping least reliable info bits.
 */
function osdDecode174_91(llr, apmask, norder) {
    const N = N_LDPC;
    const K = KK;
    const gen = getGenerator();
    const absllr = new Float64Array(N);
    for (let i = 0; i < N; i++)
        absllr[i] = Math.abs(llr[i]);
    // Sort by reliability (descending)
    const indices = new Array(N);
    for (let i = 0; i < N; i++)
        indices[i] = i;
    indices.sort((a, b) => absllr[b] - absllr[a]);
    // Reorder generator matrix columns
    const genmrb = new Uint8Array(K * N);
    for (let k = 0; k < K; k++) {
        const row = k * N;
        for (let i = 0; i < N; i++) {
            genmrb[row + i] = gen[row + indices[i]];
        }
    }
    // Gaussian elimination to get systematic form on the K most-reliable bits
    const maxPivotCol = Math.min(K + 20, N);
    for (let id = 0; id < K; id++) {
        let found = false;
        const idRow = id * N;
        for (let icol = id; icol < maxPivotCol; icol++) {
            if (genmrb[idRow + icol] === 1) {
                if (icol !== id) {
                    // Swap columns
                    for (let k = 0; k < K; k++) {
                        const row = k * N;
                        const tmp = genmrb[row + id];
                        genmrb[row + id] = genmrb[row + icol];
                        genmrb[row + icol] = tmp;
                    }
                    const tmp = indices[id];
                    indices[id] = indices[icol];
                    indices[icol] = tmp;
                }
                for (let ii = 0; ii < K; ii++) {
                    if (ii === id)
                        continue;
                    const iiRow = ii * N;
                    if (genmrb[iiRow + id] === 1) {
                        for (let c = 0; c < N; c++) {
                            genmrb[iiRow + c] ^= genmrb[idRow + c];
                        }
                    }
                }
                found = true;
                break;
            }
        }
        if (!found)
            return null;
    }
    // Hard decisions on reordered received word
    const hdec = new Int8Array(N);
    for (let i = 0; i < N; i++) {
        const idx = indices[i];
        hdec[i] = llr[idx] >= 0 ? 1 : 0;
    }
    const absrx = new Float64Array(N);
    for (let i = 0; i < N; i++) {
        absrx[i] = absllr[indices[i]];
    }
    // Encode hard decision on MRB (c0): xor selected rows of genmrb.
    const c0 = new Int8Array(N);
    for (let i = 0; i < K; i++) {
        if (hdec[i] !== 1)
            continue;
        const row = i * N;
        for (let j = 0; j < N; j++) {
            c0[j] ^= genmrb[row + j];
        }
    }
    let dmin = 0;
    for (let i = 0; i < N; i++) {
        const x = c0[i] ^ hdec[i];
        dmin += x * absrx[i];
    }
    let bestFlip1 = -1;
    let bestFlip2 = -1;
    // Order-1: flip single bits in the info portion
    for (let i1 = K - 1; i1 >= 0; i1--) {
        if (apmask[indices[i1]] === 1)
            continue;
        const row1 = i1 * N;
        let dd = 0;
        for (let j = 0; j < N; j++) {
            const x = c0[j] ^ genmrb[row1 + j] ^ hdec[j];
            dd += x * absrx[j];
        }
        if (dd < dmin) {
            dmin = dd;
            bestFlip1 = i1;
            bestFlip2 = -1;
        }
    }
    // Order-2: flip pairs of least-reliable info bits (limited search)
    if (norder >= 2) {
        const ntry = Math.min(64, K);
        const iMin = Math.max(0, K - ntry);
        for (let i1 = K - 1; i1 >= iMin; i1--) {
            if (apmask[indices[i1]] === 1)
                continue;
            const row1 = i1 * N;
            for (let i2 = i1 - 1; i2 >= iMin; i2--) {
                if (apmask[indices[i2]] === 1)
                    continue;
                const row2 = i2 * N;
                let dd = 0;
                for (let j = 0; j < N; j++) {
                    const x = c0[j] ^ genmrb[row1 + j] ^ genmrb[row2 + j] ^ hdec[j];
                    dd += x * absrx[j];
                }
                if (dd < dmin) {
                    dmin = dd;
                    bestFlip1 = i1;
                    bestFlip2 = i2;
                }
            }
        }
    }
    const bestCw = new Int8Array(c0);
    if (bestFlip1 >= 0) {
        const row1 = bestFlip1 * N;
        for (let j = 0; j < N; j++)
            bestCw[j] ^= genmrb[row1 + j];
        if (bestFlip2 >= 0) {
            const row2 = bestFlip2 * N;
            for (let j = 0; j < N; j++)
                bestCw[j] ^= genmrb[row2 + j];
        }
    }
    // Reorder codeword back to original order
    const finalCw = new Int8Array(N);
    for (let i = 0; i < N; i++) {
        finalCw[indices[i]] = bestCw[i];
    }
    const bits91 = Array.from(finalCw.slice(0, KK));
    if (!checkCRC14(bits91))
        return null;
    // Compute dmin in original order
    let dminOrig = 0;
    let nhe = 0;
    for (let i = 0; i < N; i++) {
        const hard = llr[i] >= 0 ? 1 : 0;
        const x = finalCw[i] ^ hard;
        nhe += x;
        dminOrig += x * absllr[i];
    }
    return {
        message91: bits91,
        cw: Array.from(finalCw),
        nharderrors: nhe,
        dmin: dminOrig,
        ntype: 2,
    };
}
let _generator = null;
function getGenerator() {
    if (_generator)
        return _generator;
    const K = KK;
    const N = N_LDPC;
    const M = M_LDPC;
    // Build full generator matrix (K×N) where first K columns are identity
    const gen = new Uint8Array(K * N);
    for (let i = 0; i < K; i++)
        gen[i * N + i] = 1;
    // gHex encodes the M×K generator parity matrix
    // gen_parity[m][k] = 1 means info bit k contributes to parity bit m
    for (let m = 0; m < M; m++) {
        const hexStr = gHex[m];
        for (let j = 0; j < 23; j++) {
            const val = parseInt(hexStr[j], 16);
            const limit = j === 22 ? 3 : 4;
            for (let jj = 1; jj <= limit; jj++) {
                const col = j * 4 + jj - 1;
                if (col < K && (val & (1 << (4 - jj))) !== 0) {
                    // For info bit `col`, parity bit `m` is set
                    gen[col * N + K + m] = 1;
                }
            }
        }
    }
    _generator = gen;
    return gen;
}

/**
 * Radix-2 Cooley-Tukey FFT for FT8 decoding.
 * Supports real-to-complex, complex-to-complex, and inverse transforms.
 */
const RADIX2_PLAN_CACHE = new Map();
const BLUESTEIN_PLAN_CACHE = new Map();
function fftComplex(re, im, inverse) {
    const n = re.length;
    if (n <= 1)
        return;
    if ((n & (n - 1)) !== 0) {
        bluestein(re, im, inverse);
        return;
    }
    const { bitReversed } = getRadix2Plan(n);
    // Bit-reversal permutation
    for (let i = 0; i < n; i++) {
        const j = bitReversed[i];
        if (j > i) {
            let tmp = re[i];
            re[i] = re[j];
            re[j] = tmp;
            tmp = im[i];
            im[i] = im[j];
            im[j] = tmp;
        }
    }
    const sign = inverse ? 1 : -1;
    for (let size = 2; size <= n; size <<= 1) {
        const halfsize = size >> 1;
        const step = (sign * Math.PI) / halfsize;
        const wRe = Math.cos(step);
        const wIm = Math.sin(step);
        for (let i = 0; i < n; i += size) {
            let curRe = 1;
            let curIm = 0;
            for (let k = 0; k < halfsize; k++) {
                const evenIdx = i + k;
                const oddIdx = i + k + halfsize;
                const tRe = curRe * re[oddIdx] - curIm * im[oddIdx];
                const tIm = curRe * im[oddIdx] + curIm * re[oddIdx];
                re[oddIdx] = re[evenIdx] - tRe;
                im[oddIdx] = im[evenIdx] - tIm;
                re[evenIdx] = re[evenIdx] + tRe;
                im[evenIdx] = im[evenIdx] + tIm;
                const newCurRe = curRe * wRe - curIm * wIm;
                curIm = curRe * wIm + curIm * wRe;
                curRe = newCurRe;
            }
        }
    }
    if (inverse) {
        const scale = 1 / n;
        for (let i = 0; i < n; i++) {
            re[i] = re[i] * scale;
            im[i] = im[i] * scale;
        }
    }
}
function bluestein(re, im, inverse) {
    const n = re.length;
    const { m, chirpRe, chirpIm, bFftRe, bFftIm, aRe, aIm } = getBluesteinPlan(n, inverse);
    aRe.fill(0);
    aIm.fill(0);
    for (let i = 0; i < n; i++) {
        const cosA = chirpRe[i];
        const sinA = chirpIm[i];
        const inRe = re[i];
        const inIm = im[i];
        aRe[i] = inRe * cosA - inIm * sinA;
        aIm[i] = inRe * sinA + inIm * cosA;
    }
    fftComplex(aRe, aIm, false);
    for (let i = 0; i < m; i++) {
        const ar = aRe[i];
        const ai = aIm[i];
        const br = bFftRe[i];
        const bi = bFftIm[i];
        aRe[i] = ar * br - ai * bi;
        aIm[i] = ar * bi + ai * br;
    }
    fftComplex(aRe, aIm, true);
    const scale = inverse ? 1 / n : 1;
    for (let i = 0; i < n; i++) {
        const cosA = chirpRe[i];
        const sinA = chirpIm[i];
        const r = aRe[i] * cosA - aIm[i] * sinA;
        const iIm = aRe[i] * sinA + aIm[i] * cosA;
        re[i] = r * scale;
        im[i] = iIm * scale;
    }
}
function getRadix2Plan(n) {
    let plan = RADIX2_PLAN_CACHE.get(n);
    if (plan)
        return plan;
    const bits = 31 - Math.clz32(n);
    const bitReversed = new Uint32Array(n);
    for (let i = 1; i < n; i++) {
        bitReversed[i] = (bitReversed[i >> 1] >> 1) | ((i & 1) << (bits - 1));
    }
    plan = { bitReversed };
    RADIX2_PLAN_CACHE.set(n, plan);
    return plan;
}
function getBluesteinPlan(n, inverse) {
    const key = `${n}:${inverse ? 1 : 0}`;
    const cached = BLUESTEIN_PLAN_CACHE.get(key);
    if (cached)
        return cached;
    const m = nextPow2(n * 2 - 1);
    const s = inverse ? 1 : -1;
    const chirpRe = new Float64Array(n);
    const chirpIm = new Float64Array(n);
    for (let i = 0; i < n; i++) {
        const angle = (s * Math.PI * ((i * i) % (2 * n))) / n;
        chirpRe[i] = Math.cos(angle);
        chirpIm[i] = Math.sin(angle);
    }
    const bFftRe = new Float64Array(m);
    const bFftIm = new Float64Array(m);
    for (let i = 0; i < n; i++) {
        const cosA = chirpRe[i];
        const sinA = chirpIm[i];
        bFftRe[i] = cosA;
        bFftIm[i] = -sinA;
    }
    for (let i = 1; i < n; i++) {
        bFftRe[m - i] = bFftRe[i];
        bFftIm[m - i] = bFftIm[i];
    }
    fftComplex(bFftRe, bFftIm, false);
    const plan = {
        m,
        chirpRe,
        chirpIm,
        bFftRe,
        bFftIm,
        aRe: new Float64Array(m),
        aIm: new Float64Array(m),
    };
    BLUESTEIN_PLAN_CACHE.set(key, plan);
    return plan;
}
/** Next power of 2 >= n */
function nextPow2(n) {
    let v = 1;
    while (v < n)
        v <<= 1;
    return v;
}

/**
 * FT8 message unpacking – TypeScript port of unpack77 from packjt77.f90
 *
 * Supported message types:
 *   Type 0.0  Free text
 *   Type 1    Standard (two callsigns + grid/report/RR73/73)
 *   Type 2    /P form for EU VHF contest
 *   Type 4    One nonstandard call and one hashed call
 */
function bitsToUint(bits, start, len) {
    let val = 0;
    for (let i = 0; i < len; i++) {
        val = val * 2 + (bits[start + i] ?? 0);
    }
    return val;
}
function unpack28(n28, book) {
    if (n28 < 0 || n28 >= 268435456)
        return { call: "", success: false };
    if (n28 === 0)
        return { call: "DE", success: true };
    if (n28 === 1)
        return { call: "QRZ", success: true };
    if (n28 === 2)
        return { call: "CQ", success: true };
    if (n28 >= 3 && n28 < 3 + 1000) {
        const nqsy = n28 - 3;
        return { call: `CQ ${nqsy.toString().padStart(3, "0")}`, success: true };
    }
    if (n28 >= 1003 && n28 < NTOKENS) {
        let m = n28 - 1003;
        let chars = "";
        for (let i = 3; i >= 0; i--) {
            const j = m % 27;
            m = Math.floor(m / 27);
            chars = (j === 0 ? " " : String.fromCharCode(64 + j)) + chars;
        }
        const directed = chars.trim();
        if (directed.length > 0)
            return { call: `CQ ${directed}`, success: true };
        return { call: "CQ", success: true };
    }
    if (n28 >= NTOKENS && n28 < NTOKENS + MAX22) {
        const n22 = n28 - NTOKENS;
        const resolved = book?.lookup22(n22);
        if (resolved)
            return { call: `<${resolved}>`, success: true };
        return { call: "<...>", success: true };
    }
    // Standard callsign
    let n = n28 - NTOKENS - MAX22;
    if (n < 0)
        return { call: "", success: false };
    const i6 = n % 27;
    n = Math.floor(n / 27);
    const i5 = n % 27;
    n = Math.floor(n / 27);
    const i4 = n % 27;
    n = Math.floor(n / 27);
    const i3 = n % 10;
    n = Math.floor(n / 10);
    const i2 = n % 36;
    n = Math.floor(n / 36);
    const i1 = n;
    if (i1 < 0 || i1 >= A1.length)
        return { call: "", success: false };
    if (i2 < 0 || i2 >= A2.length)
        return { call: "", success: false };
    if (i3 < 0 || i3 >= A3.length)
        return { call: "", success: false };
    if (i4 < 0 || i4 >= A4.length)
        return { call: "", success: false };
    if (i5 < 0 || i5 >= A4.length)
        return { call: "", success: false };
    if (i6 < 0 || i6 >= A4.length)
        return { call: "", success: false };
    const call = (A1[i1] + A2[i2] + A3[i3] + A4[i4] + A4[i5] + A4[i6]).trim();
    return { call, success: call.length > 0 };
}
function toGrid4(igrid4) {
    if (igrid4 < 0 || igrid4 > MAXGRID4)
        return { grid: "", success: false };
    let n = igrid4;
    const j4 = n % 10;
    n = Math.floor(n / 10);
    const j3 = n % 10;
    n = Math.floor(n / 10);
    const j2 = n % 18;
    n = Math.floor(n / 18);
    const j1 = n;
    if (j1 < 0 || j1 > 17 || j2 < 0 || j2 > 17)
        return { grid: "", success: false };
    const grid = String.fromCharCode(65 + j1) + String.fromCharCode(65 + j2) + j3.toString() + j4.toString();
    return { grid, success: true };
}
function unpackText77(bits71) {
    // Reconstruct 9 bytes from 71 bits (7 + 8*8)
    const qa = new Uint8Array(9);
    let val = 0;
    for (let b = 6; b >= 0; b--) {
        val = (val << 1) | (bits71[6 - b] ?? 0);
    }
    qa[0] = val;
    for (let li = 1; li <= 8; li++) {
        val = 0;
        for (let b = 7; b >= 0; b--) {
            val = (val << 1) | (bits71[7 + (li - 1) * 8 + (7 - b)] ?? 0);
        }
        qa[li] = val;
    }
    // Decode from base-42 big-endian
    // Convert qa (9 bytes) to a bigint, then repeatedly divide by 42
    let n = 0n;
    for (let i = 0; i < 9; i++) {
        n = (n << 8n) | BigInt(qa[i]);
    }
    const chars = [];
    for (let i = 0; i < 13; i++) {
        const j = Number(n % 42n);
        n = n / 42n;
        chars.unshift(FTALPH[j] ?? " ");
    }
    return chars.join("").trimStart();
}
/**
 * Unpack a 77-bit FT8 message into a human-readable string.
 *
 * When a {@link HashCallBook} is provided, hashed callsigns are resolved from
 * the book, and newly decoded standard callsigns are saved into it.
 */
function unpack77(bits77, book) {
    const n3 = bitsToUint(bits77, 71, 3);
    const i3 = bitsToUint(bits77, 74, 3);
    if (i3 === 0 && n3 === 0) {
        // Type 0.0: Free text
        const msg = unpackText77(bits77.slice(0, 71));
        if (msg.trim().length === 0)
            return { msg: "", success: false };
        return { msg: msg.trim(), success: true };
    }
    if (i3 === 1 || i3 === 2) {
        // Type 1/2: Standard message
        const n28a = bitsToUint(bits77, 0, 28);
        const ipa = bits77[28];
        const n28b = bitsToUint(bits77, 29, 28);
        const ipb = bits77[57];
        const ir = bits77[58];
        const igrid4 = bitsToUint(bits77, 59, 15);
        const { call: call1, success: ok1 } = unpack28(n28a, book);
        const { call: call2Raw, success: ok2 } = unpack28(n28b, book);
        if (!ok1 || !ok2)
            return { msg: "", success: false };
        let c1 = call1;
        let c2 = call2Raw;
        if (c1.startsWith("CQ_"))
            c1 = c1.replace("_", " ");
        if (c1.indexOf("<") < 0) {
            if (ipa === 1 && i3 === 1 && c1.length >= 3)
                c1 += "/R";
            if (ipa === 1 && i3 === 2 && c1.length >= 3)
                c1 += "/P";
        }
        if (c2.indexOf("<") < 0) {
            if (ipb === 1 && i3 === 1 && c2.length >= 3)
                c2 += "/R";
            if (ipb === 1 && i3 === 2 && c2.length >= 3)
                c2 += "/P";
            // Save the "from" call (call_2) into the hash book
            if (book && c2.length >= 3)
                book.save(c2);
        }
        if (igrid4 <= MAXGRID4) {
            const { grid, success: gridOk } = toGrid4(igrid4);
            if (!gridOk)
                return { msg: "", success: false };
            const msg = ir === 0 ? `${c1} ${c2} ${grid}` : `${c1} ${c2} R ${grid}`;
            return { msg, success: true };
        }
        else {
            const irpt = igrid4 - MAXGRID4;
            if (irpt === 1)
                return { msg: `${c1} ${c2}`, success: true };
            if (irpt === 2)
                return { msg: `${c1} ${c2} RRR`, success: true };
            if (irpt === 3)
                return { msg: `${c1} ${c2} RR73`, success: true };
            if (irpt === 4)
                return { msg: `${c1} ${c2} 73`, success: true };
            if (irpt >= 5) {
                let isnr = irpt - 35;
                if (isnr > 50)
                    isnr -= 101;
                const absStr = Math.abs(isnr).toString().padStart(2, "0");
                const crpt = (isnr >= 0 ? "+" : "-") + absStr;
                const msg = ir === 0 ? `${c1} ${c2} ${crpt}` : `${c1} ${c2} R${crpt}`;
                return { msg, success: true };
            }
            return { msg: "", success: false };
        }
    }
    if (i3 === 4) {
        // Type 4: One nonstandard call
        const n12 = bitsToUint(bits77, 0, 12);
        let n58 = 0n;
        for (let i = 0; i < 58; i++) {
            n58 = n58 * 2n + BigInt(bits77[12 + i] ?? 0);
        }
        const iflip = bits77[70];
        const nrpt = bitsToUint(bits77, 71, 2);
        const icq = bits77[73];
        const c11chars = [];
        let remain = n58;
        for (let i = 10; i >= 0; i--) {
            const j = Number(remain % 38n);
            remain = remain / 38n;
            c11chars.unshift(C38[j] ?? " ");
        }
        const c11 = c11chars.join("").trim();
        const resolved = book?.lookup12(n12);
        const call3 = resolved ? `<${resolved}>` : "<...>";
        let call1;
        let call2;
        if (iflip === 0) {
            call1 = call3;
            call2 = c11;
            if (book)
                book.save(c11);
        }
        else {
            call1 = c11;
            call2 = call3;
        }
        let msg;
        if (icq === 1) {
            msg = `CQ ${call2}`;
        }
        else {
            if (nrpt === 0)
                msg = `${call1} ${call2}`;
            else if (nrpt === 1)
                msg = `${call1} ${call2} RRR`;
            else if (nrpt === 2)
                msg = `${call1} ${call2} RR73`;
            else
                msg = `${call1} ${call2} 73`;
        }
        return { msg, success: true };
    }
    return { msg: "", success: false };
}

/** FT4-specific constants (lib/ft4/ft4_params.f90). */
const GRAYMAP = [0, 1, 3, 2];

// Message scrambling vector (rvec) from WSJT-X.
const RVEC = [
    0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1,
    0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0,
    1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1,
];
function xorWithScrambler(bits77) {
    const out = new Array(77);
    for (let i = 0; i < 77; i++) {
        out[i] = ((bits77[i] ?? 0) + RVEC[i]) & 1;
    }
    return out;
}

const COSTAS_A = [0, 1, 3, 2];
const COSTAS_B = [1, 0, 2, 3];
const COSTAS_C = [2, 3, 1, 0];
const COSTAS_D = [3, 2, 0, 1];
const NSPS$1 = 576;
const NFFT1$1 = 4 * NSPS$1; // 2304
const NH1 = NFFT1$1 / 2; // 1152
const NMAX$1 = 21 * 3456; // 72576
const NHSYM$1 = Math.floor((NMAX$1 - NFFT1$1) / NSPS$1); // 122
const NDOWN$1 = 18;
const NN$1 = 103;
const NFFT2$1 = NMAX$1 / NDOWN$1; // 4032
const NSS = NSPS$1 / NDOWN$1; // 32
const FS2$1 = SAMPLE_RATE$1 / NDOWN$1; // 666.67 Hz
const MAX_FREQ = 4910;
const SYNC_PASS_MIN = 1.2;
const TWO_PI$2 = 2 * Math.PI;
const HARD_SYNC_PATTERNS = [
    { offset: 0, bits: [0, 0, 0, 1, 1, 0, 1, 1] },
    { offset: 66, bits: [0, 1, 0, 0, 1, 1, 1, 0] },
    { offset: 132, bits: [1, 1, 1, 0, 0, 1, 0, 0] },
    { offset: 198, bits: [1, 0, 1, 1, 0, 0, 0, 1] },
];
const COSTAS_BLOCKS$1 = 4;
const FT4_SYNC_STRIDE = 33 * NSS;
const FT4_MAX_TWEAK = 16;
const LDPC_BITS = 174;
const BITMETRIC_LEN = 2 * NN$1;
const FRAME_LEN = NN$1 * NSS;
const NUTTALL_WINDOW = makeNuttallWindow(NFFT1$1);
const DOWNSAMPLE_CTX = createDownsampleContext();
const TWEAKED_SYNC_TEMPLATES = createTweakedSyncTemplates();
/**
 * Decode all FT4 signals in a buffer.
 * Input: mono audio samples at `sampleRate` Hz, duration ~6s.
 */
function decode$1(samples, options = {}) {
    const sampleRate = options.sampleRate ?? SAMPLE_RATE$1;
    const freqLow = options.freqLow ?? 200;
    const freqHigh = options.freqHigh ?? 3000;
    const syncMin = options.syncMin ?? 1.2;
    const depth = options.depth ?? 2;
    const maxCandidates = options.maxCandidates ?? 100;
    const book = options.hashCallBook;
    const dd = sampleRate === SAMPLE_RATE$1
        ? copySamplesToDecodeWindow$1(samples)
        : resample$1(samples, sampleRate, SAMPLE_RATE$1, NMAX$1);
    const cxRe = new Float64Array(NMAX$1);
    const cxIm = new Float64Array(NMAX$1);
    for (let i = 0; i < NMAX$1; i++)
        cxRe[i] = dd[i] ?? 0;
    fftComplex(cxRe, cxIm, false);
    const candidates = getCandidates4(dd, freqLow, freqHigh, syncMin, maxCandidates);
    if (candidates.length === 0)
        return [];
    const workspace = createDecodeWorkspace$1();
    const decoded = [];
    const seenMessages = new Set();
    for (const candidate of candidates) {
        const one = decodeCandidate(candidate, cxRe, cxIm, depth, book, workspace);
        if (!one)
            continue;
        if (seenMessages.has(one.msg))
            continue;
        seenMessages.add(one.msg);
        decoded.push(one);
    }
    return decoded;
}
function createDecodeWorkspace$1() {
    return {
        coarseRe: new Float64Array(NFFT2$1),
        coarseIm: new Float64Array(NFFT2$1),
        fineRe: new Float64Array(NFFT2$1),
        fineIm: new Float64Array(NFFT2$1),
        frameRe: new Float64Array(FRAME_LEN),
        frameIm: new Float64Array(FRAME_LEN),
        symbRe: new Float64Array(NSS),
        symbIm: new Float64Array(NSS),
        csRe: new Float64Array(4 * NN$1),
        csIm: new Float64Array(4 * NN$1),
        s4: new Float64Array(4 * NN$1),
        s2: new Float64Array(1 << 8),
        bitmetrics1: new Float64Array(BITMETRIC_LEN),
        bitmetrics2: new Float64Array(BITMETRIC_LEN),
        bitmetrics3: new Float64Array(BITMETRIC_LEN),
        llra: new Float64Array(LDPC_BITS),
        llrb: new Float64Array(LDPC_BITS),
        llrc: new Float64Array(LDPC_BITS),
        llr: new Float64Array(LDPC_BITS),
        apmask: new Int8Array(LDPC_BITS),
    };
}
function copySamplesToDecodeWindow$1(samples) {
    const out = new Float64Array(NMAX$1);
    const len = Math.min(samples.length, NMAX$1);
    for (let i = 0; i < len; i++)
        out[i] = samples[i];
    return out;
}
function decodeCandidate(candidate, cxRe, cxIm, depth, book, workspace) {
    ft4Downsample(cxRe, cxIm, candidate.freq, DOWNSAMPLE_CTX, workspace.coarseRe, workspace.coarseIm);
    normalizeComplexPower(workspace.coarseRe, workspace.coarseIm, NMAX$1 / NDOWN$1);
    for (let segment = 1; segment <= 3; segment++) {
        const coarse = findBestSyncLocation(workspace.coarseRe, workspace.coarseIm, segment);
        if (coarse.smax < SYNC_PASS_MIN)
            continue;
        const f1 = candidate.freq + coarse.idfbest;
        if (f1 <= 10 || f1 >= 4990)
            continue;
        ft4Downsample(cxRe, cxIm, f1, DOWNSAMPLE_CTX, workspace.fineRe, workspace.fineIm);
        normalizeComplexPower(workspace.fineRe, workspace.fineIm, NSS * NN$1);
        extractFrame(workspace.fineRe, workspace.fineIm, coarse.ibest, workspace.frameRe, workspace.frameIm);
        const badsync = buildBitMetrics$1(workspace.frameRe, workspace.frameIm, workspace);
        if (badsync)
            continue;
        if (!passesHardSyncQuality(workspace.bitmetrics1))
            continue;
        buildLlrs(workspace);
        const result = tryDecodePasses$1(workspace, depth);
        if (!result)
            continue;
        const message77Scrambled = result.message91.slice(0, 77);
        if (!hasNonZeroBit(message77Scrambled))
            continue;
        const message77 = xorWithScrambler(message77Scrambled);
        const { msg, success } = unpack77(message77, book);
        if (!success || msg.trim().length === 0)
            continue;
        return {
            freq: f1,
            dt: coarse.ibest / FS2$1 - 0.5,
            snr: toFt4Snr(candidate.sync - 1.0),
            msg,
            sync: coarse.smax,
        };
    }
    return null;
}
function findBestSyncLocation(cdRe, cdIm, segment) {
    let ibest = -1;
    let idfbest = 0;
    let smax = -99;
    for (let isync = 1; isync <= 2; isync++) {
        let idfmin;
        let idfmax;
        let idfstp;
        let ibmin;
        let ibmax;
        let ibstp;
        if (isync === 1) {
            idfmin = -12;
            idfmax = 12;
            idfstp = 3;
            ibmin = -344;
            ibmax = 1012;
            if (segment === 1) {
                ibmin = 108;
                ibmax = 560;
            }
            else if (segment === 2) {
                ibmin = 560;
                ibmax = 1012;
            }
            else {
                ibmin = -344;
                ibmax = 108;
            }
            ibstp = 4;
        }
        else {
            idfmin = idfbest - 4;
            idfmax = idfbest + 4;
            idfstp = 1;
            ibmin = ibest - 5;
            ibmax = ibest + 5;
            ibstp = 1;
        }
        for (let idf = idfmin; idf <= idfmax; idf += idfstp) {
            const templates = TWEAKED_SYNC_TEMPLATES.get(idf);
            if (!templates)
                continue;
            for (let istart = ibmin; istart <= ibmax; istart += ibstp) {
                const sync = sync4d(cdRe, cdIm, istart, templates);
                if (sync > smax) {
                    smax = sync;
                    ibest = istart;
                    idfbest = idf;
                }
            }
        }
    }
    return { ibest, idfbest, smax };
}
function getCandidates4(dd, freqLow, freqHigh, syncMin, maxCandidates) {
    const df = SAMPLE_RATE$1 / NFFT1$1;
    const fac = 1 / 300;
    const savg = new Float64Array(NH1);
    const s = new Float64Array(NH1 * NHSYM$1);
    const savsm = new Float64Array(NH1);
    const xRe = new Float64Array(NFFT1$1);
    const xIm = new Float64Array(NFFT1$1);
    for (let j = 0; j < NHSYM$1; j++) {
        const ia = j * NSPS$1;
        const ib = ia + NFFT1$1;
        if (ib > NMAX$1)
            break;
        xIm.fill(0);
        for (let i = 0; i < NFFT1$1; i++)
            xRe[i] = fac * dd[ia + i] * NUTTALL_WINDOW[i];
        fftComplex(xRe, xIm, false);
        for (let bin = 1; bin <= NH1; bin++) {
            const idx = bin - 1;
            const re = xRe[bin] ?? 0;
            const im = xIm[bin] ?? 0;
            const power = re * re + im * im;
            s[idx * NHSYM$1 + j] = power;
            savg[idx] = (savg[idx] ?? 0) + power;
        }
    }
    for (let i = 0; i < NH1; i++)
        savg[i] = (savg[i] ?? 0) / NHSYM$1;
    for (let i = 7; i < NH1 - 7; i++) {
        let sum = 0;
        for (let j = i - 7; j <= i + 7; j++)
            sum += savg[j];
        savsm[i] = sum / 15;
    }
    let nfa = Math.round(freqLow / df);
    if (nfa < Math.round(200 / df))
        nfa = Math.round(200 / df);
    let nfb = Math.round(freqHigh / df);
    if (nfb > Math.round(MAX_FREQ / df))
        nfb = Math.round(MAX_FREQ / df);
    const sbase = ft4Baseline(savg, nfa, nfb, df);
    for (let bin = nfa; bin <= nfb; bin++) {
        if ((sbase[bin - 1] ?? 0) <= 0)
            return [];
    }
    for (let bin = nfa; bin <= nfb; bin++) {
        const idx = bin - 1;
        savsm[idx] = (savsm[idx] ?? 0) / sbase[idx];
    }
    const fOffset = (-1.5 * SAMPLE_RATE$1) / NSPS$1;
    const candidates = [];
    for (let i = nfa + 1; i <= nfb - 1; i++) {
        const left = savsm[i - 2] ?? 0;
        const center = savsm[i - 1] ?? 0;
        const right = savsm[i] ?? 0;
        if (center >= left && center >= right && center >= syncMin) {
            const den = left - 2 * center + right;
            const del = den !== 0 ? (0.5 * (left - right)) / den : 0;
            const fpeak = (i + del) * df + fOffset;
            if (fpeak < 200 || fpeak > MAX_FREQ)
                continue;
            const speak = center - 0.25 * (left - right) * del;
            candidates.push({ freq: fpeak, sync: speak });
        }
    }
    candidates.sort((a, b) => b.sync - a.sync);
    return candidates.slice(0, maxCandidates);
}
function makeNuttallWindow(n) {
    const out = new Float64Array(n);
    const a0 = 0.3635819;
    const a1 = -0.4891775;
    const a2 = 0.1365995;
    const a3 = -0.0106411;
    for (let i = 0; i < n; i++) {
        out[i] =
            a0 +
                a1 * Math.cos((2 * Math.PI * i) / n) +
                a2 * Math.cos((4 * Math.PI * i) / n) +
                a3 * Math.cos((6 * Math.PI * i) / n);
    }
    return out;
}
function ft4Baseline(savg, nfa, nfb, df) {
    const sbase = new Float64Array(NH1);
    sbase.fill(1);
    const ia = Math.max(Math.round(200 / df), nfa);
    const ib = Math.min(NH1, nfb);
    if (ib <= ia)
        return sbase;
    const sDb = new Float64Array(NH1);
    for (let i = ia; i <= ib; i++)
        sDb[i - 1] = 10 * Math.log10(Math.max(1e-30, savg[i - 1]));
    const nseg = 10;
    const npct = 10;
    const nlen = Math.max(1, Math.trunc((ib - ia + 1) / nseg));
    const i0 = Math.trunc((ib - ia + 1) / 2);
    const x = [];
    const y = [];
    for (let seg = 0; seg < nseg; seg++) {
        const ja = ia + seg * nlen;
        if (ja > ib)
            break;
        const jb = Math.min(ib, ja + nlen - 1);
        const vals = [];
        for (let i = ja; i <= jb; i++)
            vals.push(sDb[i - 1]);
        const base = percentile(vals, npct);
        for (let i = ja; i <= jb; i++) {
            const v = sDb[i - 1];
            if (v <= base) {
                x.push(i - i0);
                y.push(v);
            }
        }
    }
    const coeff = x.length >= 5 ? polyfitLeastSquares(x, y, 4) : null;
    if (coeff) {
        for (let i = ia; i <= ib; i++) {
            const t = i - i0;
            const db = coeff[0] + t * (coeff[1] + t * (coeff[2] + t * (coeff[3] + t * coeff[4]))) + 0.65;
            sbase[i - 1] = 10 ** (db / 10);
        }
    }
    else {
        const halfWindow = 25;
        for (let i = ia; i <= ib; i++) {
            const lo = Math.max(ia, i - halfWindow);
            const hi = Math.min(ib, i + halfWindow);
            let sum = 0;
            let count = 0;
            for (let j = lo; j <= hi; j++) {
                sum += savg[j - 1];
                count++;
            }
            sbase[i - 1] = count > 0 ? sum / count : 1;
        }
    }
    return sbase;
}
function percentile(values, pct) {
    if (values.length === 0)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor((pct / 100) * (sorted.length - 1))));
    return sorted[idx];
}
function polyfitLeastSquares(x, y, degree) {
    const n = degree + 1;
    const mat = Array.from({ length: n }, () => new Float64Array(n + 1));
    const xPows = new Float64Array(2 * degree + 1);
    for (let p = 0; p <= 2 * degree; p++) {
        let sum = 0;
        for (let i = 0; i < x.length; i++)
            sum += x[i] ** p;
        xPows[p] = sum;
    }
    for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++)
            mat[row][col] = xPows[row + col];
        let rhs = 0;
        for (let i = 0; i < x.length; i++)
            rhs += y[i] * x[i] ** row;
        mat[row][n] = rhs;
    }
    for (let col = 0; col < n; col++) {
        let pivot = col;
        let maxAbs = Math.abs(mat[col][col]);
        for (let row = col + 1; row < n; row++) {
            const a = Math.abs(mat[row][col]);
            if (a > maxAbs) {
                maxAbs = a;
                pivot = row;
            }
        }
        if (maxAbs < 1e-12)
            return null;
        if (pivot !== col) {
            const tmp = mat[col];
            mat[col] = mat[pivot];
            mat[pivot] = tmp;
        }
        const pivotVal = mat[col][col];
        for (let c = col; c <= n; c++)
            mat[col][c] = mat[col][c] / pivotVal;
        for (let row = 0; row < n; row++) {
            if (row === col)
                continue;
            const factor = mat[row][col];
            if (factor === 0)
                continue;
            for (let c = col; c <= n; c++)
                mat[row][c] = mat[row][c] - factor * mat[col][c];
        }
    }
    const coeff = new Array(n);
    for (let i = 0; i < n; i++)
        coeff[i] = mat[i][n];
    return coeff;
}
function createDownsampleContext() {
    const df = SAMPLE_RATE$1 / NMAX$1;
    const baud = SAMPLE_RATE$1 / NSPS$1;
    const bwTransition = 0.5 * baud;
    const bwFlat = 4 * baud;
    const iwt = Math.max(1, Math.trunc(bwTransition / df));
    const iwf = Math.max(1, Math.trunc(bwFlat / df));
    const iws = Math.trunc(baud / df);
    const raw = new Float64Array(NFFT2$1);
    for (let i = 0; i < iwt && i < raw.length; i++) {
        raw[i] = 0.5 * (1 + Math.cos((Math.PI * (iwt - 1 - i)) / iwt));
    }
    for (let i = iwt; i < iwt + iwf && i < raw.length; i++)
        raw[i] = 1;
    for (let i = iwt + iwf; i < 2 * iwt + iwf && i < raw.length; i++) {
        raw[i] = 0.5 * (1 + Math.cos((Math.PI * (i - (iwt + iwf))) / iwt));
    }
    const window = new Float64Array(NFFT2$1);
    for (let i = 0; i < NFFT2$1; i++) {
        const src = (i + iws) % NFFT2$1;
        window[i] = raw[src];
    }
    return { df, window };
}
function ft4Downsample(cxRe, cxIm, f0, ctx, outRe, outIm) {
    outRe.fill(0);
    outIm.fill(0);
    const i0 = Math.round(f0 / ctx.df);
    if (i0 >= 0 && i0 <= NMAX$1 / 2) {
        outRe[0] = cxRe[i0] ?? 0;
        outIm[0] = cxIm[i0] ?? 0;
    }
    for (let i = 1; i <= NFFT2$1 / 2; i++) {
        const hi = i0 + i;
        if (hi >= 0 && hi <= NMAX$1 / 2) {
            outRe[i] = cxRe[hi] ?? 0;
            outIm[i] = cxIm[hi] ?? 0;
        }
        const lo = i0 - i;
        if (lo >= 0 && lo <= NMAX$1 / 2) {
            const idx = NFFT2$1 - i;
            outRe[idx] = cxRe[lo] ?? 0;
            outIm[idx] = cxIm[lo] ?? 0;
        }
    }
    const scale = 1 / NFFT2$1;
    for (let i = 0; i < NFFT2$1; i++) {
        const w = (ctx.window[i] ?? 0) * scale;
        outRe[i] = outRe[i] * w;
        outIm[i] = outIm[i] * w;
    }
    fftComplex(outRe, outIm, true);
}
function normalizeComplexPower(re, im, denom) {
    let sum = 0;
    for (let i = 0; i < re.length; i++)
        sum += re[i] * re[i] + im[i] * im[i];
    if (sum <= 0)
        return;
    const scale = 1 / Math.sqrt(sum / denom);
    for (let i = 0; i < re.length; i++) {
        re[i] = re[i] * scale;
        im[i] = im[i] * scale;
    }
}
function extractFrame(cbRe, cbIm, ibest, outRe, outIm) {
    for (let i = 0; i < outRe.length; i++) {
        const src = ibest + i;
        if (src >= 0 && src < cbRe.length) {
            outRe[i] = cbRe[src];
            outIm[i] = cbIm[src];
        }
        else {
            outRe[i] = 0;
            outIm[i] = 0;
        }
    }
}
function createTweakedSyncTemplates() {
    const base = createBaseSyncTemplates();
    const fsample = FS2$1 / 2;
    const out = new Map();
    for (let idf = -FT4_MAX_TWEAK; idf <= FT4_MAX_TWEAK; idf++) {
        const tweak = createFrequencyTweak(idf, 2 * NSS, fsample);
        out.set(idf, [
            applyTweak(base[0], tweak),
            applyTweak(base[1], tweak),
            applyTweak(base[2], tweak),
            applyTweak(base[3], tweak),
        ]);
    }
    return out;
}
function createBaseSyncTemplates() {
    return [
        buildSyncTemplate(COSTAS_A),
        buildSyncTemplate(COSTAS_B),
        buildSyncTemplate(COSTAS_C),
        buildSyncTemplate(COSTAS_D),
    ];
}
function buildSyncTemplate(tones) {
    const re = new Float64Array(2 * NSS);
    const im = new Float64Array(2 * NSS);
    let k = 0;
    let phi = 0;
    for (const tone of tones) {
        const dphi = (TWO_PI$2 * tone * 2) / NSS;
        for (let j = 0; j < NSS / 2; j++) {
            re[k] = Math.cos(phi);
            im[k] = Math.sin(phi);
            phi = (phi + dphi) % TWO_PI$2;
            k++;
        }
    }
    return { re, im };
}
function createFrequencyTweak(idf, npts, fsample) {
    const re = new Float64Array(npts);
    const im = new Float64Array(npts);
    const dphi = (TWO_PI$2 * idf) / fsample;
    const stepRe = Math.cos(dphi);
    const stepIm = Math.sin(dphi);
    let wRe = 1;
    let wIm = 0;
    for (let i = 0; i < npts; i++) {
        const newRe = wRe * stepRe - wIm * stepIm;
        const newIm = wRe * stepIm + wIm * stepRe;
        wRe = newRe;
        wIm = newIm;
        re[i] = wRe;
        im[i] = wIm;
    }
    return { re, im };
}
function applyTweak(template, tweak) {
    const re = new Float64Array(template.re.length);
    const im = new Float64Array(template.im.length);
    for (let i = 0; i < template.re.length; i++) {
        const sr = template.re[i];
        const si = template.im[i];
        const tr = tweak.re[i];
        const ti = tweak.im[i];
        re[i] = tr * sr - ti * si;
        im[i] = tr * si + ti * sr;
    }
    return { re, im };
}
function sync4d(cdRe, cdIm, i0, templates) {
    let sync = 0;
    for (let i = 0; i < COSTAS_BLOCKS$1; i++) {
        const start = i0 + i * FT4_SYNC_STRIDE;
        const z = correlateStride2(cdRe, cdIm, start, templates[i].re, templates[i].im);
        if (z.count <= 16)
            continue;
        sync += Math.hypot(z.re, z.im) / (2 * NSS);
    }
    return sync;
}
function correlateStride2(cdRe, cdIm, start, templateRe, templateIm) {
    let zRe = 0;
    let zIm = 0;
    let count = 0;
    for (let i = 0; i < templateRe.length; i++) {
        const idx = start + 2 * i;
        if (idx < 0 || idx >= cdRe.length)
            continue;
        const sRe = templateRe[i];
        const sIm = templateIm[i];
        const dRe = cdRe[idx];
        const dIm = cdIm[idx];
        zRe += dRe * sRe + dIm * sIm;
        zIm += dIm * sRe - dRe * sIm;
        count++;
    }
    return { re: zRe, im: zIm, count };
}
function buildBitMetrics$1(cdRe, cdIm, workspace) {
    const { csRe, csIm, s4, symbRe, symbIm, bitmetrics1, bitmetrics2, bitmetrics3, s2 } = workspace;
    for (let k = 0; k < NN$1; k++) {
        const i1 = k * NSS;
        for (let i = 0; i < NSS; i++) {
            symbRe[i] = cdRe[i1 + i];
            symbIm[i] = cdIm[i1 + i];
        }
        fftComplex(symbRe, symbIm, false);
        for (let tone = 0; tone < 4; tone++) {
            const idx = tone * NN$1 + k;
            const re = symbRe[tone];
            const im = symbIm[tone];
            csRe[idx] = re;
            csIm[idx] = im;
            s4[idx] = Math.hypot(re, im);
        }
    }
    let nsync = 0;
    for (let k = 0; k < 4; k++) {
        if (maxTone(s4, k) === COSTAS_A[k])
            nsync++;
        if (maxTone(s4, 33 + k) === COSTAS_B[k])
            nsync++;
        if (maxTone(s4, 66 + k) === COSTAS_C[k])
            nsync++;
        if (maxTone(s4, 99 + k) === COSTAS_D[k])
            nsync++;
    }
    bitmetrics1.fill(0);
    bitmetrics2.fill(0);
    bitmetrics3.fill(0);
    if (nsync < 6)
        return true;
    for (let nseq = 1; nseq <= 3; nseq++) {
        const nsym = nseq === 1 ? 1 : nseq === 2 ? 2 : 4;
        const nt = 1 << (2 * nsym);
        const ibmax = nseq === 1 ? 1 : nseq === 2 ? 3 : 7;
        for (let ks = 1; ks <= NN$1 - nsym + 1; ks += nsym) {
            for (let i = 0; i < nt; i++) {
                const i1 = Math.floor(i / 64);
                const i2 = Math.floor((i & 63) / 16);
                const i3 = Math.floor((i & 15) / 4);
                const i4 = i & 3;
                if (nsym === 1) {
                    const t = GRAYMAP[i4];
                    const idx = t * NN$1 + (ks - 1);
                    s2[i] = Math.hypot(csRe[idx], csIm[idx]);
                }
                else if (nsym === 2) {
                    const t3 = GRAYMAP[i3];
                    const t4 = GRAYMAP[i4];
                    const iA = t3 * NN$1 + (ks - 1);
                    const iB = t4 * NN$1 + ks;
                    const re = csRe[iA] + csRe[iB];
                    const im = csIm[iA] + csIm[iB];
                    s2[i] = Math.hypot(re, im);
                }
                else {
                    const t1 = GRAYMAP[i1];
                    const t2 = GRAYMAP[i2];
                    const t3 = GRAYMAP[i3];
                    const t4 = GRAYMAP[i4];
                    const iA = t1 * NN$1 + (ks - 1);
                    const iB = t2 * NN$1 + ks;
                    const iC = t3 * NN$1 + (ks + 1);
                    const iD = t4 * NN$1 + (ks + 2);
                    const re = csRe[iA] + csRe[iB] + csRe[iC] + csRe[iD];
                    const im = csIm[iA] + csIm[iB] + csIm[iC] + csIm[iD];
                    s2[i] = Math.hypot(re, im);
                }
            }
            const ipt = 1 + (ks - 1) * 2;
            for (let ib = 0; ib <= ibmax; ib++) {
                const mask = 1 << (ibmax - ib);
                let max1 = -1e30;
                let max0 = -1e30;
                for (let i = 0; i < nt; i++) {
                    const v = s2[i];
                    if ((i & mask) !== 0) {
                        if (v > max1)
                            max1 = v;
                    }
                    else if (v > max0) {
                        max0 = v;
                    }
                }
                const idx = ipt + ib;
                if (idx > BITMETRIC_LEN)
                    continue;
                const bm = max1 - max0;
                if (nseq === 1) {
                    bitmetrics1[idx - 1] = bm;
                }
                else if (nseq === 2) {
                    bitmetrics2[idx - 1] = bm;
                }
                else {
                    bitmetrics3[idx - 1] = bm;
                }
            }
        }
    }
    bitmetrics2[208] = bitmetrics1[208];
    bitmetrics2[209] = bitmetrics1[209];
    bitmetrics3[208] = bitmetrics1[208];
    bitmetrics3[209] = bitmetrics1[209];
    normalizeBitMetrics(bitmetrics1);
    normalizeBitMetrics(bitmetrics2);
    normalizeBitMetrics(bitmetrics3);
    return false;
}
function maxTone(s4, symbolIndex) {
    let bestTone = 0;
    let bestValue = -1;
    for (let tone = 0; tone < 4; tone++) {
        const v = s4[tone * NN$1 + symbolIndex];
        if (v > bestValue) {
            bestValue = v;
            bestTone = tone;
        }
    }
    return bestTone;
}
function normalizeBitMetrics(bmet) {
    let sum = 0;
    let sum2 = 0;
    for (let i = 0; i < bmet.length; i++) {
        sum += bmet[i];
        sum2 += bmet[i] * bmet[i];
    }
    const avg = sum / bmet.length;
    const avg2 = sum2 / bmet.length;
    const variance = avg2 - avg * avg;
    const sigma = variance > 0 ? Math.sqrt(variance) : Math.sqrt(avg2);
    if (sigma <= 0)
        return;
    for (let i = 0; i < bmet.length; i++)
        bmet[i] = bmet[i] / sigma;
}
function passesHardSyncQuality(bitmetrics1) {
    const hard = new Uint8Array(bitmetrics1.length);
    for (let i = 0; i < bitmetrics1.length; i++)
        hard[i] = bitmetrics1[i] >= 0 ? 1 : 0;
    let score = 0;
    for (const pattern of HARD_SYNC_PATTERNS) {
        for (let i = 0; i < pattern.bits.length; i++) {
            if (hard[pattern.offset + i] === pattern.bits[i])
                score++;
        }
    }
    return score >= 10;
}
function buildLlrs(workspace) {
    const { bitmetrics1, bitmetrics2, bitmetrics3, llra, llrb, llrc } = workspace;
    for (let i = 0; i < 58; i++) {
        llra[i] = bitmetrics1[8 + i];
        llra[58 + i] = bitmetrics1[74 + i];
        llra[116 + i] = bitmetrics1[140 + i];
        llrb[i] = bitmetrics2[8 + i];
        llrb[58 + i] = bitmetrics2[74 + i];
        llrb[116 + i] = bitmetrics2[140 + i];
        llrc[i] = bitmetrics3[8 + i];
        llrc[58 + i] = bitmetrics3[74 + i];
        llrc[116 + i] = bitmetrics3[140 + i];
    }
}
function tryDecodePasses$1(workspace, depth) {
    const maxosd = depth >= 3 ? 2 : depth >= 2 ? 0 : -1;
    const scalefac = 2.83;
    const sources = [workspace.llra, workspace.llrb, workspace.llrc];
    workspace.apmask.fill(0);
    for (const src of sources) {
        for (let i = 0; i < LDPC_BITS; i++)
            workspace.llr[i] = scalefac * src[i];
        const result = decode174_91(workspace.llr, workspace.apmask, maxosd);
        if (result)
            return result;
    }
    return null;
}
function hasNonZeroBit(bits) {
    for (const bit of bits) {
        if (bit !== 0)
            return true;
    }
    return false;
}
function toFt4Snr(syncMinusOne) {
    if (syncMinusOne > 0) {
        return Math.round(Math.max(-21, 10 * Math.log10(syncMinusOne) - 14.8));
    }
    return -21;
}
function resample$1(input, fromRate, toRate, outLen) {
    const out = new Float64Array(outLen);
    const ratio = fromRate / toRate;
    for (let i = 0; i < outLen; i++) {
        const srcIdx = i * ratio;
        const lo = Math.floor(srcIdx);
        const frac = srcIdx - lo;
        const v0 = lo < input.length ? (input[lo] ?? 0) : 0;
        const v1 = lo + 1 < input.length ? (input[lo + 1] ?? 0) : 0;
        out[i] = v0 * (1 - frac) + v1 * frac;
    }
    return out;
}

/**
 * FT8 message packing – TypeScript port of packjt77.f90
 *
 * Implemented message types
 * ─────────────────────────
 *  0.0  Free text (≤13 chars from the 42-char FT8 alphabet)
 *  1    Standard (two callsigns + grid/report/RR73/73)
 *       /R and /P suffixes on either callsign → ipa/ipb = 1 (triggers i3=2 for /P)
 *  4    One nonstandard (<hash>) call + one standard call
 *       e.g.  <YW18FIFA> KA1ABC 73
 *             KA1ABC <YW18FIFA> -11
 *             CQ YW18FIFA
 *
 * Reference: lib/77bit/packjt77.f90 (subroutines pack77, pack28, pack77_1,
 *            pack77_4, packtext77, ihashcall)
 */
function mpZero() {
    return new Uint8Array(9);
}
/** qa = 42 * qb + carry from high limbs, working with 9 limbs (indices 0..8) */
function mpMult42(a) {
    const b = mpZero();
    let carry = 0;
    for (let i = 8; i >= 0; i--) {
        const v = 42 * (a[i] ?? 0) + carry;
        b[i] = v & 0xff;
        carry = v >>> 8;
    }
    return b;
}
/** qa = qb + j */
function mpAdd(a, j) {
    const b = new Uint8Array(a);
    let carry = j;
    for (let i = 8; i >= 0 && carry > 0; i--) {
        const v = (b[i] ?? 0) + carry;
        b[i] = v & 0xff;
        carry = v >>> 8;
    }
    return b;
}
/**
 * Pack a 13-char free-text string (42-char alphabet) into 71 bits.
 * Mirrors Fortran packtext77 / mp_short_* logic.
 * Alphabet: ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+-./?' (42 chars)
 */
function packtext77(c13) {
    // Right-justify in 13 chars
    const w = c13.padStart(13, " ");
    let qa = mpZero();
    for (let i = 0; i < 13; i++) {
        let j = FTALPH.indexOf(w[i] ?? " ");
        if (j < 0)
            j = 0;
        qa = mpMult42(qa);
        qa = mpAdd(qa, j);
    }
    // Extract 71 bits: first 7 then 8*8
    const bits = [];
    // limb 0 gives 7 bits (high), limbs 1..8 give 8 bits each → 7 + 64 = 71
    // But we need exactly 71 bits.  The Fortran writes b7.7 then 8*b8.8 for 71 total.
    // That equals: 7 + 8*8 = 71 bits from the 9 bytes (72 bits), skipping the top bit of byte 0.
    const byte0 = qa[0] ?? 0;
    for (let b = 6; b >= 0; b--)
        bits.push((byte0 >> b) & 1);
    for (let li = 1; li <= 8; li++) {
        const byte = qa[li] ?? 0;
        for (let b = 7; b >= 0; b--)
            bits.push((byte >> b) & 1);
    }
    return bits; // 71 bits
}
/**
 * ihashcall(c0, m): compute a hash of c0 and return bits [m-1 .. 63-m] of
 * (47055833459n * n8) shifted right by (64 - m).
 *
 * Fortran: ishft(47055833459_8 * n8, m - 64)
 *  → arithmetic right-shift of 64-bit product by (64 - m), keeping low m bits.
 *
 * Here we only ever call with m=22 (per pack28 for <...> callsigns).
 */
function ihashcall22(c0) {
    const C = C38;
    let n8 = 0n;
    const s = c0.padEnd(11, " ").slice(0, 11).toUpperCase();
    for (let i = 0; i < 11; i++) {
        const j = C.indexOf(s[i] ?? " ");
        n8 = 38n * n8 + BigInt(j < 0 ? 0 : j);
    }
    const MAGIC = 47055833459n;
    const prod = BigInt.asUintN(64, MAGIC * n8);
    // arithmetic right-shift by (64 - 22) = 42 bits → take top 22 bits
    const result = Number(prod >> 42n) & 0x3fffff; // 22 bits
    return result;
}
/**
 * Checks whether c0 is a valid standard callsign (may also have /R or /P suffix).
 * Returns { basecall, isStandard, hasSuffix: '/R'|'/P'|null }
 */
function parseCallsign(raw) {
    let call = raw.trim().toUpperCase();
    let suffix = null;
    if (call.endsWith("/R")) {
        suffix = "/R";
        call = call.slice(0, -2);
    }
    if (call.endsWith("/P")) {
        suffix = "/P";
        call = call.slice(0, -2);
    }
    const isLetter = (c) => c >= "A" && c <= "Z";
    const isDigit = (c) => c >= "0" && c <= "9";
    // Find the call-area digit (last digit in the call)
    let iarea = -1;
    for (let i = call.length - 1; i >= 1; i--) {
        if (isDigit(call[i] ?? "")) {
            iarea = i;
            break;
        }
    }
    if (iarea < 1)
        return { basecall: call, isStandard: false, suffix };
    // Count letters/digits before the call-area digit
    let npdig = 0, nplet = 0;
    for (let i = 0; i < iarea; i++) {
        if (isDigit(call[i] ?? ""))
            npdig++;
        if (isLetter(call[i] ?? ""))
            nplet++;
    }
    // Count suffix letters after call-area digit
    let nslet = 0;
    for (let i = iarea + 1; i < call.length; i++) {
        if (isLetter(call[i] ?? ""))
            nslet++;
    }
    const standard = iarea >= 1 &&
        iarea <= 2 && // Fortran: iarea (1-indexed) must be 2 or 3 → 0-indexed: 1 or 2
        nplet >= 1 && // at least one letter before area digit
        npdig < iarea && // not all digits before area
        nslet >= 1 && // must have at least one letter after area digit
        nslet <= 3; // at most 3 suffix letters
    return { basecall: call, isStandard: standard, suffix };
}
/**
 * pack28: pack a single callsign/token to a 28-bit integer.
 * Mirrors Fortran pack28 subroutine.
 */
function pack28(token) {
    const t = token.trim().toUpperCase();
    // Special tokens
    if (t === "DE")
        return 0;
    if (t === "QRZ")
        return 1;
    if (t === "CQ")
        return 2;
    // CQ_nnn (CQ with frequency offset in kHz)
    if (t.startsWith("CQ_")) {
        const rest = t.slice(3);
        const nqsy = parseInt(rest, 10);
        if (!Number.isNaN(nqsy) && /^\d{3}$/.test(rest))
            return 3 + nqsy;
        // CQ_aaaa (up to 4 letters)
        if (/^[A-Z]{1,4}$/.test(rest)) {
            const padded = rest.padStart(4, " ");
            let m = 0;
            for (let i = 0; i < 4; i++) {
                const c = padded[i] ?? " ";
                const j = c >= "A" && c <= "Z" ? c.charCodeAt(0) - 64 : 0;
                m = 27 * m + j;
            }
            return 3 + 1000 + m;
        }
    }
    // <...> hash calls
    if (t.startsWith("<") && t.endsWith(">")) {
        const inner = t.slice(1, -1);
        const n22 = ihashcall22(inner);
        return (NTOKENS + n22) & (MAX28 - 1);
    }
    // Standard callsign
    const { basecall, isStandard } = parseCallsign(t);
    if (isStandard) {
        const cs = basecall.length === 5 ? ` ${basecall}` : basecall;
        const i1 = A1.indexOf(cs[0] ?? " ");
        const i2 = A2.indexOf(cs[1] ?? "0");
        const i3 = A3.indexOf(cs[2] ?? "0");
        const i4 = A4.indexOf(cs[3] ?? " ");
        const i5 = A4.indexOf(cs[4] ?? " ");
        const i6 = A4.indexOf(cs[5] ?? " ");
        const n28 = 36 * 10 * 27 * 27 * 27 * i1 +
            10 * 27 * 27 * 27 * i2 +
            27 * 27 * 27 * i3 +
            27 * 27 * i4 +
            27 * i5 +
            i6;
        return (n28 + NTOKENS + MAX22) & (MAX28 - 1);
    }
    // Non-standard → 22-bit hash
    const n22 = ihashcall22(basecall);
    return (NTOKENS + n22) & (MAX28 - 1);
}
function packgrid4(s) {
    if (s === "RRR")
        return MAXGRID4 + 2;
    if (s === "73")
        return MAXGRID4 + 4;
    // Numeric report (+NN / -NN)
    const r = /^(R?)([+-]\d+)$/.exec(s);
    if (r) {
        let irpt = parseInt(r[2], 10);
        if (irpt >= -50 && irpt <= -31)
            irpt += 101;
        irpt += 35; // encode in range 5..85
        return MAXGRID4 + irpt;
    }
    // 4-char grid locator
    const j1 = (s.charCodeAt(0) - 65) * 18 * 10 * 10;
    const j2 = (s.charCodeAt(1) - 65) * 10 * 10;
    const j3 = (s.charCodeAt(2) - 48) * 10;
    const j4 = s.charCodeAt(3) - 48;
    return j1 + j2 + j3 + j4;
}
function appendBits(bits, val, width) {
    for (let i = width - 1; i >= 0; i--) {
        bits.push(Math.floor(val / 2 ** i) % 2);
    }
}
/**
 * Pack an FT8 message into 77 bits.
 * Returns an array of 0/1 values, length 77.
 *
 * Supported message types:
 *   Type 1/2  Standard two-callsign messages including /R and /P suffixes
 *   Type 4    One nonstandard (<hash>) call + one standard or nonstandard call
 *   Type 0.0  Free text (≤13 chars from FTALPH)
 */
/**
 * Preprocess a message in the same way as Fortran split77:
 * - Collapse multiple spaces, force uppercase
 * - If the first word is "CQ" and there are ≥3 words and the 3rd word is a
 *   valid base callsign, merge words 1+2 into "CQ_<word2>" and shift the rest.
 */
function split77(msg) {
    const parts = msg.trim().toUpperCase().replace(/\s+/g, " ").split(" ").filter(Boolean);
    if (parts.length >= 3 && parts[0] === "CQ") {
        // Check if word 3 (index 2) is a valid base callsign
        const w3 = parts[2].replace(/\/[RP]$/, ""); // strip /R or /P for check
        const { isStandard } = parseCallsign(w3);
        if (isStandard) {
            // merge CQ + word2 → CQ_word2
            const merged = [`CQ_${parts[1]}`, ...parts.slice(2)];
            return merged;
        }
    }
    return parts;
}
function pack77(msg) {
    const parts = split77(msg);
    if (parts.length < 1)
        throw new Error("Empty message");
    // ── Try Type 1/2: standard message ────────────────────────────────────────
    const t1 = tryPackType1(parts);
    if (t1)
        return t1;
    // ── Try Type 4: one hash call ──────────────────────────────────────────────
    const t4 = tryPackType4(parts);
    if (t4)
        return t4;
    // ── Default: Type 0.0 free text ───────────────────────────────────────────
    return packFreeText(msg);
}
function tryPackType1(parts) {
    // Minimum 2 words, maximum 4
    if (parts.length < 2 || parts.length > 4)
        return null;
    const w1 = parts[0];
    const w2 = parts[1];
    const wLast = parts[parts.length - 1];
    // Neither word may be a hash call if the other has a slash
    if (w1.startsWith("<") && w2.includes("/"))
        return null;
    if (w2.startsWith("<") && w1.includes("/"))
        return null;
    // Parse callsign 1
    let call1;
    let ipa = 0;
    let ok1;
    if (w1 === "CQ" || w1 === "DE" || w1 === "QRZ" || w1.startsWith("CQ_")) {
        call1 = w1;
        ok1 = true;
        ipa = 0;
    }
    else if (w1.startsWith("<") && w1.endsWith(">")) {
        call1 = w1;
        ok1 = true;
        ipa = 0;
    }
    else {
        const p1 = parseCallsign(w1);
        call1 = p1.basecall;
        ok1 = p1.isStandard;
        if (p1.suffix === "/R" || p1.suffix === "/P")
            ipa = 1;
    }
    // Parse callsign 2
    let call2;
    let ipb = 0;
    let ok2;
    if (w2.startsWith("<") && w2.endsWith(">")) {
        call2 = w2;
        ok2 = true;
        ipb = 0;
    }
    else {
        const p2 = parseCallsign(w2);
        call2 = p2.basecall;
        ok2 = p2.isStandard;
        if (p2.suffix === "/R" || p2.suffix === "/P")
            ipb = 1;
    }
    if (!ok1 || !ok2)
        return null;
    // Determine message type (1 or 2)
    const i1psfx = ipa === 1 && (w1.endsWith("/P") || w1.includes("/P "));
    const i2psfx = ipb === 1 && (w2.endsWith("/P") || w2.includes("/P "));
    const i3 = i1psfx || i2psfx ? 2 : 1;
    // Decode the grid/report/special from the last word
    let igrid4;
    let ir = 0;
    if (parts.length === 2) {
        // Two-word message: <call1> <call2>  → special irpt=1
        igrid4 = MAXGRID4 + 1;
        ir = 0;
    }
    else {
        // Check whether wLast is a grid, report, or special
        const lastUpper = wLast.toUpperCase();
        if (isGrid4(lastUpper)) {
            igrid4 = packgrid4(lastUpper);
            ir = parts.length === 4 && parts[2] === "R" ? 1 : 0;
        }
        else if (lastUpper === "RRR") {
            igrid4 = MAXGRID4 + 2;
            ir = 0;
        }
        else if (lastUpper === "RR73") {
            igrid4 = MAXGRID4 + 3;
            ir = 0;
        }
        else if (lastUpper === "73") {
            igrid4 = MAXGRID4 + 4;
            ir = 0;
        }
        else if (/^R[+-]\d+$/.test(lastUpper)) {
            ir = 1;
            const reportStr = lastUpper.slice(1); // strip leading R
            let irpt = parseInt(reportStr, 10);
            if (irpt >= -50 && irpt <= -31)
                irpt += 101;
            irpt += 35;
            igrid4 = MAXGRID4 + irpt;
        }
        else if (/^[+-]\d+$/.test(lastUpper)) {
            ir = 0;
            let irpt = parseInt(lastUpper, 10);
            if (irpt >= -50 && irpt <= -31)
                irpt += 101;
            irpt += 35;
            igrid4 = MAXGRID4 + irpt;
        }
        else {
            return null; // Not a valid Type 1 last word
        }
    }
    const n28a = pack28(call1);
    const n28b = pack28(call2);
    const bits = [];
    appendBits(bits, n28a, 28);
    appendBits(bits, ipa, 1);
    appendBits(bits, n28b, 28);
    appendBits(bits, ipb, 1);
    appendBits(bits, ir, 1);
    appendBits(bits, igrid4, 15);
    appendBits(bits, i3, 3);
    return bits;
}
function isGrid4(s) {
    return (s.length === 4 &&
        s[0] >= "A" &&
        s[0] <= "R" &&
        s[1] >= "A" &&
        s[1] <= "R" &&
        s[2] >= "0" &&
        s[2] <= "9" &&
        s[3] >= "0" &&
        s[3] <= "9");
}
/**
 * Type 4: one nonstandard (or hashed <...>) call + one standard call.
 * Format:  <HASH> CALL [RRR|RR73|73]
 *          CALL <HASH> [RRR|RR73|73]
 *          CQ NONSTDCALL
 *
 * Bit layout: n12(12) n58(58) iflip(1) nrpt(2) icq(1) i3=4(3)  → 77 bits
 */
function tryPackType4(parts) {
    if (parts.length < 2 || parts.length > 3)
        return null;
    const w1 = parts[0];
    const w2 = parts[1];
    const w3 = parts[2]; // optional
    let icq = 0;
    let iflip = 0;
    let n12 = 0;
    let n58 = 0n;
    let nrpt = 0;
    const parsedW1 = parseCallsign(w1);
    const parsedW2 = parseCallsign(w2);
    // If both are standard callsigns (no hash), type 4 doesn't apply
    if (parsedW1.isStandard && parsedW2.isStandard && !w1.startsWith("<") && !w2.startsWith("<"))
        return null;
    if (w1 === "CQ") {
        // CQ <nonstdcall>
        if (w2.length <= 4)
            return null; // too short for type 4
        icq = 1;
        iflip = 0;
        // save_hash_call updates n12 with ihashcall12 of the callsign
        n12 = ihashcall12(w2);
        const c11 = w2.padStart(11, " ");
        n58 = encodeC11(c11);
        nrpt = 0;
    }
    else if (w1.startsWith("<") && w1.endsWith(">")) {
        // <HASH> CALL [rpt]
        iflip = 0;
        const inner = w1.slice(1, -1);
        n12 = ihashcall12(inner);
        const c11 = w2.padStart(11, " ");
        n58 = encodeC11(c11);
        nrpt = decodeRpt(w3);
    }
    else if (w2.startsWith("<") && w2.endsWith(">")) {
        // CALL <HASH> [rpt]
        iflip = 1;
        const inner = w2.slice(1, -1);
        n12 = ihashcall12(inner);
        const c11 = w1.padStart(11, " ");
        n58 = encodeC11(c11);
        nrpt = decodeRpt(w3);
    }
    else {
        return null;
    }
    const i3 = 4;
    const bits = [];
    appendBits(bits, n12, 12);
    // n58 is a BigInt, need 58 bits
    for (let b = 57; b >= 0; b--) {
        bits.push(Number((n58 >> BigInt(b)) & 1n));
    }
    appendBits(bits, iflip, 1);
    appendBits(bits, nrpt, 2);
    appendBits(bits, icq, 1);
    appendBits(bits, i3, 3);
    return bits;
}
function ihashcall12(c0) {
    let n8 = 0n;
    const s = c0.padEnd(11, " ").slice(0, 11).toUpperCase();
    for (let i = 0; i < 11; i++) {
        const j = C38.indexOf(s[i] ?? " ");
        n8 = 38n * n8 + BigInt(j < 0 ? 0 : j);
    }
    const MAGIC = 47055833459n;
    const prod = BigInt.asUintN(64, MAGIC * n8);
    return Number(prod >> 52n) & 0xfff; // 12 bits
}
function encodeC11(c11) {
    const padded = c11.padStart(11, " ");
    let n = 0n;
    for (let i = 0; i < 11; i++) {
        const j = C38.indexOf(padded[i].toUpperCase());
        n = n * 38n + BigInt(j < 0 ? 0 : j);
    }
    return n;
}
function decodeRpt(w) {
    if (!w)
        return 0;
    if (w === "RRR")
        return 1;
    if (w === "RR73")
        return 2;
    if (w === "73")
        return 3;
    return 0;
}
function packFreeText(msg) {
    // Truncate to 13 chars, only characters from FTALPH
    const raw = msg.slice(0, 13).toUpperCase();
    const bits71 = packtext77(raw);
    // Type 0.0: n3=0, i3=0 → last 6 bits are 000 000
    const bits = [...bits71, 0, 0, 0, 0, 0, 0];
    return bits; // 77 bits
}

const TWO_PI$1 = 2 * Math.PI;
const FT8_DEFAULT_SAMPLE_RATE = 12_000;
const FT8_DEFAULT_SAMPLES_PER_SYMBOL = 1_920;
const FT8_DEFAULT_BT = 2.0;
const MODULATION_INDEX = 1.0;
function assertPositiveFinite(value, name) {
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${name} must be a positive finite number`);
    }
}
// Abramowitz and Stegun 7.1.26 approximation.
function erfApprox(x) {
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * ax);
    const y = 1 -
        ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
            t *
            Math.exp(-ax * ax);
    return sign * y;
}
function gfskPulse(bt, tt) {
    // Same expression used by lib/ft2/gfsk_pulse.f90.
    const scale = Math.PI * Math.sqrt(2 / Math.log(2)) * bt;
    return 0.5 * (erfApprox(scale * (tt + 0.5)) - erfApprox(scale * (tt - 0.5)));
}
function generateGfskWaveform(tones, options, defaults, shape) {
    const nsym = tones.length;
    if (nsym === 0) {
        return new Float32Array(0);
    }
    const sampleRate = options.sampleRate ?? defaults.sampleRate;
    const nsps = options.samplesPerSymbol ?? defaults.samplesPerSymbol;
    const bt = options.bt ?? defaults.bt;
    const f0 = options.baseFrequency ?? 0;
    const initialPhase = options.initialPhase ?? 0;
    assertPositiveFinite(sampleRate, "sampleRate");
    assertPositiveFinite(nsps, "samplesPerSymbol");
    assertPositiveFinite(bt, "bt");
    if (!Number.isFinite(f0)) {
        throw new Error("baseFrequency must be finite");
    }
    if (!Number.isFinite(initialPhase)) {
        throw new Error("initialPhase must be finite");
    }
    if (!Number.isInteger(nsps)) {
        throw new Error("samplesPerSymbol must be an integer");
    }
    const nwave = (nsym) * nsps;
    const pulse = new Float64Array(3 * nsps);
    for (let i = 0; i < pulse.length; i++) {
        const tt = (i + 1 - 1.5 * nsps) / nsps;
        pulse[i] = gfskPulse(bt, tt);
    }
    const dphi = new Float64Array((nsym + 2) * nsps);
    const dphiPeak = (TWO_PI$1 * MODULATION_INDEX) / nsps;
    for (let j = 0; j < nsym; j++) {
        const tone = tones[j];
        const ib = j * nsps;
        for (let i = 0; i < pulse.length; i++) {
            dphi[ib + i] += dphiPeak * pulse[i] * tone;
        }
    }
    const firstTone = tones[0];
    const lastTone = tones[nsym - 1];
    const tailBase = nsym * nsps;
    for (let i = 0; i < 2 * nsps; i++) {
        dphi[i] += dphiPeak * firstTone * pulse[nsps + i];
        dphi[tailBase + i] += dphiPeak * lastTone * pulse[i];
    }
    const carrierDphi = (TWO_PI$1 * f0) / sampleRate;
    for (let i = 0; i < dphi.length; i++) {
        dphi[i] += carrierDphi;
    }
    const wave = new Float32Array(nwave);
    let phi = initialPhase % TWO_PI$1;
    if (phi < 0)
        phi += TWO_PI$1;
    const phaseStart = nsps;
    for (let k = 0; k < nwave; k++) {
        const j = phaseStart + k;
        wave[k] = Math.sin(phi);
        phi += dphi[j];
        phi %= TWO_PI$1;
        if (phi < 0) {
            phi += TWO_PI$1;
        }
    }
    {
        const nramp = Math.round(nsps / 8);
        for (let i = 0; i < nramp; i++) {
            const up = (1 - Math.cos((TWO_PI$1 * i) / (2 * nramp))) / 2;
            wave[i] *= up;
        }
        const tailStart = nwave - nramp;
        for (let i = 0; i < nramp; i++) {
            const down = (1 + Math.cos((TWO_PI$1 * i) / (2 * nramp))) / 2;
            wave[tailStart + i] *= down;
        }
    }
    return wave;
}
function generateFT8Waveform(tones, options = {}) {
    // Mirrors the FT8 path in lib/ft8/gen_ft8wave.f90.
    return generateGfskWaveform(tones, options, {
        sampleRate: FT8_DEFAULT_SAMPLE_RATE,
        samplesPerSymbol: FT8_DEFAULT_SAMPLES_PER_SYMBOL,
        bt: FT8_DEFAULT_BT,
    });
}

/** FT8-specific constants (lib/ft8/ft8_params.f90). */
/** 7-symbol Costas array for sync. */
const COSTAS = [3, 1, 4, 0, 6, 5, 2];
/** 8-tone Gray mapping. */
const GRAY_MAP = [0, 1, 3, 2, 5, 6, 4, 7];

function generateLdpcGMatrix() {
    const K = 91;
    const M = 83; // 174 - 91
    const gen = Array.from({ length: M }, () => new Array(K).fill(0));
    for (let i = 0; i < M; i++) {
        const hexStr = gHex[i];
        for (let j = 0; j < 23; j++) {
            const val = parseInt(hexStr[j], 16);
            const limit = j === 22 ? 3 : 4;
            for (let jj = 1; jj <= limit; jj++) {
                const col = j * 4 + jj - 1; // 0-indexed
                if ((val & (1 << (4 - jj))) !== 0) {
                    gen[i][col] = 1;
                }
            }
        }
    }
    return gen;
}
const G = generateLdpcGMatrix();
function encode174_91(msg77) {
    const poly = 0x2757;
    let crc = 0;
    // padded with 19 zeros (3 zeros + 16 zero-bits for flush)
    const bitArray = [...msg77, 0, 0, 0, ...new Array(16).fill(0)];
    for (let bit = 0; bit < 96; bit++) {
        const nextBit = bitArray[bit];
        if ((crc & 0x2000) !== 0) {
            crc = ((crc << 1) | nextBit) ^ poly;
        }
        else {
            crc = (crc << 1) | nextBit;
        }
        crc &= 0x3fff;
    }
    const msg91 = [...msg77];
    for (let i = 0; i < 14; i++) {
        msg91.push((crc >> (13 - i)) & 1);
    }
    const codeword = [...msg91];
    for (let i = 0; i < 83; i++) {
        let sum = 0;
        for (let j = 0; j < 91; j++) {
            sum += msg91[j] * G[i][j];
        }
        codeword.push(sum % 2);
    }
    return codeword;
}
function getTones$1(codeword) {
    const tones = new Array(79).fill(0);
    for (let i = 0; i < 7; i++)
        tones[i] = COSTAS[i];
    for (let i = 0; i < 7; i++)
        tones[36 + i] = COSTAS[i];
    for (let i = 0; i < 7; i++)
        tones[72 + i] = COSTAS[i];
    let k = 7;
    for (let j = 1; j <= 58; j++) {
        const i = j * 3 - 3; // codeword is 0-indexed in JS, but the loop was j=1 to 58
        if (j === 30)
            k += 7;
        const indx = codeword[i] * 4 + codeword[i + 1] * 2 + codeword[i + 2];
        tones[k] = GRAY_MAP[indx];
        k++;
    }
    return tones;
}
function encodeMessage(msg) {
    const bits77 = pack77(msg);
    const codeword = encode174_91(bits77);
    return getTones$1(codeword);
}
function encode(msg, options = {}) {
    return generateFT8Waveform(encodeMessage(msg), options);
}

const NSPS = 1920;
const NFFT1 = 2 * NSPS; // 3840
const NSTEP = NSPS / 4; // 480
const NMAX = 15 * 12_000; // 180000
const NHSYM = Math.floor(NMAX / NSTEP) - 3; // 372
const NDOWN = 60;
const NN = 79;
const NFFT1_LONG = 192000;
const NFFT2 = 3200;
const NP2 = 2812;
const COSTAS_BLOCKS = 7;
const COSTAS_SYMBOL_LEN = 32;
const SYNC_TIME_SHIFTS = [0, 36, 72];
const TAPER_SIZE = 101;
const TAPER_LAST = TAPER_SIZE - 1;
const TWO_PI = 2 * Math.PI;
const MAX_DECODE_PASSES_DEPTH3 = 2;
const SUBTRACTION_GAIN = 0.95;
const SUBTRACTION_PHASE_SHIFT = Math.PI / 2;
const MIN_SUBTRACTION_SNR = -22;
const FS2 = SAMPLE_RATE$1 / NDOWN;
const DT2 = 1.0 / FS2;
const DOWNSAMPLE_DF = SAMPLE_RATE$1 / NFFT1_LONG;
const DOWNSAMPLE_BAUD = SAMPLE_RATE$1 / NSPS;
const DOWNSAMPLE_SCALE = Math.sqrt(NFFT2 / NFFT1_LONG);
const TAPER = buildTaper(TAPER_SIZE);
const COSTAS_SYNC = buildCostasSyncTemplates();
const FREQ_SHIFT_SYNC = buildFrequencyShiftSyncTemplates();
/**
 * Decode all FT8 signals in an audio buffer.
 * Input: mono audio samples at `sampleRate` Hz, duration ~15s.
 */
function decode(samples, options = {}) {
    const sampleRate = options.sampleRate ?? SAMPLE_RATE$1;
    const nfa = options.freqLow ?? 200;
    const nfb = options.freqHigh ?? 3000;
    const syncmin = options.syncMin ?? 1.2;
    const depth = options.depth ?? 2;
    const maxCandidates = options.maxCandidates ?? 300;
    const book = options.hashCallBook;
    const dd = sampleRate === SAMPLE_RATE$1
        ? copySamplesToDecodeWindow(samples)
        : resample(samples, sampleRate, SAMPLE_RATE$1, NMAX);
    const residual = new Float64Array(dd);
    const cxRe = new Float64Array(NFFT1_LONG);
    const cxIm = new Float64Array(NFFT1_LONG);
    const workspace = createDecodeWorkspace();
    const toneCache = new Map();
    const decoded = [];
    const seenMessages = new Set();
    const maxPasses = depth >= 3 ? MAX_DECODE_PASSES_DEPTH3 : 1;
    for (let pass = 0; pass < maxPasses; pass++) {
        cxRe.fill(0);
        cxIm.fill(0);
        cxRe.set(residual);
        fftComplex(cxRe, cxIm, false);
        const { candidates, sbase } = sync8(residual, nfa, nfb, syncmin, maxCandidates);
        const coarseFrequencyUses = countCandidateFrequencies(candidates);
        const coarseDownsampleCache = new Map();
        let decodedInPass = 0;
        for (const cand of candidates) {
            const result = ft8b(residual, cxRe, cxIm, cand.freq, cand.dt, sbase, depth, book, workspace, coarseDownsampleCache, coarseFrequencyUses);
            if (!result)
                continue;
            const messageKey = normalizeMessageKey(result.msg);
            if (seenMessages.has(messageKey))
                continue;
            seenMessages.add(messageKey);
            decoded.push({
                freq: result.freq,
                dt: result.dt - 0.5,
                snr: result.snr,
                msg: result.msg,
                sync: cand.sync,
            });
            decodedInPass++;
            if (pass + 1 < maxPasses) {
                subtractDecodedSignal(residual, result, toneCache);
            }
        }
        if (decodedInPass === 0)
            break;
    }
    return decoded;
}
function normalizeMessageKey(msg) {
    return msg.trim().replace(/\s+/g, " ").toUpperCase();
}
function countCandidateFrequencies(candidates) {
    const counts = new Map();
    for (const c of candidates) {
        counts.set(c.freq, (counts.get(c.freq) ?? 0) + 1);
    }
    return counts;
}
function createDecodeWorkspace() {
    return {
        cd0Re: new Float64Array(NFFT2),
        cd0Im: new Float64Array(NFFT2),
        shiftRe: new Float64Array(NFFT2),
        shiftIm: new Float64Array(NFFT2),
        s8: new Float64Array(8 * NN),
        csRe: new Float64Array(8 * NN),
        csIm: new Float64Array(8 * NN),
        symbRe: new Float64Array(COSTAS_SYMBOL_LEN),
        symbIm: new Float64Array(COSTAS_SYMBOL_LEN),
        s2: new Float64Array(1 << 9),
        bmeta: new Float64Array(N_LDPC),
        bmetb: new Float64Array(N_LDPC),
        bmetc: new Float64Array(N_LDPC),
        bmetd: new Float64Array(N_LDPC),
        llr: new Float64Array(N_LDPC),
        apmask: new Int8Array(N_LDPC),
        ss: new Float64Array(9),
    };
}
function copySamplesToDecodeWindow(samples) {
    const out = new Float64Array(NMAX);
    const len = Math.min(samples.length, NMAX);
    for (let i = 0; i < len; i++)
        out[i] = samples[i];
    return out;
}
function sync8(dd, nfa, nfb, syncmin, maxcand) {
    const JZ = 62;
    const fftSize = nextPow2(NFFT1); // 4096
    const halfSize = fftSize / 2;
    const tstep = NSTEP / SAMPLE_RATE$1;
    const df = SAMPLE_RATE$1 / fftSize;
    const fac = 1.0 / 300.0;
    const s = new Float64Array(halfSize * NHSYM);
    const savg = new Float64Array(halfSize);
    const xRe = new Float64Array(fftSize);
    const xIm = new Float64Array(fftSize);
    for (let j = 0; j < NHSYM; j++) {
        const ia = j * NSTEP;
        xRe.fill(0);
        xIm.fill(0);
        for (let i = 0; i < NSPS && ia + i < dd.length; i++)
            xRe[i] = fac * dd[ia + i];
        fftComplex(xRe, xIm, false);
        for (let i = 0; i < halfSize; i++) {
            const power = xRe[i] * xRe[i] + xIm[i] * xIm[i];
            s[i * NHSYM + j] = power;
            savg[i] = savg[i] + power;
        }
    }
    const sbase = computeBaseline(savg, nfa, nfb, df, halfSize);
    const ia = Math.max(1, Math.round(nfa / df));
    const ib = Math.min(halfSize - 14, Math.round(nfb / df));
    const nssy = Math.floor(NSPS / NSTEP);
    const nfos = Math.round(SAMPLE_RATE$1 / NSPS / df);
    const jstrt = Math.round(0.5 / tstep);
    const width = 2 * JZ + 1;
    const sync2d = new Float64Array((ib - ia + 1) * width);
    for (let i = ia; i <= ib; i++) {
        for (let jj = -JZ; jj <= JZ; jj++) {
            let ta = 0;
            let tb = 0;
            let tc = 0;
            let t0a = 0;
            let t0b = 0;
            let t0c = 0;
            for (let n = 0; n < COSTAS_BLOCKS; n++) {
                const m = jj + jstrt + nssy * n;
                const iCostas = i + nfos * COSTAS[n];
                if (m >= 0 && m < NHSYM && iCostas < halfSize) {
                    ta += s[iCostas * NHSYM + m];
                    for (let tone = 0; tone <= 6; tone++) {
                        const idx = i + nfos * tone;
                        if (idx < halfSize)
                            t0a += s[idx * NHSYM + m];
                    }
                }
                const m36 = m + nssy * 36;
                if (m36 >= 0 && m36 < NHSYM && iCostas < halfSize) {
                    tb += s[iCostas * NHSYM + m36];
                    for (let tone = 0; tone <= 6; tone++) {
                        const idx = i + nfos * tone;
                        if (idx < halfSize)
                            t0b += s[idx * NHSYM + m36];
                    }
                }
                const m72 = m + nssy * 72;
                if (m72 >= 0 && m72 < NHSYM && iCostas < halfSize) {
                    tc += s[iCostas * NHSYM + m72];
                    for (let tone = 0; tone <= 6; tone++) {
                        const idx = i + nfos * tone;
                        if (idx < halfSize)
                            t0c += s[idx * NHSYM + m72];
                    }
                }
            }
            const t = ta + tb + tc;
            const t0 = (t0a + t0b + t0c - t) / 6.0;
            const syncVal = t0 > 0 ? t / t0 : 0;
            const tbc = tb + tc;
            const t0bc = (t0b + t0c - tbc) / 6.0;
            const syncBc = t0bc > 0 ? tbc / t0bc : 0;
            sync2d[(i - ia) * width + (jj + JZ)] = Math.max(syncVal, syncBc);
        }
    }
    const candidates0 = [];
    const mlag = 10;
    for (let i = ia; i <= ib; i++) {
        let bestSync = -1;
        let bestJ = 0;
        for (let j = -mlag; j <= mlag; j++) {
            const v = sync2d[(i - ia) * width + (j + JZ)];
            if (v > bestSync) {
                bestSync = v;
                bestJ = j;
            }
        }
        let bestSync2 = -1;
        let bestJ2 = 0;
        for (let j = -JZ; j <= JZ; j++) {
            const v = sync2d[(i - ia) * width + (j + JZ)];
            if (v > bestSync2) {
                bestSync2 = v;
                bestJ2 = j;
            }
        }
        if (bestSync >= syncmin) {
            candidates0.push({
                freq: i * df,
                dt: (bestJ - 0.5) * tstep,
                sync: bestSync,
            });
        }
        if (bestJ2 !== bestJ && bestSync2 >= syncmin) {
            candidates0.push({
                freq: i * df,
                dt: (bestJ2 - 0.5) * tstep,
                sync: bestSync2,
            });
        }
    }
    const syncValues = candidates0.map((c) => c.sync);
    syncValues.sort((a, b) => a - b);
    const pctileIdx = Math.max(0, Math.round(0.4 * syncValues.length) - 1);
    const base = syncValues[pctileIdx] ?? 1;
    if (base > 0) {
        for (const c of candidates0)
            c.sync /= base;
    }
    for (let i = 0; i < candidates0.length; i++) {
        for (let j = 0; j < i; j++) {
            const fdiff = Math.abs(candidates0[i].freq - candidates0[j].freq);
            const tdiff = Math.abs(candidates0[i].dt - candidates0[j].dt);
            if (fdiff < 4.0 && tdiff < 0.04) {
                if (candidates0[i].sync >= candidates0[j].sync) {
                    candidates0[j].sync = 0;
                }
                else {
                    candidates0[i].sync = 0;
                }
            }
        }
    }
    const filtered = candidates0.filter((c) => c.sync >= syncmin);
    filtered.sort((a, b) => b.sync - a.sync);
    return { candidates: filtered.slice(0, maxcand), sbase };
}
function computeBaseline(savg, nfa, nfb, df, nh1) {
    const sbase = new Float64Array(nh1);
    const ia = Math.max(1, Math.round(nfa / df));
    const ib = Math.min(nh1 - 1, Math.round(nfb / df));
    const window = 50;
    for (let i = 0; i < nh1; i++) {
        let sum = 0;
        let count = 0;
        const lo = Math.max(ia, i - window);
        const hi = Math.min(ib, i + window);
        for (let j = lo; j <= hi; j++) {
            sum += savg[j];
            count++;
        }
        sbase[i] = count > 0 ? 10 * Math.log10(Math.max(1e-30, sum / count)) : 0;
    }
    return sbase;
}
function ft8b(_dd0, cxRe, cxIm, f1, xdt, _sbase, depth, book, workspace, coarseDownsampleCache, coarseFrequencyUses) {
    loadCoarseDownsample(cxRe, cxIm, f1, workspace, coarseDownsampleCache, coarseFrequencyUses);
    let ibest = findBestTimeOffset(workspace.cd0Re, workspace.cd0Im, xdt);
    const delfbest = findBestFrequencyShift(workspace.cd0Re, workspace.cd0Im, ibest);
    f1 += delfbest;
    ft8Downsample(cxRe, cxIm, f1, workspace);
    ibest = refineTimeOffset(workspace.cd0Re, workspace.cd0Im, ibest, workspace.ss);
    xdt = (ibest - 1) * DT2;
    extractSoftSymbols(workspace.cd0Re, workspace.cd0Im, ibest, workspace);
    const minCostasHits = depth >= 3 ? 6 : 7;
    if (!passesSyncGate(workspace.s8, minCostasHits))
        return null;
    buildBitMetrics(workspace);
    const result = tryDecodePasses(workspace, depth);
    if (!result)
        return null;
    if (result.cw.every((b) => b === 0))
        return null;
    const message77 = result.message91.slice(0, 77);
    if (!isValidMessageType(message77))
        return null;
    const { msg, success } = unpack77(message77, book);
    if (!success || msg.trim().length === 0)
        return null;
    const snr = estimateSnr(workspace.s8, result.cw);
    return { msg, freq: f1, dt: xdt, snr };
}
function loadCoarseDownsample(cxRe, cxIm, f0, workspace, coarseDownsampleCache, coarseFrequencyUses) {
    const cached = coarseDownsampleCache.get(f0);
    if (cached) {
        workspace.cd0Re.set(cached.re);
        workspace.cd0Im.set(cached.im);
    }
    else {
        ft8Downsample(cxRe, cxIm, f0, workspace);
        const uses = coarseFrequencyUses.get(f0) ?? 0;
        if (uses > 1) {
            coarseDownsampleCache.set(f0, {
                re: new Float64Array(workspace.cd0Re),
                im: new Float64Array(workspace.cd0Im),
            });
        }
    }
    const remaining = (coarseFrequencyUses.get(f0) ?? 1) - 1;
    if (remaining <= 0) {
        coarseFrequencyUses.delete(f0);
        coarseDownsampleCache.delete(f0);
    }
    else {
        coarseFrequencyUses.set(f0, remaining);
    }
}
function findBestTimeOffset(cd0Re, cd0Im, xdt) {
    const i0 = Math.round((xdt + 0.5) * FS2);
    let smax = 0;
    let ibest = i0;
    for (let idt = i0 - 10; idt <= i0 + 10; idt++) {
        const sync = sync8d(cd0Re, cd0Im, idt, COSTAS_SYNC.re, COSTAS_SYNC.im);
        if (sync > smax) {
            smax = sync;
            ibest = idt;
        }
    }
    return ibest;
}
function findBestFrequencyShift(cd0Re, cd0Im, ibest) {
    let smax = 0;
    let delfbest = 0;
    for (const tpl of FREQ_SHIFT_SYNC) {
        const sync = sync8d(cd0Re, cd0Im, ibest, tpl.re, tpl.im);
        if (sync > smax) {
            smax = sync;
            delfbest = tpl.delf;
        }
    }
    return delfbest;
}
function refineTimeOffset(cd0Re, cd0Im, ibest, ss) {
    for (let idt = -4; idt <= 4; idt++) {
        ss[idt + 4] = sync8d(cd0Re, cd0Im, ibest + idt, COSTAS_SYNC.re, COSTAS_SYNC.im);
    }
    let maxss = -1;
    let maxIdx = 4;
    for (let i = 0; i < 9; i++) {
        if (ss[i] > maxss) {
            maxss = ss[i];
            maxIdx = i;
        }
    }
    return ibest + maxIdx - 4;
}
function extractSoftSymbols(cd0Re, cd0Im, ibest, workspace) {
    const { s8, csRe, csIm, symbRe, symbIm } = workspace;
    for (let k = 0; k < NN; k++) {
        const i1 = ibest + k * COSTAS_SYMBOL_LEN;
        symbRe.fill(0);
        symbIm.fill(0);
        if (i1 >= 0 && i1 + COSTAS_SYMBOL_LEN - 1 < NP2) {
            for (let j = 0; j < COSTAS_SYMBOL_LEN; j++) {
                symbRe[j] = cd0Re[i1 + j];
                symbIm[j] = cd0Im[i1 + j];
            }
        }
        fftComplex(symbRe, symbIm, false);
        for (let tone = 0; tone < 8; tone++) {
            const re = symbRe[tone] / 1000;
            const im = symbIm[tone] / 1000;
            const idx = tone * NN + k;
            csRe[idx] = re;
            csIm[idx] = im;
            s8[idx] = Math.sqrt(re * re + im * im);
        }
    }
}
function passesSyncGate(s8, minCostasHits) {
    let nsync = 0;
    for (let k = 0; k < COSTAS_BLOCKS; k++) {
        for (const offset of SYNC_TIME_SHIFTS) {
            let maxTone = 0;
            let maxVal = -1;
            for (let t = 0; t < 8; t++) {
                const v = s8[t * NN + k + offset];
                if (v > maxVal) {
                    maxVal = v;
                    maxTone = t;
                }
            }
            if (maxTone === COSTAS[k])
                nsync++;
        }
    }
    return nsync >= minCostasHits;
}
function buildBitMetrics(workspace) {
    const { csRe, csIm, bmeta, bmetb, bmetc, bmetd, s2 } = workspace;
    bmeta.fill(0);
    bmetb.fill(0);
    bmetc.fill(0);
    bmetd.fill(0);
    for (let nsym = 1; nsym <= 3; nsym++) {
        const nt = 1 << (3 * nsym);
        const ibmax = nsym === 1 ? 2 : nsym === 2 ? 5 : 8;
        for (let ihalf = 1; ihalf <= 2; ihalf++) {
            for (let k = 1; k <= 29; k += nsym) {
                const ks = ihalf === 1 ? k + 7 : k + 43;
                for (let i = 0; i < nt; i++) {
                    const i1 = Math.floor(i / 64);
                    const i2 = Math.floor((i & 63) / 8);
                    const i3 = i & 7;
                    if (nsym === 1) {
                        const re = csRe[GRAY_MAP[i3] * NN + ks - 1];
                        const im = csIm[GRAY_MAP[i3] * NN + ks - 1];
                        s2[i] = Math.sqrt(re * re + im * im);
                    }
                    else if (nsym === 2) {
                        const sRe = csRe[GRAY_MAP[i2] * NN + ks - 1] + csRe[GRAY_MAP[i3] * NN + ks];
                        const sIm = csIm[GRAY_MAP[i2] * NN + ks - 1] + csIm[GRAY_MAP[i3] * NN + ks];
                        s2[i] = Math.sqrt(sRe * sRe + sIm * sIm);
                    }
                    else {
                        const sRe = csRe[GRAY_MAP[i1] * NN + ks - 1] +
                            csRe[GRAY_MAP[i2] * NN + ks] +
                            csRe[GRAY_MAP[i3] * NN + ks + 1];
                        const sIm = csIm[GRAY_MAP[i1] * NN + ks - 1] +
                            csIm[GRAY_MAP[i2] * NN + ks] +
                            csIm[GRAY_MAP[i3] * NN + ks + 1];
                        s2[i] = Math.sqrt(sRe * sRe + sIm * sIm);
                    }
                }
                const i32 = 1 + (k - 1) * 3 + (ihalf - 1) * 87;
                for (let ib = 0; ib <= ibmax; ib++) {
                    let max1 = -1e30;
                    let max0 = -1e30;
                    for (let i = 0; i < nt; i++) {
                        const bitSet = (i & (1 << (ibmax - ib))) !== 0;
                        if (bitSet) {
                            if (s2[i] > max1)
                                max1 = s2[i];
                        }
                        else {
                            if (s2[i] > max0)
                                max0 = s2[i];
                        }
                    }
                    const idx = i32 + ib - 1;
                    if (idx < 0 || idx >= N_LDPC)
                        continue;
                    const bm = max1 - max0;
                    if (nsym === 1) {
                        bmeta[idx] = bm;
                        const den = Math.max(max1, max0);
                        bmetd[idx] = den > 0 ? bm / den : 0;
                    }
                    else if (nsym === 2) {
                        bmetb[idx] = bm;
                    }
                    else {
                        bmetc[idx] = bm;
                    }
                }
            }
        }
    }
    normalizeBmet(bmeta);
    normalizeBmet(bmetb);
    normalizeBmet(bmetc);
    normalizeBmet(bmetd);
}
function tryDecodePasses(workspace, depth) {
    const scalefac = 2.83;
    const maxosd = depth >= 3 ? 2 : depth >= 2 ? 0 : -1;
    const bmetrics = [workspace.bmeta, workspace.bmetb, workspace.bmetc, workspace.bmetd];
    workspace.apmask.fill(0);
    for (let ipass = 0; ipass < 4; ipass++) {
        const metric = bmetrics[ipass];
        for (let i = 0; i < N_LDPC; i++)
            workspace.llr[i] = scalefac * metric[i];
        const result = decode174_91(workspace.llr, workspace.apmask, maxosd);
        if (result && result.nharderrors >= 0 && result.nharderrors <= 36)
            return result;
    }
    return null;
}
function isValidMessageType(message77) {
    const n3v = (message77[71] << 2) | (message77[72] << 1) | message77[73];
    const i3v = (message77[74] << 2) | (message77[75] << 1) | message77[76];
    if (i3v > 5 || (i3v === 0 && n3v > 6))
        return false;
    if (i3v === 0 && n3v === 2)
        return false;
    return true;
}
function estimateSnr(s8, cw) {
    let xsig = 0;
    let xnoi = 0;
    const itone = getTones(cw);
    for (let i = 0; i < 79; i++) {
        xsig += s8[itone[i] * NN + i] ** 2;
        const ios = (itone[i] + 4) % 7;
        xnoi += s8[ios * NN + i] ** 2;
    }
    let snr = 0.001;
    const arg = xsig / Math.max(xnoi, 1e-30) - 1.0;
    if (arg > 0.1)
        snr = arg;
    snr = 10 * Math.log10(snr) - 27.0;
    return snr < -24 ? -24 : snr;
}
function getTones(cw) {
    const tones = new Array(79).fill(0);
    for (let i = 0; i < 7; i++)
        tones[i] = COSTAS[i];
    for (let i = 0; i < 7; i++)
        tones[36 + i] = COSTAS[i];
    for (let i = 0; i < 7; i++)
        tones[72 + i] = COSTAS[i];
    let k = 7;
    for (let j = 1; j <= 58; j++) {
        const i = (j - 1) * 3;
        if (j === 30)
            k += 7;
        const indx = cw[i] * 4 + cw[i + 1] * 2 + cw[i + 2];
        tones[k] = GRAY_MAP[indx];
        k++;
    }
    return tones;
}
/**
 * Mix f0 to baseband and decimate by NDOWN (60x) by extracting frequency bins.
 * Identical to Fortran ft8_downsample.
 */
function ft8Downsample(cxRe, cxIm, f0, workspace) {
    const { cd0Re, cd0Im, shiftRe, shiftIm } = workspace;
    const df = DOWNSAMPLE_DF;
    const baud = DOWNSAMPLE_BAUD;
    const i0 = Math.round(f0 / df);
    const ft = f0 + 8.5 * baud;
    const it = Math.min(Math.round(ft / df), NFFT1_LONG / 2);
    const fb = f0 - 1.5 * baud;
    const ib = Math.max(1, Math.round(fb / df));
    cd0Re.fill(0);
    cd0Im.fill(0);
    let k = 0;
    for (let i = ib; i <= it; i++) {
        if (k >= NFFT2)
            break;
        cd0Re[k] = cxRe[i];
        cd0Im[k] = cxIm[i];
        k++;
    }
    for (let i = 0; i <= TAPER_LAST; i++) {
        if (i >= NFFT2)
            break;
        const tap = TAPER[TAPER_LAST - i];
        cd0Re[i] = cd0Re[i] * tap;
        cd0Im[i] = cd0Im[i] * tap;
    }
    const endTap = k - 1;
    for (let i = 0; i <= TAPER_LAST; i++) {
        const idx = endTap - TAPER_LAST + i;
        if (idx >= 0 && idx < NFFT2) {
            const tap = TAPER[i];
            cd0Re[idx] = cd0Re[idx] * tap;
            cd0Im[idx] = cd0Im[idx] * tap;
        }
    }
    const shift = i0 - ib;
    for (let i = 0; i < NFFT2; i++) {
        let srcIdx = (i + shift) % NFFT2;
        if (srcIdx < 0)
            srcIdx += NFFT2;
        shiftRe[i] = cd0Re[srcIdx];
        shiftIm[i] = cd0Im[srcIdx];
    }
    for (let i = 0; i < NFFT2; i++) {
        cd0Re[i] = shiftRe[i];
        cd0Im[i] = shiftIm[i];
    }
    fftComplex(cd0Re, cd0Im, true);
    for (let i = 0; i < NFFT2; i++) {
        cd0Re[i] = cd0Re[i] * DOWNSAMPLE_SCALE;
        cd0Im[i] = cd0Im[i] * DOWNSAMPLE_SCALE;
    }
}
function sync8d(cd0Re, cd0Im, i0, syncRe, syncIm) {
    let sync = 0;
    const stride = 36 * COSTAS_SYMBOL_LEN;
    for (let i = 0; i < COSTAS_BLOCKS; i++) {
        const base = i * COSTAS_SYMBOL_LEN;
        let iStart = i0 + i * COSTAS_SYMBOL_LEN;
        for (let block = 0; block < 3; block++, iStart += stride) {
            if (iStart < 0 || iStart + COSTAS_SYMBOL_LEN - 1 >= NP2)
                continue;
            let zRe = 0;
            let zIm = 0;
            for (let j = 0; j < COSTAS_SYMBOL_LEN; j++) {
                const sRe = syncRe[base + j];
                const sIm = syncIm[base + j];
                const dRe = cd0Re[iStart + j];
                const dIm = cd0Im[iStart + j];
                zRe += dRe * sRe + dIm * sIm;
                zIm += dIm * sRe - dRe * sIm;
            }
            sync += zRe * zRe + zIm * zIm;
        }
    }
    return sync;
}
function normalizeBmet(bmet) {
    const n = bmet.length;
    let sum = 0;
    let sum2 = 0;
    for (let i = 0; i < n; i++) {
        sum += bmet[i];
        sum2 += bmet[i] * bmet[i];
    }
    const avg = sum / n;
    const avg2 = sum2 / n;
    const variance = avg2 - avg * avg;
    const sigma = variance > 0 ? Math.sqrt(variance) : Math.sqrt(avg2);
    if (sigma > 0) {
        for (let i = 0; i < n; i++)
            bmet[i] = bmet[i] / sigma;
    }
}
function resample(input, fromRate, toRate, outLen) {
    const out = new Float64Array(outLen);
    const ratio = fromRate / toRate;
    for (let i = 0; i < outLen; i++) {
        const srcIdx = i * ratio;
        const lo = Math.floor(srcIdx);
        const frac = srcIdx - lo;
        const v0 = lo < input.length ? (input[lo] ?? 0) : 0;
        const v1 = lo + 1 < input.length ? (input[lo + 1] ?? 0) : 0;
        out[i] = v0 * (1 - frac) + v1 * frac;
    }
    return out;
}
function subtractDecodedSignal(residual, result, toneCache) {
    if (result.snr < MIN_SUBTRACTION_SNR)
        return;
    const msgKey = normalizeMessageKey(result.msg);
    let tones = toneCache.get(msgKey);
    if (!tones) {
        try {
            tones = encodeMessage(result.msg);
        }
        catch {
            return;
        }
        toneCache.set(msgKey, tones);
    }
    const waveI = generateFT8Waveform(tones, {
        sampleRate: SAMPLE_RATE$1,
        samplesPerSymbol: NSPS,
        baseFrequency: result.freq,
        initialPhase: 0,
    });
    const waveQ = generateFT8Waveform(tones, {
        sampleRate: SAMPLE_RATE$1,
        samplesPerSymbol: NSPS,
        baseFrequency: result.freq,
        initialPhase: SUBTRACTION_PHASE_SHIFT,
    });
    const start = Math.round(result.dt * SAMPLE_RATE$1);
    let srcStart = start;
    let tplStart = 0;
    if (srcStart < 0) {
        tplStart = -srcStart;
        srcStart = 0;
    }
    const maxLen = Math.min(residual.length - srcStart, waveI.length - tplStart, waveQ.length - tplStart);
    if (maxLen <= 0)
        return;
    let sii = 0;
    let sqq = 0;
    let siq = 0;
    let sri = 0;
    let srq = 0;
    for (let i = 0; i < maxLen; i++) {
        const wi = waveI[tplStart + i];
        const wq = waveQ[tplStart + i];
        const rv = residual[srcStart + i];
        sii += wi * wi;
        sqq += wq * wq;
        siq += wi * wq;
        sri += rv * wi;
        srq += rv * wq;
    }
    const det = sii * sqq - siq * siq;
    if (det <= 1e-9)
        return;
    const ampI = (sri * sqq - srq * siq) / det;
    const ampQ = (srq * sii - sri * siq) / det;
    for (let i = 0; i < maxLen; i++) {
        const wi = waveI[tplStart + i];
        const wq = waveQ[tplStart + i];
        const idx = srcStart + i;
        residual[idx] = residual[idx] - SUBTRACTION_GAIN * (ampI * wi + ampQ * wq);
    }
}
function buildTaper(size) {
    const taper = new Float64Array(size);
    const last = size - 1;
    for (let i = 0; i < size; i++)
        taper[i] = 0.5 * (1.0 + Math.cos((i * Math.PI) / last));
    return taper;
}
function buildCostasSyncTemplates() {
    const re = new Float64Array(COSTAS_BLOCKS * COSTAS_SYMBOL_LEN);
    const im = new Float64Array(COSTAS_BLOCKS * COSTAS_SYMBOL_LEN);
    for (let i = 0; i < COSTAS_BLOCKS; i++) {
        let phi = 0;
        const dphi = (TWO_PI * COSTAS[i]) / COSTAS_SYMBOL_LEN;
        for (let j = 0; j < COSTAS_SYMBOL_LEN; j++) {
            re[i * COSTAS_SYMBOL_LEN + j] = Math.cos(phi);
            im[i * COSTAS_SYMBOL_LEN + j] = Math.sin(phi);
            phi = (phi + dphi) % TWO_PI;
        }
    }
    return { re, im };
}
function buildFrequencyShiftSyncTemplates() {
    const templates = [];
    for (let ifr = -5; ifr <= 5; ifr++) {
        const delf = ifr * 0.5;
        const dphi = TWO_PI * delf * DT2;
        const twkRe = new Float64Array(COSTAS_SYMBOL_LEN);
        const twkIm = new Float64Array(COSTAS_SYMBOL_LEN);
        let phi = 0;
        for (let j = 0; j < COSTAS_SYMBOL_LEN; j++) {
            twkRe[j] = Math.cos(phi);
            twkIm[j] = Math.sin(phi);
            phi = (phi + dphi) % TWO_PI;
        }
        const re = new Float64Array(COSTAS_BLOCKS * COSTAS_SYMBOL_LEN);
        const im = new Float64Array(COSTAS_BLOCKS * COSTAS_SYMBOL_LEN);
        for (let i = 0; i < COSTAS_BLOCKS; i++) {
            const base = i * COSTAS_SYMBOL_LEN;
            for (let j = 0; j < COSTAS_SYMBOL_LEN; j++) {
                const idx = base + j;
                const csRe = COSTAS_SYNC.re[idx];
                const csIm = COSTAS_SYNC.im[idx];
                const tRe = twkRe[j] * csRe - twkIm[j] * csIm;
                const tIm = twkRe[j] * csIm + twkIm[j] * csRe;
                re[idx] = tRe;
                im[idx] = tIm;
            }
        }
        templates.push({ delf, re, im });
    }
    return templates;
}

/// <reference types="node" />
/**
 * Parse a WAV file buffer into sample rate and normalized float samples.
 * Supports PCM format 1, 8/16/32-bit samples.
 */
function parseWavBuffer(buf) {
    if (buf.length < 44)
        throw new Error("File too small for WAV");
    const riff = buf.toString("ascii", 0, 4);
    const wave = buf.toString("ascii", 8, 12);
    if (riff !== "RIFF" || wave !== "WAVE")
        throw new Error("Not a WAV file");
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
        }
        else if (chunkId === "data") {
            dataOffset = offset;
            dataSize = chunkSize;
            break;
        }
        offset += chunkSize;
    }
    if (!fmtFound)
        throw new Error("No fmt chunk found");
    if (audioFormat !== 1)
        throw new Error(`Unsupported audio format: ${audioFormat} (only PCM=1)`);
    if (dataOffset === 0)
        throw new Error("No data chunk found");
    const bytesPerSample = bitsPerSample / 8;
    const totalSamples = Math.floor(dataSize / (bytesPerSample * numChannels));
    const samples = new Float32Array(totalSamples);
    for (let i = 0; i < totalSamples; i++) {
        const pos = dataOffset + i * numChannels * bytesPerSample;
        let val;
        if (bitsPerSample === 16) {
            val = buf.readInt16LE(pos) / 32768;
        }
        else if (bitsPerSample === 32) {
            val = buf.readInt32LE(pos) / 2147483648;
        }
        else if (bitsPerSample === 8) {
            val = (buf.readUInt8(pos) - 128) / 128;
        }
        else {
            throw new Error(`Unsupported bits per sample: ${bitsPerSample}`);
        }
        samples[i] = val;
    }
    return { sampleRate, samples };
}
function floatToInt16(sample) {
    const clamped = Math.max(-1, Math.min(1, sample));
    return clamped < 0 ? Math.round(clamped * 0x8000) : Math.round(clamped * 0x7fff);
}
/**
 * Write mono 16-bit PCM WAV file from normalized float samples (-1..1).
 */
function writeMono16WavFile(filePath, samples, sampleRate) {
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
        wav.writeInt16LE(floatToInt16(samples[i]), offset + i * 2);
    }
    writeFileSync(filePath, wav);
}

const SAMPLE_RATE = 12_000;
const DEFAULT_OUTPUT = "output.wav";
const DEFAULT_DF_HZ = 1_000;
function printUsage() {
    console.error(`ft8ts - FT8 encoder/decoder

Usage:
  ft8ts decode <file.wav> [options]
  ft8ts encode "<message>" [options]

Decode options:
  --mode <ft8|ft4>  Mode: ft8 (default) or ft4
  --low <hz>     Lower frequency bound (default: 200)
  --high <hz>    Upper frequency bound (default: 3000)
  --depth <1|2|3>  Decoding depth (default: 2)
  --max-candidates <n>  Max candidate signals to decode (default: 300)

Encode options:
  --out <file>   Output WAV file (default: output.wav)
  --df <hz>      Base frequency in Hz (default: 1000)
`);
}
function formatMessage(d) {
    const freq = d.freq.toFixed(0).padStart(5);
    const dt = (d.dt >= 0 ? "+" : "") + d.dt.toFixed(1);
    const snr = (d.snr >= 0 ? "+" : "") + Math.round(d.snr).toString().padStart(3);
    return `${dt.padStart(5)}  ${snr}  ${freq}  ${d.msg}`;
}
function runDecode(argv) {
    if (argv.length === 0) {
        console.error("Error: missing input file");
        printUsage();
        process.exit(1);
    }
    const wavFile = argv[0];
    const options = {};
    let mode = "ft8";
    for (let i = 1; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--mode") {
            const value = argv[++i];
            if (value === "ft8" || value === "ft4") {
                mode = value;
            }
            else {
                throw new Error(`Invalid --mode: ${value ?? "(missing)"}. Use ft8 or ft4`);
            }
        }
        else if (arg === "--low") {
            options.freqLow = Number(argv[++i]);
        }
        else if (arg === "--high") {
            options.freqHigh = Number(argv[++i]);
        }
        else if (arg === "--depth") {
            options.depth = Number(argv[++i]);
        }
        else if (arg === "--max-candidates") {
            options.maxCandidates = Number(argv[++i]);
        }
        else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    const filePath = resolve(process.cwd(), wavFile);
    console.log(`Reading ${filePath}...`);
    const { sampleRate, samples } = parseWavBuffer(readFileSync(filePath));
    console.log(`WAV: ${sampleRate} Hz, ${samples.length} samples, ${(samples.length / sampleRate).toFixed(1)}s`);
    const startTime = performance.now();
    const decoded = mode === "ft4"
        ? decode$1(samples, { ...options, sampleRate })
        : decode(samples, { ...options, sampleRate });
    const elapsed = performance.now() - startTime;
    console.log(`\nDecoded ${decoded.length} messages in ${(elapsed / 1000).toFixed(2)}s:\n`);
    console.log("   dt  snr   freq  message");
    console.log("  ---  ---  -----  -------");
    for (const d of decoded) {
        console.log(formatMessage(d));
    }
}
function runEncode(argv) {
    if (argv.length === 0) {
        console.error("Error: missing message");
        printUsage();
        process.exit(1);
    }
    const message = argv[0];
    let outputFile = DEFAULT_OUTPUT;
    let dfHz = DEFAULT_DF_HZ;
    for (let i = 1; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--out") {
            i++;
            const value = argv[i];
            if (!value)
                throw new Error("Missing value for --out");
            outputFile = value;
        }
        else if (arg === "--df") {
            i++;
            const value = argv[i];
            if (!value)
                throw new Error("Missing value for --df");
            const parsed = Number(value);
            if (!Number.isFinite(parsed) || parsed < 0) {
                throw new Error(`Invalid --df value: ${value}`);
            }
            dfHz = parsed;
        }
        else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    const waveform = encode(message, {
        sampleRate: SAMPLE_RATE,
        samplesPerSymbol: 1_920,
        baseFrequency: dfHz,
    });
    const outPath = resolve(process.cwd(), outputFile);
    writeMono16WavFile(outPath, waveform, SAMPLE_RATE);
    console.log(`Wrote ${outPath} (${waveform.length} samples, ${(waveform.length / SAMPLE_RATE).toFixed(3)} s)`);
}
function main() {
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
        }
        else if (subcommand === "encode") {
            runEncode(subArgs);
        }
        else {
            console.error(`Error: unknown subcommand '${subcommand}'`);
            printUsage();
            process.exit(1);
        }
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`Error: ${msg}`);
        printUsage();
        process.exit(1);
    }
}
main();
//# sourceMappingURL=cli.js.map
