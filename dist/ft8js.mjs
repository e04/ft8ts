const SAMPLE_RATE = 12_000;
const NSPS = 1920;
const NFFT1 = 2 * NSPS; // 3840
const NSTEP = NSPS / 4; // 480
const NMAX = 15 * SAMPLE_RATE; // 180000
const NHSYM = Math.floor(NMAX / NSTEP) - 3; // 372
const NDOWN = 60;
const NN = 79;
const KK = 91;
const N_LDPC = 174;
const M_LDPC = N_LDPC - KK; // 83
const icos7 = [3, 1, 4, 0, 6, 5, 2];
const graymap = [0, 1, 3, 2, 5, 6, 4, 7];
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
    // Sort by reliability (descending)
    const indices = Array.from({ length: N }, (_, i) => i);
    indices.sort((a, b) => Math.abs(llr[b]) - Math.abs(llr[a]));
    // Reorder generator matrix columns
    const genmrb = new Uint8Array(K * N);
    for (let i = 0; i < N; i++) {
        for (let k = 0; k < K; k++) {
            genmrb[k * N + i] = gen[k * N + indices[i]];
        }
    }
    // Gaussian elimination to get systematic form on the K most-reliable bits
    for (let id = 0; id < K; id++) {
        let found = false;
        for (let icol = id; icol < Math.min(K + 20, N); icol++) {
            if (genmrb[id * N + icol] === 1) {
                if (icol !== id) {
                    // Swap columns
                    for (let k = 0; k < K; k++) {
                        const tmp = genmrb[k * N + id];
                        genmrb[k * N + id] = genmrb[k * N + icol];
                        genmrb[k * N + icol] = tmp;
                    }
                    const tmp = indices[id];
                    indices[id] = indices[icol];
                    indices[icol] = tmp;
                }
                for (let ii = 0; ii < K; ii++) {
                    if (ii !== id && genmrb[ii * N + id] === 1) {
                        for (let c = 0; c < N; c++) {
                            genmrb[ii * N + c] ^= genmrb[id * N + c];
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
        hdec[i] = llr[indices[i]] >= 0 ? 1 : 0;
    }
    const absrx = new Float64Array(N);
    for (let i = 0; i < N; i++) {
        absrx[i] = Math.abs(llr[indices[i]]);
    }
    // Transpose of reordered gen matrix
    const g2 = new Uint8Array(N * K);
    for (let i = 0; i < K; i++) {
        for (let j = 0; j < N; j++) {
            g2[j * K + i] = genmrb[i * N + j];
        }
    }
    function mrbencode(me) {
        const codeword = new Int8Array(N);
        for (let i = 0; i < K; i++) {
            if (me[i] === 1) {
                for (let j = 0; j < N; j++) {
                    codeword[j] ^= g2[j * K + i];
                }
            }
        }
        return codeword;
    }
    const m0 = hdec.slice(0, K);
    const c0 = mrbencode(m0);
    const bestCw = new Int8Array(c0);
    let dmin = 0;
    for (let i = 0; i < N; i++) {
        const x = c0[i] ^ hdec[i];
        dmin += x * absrx[i];
    }
    // Order-1: flip single bits in the info portion
    for (let i1 = K - 1; i1 >= 0; i1--) {
        if (apmask[indices[i1]] === 1)
            continue;
        const me = new Int8Array(m0);
        me[i1] ^= 1;
        const ce = mrbencode(me);
        let dd = 0;
        for (let j = 0; j < N; j++) {
            const x = ce[j] ^ hdec[j];
            dd += x * absrx[j];
        }
        if (dd < dmin) {
            dmin = dd;
            bestCw.set(ce);
        }
    }
    // Order-2: flip pairs of least-reliable info bits (limited search)
    if (norder >= 2) {
        const ntry = Math.min(40, K);
        for (let i1 = K - 1; i1 >= K - ntry; i1--) {
            if (apmask[indices[i1]] === 1)
                continue;
            for (let i2 = i1 - 1; i2 >= K - ntry; i2--) {
                if (apmask[indices[i2]] === 1)
                    continue;
                const me = new Int8Array(m0);
                me[i1] ^= 1;
                me[i2] ^= 1;
                const ce = mrbencode(me);
                let dd = 0;
                for (let j = 0; j < N; j++) {
                    const x = ce[j] ^ hdec[j];
                    dd += x * absrx[j];
                }
                if (dd < dmin) {
                    dmin = dd;
                    bestCw.set(ce);
                }
            }
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
    const hdecOrig = new Int8Array(N);
    for (let i = 0; i < N; i++)
        hdecOrig[i] = llr[i] >= 0 ? 1 : 0;
    let nhe = 0;
    for (let i = 0; i < N; i++) {
        const x = finalCw[i] ^ hdecOrig[i];
        nhe += x;
        dminOrig += x * Math.abs(llr[i]);
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
function fftComplex(re, im, inverse) {
    const n = re.length;
    if (n <= 1)
        return;
    // Bit-reversal permutation
    let j = 0;
    for (let i = 0; i < n; i++) {
        if (j > i) {
            let tmp = re[i];
            re[i] = re[j];
            re[j] = tmp;
            tmp = im[i];
            im[i] = im[j];
            im[j] = tmp;
        }
        let m = n >> 1;
        while (m >= 1 && j >= m) {
            j -= m;
            m >>= 1;
        }
        j += m;
    }
    const sign = -1;
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
function unpack28(n28) {
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
        // CQ with 4-letter directed call
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
        // Hashed call – we don't have a hash table, so show <...>
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
 */
function unpack77(bits77) {
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
        const { call: call1, success: ok1 } = unpack28(n28a);
        const { call: call2Raw, success: ok2 } = unpack28(n28b);
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
        let n58 = 0n;
        for (let i = 0; i < 58; i++) {
            n58 = n58 * 2n + BigInt(bits77[12 + i] ?? 0);
        }
        const iflip = bits77[70];
        const nrpt = bitsToUint(bits77, 71, 2);
        const icq = bits77[73];
        // Decode n58 to 11-char string using C38 alphabet
        const c11chars = [];
        let remain = n58;
        for (let i = 10; i >= 0; i--) {
            const j = Number(remain % 38n);
            remain = remain / 38n;
            c11chars.unshift(C38[j] ?? " ");
        }
        const c11 = c11chars.join("").trim();
        const call3 = "<...>"; // We don't have a hash table for n12
        let call1;
        let call2;
        if (iflip === 0) {
            call1 = call3;
            call2 = c11;
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

/**
 * Decode all FT8 signals in an audio buffer.
 * Input: mono audio samples at `sampleRate` Hz, duration ~15s.
 */
function decode(samples, sampleRate = SAMPLE_RATE, options = {}) {
    const nfa = options.freqLow ?? 200;
    const nfb = options.freqHigh ?? 3000;
    const syncmin = options.syncMin ?? 1.2;
    const depth = options.depth ?? 2;
    const maxCandidates = options.maxCandidates ?? 300;
    // Resample to 12000 Hz if needed
    let dd;
    if (sampleRate === SAMPLE_RATE) {
        dd = new Float64Array(NMAX);
        const len = Math.min(samples.length, NMAX);
        for (let i = 0; i < len; i++)
            dd[i] = samples[i];
    }
    else {
        dd = resample(samples, sampleRate, SAMPLE_RATE, NMAX);
    }
    // Compute spectrogram and find sync candidates
    const { candidates, sbase } = sync8(dd, nfa, nfb, syncmin, maxCandidates);
    const decoded = [];
    const seenMessages = new Set();
    for (const cand of candidates) {
        const result = ft8b(dd, cand.freq, cand.dt, sbase, depth);
        if (!result)
            continue;
        if (seenMessages.has(result.msg))
            continue;
        seenMessages.add(result.msg);
        decoded.push({
            freq: result.freq,
            dt: result.dt - 0.5,
            snr: result.snr,
            msg: result.msg,
            sync: cand.sync,
        });
    }
    return decoded;
}
function sync8(dd, nfa, nfb, syncmin, maxcand) {
    const JZ = 62;
    // Fortran uses NFFT1=3840 for the spectrogram FFT; we need a power of 2
    const fftSize = nextPow2(NFFT1); // 4096
    const halfSize = fftSize / 2; // 2048
    const tstep = NSTEP / SAMPLE_RATE;
    const df = SAMPLE_RATE / fftSize;
    const fac = 1.0 / 300.0;
    // Compute symbol spectra, stepping by NSTEP
    const s = new Float64Array(halfSize * NHSYM);
    const savg = new Float64Array(halfSize);
    const xRe = new Float64Array(fftSize);
    const xIm = new Float64Array(fftSize);
    for (let j = 0; j < NHSYM; j++) {
        const ia = j * NSTEP;
        xRe.fill(0);
        xIm.fill(0);
        for (let i = 0; i < NSPS && ia + i < dd.length; i++) {
            xRe[i] = fac * dd[ia + i];
        }
        fftComplex(xRe, xIm);
        for (let i = 0; i < halfSize; i++) {
            const power = xRe[i] * xRe[i] + xIm[i] * xIm[i];
            s[i * NHSYM + j] = power;
            savg[i] = (savg[i] ?? 0) + power;
        }
    }
    // Compute baseline
    const sbase = computeBaseline(savg, nfa, nfb, df, halfSize);
    const ia = Math.max(1, Math.round(nfa / df));
    const ib = Math.min(halfSize - 14, Math.round(nfb / df));
    const nssy = Math.floor(NSPS / NSTEP);
    const nfos = Math.round(SAMPLE_RATE / NSPS / df); // ~2 bins per tone spacing
    const jstrt = Math.round(0.5 / tstep);
    // 2D sync correlation
    const sync2d = new Float64Array((ib - ia + 1) * (2 * JZ + 1));
    const width = 2 * JZ + 1;
    for (let i = ia; i <= ib; i++) {
        for (let jj = -JZ; jj <= JZ; jj++) {
            let ta = 0, tb = 0, tc = 0;
            let t0a = 0, t0b = 0, t0c = 0;
            for (let n = 0; n < 7; n++) {
                const m = jj + jstrt + nssy * n;
                const iCostas = i + nfos * icos7[n];
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
            const t0total = t0a + t0b + t0c;
            const t0 = (t0total - t) / 6.0;
            const syncVal = t0 > 0 ? t / t0 : 0;
            const tbc = tb + tc;
            const t0bc = t0b + t0c;
            const t0bc2 = (t0bc - tbc) / 6.0;
            const syncBc = t0bc2 > 0 ? tbc / t0bc2 : 0;
            sync2d[(i - ia) * width + (jj + JZ)] = Math.max(syncVal, syncBc);
        }
    }
    // Find peaks
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
        // Also check wider range
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
        if (Math.abs(bestJ2 - bestJ) > 0 && bestSync2 >= syncmin) {
            candidates0.push({
                freq: i * df,
                dt: (bestJ2 - 0.5) * tstep,
                sync: bestSync2,
            });
        }
    }
    // Compute baseline normalization for sync values
    const syncValues = candidates0.map((c) => c.sync);
    syncValues.sort((a, b) => a - b);
    const pctileIdx = Math.max(0, Math.round(0.4 * syncValues.length) - 1);
    const base = syncValues[pctileIdx] ?? 1;
    if (base > 0) {
        for (const c of candidates0)
            c.sync /= base;
    }
    // Remove near-duplicate candidates
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
    // Sort by sync descending, take top maxcand
    const filtered = candidates0.filter((c) => c.sync >= syncmin);
    filtered.sort((a, b) => b.sync - a.sync);
    return { candidates: filtered.slice(0, maxcand), sbase };
}
function computeBaseline(savg, nfa, nfb, df, nh1) {
    const sbase = new Float64Array(nh1);
    const ia = Math.max(1, Math.round(nfa / df));
    const ib = Math.min(nh1 - 1, Math.round(nfb / df));
    // Smooth the spectrum to get baseline
    const window = 50; // bins
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
function ft8b(dd0, f1, xdt, _sbase, depth) {
    const NFFT2 = 3200;
    const NP2 = 2812;
    const NFFT1_LONG = 192000;
    const fs2 = SAMPLE_RATE / NDOWN;
    const dt2 = 1.0 / fs2;
    const twopi = 2 * Math.PI;
    // Downsample: mix to baseband and filter
    const cd0Re = new Float64Array(NFFT2);
    const cd0Im = new Float64Array(NFFT2);
    ft8Downsample(dd0, f1, cd0Re, cd0Im, NFFT1_LONG, NFFT2);
    // Find best time offset
    const i0 = Math.round((xdt + 0.5) * fs2);
    let smax = 0;
    let ibest = i0;
    for (let idt = i0 - 10; idt <= i0 + 10; idt++) {
        const sync = sync8d(cd0Re, cd0Im, idt, null, null, false);
        if (sync > smax) {
            smax = sync;
            ibest = idt;
        }
    }
    // Fine frequency search
    smax = 0;
    let delfbest = 0;
    for (let ifr = -5; ifr <= 5; ifr++) {
        const delf = ifr * 0.5;
        const dphi = twopi * delf * dt2;
        const twkRe = new Float64Array(32);
        const twkIm = new Float64Array(32);
        let phi = 0;
        for (let i = 0; i < 32; i++) {
            twkRe[i] = Math.cos(phi);
            twkIm[i] = Math.sin(phi);
            phi = (phi + dphi) % twopi;
        }
        const sync = sync8d(cd0Re, cd0Im, ibest, twkRe, twkIm, true);
        if (sync > smax) {
            smax = sync;
            delfbest = delf;
        }
    }
    // Apply frequency correction and re-downsample
    f1 += delfbest;
    ft8Downsample(dd0, f1, cd0Re, cd0Im, NFFT1_LONG, NFFT2);
    // Refine time offset
    const ss = new Float64Array(9);
    for (let idt = -4; idt <= 4; idt++) {
        ss[idt + 4] = sync8d(cd0Re, cd0Im, ibest + idt, null, null, false);
    }
    let maxss = -1;
    let maxIdx = 4;
    for (let i = 0; i < 9; i++) {
        if (ss[i] > maxss) {
            maxss = ss[i];
            maxIdx = i;
        }
    }
    ibest = ibest + maxIdx - 4;
    xdt = (ibest - 1) * dt2;
    // Extract 8-tone soft symbols for each of NN=79 symbols
    const s8 = new Float64Array(8 * NN);
    const csRe = new Float64Array(8 * NN);
    const csIm = new Float64Array(8 * NN);
    const symbRe = new Float64Array(32);
    const symbIm = new Float64Array(32);
    for (let k = 0; k < NN; k++) {
        const i1 = ibest + k * 32;
        symbRe.fill(0);
        symbIm.fill(0);
        if (i1 >= 0 && i1 + 31 < NP2) {
            for (let j = 0; j < 32; j++) {
                symbRe[j] = cd0Re[i1 + j];
                symbIm[j] = cd0Im[i1 + j];
            }
        }
        fftComplex(symbRe, symbIm);
        for (let tone = 0; tone < 8; tone++) {
            const re = symbRe[tone] / 1000;
            const im = symbIm[tone] / 1000;
            csRe[tone * NN + k] = re;
            csIm[tone * NN + k] = im;
            s8[tone * NN + k] = Math.sqrt(re * re + im * im);
        }
    }
    // Sync quality check
    let nsync = 0;
    for (let k = 0; k < 7; k++) {
        for (const offset of [0, 36, 72]) {
            let maxTone = 0;
            let maxVal = -1;
            for (let t = 0; t < 8; t++) {
                const v = s8[t * NN + k + offset];
                if (v > maxVal) {
                    maxVal = v;
                    maxTone = t;
                }
            }
            if (maxTone === icos7[k])
                nsync++;
        }
    }
    if (nsync <= 6)
        return null;
    // Compute soft bit metrics for multiple nsym values (1, 2, 3)
    // and a normalized version, matching the Fortran ft8b passes 1-4
    const bmeta = new Float64Array(N_LDPC); // nsym=1
    const bmetb = new Float64Array(N_LDPC); // nsym=2
    const bmetc = new Float64Array(N_LDPC); // nsym=3
    const bmetd = new Float64Array(N_LDPC); // nsym=1 normalized
    for (let nsym = 1; nsym <= 3; nsym++) {
        const nt = 1 << (3 * nsym); // 8, 64, 512
        const ibmax = nsym === 1 ? 2 : nsym === 2 ? 5 : 8;
        for (let ihalf = 1; ihalf <= 2; ihalf++) {
            for (let k = 1; k <= 29; k += nsym) {
                const ks = ihalf === 1 ? k + 7 : k + 43;
                const s2 = new Float64Array(nt);
                for (let i = 0; i < nt; i++) {
                    const i1 = Math.floor(i / 64);
                    const i2 = Math.floor((i & 63) / 8);
                    const i3 = i & 7;
                    if (nsym === 1) {
                        const re = csRe[graymap[i3] * NN + ks - 1];
                        const im = csIm[graymap[i3] * NN + ks - 1];
                        s2[i] = Math.sqrt(re * re + im * im);
                    }
                    else if (nsym === 2) {
                        const sRe = csRe[graymap[i2] * NN + ks - 1] + csRe[graymap[i3] * NN + ks];
                        const sIm = csIm[graymap[i2] * NN + ks - 1] + csIm[graymap[i3] * NN + ks];
                        s2[i] = Math.sqrt(sRe * sRe + sIm * sIm);
                    }
                    else {
                        const sRe = csRe[graymap[i1] * NN + ks - 1] +
                            csRe[graymap[i2] * NN + ks] +
                            csRe[graymap[i3] * NN + ks + 1];
                        const sIm = csIm[graymap[i1] * NN + ks - 1] +
                            csIm[graymap[i2] * NN + ks] +
                            csIm[graymap[i3] * NN + ks + 1];
                        s2[i] = Math.sqrt(sRe * sRe + sIm * sIm);
                    }
                }
                // Fortran: i32 = 1 + (k-1)*3 + (ihalf-1)*87  (1-based)
                const i32 = 1 + (k - 1) * 3 + (ihalf - 1) * 87;
                for (let ib = 0; ib <= ibmax; ib++) {
                    // max of s2 where bit (ibmax-ib) of index is 1
                    let max1 = -1e30, max0 = -1e30;
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
                    const idx = i32 + ib - 1; // Convert to 0-based
                    if (idx >= 0 && idx < N_LDPC) {
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
    }
    normalizeBmet(bmeta);
    normalizeBmet(bmetb);
    normalizeBmet(bmetc);
    normalizeBmet(bmetd);
    const bmetrics = [bmeta, bmetb, bmetc, bmetd];
    const scalefac = 2.83;
    const maxosd = depth >= 3 ? 2 : depth >= 2 ? 0 : -1;
    const apmask = new Int8Array(N_LDPC);
    // Try 4 passes with different soft-symbol metrics (matching Fortran)
    let result = null;
    for (let ipass = 0; ipass < 4; ipass++) {
        const llr = new Float64Array(N_LDPC);
        for (let i = 0; i < N_LDPC; i++)
            llr[i] = scalefac * bmetrics[ipass][i];
        result = decode174_91(llr, apmask, maxosd);
        if (result && result.nharderrors >= 0 && result.nharderrors <= 36)
            break;
        result = null;
    }
    if (!result || result.nharderrors < 0 || result.nharderrors > 36)
        return null;
    // Check for all-zero codeword
    if (result.cw.every((b) => b === 0))
        return null;
    const message77 = result.message91.slice(0, 77);
    // Validate message type
    const n3v = (message77[71] << 2) | (message77[72] << 1) | message77[73];
    const i3v = (message77[74] << 2) | (message77[75] << 1) | message77[76];
    if (i3v > 5 || (i3v === 0 && n3v > 6))
        return null;
    if (i3v === 0 && n3v === 2)
        return null;
    // Unpack
    const { msg, success } = unpack77(message77);
    if (!success || msg.trim().length === 0)
        return null;
    // Estimate SNR
    let xsig = 0;
    let xnoi = 0;
    const itone = getTones$1(result.cw);
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
    if (snr < -24)
        snr = -24;
    return { msg, freq: f1, dt: xdt, snr };
}
function getTones$1(cw) {
    const tones = new Array(79).fill(0);
    for (let i = 0; i < 7; i++)
        tones[i] = icos7[i];
    for (let i = 0; i < 7; i++)
        tones[36 + i] = icos7[i];
    for (let i = 0; i < 7; i++)
        tones[72 + i] = icos7[i];
    let k = 7;
    for (let j = 1; j <= 58; j++) {
        const i = (j - 1) * 3;
        if (j === 30)
            k += 7;
        const indx = cw[i] * 4 + cw[i + 1] * 2 + cw[i + 2];
        tones[k] = graymap[indx];
        k++;
    }
    return tones;
}
/**
 * Mix f0 to baseband and decimate by NDOWN (60x).
 * Time-domain approach: mix down, low-pass filter via moving average, decimate.
 * Output: complex baseband signal at 200 Hz sample rate (32 samples/symbol).
 */
function ft8Downsample(dd, f0, outRe, outIm, _nfft1Long, nfft2) {
    const twopi = 2 * Math.PI;
    const len = Math.min(dd.length, NMAX);
    const dphi = (twopi * f0) / SAMPLE_RATE;
    // Mix to baseband
    const mixRe = new Float64Array(len);
    const mixIm = new Float64Array(len);
    let phi = 0;
    for (let i = 0; i < len; i++) {
        mixRe[i] = dd[i] * Math.cos(phi);
        mixIm[i] = -dd[i] * Math.sin(phi);
        phi += dphi;
        if (phi > twopi)
            phi -= twopi;
    }
    // Low-pass filter: simple moving-average with window = NDOWN
    // then decimate by NDOWN to get 200 Hz sample rate
    const outLen = Math.min(nfft2, Math.floor(len / NDOWN));
    outRe.fill(0);
    outIm.fill(0);
    // Running sum filter
    const halfWin = NDOWN >> 1;
    for (let k = 0; k < outLen; k++) {
        const center = k * NDOWN + halfWin;
        let sumRe = 0, sumIm = 0;
        const start = Math.max(0, center - halfWin);
        const end = Math.min(len, center + halfWin);
        for (let j = start; j < end; j++) {
            sumRe += mixRe[j];
            sumIm += mixIm[j];
        }
        const n = end - start;
        outRe[k] = sumRe / n;
        outIm[k] = sumIm / n;
    }
}
function sync8d(cd0Re, cd0Im, i0, twkRe, twkIm, useTwk) {
    const NP2 = 2812;
    const twopi = 2 * Math.PI;
    // Precompute Costas sync waveforms
    const csyncRe = new Float64Array(7 * 32);
    const csyncIm = new Float64Array(7 * 32);
    for (let i = 0; i < 7; i++) {
        let phi = 0;
        const dphi = (twopi * icos7[i]) / 32;
        for (let j = 0; j < 32; j++) {
            csyncRe[i * 32 + j] = Math.cos(phi);
            csyncIm[i * 32 + j] = Math.sin(phi);
            phi = (phi + dphi) % twopi;
        }
    }
    let sync = 0;
    for (let i = 0; i < 7; i++) {
        const i1 = i0 + i * 32;
        const i2 = i1 + 36 * 32;
        const i3 = i1 + 72 * 32;
        for (const iStart of [i1, i2, i3]) {
            let zRe = 0, zIm = 0;
            if (iStart >= 0 && iStart + 31 < NP2) {
                for (let j = 0; j < 32; j++) {
                    let sRe = csyncRe[i * 32 + j];
                    let sIm = csyncIm[i * 32 + j];
                    if (useTwk && twkRe && twkIm) {
                        const tRe = twkRe[j] * sRe - twkIm[j] * sIm;
                        const tIm = twkRe[j] * sIm + twkIm[j] * sRe;
                        sRe = tRe;
                        sIm = tIm;
                    }
                    // Conjugate multiply: cd0 * conj(csync)
                    const dRe = cd0Re[iStart + j];
                    const dIm = cd0Im[iStart + j];
                    zRe += dRe * sRe + dIm * sIm;
                    zIm += dIm * sRe - dRe * sIm;
                }
            }
            sync += zRe * zRe + zIm * zIm;
        }
    }
    return sync;
}
function normalizeBmet(bmet) {
    const n = bmet.length;
    let sum = 0, sum2 = 0;
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

const TWO_PI = 2 * Math.PI;
const DEFAULT_SAMPLE_RATE = 12_000;
const DEFAULT_SAMPLES_PER_SYMBOL = 1_920;
const DEFAULT_BT = 2.0;
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
function generateFT8Waveform(tones, options = {}) {
    // Mirrors the FT8 path in lib/ft8/gen_ft8wave.f90.
    const nsym = tones.length;
    if (nsym === 0) {
        return new Float32Array(0);
    }
    const sampleRate = options.sampleRate ?? DEFAULT_SAMPLE_RATE;
    const nsps = options.samplesPerSymbol ?? DEFAULT_SAMPLES_PER_SYMBOL;
    const bt = options.bt ?? DEFAULT_BT;
    const f0 = options.baseFrequency ?? 0;
    assertPositiveFinite(sampleRate, "sampleRate");
    assertPositiveFinite(nsps, "samplesPerSymbol");
    assertPositiveFinite(bt, "bt");
    if (!Number.isFinite(f0)) {
        throw new Error("baseFrequency must be finite");
    }
    if (!Number.isInteger(nsps)) {
        throw new Error("samplesPerSymbol must be an integer");
    }
    const nwave = nsym * nsps;
    const pulse = new Float64Array(3 * nsps);
    for (let i = 0; i < pulse.length; i++) {
        const tt = (i + 1 - 1.5 * nsps) / nsps;
        pulse[i] = gfskPulse(bt, tt);
    }
    const dphi = new Float64Array((nsym + 2) * nsps);
    const dphiPeak = (TWO_PI * MODULATION_INDEX) / nsps;
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
    const carrierDphi = (TWO_PI * f0) / sampleRate;
    for (let i = 0; i < dphi.length; i++) {
        dphi[i] += carrierDphi;
    }
    const wave = new Float32Array(nwave);
    let phi = 0;
    for (let k = 0; k < nwave; k++) {
        const j = nsps + k; // skip the leading dummy symbol
        wave[k] = Math.sin(phi);
        phi += dphi[j];
        phi %= TWO_PI;
        if (phi < 0) {
            phi += TWO_PI;
        }
    }
    const nramp = Math.round(nsps / 8);
    for (let i = 0; i < nramp; i++) {
        const up = (1 - Math.cos((TWO_PI * i) / (2 * nramp))) / 2;
        wave[i] *= up;
    }
    const tailStart = nwave - nramp;
    for (let i = 0; i < nramp; i++) {
        const down = (1 + Math.cos((TWO_PI * i) / (2 * nramp))) / 2;
        wave[tailStart + i] *= down;
    }
    return wave;
}

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
function getTones(codeword) {
    const tones = new Array(79).fill(0);
    for (let i = 0; i < 7; i++)
        tones[i] = icos7[i];
    for (let i = 0; i < 7; i++)
        tones[36 + i] = icos7[i];
    for (let i = 0; i < 7; i++)
        tones[72 + i] = icos7[i];
    let k = 7;
    for (let j = 1; j <= 58; j++) {
        const i = j * 3 - 3; // codeword is 0-indexed in JS, but the loop was j=1 to 58
        if (j === 30)
            k += 7;
        const indx = codeword[i] * 4 + codeword[i + 1] * 2 + codeword[i + 2];
        tones[k] = graymap[indx];
        k++;
    }
    return tones;
}
function encodeMessage(msg) {
    const bits77 = pack77(msg);
    const codeword = encode174_91(bits77);
    return getTones(codeword);
}
function encode(msg, options = {}) {
    return generateFT8Waveform(encodeMessage(msg), options);
}

export { decode as decodeFT8, encode as encodeFT8 };
//# sourceMappingURL=ft8js.mjs.map
