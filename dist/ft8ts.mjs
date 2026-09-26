/** Shared constants used by FT8, FT4, pack77, etc. */
const SAMPLE_RATE = 12_000;
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
const FIELD_DAY_SECTIONS = [
    "AB",
    "AK",
    "AL",
    "AR",
    "AZ",
    "BC",
    "CO",
    "CT",
    "DE",
    "EB",
    "EMA",
    "ENY",
    "EPA",
    "EWA",
    "GA",
    "GH",
    "IA",
    "ID",
    "IL",
    "IN",
    "KS",
    "KY",
    "LA",
    "LAX",
    "NS",
    "MB",
    "MDC",
    "ME",
    "MI",
    "MN",
    "MO",
    "MS",
    "MT",
    "NC",
    "ND",
    "NE",
    "NFL",
    "NH",
    "NL",
    "NLI",
    "NM",
    "NNJ",
    "NNY",
    "TER",
    "NTX",
    "NV",
    "OH",
    "OK",
    "ONE",
    "ONN",
    "ONS",
    "OR",
    "ORG",
    "PAC",
    "PR",
    "QC",
    "RI",
    "SB",
    "SC",
    "SCV",
    "SD",
    "SDG",
    "SF",
    "SFL",
    "SJV",
    "SK",
    "SNJ",
    "STX",
    "SV",
    "TN",
    "UT",
    "VA",
    "VI",
    "VT",
    "WCF",
    "WI",
    "WMA",
    "WNY",
    "WPA",
    "WTX",
    "WV",
    "WWA",
    "WY",
    "DX",
    "PE",
    "NB",
];
const NTOKENS = 2063592;
const MAX22 = 4194304; // 2^22
const MAX28 = 268435456; // 2^28
const MAXGRID4 = 32400;

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
 * LDPC (174,91) decoder for FT8/FT4.
 * Port of decode174_91.f90 (hybrid BP/OSD) and osd174_91.f90 from WSJT-X.
 */
const N = N_LDPC;
const KK = 91;
const M_LDPC = N - KK; // 83
const MAX_ITERATIONS = 30;
// ── Tanner graph as flat edge arrays ────────────────────────────────────────
/** Edges of check j are CHECK_START[j]..CHECK_START[j+1]-1. */
const CHECK_START = new Int32Array(M_LDPC + 1);
/** Variable node of each edge. */
const EDGE_VAR = new Int32Array(3 * N);
/** The three edges of variable i are VAR_EDGES[3i..3i+2] (Mn order). */
const VAR_EDGES = new Int32Array(3 * N);
(() => {
    let e = 0;
    for (let j = 0; j < M_LDPC; j++) {
        CHECK_START[j] = e;
        for (let i = 0; i < nrw[j]; i++)
            EDGE_VAR[e++] = Nm[j][i];
    }
    CHECK_START[M_LDPC] = e;
    for (let v = 0; v < N; v++) {
        for (let t = 0; t < 3; t++) {
            const chk = Mn[v][t];
            for (let k = CHECK_START[chk]; k < CHECK_START[chk + 1]; k++) {
                if (EDGE_VAR[k] === v)
                    VAR_EDGES[3 * v + t] = k;
            }
        }
    }
})();
const NEDGES = CHECK_START[M_LDPC];
const tov = new Float64Array(NEDGES);
const toc = new Float64Array(NEDGES);
const tanhtoc = new Float64Array(NEDGES);
const zn = new Float64Array(N);
const zsum = new Float64Array(N);
const zsave = new Float64Array(3 * N);
const hardBits = new Int8Array(N);
/** Piecewise-linear atanh approximation used by WSJT-X (platanh.f90). */
function platanh(x) {
    const z = x < 0 ? -x : x;
    let y;
    if (z <= 0.664)
        return x / 0.83;
    if (z <= 0.9217)
        y = (z - 0.4064) / 0.322;
    else if (z <= 0.9951)
        y = (z - 0.8378) / 0.0524;
    else if (z <= 0.9998)
        y = (z - 0.9914) / 0.0012;
    else
        y = 7.0;
    return x < 0 ? -y : y;
}
/** CRC-14 check on bits 0..90 of `bits` (77 message bits followed by 14 CRC bits). */
function crc14Matches(bits) {
    const poly = 0x2757;
    let crc = 0;
    for (let bit = 0; bit < 96; bit++) {
        const nextBit = bit < 77 ? bits[bit] : 0;
        if ((crc & 0x2000) !== 0) {
            crc = ((crc << 1) | nextBit) ^ poly;
        }
        else {
            crc = (crc << 1) | nextBit;
        }
        crc &= 0x3fff;
    }
    let received = 0;
    for (let i = 77; i < 91; i++)
        received = (received << 1) | bits[i];
    return received === crc;
}
function distanceToHardDecision(llr, cw) {
    let dmin = 0;
    for (let i = 0; i < N; i++) {
        const hard = llr[i] >= 0 ? 1 : 0;
        if (hard !== cw[i])
            dmin += Math.abs(llr[i]);
    }
    return dmin;
}
/**
 * Hybrid BP/OSD decoder for the (174,91) code (decode174_91.f90).
 *
 * maxosd < 0: BP only
 * maxosd = 0: BP, then OSD once with the channel LLRs
 * maxosd > 0: BP, then OSD up to `maxosd` times (max 3) with the accumulated
 *             BP soft outputs of iterations 1..maxosd
 * norder: OSD search depth (osd174_91 `ndeep`)
 */
function decode174_91(llr, apmask, maxosd, norder = 2) {
    if (maxosd > 3)
        maxosd = 3;
    let nosd = 0;
    if (maxosd === 0) {
        nosd = 1;
        zsave.set(llr);
    }
    else if (maxosd > 0) {
        nosd = maxosd;
    }
    tov.fill(0);
    zsum.fill(0);
    let ncnt = 0;
    let nclast = 0;
    for (let iter = 0; iter <= MAX_ITERATIONS; iter++) {
        for (let i = 0; i < N; i++) {
            let z = llr[i];
            if (apmask[i] !== 1) {
                const e = 3 * i;
                z += tov[VAR_EDGES[e]] + tov[VAR_EDGES[e + 1]] + tov[VAR_EDGES[e + 2]];
            }
            zn[i] = z;
            zsum[i] = zsum[i] + z;
            hardBits[i] = z > 0 ? 1 : 0;
        }
        if (iter > 0 && iter <= maxosd)
            zsave.set(zsum, (iter - 1) * N);
        let ncheck = 0;
        for (let j = 0; j < M_LDPC; j++) {
            let parity = 0;
            for (let e = CHECK_START[j]; e < CHECK_START[j + 1]; e++)
                parity ^= hardBits[EDGE_VAR[e]];
            ncheck += parity;
        }
        if (ncheck === 0 && crc14Matches(hardBits)) {
            let nharderrors = 0;
            for (let i = 0; i < N; i++) {
                if ((2 * hardBits[i] - 1) * llr[i] < 0)
                    nharderrors++;
            }
            return {
                message91: Array.from(hardBits.subarray(0, KK)),
                cw: Array.from(hardBits),
                nharderrors,
                dmin: distanceToHardDecision(llr, hardBits),
                ntype: 1,
            };
        }
        if (iter > 0) {
            if (ncheck - nclast < 0) {
                ncnt = 0;
            }
            else {
                ncnt++;
            }
            if (ncnt >= 5 && iter >= 10 && ncheck > 15)
                break;
        }
        nclast = ncheck;
        // Messages from bits to checks
        for (let e = 0; e < NEDGES; e++) {
            const t = zn[EDGE_VAR[e]] - tov[e];
            toc[e] = t;
            tanhtoc[e] = Math.tanh(-t / 2);
        }
        // Messages from checks to bits
        for (let j = 0; j < M_LDPC; j++) {
            const start = CHECK_START[j];
            const end = CHECK_START[j + 1];
            for (let e = start; e < end; e++) {
                let tmn = 1.0;
                for (let k = start; k < end; k++) {
                    if (k !== e)
                        tmn *= tanhtoc[k];
                }
                tov[e] = 2 * platanh(-tmn);
            }
        }
    }
    for (let i = 0; i < nosd; i++) {
        const osd = osd174_91(zsave.subarray(i * N, (i + 1) * N), apmask, norder);
        if (osd && osd.nhardmin > 0) {
            return {
                message91: osd.cw.slice(0, KK),
                cw: osd.cw,
                nharderrors: osd.nhardmin,
                dmin: distanceToHardDecision(llr, osd.cw),
                ntype: 2,
            };
        }
    }
    return null;
}
// ── Ordered-statistics decoder ──────────────────────────────────────────────
/** Number of 32-bit words for a 91-row column bitset. */
const RW = 3;
/** Number of 32-bit words for the 83 parity positions. */
const PW = 3;
/**
 * Generator matrix in column-major bitset form: column c is a 91-bit set of the
 * information bits whose unit codeword has a 1 in position c.
 */
const GEN_COLS = buildGeneratorColumns();
const osdCols = new Int32Array(N * RW);
const osdIndices = new Int32Array(N);
const osdAbs = new Float64Array(N);
const osdAbsP = new Float64Array(N);
const osdHdecP = new Int8Array(N);
const osdApP = new Int8Array(N);
const osdC0 = new Int8Array(N);
const osdRowParity = new Int32Array(KK * PW);
const osdOrder = Array.from({ length: N }, (_, i) => i);
function popcount32(x) {
    x -= (x >>> 1) & 0x55555555;
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    x = (x + (x >>> 4)) & 0x0f0f0f0f;
    return Math.imul(x, 0x01010101) >>> 24;
}
function paritySum(w0, w1, w2, absP) {
    let sum = 0;
    let w = w0;
    while (w !== 0) {
        const low = w & -w;
        sum += absP[KK + 31 - Math.clz32(low)];
        w ^= low;
    }
    w = w1;
    while (w !== 0) {
        const low = w & -w;
        sum += absP[KK + 32 + 31 - Math.clz32(low)];
        w ^= low;
    }
    w = w2;
    while (w !== 0) {
        const low = w & -w;
        sum += absP[KK + 64 + 31 - Math.clz32(low)];
        w ^= low;
    }
    return sum;
}
/**
 * Ordered-statistics decoder for the (174,91) code (osd174_91.f90 with k=91).
 * Supports ndeep 0..2 (the depths WSJT-X uses for FT8/FT4).
 */
function osd174_91(llr, apmask, ndeep) {
    if (ndeep > 2)
        ndeep = 2;
    const k = KK;
    const cols = osdCols;
    const indices = osdIndices;
    for (let i = 0; i < N; i++) {
        osdAbs[i] = Math.abs(llr[i]);
        osdOrder[i] = i;
    }
    osdOrder.sort((a, b) => osdAbs[b] - osdAbs[a]);
    // Columns of the generator matrix in order of decreasing reliability.
    for (let i = 0; i < N; i++) {
        const src = osdOrder[i];
        indices[i] = src;
        cols[i * RW] = GEN_COLS[src * RW];
        cols[i * RW + 1] = GEN_COLS[src * RW + 1];
        cols[i * RW + 2] = GEN_COLS[src * RW + 2];
    }
    // Gaussian elimination: make the first k columns (most reliable) systematic.
    const maxPivotCol = Math.min(k + 20, N);
    for (let id = 0; id < k; id++) {
        const word = id >>> 5;
        const mask = 1 << (id & 31);
        for (let icol = id; icol < maxPivotCol; icol++) {
            if ((cols[icol * RW + word] & mask) === 0)
                continue;
            if (icol !== id) {
                for (let w = 0; w < RW; w++) {
                    const tmp = cols[id * RW + w];
                    cols[id * RW + w] = cols[icol * RW + w];
                    cols[icol * RW + w] = tmp;
                }
                const tmp = indices[id];
                indices[id] = indices[icol];
                indices[icol] = tmp;
            }
            // Rows (other than id) that have a 1 in column id.
            const s0 = cols[id * RW];
            const s1 = cols[id * RW + 1];
            const s2 = cols[id * RW + 2];
            const r0 = word === 0 ? s0 & ~mask : s0;
            const r1 = word === 1 ? s1 & ~mask : s1;
            const r2 = word === 2 ? s2 & ~mask : s2;
            if ((r0 | r1 | r2) !== 0) {
                for (let c = 0; c < N; c++) {
                    if ((cols[c * RW + word] & mask) !== 0) {
                        cols[c * RW] = cols[c * RW] ^ r0;
                        cols[c * RW + 1] = cols[c * RW + 1] ^ r1;
                        cols[c * RW + 2] = cols[c * RW + 2] ^ r2;
                    }
                }
            }
            break;
        }
    }
    // Received word in MRB order.
    let m0w0 = 0;
    let m0w1 = 0;
    let m0w2 = 0;
    for (let i = 0; i < N; i++) {
        const src = indices[i];
        const hard = llr[src] >= 0 ? 1 : 0;
        osdHdecP[i] = hard;
        osdAbsP[i] = osdAbs[src];
        osdApP[i] = apmask[src];
        if (i < k && hard === 1) {
            if (i < 32)
                m0w0 |= 1 << i;
            else if (i < 64)
                m0w1 |= 1 << (i - 32);
            else
                m0w2 |= 1 << (i - 64);
        }
    }
    // Order-0 codeword and distance.
    let nhardmin = 0;
    let dmin = 0;
    for (let c = 0; c < N; c++) {
        const bit = (popcount32(m0w0 & cols[c * RW]) +
            popcount32(m0w1 & cols[c * RW + 1]) +
            popcount32(m0w2 & cols[c * RW + 2])) &
            1;
        osdC0[c] = bit;
        if (bit !== osdHdecP[c]) {
            nhardmin++;
            dmin += osdAbsP[c];
        }
    }
    let bestA = -1;
    let bestB = -1;
    if (ndeep > 0) {
        const npre1 = ndeep >= 2 ? 1 : 0;
        const ntheta = ndeep === 2 ? 10 : 12;
        // nt = 40: the screening uses the 40 most reliable parity positions.
        const NT_MASK1 = 0xff;
        // Parity part of each (systematic) row, and of the order-0 error pattern.
        osdRowParity.fill(0);
        let e0w0 = 0;
        let e0w1 = 0;
        let e0w2 = 0;
        for (let j = 0; j < M_LDPC; j++) {
            const c = k + j;
            const pw = j >>> 5;
            const pmask = 1 << (j & 31);
            if (osdC0[c] !== osdHdecP[c]) {
                if (pw === 0)
                    e0w0 |= pmask;
                else if (pw === 1)
                    e0w1 |= pmask;
                else
                    e0w2 |= pmask;
            }
            for (let w = 0; w < RW; w++) {
                let bits = cols[c * RW + w];
                while (bits !== 0) {
                    const low = bits & -bits;
                    const row = w * 32 + 31 - Math.clz32(low);
                    osdRowParity[row * PW + pw] = osdRowParity[row * PW + pw] | pmask;
                    bits ^= low;
                }
            }
        }
        for (let iflag = k - 1; iflag >= 0; iflag--) {
            // Every pattern of this iteration contains bit iflag.
            if (osdApP[iflag] === 1)
                continue;
            const s0 = e0w0 ^ osdRowParity[iflag * PW];
            const s1 = e0w1 ^ osdRowParity[iflag * PW + 1];
            const s2 = e0w2 ^ osdRowParity[iflag * PW + 2];
            const d1 = osdAbsP[iflag];
            let nd1kpt = popcount32(s0) + popcount32(s1 & NT_MASK1) + 1;
            if (nd1kpt <= ntheta) {
                const dd = d1 + paritySum(s0, s1, s2, osdAbsP);
                if (dd < dmin) {
                    dmin = dd;
                    bestA = iflag;
                    bestB = -1;
                }
            }
            if (npre1 === 0)
                continue;
            for (let n1 = iflag - 1; n1 >= 0; n1--) {
                if (osdApP[n1] === 1)
                    continue;
                const t0 = s0 ^ osdRowParity[n1 * PW];
                const t1 = s1 ^ osdRowParity[n1 * PW + 1];
                nd1kpt = popcount32(t0) + popcount32(t1 & NT_MASK1) + 2;
                if (nd1kpt > ntheta)
                    continue;
                const t2 = s2 ^ osdRowParity[n1 * PW + 2];
                const dd = d1 + osdAbsP[n1] + paritySum(t0, t1, t2, osdAbsP);
                if (dd < dmin) {
                    dmin = dd;
                    bestA = iflag;
                    bestB = n1;
                }
            }
        }
    }
    // Build the best codeword: c0 + rows bestA and bestB of the reduced generator.
    const cwP = osdC0;
    if (bestA >= 0) {
        for (const row of [bestA, bestB]) {
            if (row < 0)
                continue;
            const w = row >>> 5;
            const mask = 1 << (row & 31);
            for (let c = 0; c < N; c++) {
                if ((cols[c * RW + w] & mask) !== 0)
                    cwP[c] = cwP[c] ^ 1;
            }
        }
        nhardmin = 0;
        for (let c = 0; c < N; c++)
            if (cwP[c] !== osdHdecP[c])
                nhardmin++;
    }
    const cw = new Array(N);
    for (let i = 0; i < N; i++)
        cw[indices[i]] = cwP[i];
    if (!crc14Matches(cw))
        nhardmin = -nhardmin;
    return { cw, nhardmin };
}
function buildGeneratorColumns() {
    const colsOut = new Int32Array(N * RW);
    // Identity for the information positions.
    for (let i = 0; i < KK; i++) {
        colsOut[i * RW + (i >>> 5)] = 1 << (i & 31);
    }
    // gHex encodes the M×K generator parity matrix: parity bit m depends on info bit col.
    for (let m = 0; m < M_LDPC; m++) {
        const hexStr = gHex[m];
        const c = KK + m;
        for (let j = 0; j < 23; j++) {
            const val = parseInt(hexStr[j], 16);
            const limit = j === 22 ? 3 : 4;
            for (let jj = 1; jj <= limit; jj++) {
                const col = j * 4 + jj - 1;
                if (col < KK && (val & (1 << (4 - jj))) !== 0) {
                    colsOut[c * RW + (col >>> 5)] = colsOut[c * RW + (col >>> 5)] | (1 << (col & 31));
                }
            }
        }
    }
    return colsOut;
}

/**
 * FFT for FT8/FT4 decoding.
 * Radix-2 Cooley-Tukey for powers of two, mixed-radix Stockham for sizes
 * with small prime factors (e.g. 3840, 3200, 192000, 72576), and Bluestein
 * for everything else.
 * Supports real-to-complex, complex-to-complex, and inverse transforms.
 */
const RADIX2_PLAN_CACHE = new Map();
const MIXED_RADIX_PLAN_CACHE = new Map();
const BLUESTEIN_PLAN_CACHE = new Map();
const MAX_GENERIC_RADIX = 31;
function fftComplex(re, im, inverse) {
    const n = re.length;
    if (n <= 1)
        return;
    if ((n & (n - 1)) !== 0) {
        const plan = getMixedRadixPlan(n);
        if (plan) {
            mixedRadix(re, im, inverse, plan);
        }
        else {
            bluestein(re, im, inverse);
        }
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
function getMixedRadixPlan(n) {
    const cached = MIXED_RADIX_PLAN_CACHE.get(n);
    if (cached !== undefined)
        return cached;
    const factors = [];
    let rest = n;
    while (rest % 4 === 0) {
        factors.push(4);
        rest /= 4;
    }
    for (let p = 2; p <= MAX_GENERIC_RADIX && rest > 1; p++) {
        while (rest % p === 0) {
            factors.push(p);
            rest /= p;
        }
    }
    if (rest !== 1) {
        MIXED_RADIX_PLAN_CACHE.set(n, null);
        return null;
    }
    const twRe = new Float64Array(n);
    const twIm = new Float64Array(n);
    for (let k = 0; k < n; k++) {
        const angle = (-2 * Math.PI * k) / n;
        twRe[k] = Math.cos(angle);
        twIm[k] = Math.sin(angle);
    }
    const maxRadix = Math.max(...factors);
    const plan = {
        factors,
        twRe,
        twIm,
        workRe: new Float64Array(n),
        workIm: new Float64Array(n),
        vRe: new Float64Array(maxRadix),
        vIm: new Float64Array(maxRadix),
    };
    MIXED_RADIX_PLAN_CACHE.set(n, plan);
    return plan;
}
const SIN_60 = Math.sqrt(3) / 2;
const COS_72 = Math.cos((2 * Math.PI) / 5);
const COS_144 = Math.cos((4 * Math.PI) / 5);
const SIN_72 = Math.sin((2 * Math.PI) / 5);
const SIN_144 = Math.sin((4 * Math.PI) / 5);
/**
 * Stockham autosort mixed-radix FFT. Each stage combines `radix` transforms
 * of length `ns` into transforms of length `ns * radix`.
 */
function mixedRadix(re, im, inverse, plan) {
    const n = re.length;
    const { factors, twRe, twIm, vRe, vIm } = plan;
    const sign = inverse ? 1 : -1;
    let xRe = re;
    let xIm = im;
    let yRe = plan.workRe;
    let yIm = plan.workIm;
    let ns = 1;
    for (const radix of factors) {
        const stride = n / radix;
        const twStep = n / (ns * radix);
        const nblocks = stride / ns;
        for (let b = 0; b < nblocks; b++) {
            const inBase = b * ns;
            const outBase = b * ns * radix;
            for (let k = 0; k < ns; k++) {
                const j = inBase + k;
                const d = outBase + k;
                const tw = k * twStep;
                if (radix === 2) {
                    const aRe = xRe[j];
                    const aIm = xIm[j];
                    let bRe = xRe[j + stride];
                    let bIm = xIm[j + stride];
                    if (tw !== 0) {
                        const wr = twRe[tw];
                        const wi = -sign * twIm[tw];
                        const t = bRe * wr - bIm * wi;
                        bIm = bRe * wi + bIm * wr;
                        bRe = t;
                    }
                    yRe[d] = aRe + bRe;
                    yIm[d] = aIm + bIm;
                    yRe[d + ns] = aRe - bRe;
                    yIm[d + ns] = aIm - bIm;
                }
                else if (radix === 4) {
                    const v0r = xRe[j];
                    const v0i = xIm[j];
                    let v1r = xRe[j + stride];
                    let v1i = xIm[j + stride];
                    let v2r = xRe[j + 2 * stride];
                    let v2i = xIm[j + 2 * stride];
                    let v3r = xRe[j + 3 * stride];
                    let v3i = xIm[j + 3 * stride];
                    if (tw !== 0) {
                        let wr = twRe[tw];
                        let wi = -sign * twIm[tw];
                        let t = v1r * wr - v1i * wi;
                        v1i = v1r * wi + v1i * wr;
                        v1r = t;
                        wr = twRe[2 * tw];
                        wi = -sign * twIm[2 * tw];
                        t = v2r * wr - v2i * wi;
                        v2i = v2r * wi + v2i * wr;
                        v2r = t;
                        wr = twRe[3 * tw];
                        wi = -sign * twIm[3 * tw];
                        t = v3r * wr - v3i * wi;
                        v3i = v3r * wi + v3i * wr;
                        v3r = t;
                    }
                    const t0r = v0r + v2r;
                    const t0i = v0i + v2i;
                    const t1r = v0r - v2r;
                    const t1i = v0i - v2i;
                    const t2r = v1r + v3r;
                    const t2i = v1i + v3i;
                    // (v1 - v3) * (sign * i)
                    const dr = v1r - v3r;
                    const di = v1i - v3i;
                    const t3r = -sign * di;
                    const t3i = sign * dr;
                    yRe[d] = t0r + t2r;
                    yIm[d] = t0i + t2i;
                    yRe[d + ns] = t1r + t3r;
                    yIm[d + ns] = t1i + t3i;
                    yRe[d + 2 * ns] = t0r - t2r;
                    yIm[d + 2 * ns] = t0i - t2i;
                    yRe[d + 3 * ns] = t1r - t3r;
                    yIm[d + 3 * ns] = t1i - t3i;
                }
                else if (radix === 3) {
                    const v0r = xRe[j];
                    const v0i = xIm[j];
                    let v1r = xRe[j + stride];
                    let v1i = xIm[j + stride];
                    let v2r = xRe[j + 2 * stride];
                    let v2i = xIm[j + 2 * stride];
                    if (tw !== 0) {
                        let wr = twRe[tw];
                        let wi = -sign * twIm[tw];
                        let t = v1r * wr - v1i * wi;
                        v1i = v1r * wi + v1i * wr;
                        v1r = t;
                        wr = twRe[2 * tw];
                        wi = -sign * twIm[2 * tw];
                        t = v2r * wr - v2i * wi;
                        v2i = v2r * wi + v2i * wr;
                        v2r = t;
                    }
                    const sr = v1r + v2r;
                    const si = v1i + v2i;
                    const mr = v0r - 0.5 * sr;
                    const mi = v0i - 0.5 * si;
                    // i * sign * sin60 * (v1 - v2)
                    const s = sign * SIN_60;
                    const qr = -s * (v1i - v2i);
                    const qi = s * (v1r - v2r);
                    yRe[d] = v0r + sr;
                    yIm[d] = v0i + si;
                    yRe[d + ns] = mr + qr;
                    yIm[d + ns] = mi + qi;
                    yRe[d + 2 * ns] = mr - qr;
                    yIm[d + 2 * ns] = mi - qi;
                }
                else if (radix === 5) {
                    const v0r = xRe[j];
                    const v0i = xIm[j];
                    let v1r = xRe[j + stride];
                    let v1i = xIm[j + stride];
                    let v2r = xRe[j + 2 * stride];
                    let v2i = xIm[j + 2 * stride];
                    let v3r = xRe[j + 3 * stride];
                    let v3i = xIm[j + 3 * stride];
                    let v4r = xRe[j + 4 * stride];
                    let v4i = xIm[j + 4 * stride];
                    if (tw !== 0) {
                        let wr = twRe[tw];
                        let wi = -sign * twIm[tw];
                        let t = v1r * wr - v1i * wi;
                        v1i = v1r * wi + v1i * wr;
                        v1r = t;
                        wr = twRe[2 * tw];
                        wi = -sign * twIm[2 * tw];
                        t = v2r * wr - v2i * wi;
                        v2i = v2r * wi + v2i * wr;
                        v2r = t;
                        wr = twRe[3 * tw];
                        wi = -sign * twIm[3 * tw];
                        t = v3r * wr - v3i * wi;
                        v3i = v3r * wi + v3i * wr;
                        v3r = t;
                        wr = twRe[4 * tw];
                        wi = -sign * twIm[4 * tw];
                        t = v4r * wr - v4i * wi;
                        v4i = v4r * wi + v4i * wr;
                        v4r = t;
                    }
                    const a1r = v1r + v4r;
                    const a1i = v1i + v4i;
                    const b1r = v1r - v4r;
                    const b1i = v1i - v4i;
                    const a2r = v2r + v3r;
                    const a2i = v2i + v3i;
                    const b2r = v2r - v3r;
                    const b2i = v2i - v3i;
                    const c1r = v0r + COS_72 * a1r + COS_144 * a2r;
                    const c1i = v0i + COS_72 * a1i + COS_144 * a2i;
                    const c2r = v0r + COS_144 * a1r + COS_72 * a2r;
                    const c2i = v0i + COS_144 * a1i + COS_72 * a2i;
                    // i * sign * (...)
                    const s1r = SIN_72 * b1r + SIN_144 * b2r;
                    const s1i = SIN_72 * b1i + SIN_144 * b2i;
                    const s2r = SIN_144 * b1r - SIN_72 * b2r;
                    const s2i = SIN_144 * b1i - SIN_72 * b2i;
                    const q1r = -sign * s1i;
                    const q1i = sign * s1r;
                    const q2r = -sign * s2i;
                    const q2i = sign * s2r;
                    yRe[d] = v0r + a1r + a2r;
                    yIm[d] = v0i + a1i + a2i;
                    yRe[d + ns] = c1r + q1r;
                    yIm[d + ns] = c1i + q1i;
                    yRe[d + 2 * ns] = c2r + q2r;
                    yIm[d + 2 * ns] = c2i + q2i;
                    yRe[d + 3 * ns] = c2r - q2r;
                    yIm[d + 3 * ns] = c2i - q2i;
                    yRe[d + 4 * ns] = c1r - q1r;
                    yIm[d + 4 * ns] = c1i - q1i;
                }
                else {
                    for (let r = 0; r < radix; r++) {
                        let vr = xRe[j + r * stride];
                        let vi = xIm[j + r * stride];
                        const ti = r * tw;
                        if (ti !== 0) {
                            const wr = twRe[ti];
                            const wi = -sign * twIm[ti];
                            const t = vr * wr - vi * wi;
                            vi = vr * wi + vi * wr;
                            vr = t;
                        }
                        vRe[r] = vr;
                        vIm[r] = vi;
                    }
                    const rootStep = n / radix;
                    for (let q = 0; q < radix; q++) {
                        let sr = 0;
                        let si = 0;
                        for (let r = 0; r < radix; r++) {
                            const ri = ((q * r) % radix) * rootStep;
                            const wr = twRe[ri];
                            const wi = -sign * twIm[ri];
                            sr += vRe[r] * wr - vIm[r] * wi;
                            si += vRe[r] * wi + vIm[r] * wr;
                        }
                        yRe[d + q * ns] = sr;
                        yIm[d + q * ns] = si;
                    }
                }
            }
        }
        const tRe = xRe;
        const tIm = xIm;
        xRe = yRe;
        xIm = yIm;
        yRe = tRe;
        yIm = tIm;
        ns *= radix;
    }
    const scale = inverse ? 1 / n : 1;
    if (xRe !== re) {
        for (let i = 0; i < n; i++) {
            re[i] = xRe[i] * scale;
            im[i] = xIm[i] * scale;
        }
    }
    else if (inverse) {
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
 *   Type 0.1  DXpedition
 *   Type 0.3/0.4 ARRL Field Day
 *   Type 0.5  Telemetry
 *   Type 0.6  WSPR-style callsign/grid/power payloads
 *   Type 1    Standard (two callsigns + grid/report/RR73/73)
 *   Type 2    /P form for EU VHF contest
 *   Type 3    ARRL RTTY Roundup
 *   Type 4    One nonstandard call and one hashed call
 *   Type 5    EU VHF contest with two hashed calls
 */
const RTTY_MULTIPLIERS$1 = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
    "NB",
    "NS",
    "QC",
    "ON",
    "MB",
    "SK",
    "AB",
    "BC",
    "NWT",
    "NF",
    "LB",
    "NU",
    "YT",
    "PEI",
    "DC",
];
const WSPR_NZZZ$1 = 36 * 36 * 36;
function bitsToUint(bits, start, len) {
    let val = 0;
    for (let i = 0; i < len; i++) {
        val = val * 2 + (bits[start + i] ?? 0);
    }
    return val;
}
function formatSignedReport(value) {
    const absStr = Math.abs(value).toString().padStart(2, "0");
    return (value >= 0 ? "+" : "-") + absStr;
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
    return { call, success: callok(call) };
}
/**
 * Plausibility check for a standard callsign (callok in packjt77.f90): at least
 * three characters, not starting with Q, the last digit (call area) in the second
 * or third position, a prefix containing a letter and an all-letter suffix.
 */
function callok(call) {
    const n = call.length;
    if (n < 3)
        return false;
    if (call[0] === "Q")
        return false;
    let i0 = n - 1;
    while (i0 >= 0 && !isDigit$1(call[i0]))
        i0--;
    if (i0 !== 1 && i0 !== 2)
        return false;
    const pfx = call.slice(0, i0);
    const sfx = call.slice(i0 + 1);
    if (!/[A-Z]/.test(pfx))
        return false;
    return /^[A-Z]*$/.test(sfx);
}
function isDigit$1(c) {
    return c >= "0" && c <= "9";
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
function toGrid6(igrid6) {
    if (igrid6 < 0 || igrid6 > 18 * 18 * 10 * 10 * 24 * 24 - 1)
        return { grid: "", success: false };
    let n = igrid6;
    const j6 = n % 24;
    n = Math.floor(n / 24);
    const j5 = n % 24;
    n = Math.floor(n / 24);
    const j4 = n % 10;
    n = Math.floor(n / 10);
    const j3 = n % 10;
    n = Math.floor(n / 10);
    const j2 = n % 18;
    n = Math.floor(n / 18);
    const j1 = n;
    if (j1 < 0 || j1 > 17 || j2 < 0 || j2 > 17)
        return { grid: "", success: false };
    const grid = String.fromCharCode(65 + j1) +
        String.fromCharCode(65 + j2) +
        j3.toString() +
        j4.toString() +
        String.fromCharCode(65 + j5) +
        String.fromCharCode(65 + j6);
    return { grid, success: true };
}
function toGrid(igrid6) {
    if (igrid6 < 0 || igrid6 > 18 * 18 * 10 * 10 * 25 * 25 - 1)
        return { grid: "", success: false };
    let n = igrid6;
    const j6 = n % 25;
    n = Math.floor(n / 25);
    const j5 = n % 25;
    n = Math.floor(n / 25);
    const j4 = n % 10;
    n = Math.floor(n / 10);
    const j3 = n % 10;
    n = Math.floor(n / 10);
    const j2 = n % 18;
    n = Math.floor(n / 18);
    const j1 = n;
    if (j1 < 0 || j1 > 17 || j2 < 0 || j2 > 17 || j5 > 24 || j6 > 24)
        return { grid: "", success: false };
    let grid = String.fromCharCode(65 + j1) + String.fromCharCode(65 + j2) + j3.toString() + j4.toString();
    if (j5 !== 24 || j6 !== 24)
        grid += String.fromCharCode(65 + j5) + String.fromCharCode(65 + j6);
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
    if (i3 === 0 && n3 === 1) {
        const n28a = bitsToUint(bits77, 0, 28);
        const n28b = bitsToUint(bits77, 28, 28);
        const n10 = bitsToUint(bits77, 56, 10);
        const n5 = bitsToUint(bits77, 66, 5);
        const { call: call1, success: ok1 } = unpack28(n28a, book);
        const { call: call2, success: ok2 } = unpack28(n28b, book);
        if (!ok1 || !ok2 || n28a <= 2 || n28b <= 2)
            return { msg: "", success: false };
        const resolved = book?.lookup10(n10);
        const call3 = resolved ? `<${resolved}>` : "<...>";
        const report = formatSignedReport(2 * n5 - 30);
        return { msg: `${call1} RR73; ${call2} ${call3} ${report}`, success: true };
    }
    if (i3 === 0 && (n3 === 3 || n3 === 4)) {
        const n28a = bitsToUint(bits77, 0, 28);
        const n28b = bitsToUint(bits77, 28, 28);
        const ir = bits77[56];
        const intx = bitsToUint(bits77, 57, 4);
        const nclass = bitsToUint(bits77, 61, 3);
        const isec = bitsToUint(bits77, 64, 7);
        if (isec < 1 || isec > FIELD_DAY_SECTIONS.length || nclass > 7)
            return { msg: "", success: false };
        const { call: call1, success: ok1 } = unpack28(n28a, book);
        const { call: call2, success: ok2 } = unpack28(n28b, book);
        if (!ok1 || !ok2 || n28a <= 2 || n28b <= 2)
            return { msg: "", success: false };
        const ntx = intx + 1 + (n3 === 4 ? 16 : 0);
        const exchange = `${ntx}${String.fromCharCode(65 + nclass)}`;
        const section = FIELD_DAY_SECTIONS[isec - 1];
        const msg = ir === 0
            ? `${call1} ${call2} ${exchange} ${section}`
            : `${call1} ${call2} R ${exchange} ${section}`;
        return { msg, success: true };
    }
    if (i3 === 0 && n3 === 5) {
        const n23 = bitsToUint(bits77, 0, 23);
        const n24a = bitsToUint(bits77, 23, 24);
        const n24b = bitsToUint(bits77, 47, 24);
        const msg = [
            n23.toString(16).padStart(6, "0"),
            n24a.toString(16).padStart(6, "0"),
            n24b.toString(16).padStart(6, "0"),
        ]
            .join("")
            .replace(/^0+/, "")
            .toUpperCase();
        return { msg: msg.length > 0 ? msg : "0", success: true };
    }
    if (i3 === 0 && n3 === 6) {
        const j2a = bits77[48];
        const j2b = bits77[49];
        let itype = 2;
        if (j2b === 0 && j2a === 0)
            itype = 1;
        if (j2b === 0 && j2a === 1)
            itype = 3;
        if (itype === 1) {
            const n28 = bitsToUint(bits77, 0, 28);
            const igrid4 = bitsToUint(bits77, 28, 15);
            const idbm = Math.round((bitsToUint(bits77, 43, 5) * 10) / 3);
            const { call, success: callOk } = unpack28(n28, book);
            const { grid, success: gridOk } = toGrid4(igrid4);
            if (!callOk || !gridOk)
                return { msg: "", success: false };
            if (book)
                book.save(call);
            return { msg: `${call} ${grid} ${idbm}`, success: true };
        }
        if (itype === 2) {
            const n28 = bitsToUint(bits77, 0, 28);
            let npfx = bitsToUint(bits77, 28, 16);
            const idbm = Math.round((bitsToUint(bits77, 44, 5) * 10) / 3);
            const { call, success: callOk } = unpack28(n28, book);
            if (!callOk)
                return { msg: "", success: false };
            let compound;
            if (npfx < WSPR_NZZZ$1) {
                let prefix = "";
                for (let i = 2; i >= 0; i--) {
                    const j = npfx % 36;
                    prefix = `${A2[j] ?? "0"}${prefix}`;
                    npfx = Math.floor(npfx / 36);
                    if (npfx === 0)
                        break;
                }
                compound = `${prefix}/${call}`;
            }
            else {
                npfx -= WSPR_NZZZ$1;
                let suffix;
                if (npfx <= 35) {
                    suffix = A2[npfx] ?? "";
                }
                else if (npfx <= 1295) {
                    suffix = `${A2[Math.floor(npfx / 36)] ?? ""}${A2[npfx % 36] ?? ""}`;
                }
                else if (npfx <= 12959) {
                    suffix = `${A2[Math.floor(npfx / 360)] ?? ""}${A2[Math.floor(npfx / 10) % 36] ?? ""}${A2[npfx % 10] ?? ""}`;
                }
                else {
                    return { msg: "", success: false };
                }
                compound = `${call}/${suffix}`;
            }
            if (book)
                book.save(compound);
            return { msg: `${compound} ${idbm}`, success: true };
        }
        const n22 = bitsToUint(bits77, 0, 22);
        const igrid6 = bitsToUint(bits77, 22, 25);
        const n28 = NTOKENS + n22;
        const { call, success: callOk } = unpack28(n28, book);
        const { grid, success: gridOk } = toGrid(igrid6);
        if (!callOk || !gridOk)
            return { msg: "", success: false };
        return { msg: `${call} ${grid}`, success: true };
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
    if (i3 === 3) {
        const itu = bits77[0];
        const n28a = bitsToUint(bits77, 1, 28);
        const n28b = bitsToUint(bits77, 29, 28);
        const ir = bits77[57];
        const irpt = bitsToUint(bits77, 58, 3);
        const nexch = bitsToUint(bits77, 61, 13);
        const { call: call1, success: ok1 } = unpack28(n28a, book);
        const { call: call2, success: ok2 } = unpack28(n28b, book);
        if (!ok1 || !ok2)
            return { msg: "", success: false };
        let exchange = null;
        if (nexch > 8000) {
            const imult = nexch - 8000;
            if (imult >= 1 && imult <= RTTY_MULTIPLIERS$1.length)
                exchange = RTTY_MULTIPLIERS$1[imult - 1];
        }
        else if (nexch >= 1 && nexch <= 7999) {
            exchange = nexch.toString().padStart(4, "0");
        }
        if (!exchange)
            return { msg: "", success: false };
        const report = `5${irpt + 2}9`;
        const prefix = itu === 1 ? "TU; " : "";
        const roger = ir === 1 ? " R" : "";
        return { msg: `${prefix}${call1} ${call2}${roger} ${report} ${exchange}`, success: true };
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
    if (i3 === 5) {
        const n12 = bitsToUint(bits77, 0, 12);
        const n22 = bitsToUint(bits77, 12, 22);
        const ir = bits77[34];
        const irpt = bitsToUint(bits77, 35, 3);
        const iserial = bitsToUint(bits77, 38, 11);
        const igrid6 = bitsToUint(bits77, 49, 25);
        const call1Resolved = book?.lookup12(n12);
        const call2Resolved = book?.lookup22(n22);
        const call1 = call1Resolved ? `<${call1Resolved}>` : "<...>";
        const call2 = call2Resolved ? `<${call2Resolved}>` : "<...>";
        const { grid, success: gridOk } = toGrid6(igrid6);
        if (!gridOk)
            return { msg: "", success: false };
        const exchange = `${52 + irpt}${iserial.toString().padStart(4, "0")}`;
        const msg = ir === 0
            ? `${call1} ${call2} ${exchange} ${grid}`
            : `${call1} ${call2} R ${exchange} ${grid}`;
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

const COSTAS_A$1 = [0, 1, 3, 2];
const COSTAS_B$1 = [1, 0, 2, 3];
const COSTAS_C$1 = [2, 3, 1, 0];
const COSTAS_D$1 = [3, 2, 0, 1];
const NSPS$1 = 576;
const NFFT1$1 = 4 * NSPS$1; // 2304
const NH1$1 = NFFT1$1 / 2; // 1152
const NMAX$1 = 21 * 3456; // 72576
const NHSYM$1 = Math.floor((NMAX$1 - NFFT1$1) / NSPS$1); // 122
const NDOWN$1 = 18;
const NN$1 = 103;
const NFFT2$1 = NMAX$1 / NDOWN$1; // 4032
const NSS = NSPS$1 / NDOWN$1; // 32
const FS2$1 = SAMPLE_RATE / NDOWN$1; // 666.67 Hz
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
    const sampleRate = options.sampleRate ?? SAMPLE_RATE;
    const freqLow = options.freqLow ?? 200;
    const freqHigh = options.freqHigh ?? 3000;
    const syncMin = options.syncMin ?? 1.18;
    const depth = options.depth ?? 2;
    const maxCandidates = options.maxCandidates ?? 200;
    const book = options.hashCallBook;
    const dd = sampleRate === SAMPLE_RATE
        ? copySamplesToDecodeWindow$1(samples)
        : resample$1(samples, sampleRate, SAMPLE_RATE, NMAX$1);
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
        const result = tryDecodePasses(workspace, depth);
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
    const df = SAMPLE_RATE / NFFT1$1;
    const fac = 1 / 300;
    const savg = new Float64Array(NH1$1);
    const s = new Float64Array(NH1$1 * NHSYM$1);
    const savsm = new Float64Array(NH1$1);
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
        for (let bin = 1; bin <= NH1$1; bin++) {
            const idx = bin - 1;
            const re = xRe[bin] ?? 0;
            const im = xIm[bin] ?? 0;
            const power = re * re + im * im;
            s[idx * NHSYM$1 + j] = power;
            savg[idx] = (savg[idx] ?? 0) + power;
        }
    }
    for (let i = 0; i < NH1$1; i++)
        savg[i] = (savg[i] ?? 0) / NHSYM$1;
    for (let i = 7; i < NH1$1 - 7; i++) {
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
    const fOffset = (-1.5 * SAMPLE_RATE) / NSPS$1;
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
    const sbase = new Float64Array(NH1$1);
    sbase.fill(1);
    const ia = Math.max(Math.round(200 / df), nfa);
    const ib = Math.min(NH1$1, nfb);
    if (ib <= ia)
        return sbase;
    const sDb = new Float64Array(NH1$1);
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
    const df = SAMPLE_RATE / NMAX$1;
    const baud = SAMPLE_RATE / NSPS$1;
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
        buildSyncTemplate(COSTAS_A$1),
        buildSyncTemplate(COSTAS_B$1),
        buildSyncTemplate(COSTAS_C$1),
        buildSyncTemplate(COSTAS_D$1),
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
        if (maxTone(s4, k) === COSTAS_A$1[k])
            nsync++;
        if (maxTone(s4, 33 + k) === COSTAS_B$1[k])
            nsync++;
        if (maxTone(s4, 66 + k) === COSTAS_C$1[k])
            nsync++;
        if (maxTone(s4, 99 + k) === COSTAS_D$1[k])
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
function tryDecodePasses(workspace, depth) {
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
 *  0.1  DXpedition
 *  0.3/0.4 ARRL Field Day
 *  0.5  Telemetry
 *  0.6  WSPR-style callsign/grid/power payloads
 *  1    Standard (two callsigns + grid/report/RR73/73)
 *       /R and /P suffixes on either callsign → ipa/ipb = 1 (triggers i3=2 for /P)
 *  3    ARRL RTTY Roundup
 *  4    One nonstandard (<hash>) call + one standard call
 *       e.g.  <YW18FIFA> KA1ABC 73
 *             KA1ABC <YW18FIFA> -11
 *             CQ YW18FIFA
 *  5    EU VHF contest with two hashed calls
 *
 * Reference: lib/77bit/packjt77.f90 (subroutines pack77, pack28, pack77_1,
 *            pack77_3, pack77_4, pack77_5, packtext77, ihashcall)
 */
const RTTY_MULTIPLIERS = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
    "NB",
    "NS",
    "QC",
    "ON",
    "MB",
    "SK",
    "AB",
    "BC",
    "NWT",
    "NF",
    "LB",
    "NU",
    "YT",
    "PEI",
    "DC",
];
const WSPR_NZZZ = 36 * 36 * 36;
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
 * Here we use m=10/12/22 for message types that carry hashed callsigns.
 */
function ihashcall$1(c0, width) {
    const C = C38;
    let n8 = 0n;
    const s = c0.padEnd(11, " ").slice(0, 11).toUpperCase();
    for (let i = 0; i < 11; i++) {
        const j = C.indexOf(s[i] ?? " ");
        n8 = 38n * n8 + BigInt(j < 0 ? 0 : j);
    }
    const MAGIC = 47055833459n;
    const prod = BigInt.asUintN(64, MAGIC * n8);
    return Number(prod >> BigInt(64 - width)) & ((1 << width) - 1);
}
function ihashcall22(c0) {
    return ihashcall$1(c0, 22);
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
        // Fortran pack28 layout:
        //   iarea==2 (0-based 1): callsign=' '//c13(1:5)
        //   iarea==3 (0-based 2): callsign=     c13(1:6)
        let iareaD = -1;
        for (let ii = basecall.length - 1; ii >= 1; ii--) {
            const c = basecall[ii] ?? "";
            if (c >= "0" && c <= "9") {
                iareaD = ii;
                break;
            }
        }
        let cs = basecall;
        if (iareaD === 1)
            cs = ` ${basecall.slice(0, 5)}`;
        if (iareaD === 2)
            cs = basecall.slice(0, 6);
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
function appendType0Suffix(bits, n3) {
    appendBits(bits, n3, 3);
    appendBits(bits, 0, 3);
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
function split77$1(msg) {
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
    const parts = split77$1(msg);
    if (parts.length < 1)
        throw new Error("Empty message");
    const dxpedition = tryPackType01(parts);
    if (dxpedition)
        return dxpedition;
    const fieldDay = tryPackType03(parts);
    if (fieldDay)
        return fieldDay;
    if (parts.length === 1) {
        const telemetry = tryPackType05(parts[0]);
        if (telemetry)
            return telemetry;
    }
    const wspr = tryPackType06(parts);
    if (wspr)
        return wspr;
    // ── Try Type 1/2: standard message ────────────────────────────────────────
    const t1 = tryPackType1(parts);
    if (t1)
        return t1;
    const rtty = tryPackType3(parts);
    if (rtty)
        return rtty;
    // ── Try Type 4: one hash call ──────────────────────────────────────────────
    const t4 = tryPackType4(parts);
    if (t4)
        return t4;
    const vhf = tryPackType5(parts);
    if (vhf)
        return vhf;
    // ── Default: Type 0.0 free text ───────────────────────────────────────────
    return packFreeText(msg);
}
function tryPackType01(parts) {
    if (parts.length !== 5)
        return null;
    if (parts[1] !== "RR73;")
        return null;
    const hashed = parts[3];
    if (!hashed.startsWith("<") || !hashed.endsWith(">"))
        return null;
    const p1 = parseCallsign(parts[0]);
    const p2 = parseCallsign(parts[2]);
    if (!p1.isStandard || !p2.isStandard)
        return null;
    const report = parseInt(parts[4], 10);
    if (Number.isNaN(report))
        return null;
    let n5 = Math.trunc((report + 30) / 2);
    if (n5 < 0)
        n5 = 0;
    if (n5 > 31)
        n5 = 31;
    const bits = [];
    appendBits(bits, pack28(p1.basecall), 28);
    appendBits(bits, pack28(p2.basecall), 28);
    appendBits(bits, ihashcall$1(hashed.slice(1, -1), 10), 10);
    appendBits(bits, n5, 5);
    appendType0Suffix(bits, 1);
    return bits;
}
function tryPackType03(parts) {
    if (parts.length < 4 || parts.length > 5)
        return null;
    const p1 = parseCallsign(parts[0]);
    const p2 = parseCallsign(parts[1]);
    if (!p1.isStandard || !p2.isStandard)
        return null;
    const section = parts[parts.length - 1];
    const isec = FIELD_DAY_SECTIONS.indexOf(section);
    if (isec < 0)
        return null;
    if (parts.length === 5 && parts[2] !== "R")
        return null;
    const ntxClass = /^(\d{1,2})([A-Z])$/.exec(parts[parts.length - 2]);
    if (!ntxClass)
        return null;
    const ntx = parseInt(ntxClass[1], 10);
    if (ntx < 1 || ntx > 32)
        return null;
    const nclass = ntxClass[2].charCodeAt(0) - 65;
    if (nclass < 0 || nclass > 7)
        return null;
    let n3 = 3;
    let intx = ntx - 1;
    if (intx >= 16) {
        n3 = 4;
        intx = ntx - 17;
    }
    const bits = [];
    appendBits(bits, pack28(p1.basecall), 28);
    appendBits(bits, pack28(p2.basecall), 28);
    appendBits(bits, parts[2] === "R" ? 1 : 0, 1);
    appendBits(bits, intx, 4);
    appendBits(bits, nclass, 3);
    appendBits(bits, isec + 1, 7);
    appendType0Suffix(bits, n3);
    return bits;
}
function tryPackType05(word) {
    if (!/^[0-9A-F]{18}$/.test(word))
        return null;
    const hex = word.padStart(18, "0");
    const n23 = parseInt(hex.slice(0, 6), 16);
    if (n23 >= 2 ** 23)
        return null;
    const bits = [];
    appendBits(bits, n23, 23);
    appendBits(bits, parseInt(hex.slice(6, 12), 16), 24);
    appendBits(bits, parseInt(hex.slice(12, 18), 16), 24);
    appendType0Suffix(bits, 5);
    return bits;
}
function tryPackType06(parts) {
    const type1 = tryPackWsprType1(parts);
    if (type1)
        return type1;
    const type2 = tryPackWsprType2(parts);
    if (type2)
        return type2;
    return null;
}
function packDbm(dbmWord) {
    if (!/^\d{1,2}$/.test(dbmWord))
        return null;
    let dbm = parseInt(dbmWord, 10);
    if (dbm < 0)
        dbm = 0;
    if (dbm > 60)
        dbm = 60;
    return Math.round(0.3 * dbm);
}
function tryPackWsprType1(parts) {
    if (parts.length !== 3)
        return null;
    const [call, grid4, dbmWord] = parts;
    if (call.length < 3 || call.length > 6)
        return null;
    if (!parseCallsign(call).isStandard)
        return null;
    if (!isGrid4$1(grid4))
        return null;
    const idbm = packDbm(dbmWord);
    if (idbm === null)
        return null;
    const bits = [];
    appendBits(bits, pack28(call), 28);
    appendBits(bits, packgrid4(grid4), 15);
    appendBits(bits, idbm, 5);
    appendBits(bits, 0, 2);
    appendBits(bits, 0, 21);
    appendType0Suffix(bits, 6);
    return bits;
}
function tryPackWsprType2(parts) {
    if (parts.length !== 2)
        return null;
    const [compound, dbmWord] = parts;
    if (compound.length < 5 || compound.length > 10)
        return null;
    const slash = compound.indexOf("/");
    if (slash < 1 || slash === compound.length - 1)
        return null;
    const idbm = packDbm(dbmWord);
    if (idbm === null)
        return null;
    const left = compound.slice(0, slash);
    const right = compound.slice(slash + 1);
    let baseCall;
    let npfx;
    if (left.length <= 3) {
        if (left.length < 1 || left.length > 3 || !/^[0-9A-Z]+$/.test(left))
            return null;
        if (!parseCallsign(right).isStandard)
            return null;
        baseCall = right;
        npfx = 0;
        for (const ch of left) {
            const idx = A2.indexOf(ch);
            if (idx < 0)
                return null;
            npfx = 36 * npfx + idx;
        }
    }
    else {
        if (right.length < 1 || right.length > 3 || !/^[0-9A-Z]+$/.test(right))
            return null;
        if (right.length === 3 && !/^\d$/.test(right[2]))
            return null;
        if (!parseCallsign(left).isStandard)
            return null;
        baseCall = left;
        if (right.length === 1) {
            npfx = A2.indexOf(right[0]);
        }
        else if (right.length === 2) {
            npfx = 36 * A2.indexOf(right[0]) + A2.indexOf(right[1]);
        }
        else {
            npfx = 360 * A2.indexOf(right[0]) + 10 * A2.indexOf(right[1]) + A2.indexOf(right[2]);
        }
        if (npfx < 0)
            return null;
        npfx += WSPR_NZZZ;
    }
    const bits = [];
    appendBits(bits, pack28(baseCall), 28);
    appendBits(bits, npfx, 16);
    appendBits(bits, idbm, 5);
    appendBits(bits, 1, 1);
    appendBits(bits, 0, 21);
    appendType0Suffix(bits, 6);
    return bits;
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
        if (isGrid4$1(lastUpper)) {
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
function isGrid4$1(s) {
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
function isGrid6(s) {
    return (s.length === 6 &&
        s[0] >= "A" &&
        s[0] <= "R" &&
        s[1] >= "A" &&
        s[1] <= "R" &&
        s[2] >= "0" &&
        s[2] <= "9" &&
        s[3] >= "0" &&
        s[3] <= "9" &&
        s[4] >= "A" &&
        s[4] <= "X" &&
        s[5] >= "A" &&
        s[5] <= "X");
}
function packgrid6(s) {
    const j1 = (s.charCodeAt(0) - 65) * 18 * 10 * 10 * 24 * 24;
    const j2 = (s.charCodeAt(1) - 65) * 10 * 10 * 24 * 24;
    const j3 = (s.charCodeAt(2) - 48) * 10 * 24 * 24;
    const j4 = (s.charCodeAt(3) - 48) * 24 * 24;
    const j5 = (s.charCodeAt(4) - 65) * 24;
    const j6 = s.charCodeAt(5) - 65;
    return j1 + j2 + j3 + j4 + j5 + j6;
}
function tryPackType3(parts) {
    if (parts.length < 4 || parts.length > 6)
        return null;
    if (parts[0]?.startsWith("<") && parts[1]?.startsWith("<"))
        return null;
    const itu = parts[0] === "TU;" ? 1 : 0;
    const call1 = parts[itu];
    const call2 = parts[itu + 1];
    const p1 = parseCallsign(call1);
    const p2 = parseCallsign(call2);
    if (!p1.isStandard || !p2.isStandard)
        return null;
    const reportIndex = itu + 2 + (parts[itu + 2] === "R" ? 1 : 0);
    if (reportIndex !== parts.length - 2)
        return null;
    const report = parts[reportIndex];
    const exchange = parts[parts.length - 1];
    if (!report || !/^5[2-9]9$/.test(report))
        return null;
    let nexch = 0;
    const serial = parseInt(exchange, 10);
    if (/^\d+$/.test(exchange) && serial > 0 && serial <= 7999) {
        nexch = serial;
    }
    else {
        const imult = RTTY_MULTIPLIERS.indexOf(exchange);
        if (imult < 0)
            return null;
        nexch = 8000 + imult + 1;
    }
    let irpt = Math.trunc((parseInt(report, 10) - 509) / 10) - 2;
    if (irpt < 0)
        irpt = 0;
    if (irpt > 7)
        irpt = 7;
    const bits = [];
    appendBits(bits, itu, 1);
    appendBits(bits, pack28(p1.basecall), 28);
    appendBits(bits, pack28(p2.basecall), 28);
    appendBits(bits, parts[itu + 2] === "R" ? 1 : 0, 1);
    appendBits(bits, irpt, 3);
    appendBits(bits, nexch, 13);
    appendBits(bits, 3, 3);
    return bits;
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
function tryPackType5(parts) {
    if (parts.length < 4 || parts.length > 5)
        return null;
    if (parts.length === 5 && parts[2] !== "R")
        return null;
    const w1 = parts[0];
    const w2 = parts[1];
    if (!w1.startsWith("<") || !w1.endsWith(">"))
        return null;
    if (!w2.startsWith("<") || !w2.endsWith(">"))
        return null;
    const exchange = parts[parts.length - 2];
    const grid6 = parts[parts.length - 1];
    if (!isGrid6(grid6))
        return null;
    const nx = parseInt(exchange, 10);
    if (Number.isNaN(nx) || nx < 520001 || nx > 594095)
        return null;
    const ir = parts[2] === "R" ? 1 : 0;
    const irpt = Math.trunc(nx / 10000) - 52;
    let iserial = nx % 10000;
    if (iserial > 2047)
        iserial = 2047;
    const bits = [];
    appendBits(bits, ihashcall$1(w1.slice(1, -1), 12), 12);
    appendBits(bits, ihashcall$1(w2.slice(1, -1), 22), 22);
    appendBits(bits, ir, 1);
    appendBits(bits, irpt, 3);
    appendBits(bits, iserial, 11);
    appendBits(bits, packgrid6(grid6), 25);
    appendBits(bits, 5, 3);
    return bits;
}
function ihashcall12(c0) {
    return ihashcall$1(c0, 12);
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
const FT4_DEFAULT_SAMPLE_RATE = 12_000;
const FT4_DEFAULT_SAMPLES_PER_SYMBOL = 576;
const FT4_DEFAULT_BT = 1.0;
const MODULATION_INDEX = 1.0;
function assertPositiveFinite(value, name) {
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${name} must be a positive finite number`);
    }
}
// Abramowitz and Stegun 7.1.26 approximation.
function erfApprox$1(x) {
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
    return 0.5 * (erfApprox$1(scale * (tt + 0.5)) - erfApprox$1(scale * (tt - 0.5)));
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
    const nwave = (shape.includeRampSymbols ? nsym + 2 : nsym) * nsps;
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
    const phaseStart = shape.includeRampSymbols ? 0 : nsps;
    for (let k = 0; k < nwave; k++) {
        const j = phaseStart + k;
        wave[k] = Math.sin(phi);
        phi += dphi[j];
        phi %= TWO_PI$1;
        if (phi < 0) {
            phi += TWO_PI$1;
        }
    }
    if (shape.fullSymbolRamp) {
        for (let i = 0; i < nsps; i++) {
            const up = (1 - Math.cos((TWO_PI$1 * i) / (2 * nsps))) / 2;
            wave[i] *= up;
        }
        const tailStart = (nsym + 1) * nsps;
        for (let i = 0; i < nsps; i++) {
            const down = (1 + Math.cos((TWO_PI$1 * i) / (2 * nsps))) / 2;
            wave[tailStart + i] *= down;
        }
    }
    else {
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
    }, {
        includeRampSymbols: false,
        fullSymbolRamp: false,
    });
}
function generateFT4Waveform(tones, options = {}) {
    // Mirrors lib/ft4/gen_ft4wave.f90.
    return generateGfskWaveform(tones, options, {
        sampleRate: FT4_DEFAULT_SAMPLE_RATE,
        samplesPerSymbol: FT4_DEFAULT_SAMPLES_PER_SYMBOL,
        bt: FT4_DEFAULT_BT,
    }, {
        includeRampSymbols: true,
        fullSymbolRamp: true,
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
function getTones$2(codeword) {
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
function encodeMessage$1(msg) {
    const bits77 = pack77(msg);
    const codeword = encode174_91(bits77);
    return getTones$2(codeword);
}
function encode$1(msg, options = {}) {
    return generateFT8Waveform(encodeMessage$1(msg), options);
}

const COSTAS_A = [0, 1, 3, 2];
const COSTAS_B = [1, 0, 2, 3];
const COSTAS_C = [2, 3, 1, 0];
const COSTAS_D = [3, 2, 0, 1];
/**
 * Convert FT4 LDPC codeword bits into 103 channel tones.
 * Port of lib/ft4/genft4.f90.
 */
function getTones$1(codeword) {
    const dataTones = new Array(87);
    for (let i = 0; i < 87; i++) {
        const b0 = codeword[2 * i] ?? 0;
        const b1 = codeword[2 * i + 1] ?? 0;
        const symbol = b1 + 2 * b0;
        dataTones[i] = GRAYMAP[symbol];
    }
    const tones = new Array(103);
    tones.splice(0, 4, ...COSTAS_A);
    tones.splice(4, 29, ...dataTones.slice(0, 29));
    tones.splice(33, 4, ...COSTAS_B);
    tones.splice(37, 29, ...dataTones.slice(29, 58));
    tones.splice(66, 4, ...COSTAS_C);
    tones.splice(70, 29, ...dataTones.slice(58, 87));
    tones.splice(99, 4, ...COSTAS_D);
    return tones;
}
function encodeMessage(msg) {
    const bits77 = pack77(msg);
    const scrambled = xorWithScrambler(bits77);
    const codeword = encode174_91(scrambled);
    return getTones$1(codeword);
}
function encode(msg, options = {}) {
    return generateFT4Waveform(encodeMessage(msg), options);
}

/**
 * Hash call table – TypeScript port of the hash call storage from packjt77.f90
 *
 * In FT8, nonstandard callsigns are transmitted as hashes (10-, 12-, or 22-bit).
 * When a full callsign is decoded from a standard message, it is stored in this
 * table so that future hashed references to it can be resolved.
 *
 * Mirrors Fortran: save_hash_call, hash10, hash12, hash22, ihashcall
 */
const MAGIC = 47055833459n;
const MAX_HASH22_ENTRIES = 1000;
function ihashcall(c0, m) {
    const s = c0.padEnd(11, " ").slice(0, 11).toUpperCase();
    let n8 = 0n;
    for (let i = 0; i < 11; i++) {
        const j = C38.indexOf(s[i] ?? " ");
        n8 = 38n * n8 + BigInt(j < 0 ? 0 : j);
    }
    const prod = BigInt.asUintN(64, MAGIC * n8);
    return Number(prod >> BigInt(64 - m)) & ((1 << m) - 1);
}
/**
 * Maintains a callsign ↔ hash lookup table for resolving hashed FT8 callsigns.
 *
 * Usage:
 * ```ts
 * const book = new HashCallBook();
 * const decoded = decodeFT8(samples, { sampleRate, hashCallBook: book });
 * // `book` now contains callsigns learned from decoded messages.
 * // Subsequent calls reuse the same book to resolve hashed callsigns:
 * const decoded2 = decodeFT8(samples2, { sampleRate, hashCallBook: book });
 * ```
 *
 * You can also pre-populate the book with known callsigns:
 * ```ts
 * book.save("W9XYZ");
 * book.save("PJ4/K1ABC");
 * ```
 */
class HashCallBook {
    calls10 = new Map();
    calls12 = new Map();
    hash22Entries = [];
    /**
     * Store a callsign in all three hash tables (10, 12, 22-bit).
     * Strips angle brackets if present. Ignores `<...>` and blank/short strings.
     */
    save(callsign) {
        let cw = callsign.trim().toUpperCase();
        if (cw === "" || cw === "<...>")
            return;
        if (cw.startsWith("<"))
            cw = cw.slice(1);
        const gt = cw.indexOf(">");
        if (gt >= 0)
            cw = cw.slice(0, gt);
        cw = cw.trim();
        if (cw.length < 3)
            return;
        const n10 = ihashcall(cw, 10);
        if (n10 >= 0 && n10 <= 1023)
            this.calls10.set(n10, cw);
        const n12 = ihashcall(cw, 12);
        if (n12 >= 0 && n12 <= 4095)
            this.calls12.set(n12, cw);
        const n22 = ihashcall(cw, 22);
        const existing = this.hash22Entries.findIndex((e) => e.hash === n22);
        if (existing >= 0) {
            this.hash22Entries[existing].call = cw;
        }
        else {
            if (this.hash22Entries.length >= MAX_HASH22_ENTRIES) {
                this.hash22Entries.pop();
            }
            this.hash22Entries.unshift({ hash: n22, call: cw });
        }
    }
    /** Look up a callsign by its 10-bit hash. Returns `null` if not found. */
    lookup10(n10) {
        if (n10 < 0 || n10 > 1023)
            return null;
        return this.calls10.get(n10) ?? null;
    }
    /** Look up a callsign by its 12-bit hash. Returns `null` if not found. */
    lookup12(n12) {
        if (n12 < 0 || n12 > 4095)
            return null;
        return this.calls12.get(n12) ?? null;
    }
    /** Look up a callsign by its 22-bit hash. Returns `null` if not found. */
    lookup22(n22) {
        const entry = this.hash22Entries.find((e) => e.hash === n22);
        return entry?.call ?? null;
    }
    /** Number of entries in the 22-bit hash table. */
    get size() {
        return this.hash22Entries.length;
    }
    /** The contents of the book, to be restored with `restore`. */
    snapshot() {
        return {
            calls10: [...this.calls10],
            calls12: [...this.calls12],
            hash22: this.hash22Entries.map((e) => ({ ...e })),
        };
    }
    /** Replace the contents of the book with a `snapshot`. */
    restore(snapshot) {
        this.clear();
        for (const [hash, call] of snapshot.calls10)
            this.calls10.set(hash, call);
        for (const [hash, call] of snapshot.calls12)
            this.calls12.set(hash, call);
        for (const e of snapshot.hash22)
            this.hash22Entries.push({ ...e });
    }
    /** Remove all stored entries. */
    clear() {
        this.calls10.clear();
        this.calls12.clear();
        this.hash22Entries.length = 0;
    }
}

// Port of the "a7" decode table and candidate messages of WSJT-X v3.0.1
// (ft8_a7.f90: ft8_a7_save and the message list of ft8_a7d).
/** Maximum number of decodes saved per slot (MAXDEC). */
const MAX_ENTRIES = 200;
const SLOT_MS = 15_000;
/** Number of candidate messages tried for each saved decode. */
const NUM_MESSAGES = 206;
/**
 * Decodes of recent FT8 slots, used for "a7" decoding: a station decoded 30 s
 * earlier is looked for again at the same frequency with the messages it is
 * likely to send next.
 *
 * Pass the same instance to consecutive `decodeFT8` calls together with
 * `slotStart`:
 * ```ts
 * const history = new FT8History();
 * const decoded = decodeFT8(samples, { depth: 3, history, slotStart: Date.now() });
 * ```
 */
class FT8History {
    /** Saved decodes keyed by slot number, floor(ms since epoch / 15000). */
    slots = new Map();
    /** Remove all saved decodes. */
    clear() {
        this.slots.clear();
    }
    /**
     * Start a new tally for `slot`, replacing one saved by an earlier decode of
     * the same slot, and return the tally of the previous slot of the same
     * sequence (30 s earlier).
     */
    beginSlot(slot) {
        for (const key of this.slots.keys()) {
            if (key < slot - 2)
                this.slots.delete(key);
        }
        this.slots.set(slot, []);
        return this.slots.get(slot - 2) ?? [];
    }
    /** Save a decode of `slot` (ft8_a7_save). `dt` and `freq` are as reported to the user. */
    save(slot, dt, freq, msg) {
        if (msg.includes("/") || msg.includes("<"))
            return;
        const { words, lengths } = split77(msg);
        if (words.length < 1 || words[0].startsWith("CQ_"))
            return;
        const tally = this.slots.get(slot);
        if (!tally || tally.length >= MAX_ENTRIES)
            return;
        const [w1, w2 = "", w3 = ""] = words;
        let entry = `${w1} ${w2}`.trim();
        if (w1 === "CQ" && lengths[1] <= 2)
            entry = `CQ ${w2} ${w3}`.trim();
        const last = words[words.length - 1];
        if (isGrid4(last.slice(0, 4)))
            entry = `${entry} ${last}`;
        tally.push({ dt, freq, msg: entry });
    }
    /**
     * Whether a decode already saved for `slot` comes from the station of
     * `entry` (saved for slot - 2), so that no a7 decode should be tried for it.
     */
    supersedes(slot, entry) {
        for (const cur of this.slots.get(slot) ?? []) {
            const call2 = split77(cur.msg).words[1] ?? "";
            if (Math.abs(cur.freq - entry.freq) <= 3.0 && entry.msg.indexOf(` ${call2}`) >= 2) {
                return true;
            }
        }
        return false;
    }
}
/** Slot number of a time within a 15 s FT8 slot. */
function slotNumber(time) {
    const ms = typeof time === "number" ? time : time.getTime();
    return Math.floor(ms / SLOT_MS);
}
/**
 * The message candidates for an a7 decode of `entry` (ft8_a7d), with the
 * callsigns and grid they were built from. Messages that cannot be packed are
 * `null`.
 */
function a7Candidates(entry) {
    const i1 = entry.msg.indexOf(" ");
    const call1 = (i1 < 0 ? entry.msg : entry.msg.slice(0, i1)).slice(0, 12);
    const rest = i1 < 0 ? "" : entry.msg.slice(i1 + 1);
    const i2 = rest.indexOf(" ");
    const call2 = (i2 < 0 ? rest : rest.slice(0, i2)).slice(0, 12);
    let grid4 = i2 < 0 ? "" : rest.slice(i2 + 1, i2 + 5);
    if (grid4 === "RR73" || grid4.includes("+") || grid4.includes("-"))
        grid4 = "";
    const candidates = a7Messages(call1, call2, grid4).map((msg) => {
        try {
            const bits77 = pack77(msg);
            const cw = encode174_91(bits77);
            return { bits77, cw, tones: getTones$2(cw) };
        }
        catch {
            return null;
        }
    });
    return { call1, call2, grid4, candidates };
}
/** The message a candidate decodes to, with hashed callsigns resolved (genft8 `msgsent`). */
function a7MessageText(candidate, call1, call2) {
    const book = new HashCallBook();
    for (const call of [call1, call2, "QU1RK"])
        book.save(call);
    const { msg, success } = unpack77(candidate.bits77, book);
    return success ? msg : null;
}
/** Whether `call` is a standard callsign (stdcall in WSJT-X). */
function isStandardCall(call) {
    const n = call.length;
    let iarea = n - 1;
    while (iarea >= 1 && !isDigit(call[iarea]))
        iarea--;
    if (iarea < 1 || iarea > 2)
        return false;
    let npdig = 0;
    let nplet = 0;
    for (let i = 0; i < iarea; i++) {
        if (isDigit(call[i]))
            npdig++;
        if (isLetter(call[i]))
            nplet++;
    }
    let nslet = 0;
    for (let i = iarea + 1; i < n; i++) {
        if (isLetter(call[i]))
            nslet++;
    }
    return nplet > 0 && npdig < iarea && nslet <= 3;
}
/**
 * The 206 messages tried for an a7 decode: "call_1 call_2" alone and with RRR,
 * RR73, 73, the grid and every report from -50 to +49 (with and without R),
 * plus "CQ call_2 grid".
 */
function a7Messages(call1, call2, grid4) {
    const std1 = call1 === "CQ" || isStandardCall(call1);
    const std2 = isStandardCall(call2);
    const msgs = [];
    for (let i = 1; i <= NUM_MESSAGES; i++) {
        let msg = `${call1} ${call2}`;
        if (call1 === "CQ" && i !== 5)
            msg = `QU1RK ${call2}`;
        if (!std1) {
            if (i === 1 || i >= 6)
                msg = `<${call1}> ${call2}`;
            if (i >= 2 && i <= 4)
                msg = `${call1} <${call2}>`;
        }
        else if (!std2) {
            if (i <= 4 || i === 6)
                msg = `<${call1}> ${call2}`;
            if (i >= 7)
                msg = `${call1} <${call2}>`;
        }
        if (i === 2)
            msg += " RRR";
        if (i === 3)
            msg += " RR73";
        if (i === 4)
            msg += " 73";
        if (i === 5) {
            if (std2) {
                msg = `CQ ${call2}`;
                if (call1[2] === "_")
                    msg = `${call1} ${call2}`;
                msg += ` ${grid4}`;
            }
            else {
                msg = `CQ ${call2}`;
            }
        }
        if (i === 6 && std2)
            msg += ` ${grid4}`;
        if (i >= 7) {
            const isnr = -50 + Math.trunc((i - 7) / 2);
            const report = (isnr >= 0 ? "+" : "-") + Math.abs(isnr).toString().padStart(2, "0");
            msg += i % 2 === 1 ? ` ${report}` : ` R${report}`;
        }
        msgs.push(msg.trim());
    }
    return msgs;
}
/**
 * Split a message into upper-case words, merging "CQ xxx" into "CQ_xxx" when
 * the third word is a callsign (split77 in packjt77.f90). `lengths` are the
 * word lengths before merging.
 */
function split77(msg) {
    const words = msg.toUpperCase().split(" ").filter(Boolean);
    const lengths = words.map((w) => w.length);
    if (words.length >= 3 && words[0] === "CQ" && chkcall(words[2])) {
        words.splice(0, 2, `CQ_${words[1].slice(0, 10)}`);
    }
    return { words, lengths };
}
/** Whether `w` could be a standard or compound callsign (chkcall.f90). */
function chkcall(w) {
    const n1 = w.length;
    if (n1 > 11 || /[.+\-?]/.test(w))
        return false;
    const i0 = w.indexOf("/");
    if (n1 > 6 && i0 < 0)
        return false;
    // Base call of a compound call: the longer part
    if (Math.max(i0, n1 - i0 - 1) > 6)
        return false;
    let bc = w.slice(0, 6);
    if (i0 >= 1 && i0 <= n1 - 2)
        bc = i0 <= n1 - i0 - 1 ? w.slice(i0 + 1) : w.slice(0, i0);
    const nbc = bc.length;
    if (nbc > 6)
        return false;
    if (!isLetter(bc[0] ?? "") && !isLetter(bc[1] ?? ""))
        return false;
    if (bc[0] === "Q" && !bc.startsWith("QU1RK"))
        return false;
    // Call area digit in the second or third position, followed by 1-3 letters
    let i1 = -1;
    if (isDigit(bc[1] ?? ""))
        i1 = 1;
    if (isDigit(bc[2] ?? ""))
        i1 = 2;
    if (i1 < 0 || i1 === nbc - 1)
        return false;
    for (let i = i1 + 1; i < nbc; i++) {
        if (!isLetter(bc[i]))
            return false;
    }
    return nbc - i1 - 1 <= 3;
}
function isGrid4(g) {
    return /^[A-R]{2}[0-9]{2}$/.test(g);
}
function isDigit(c) {
    return c >= "0" && c <= "9";
}
function isLetter(c) {
    return c >= "A" && c <= "Z";
}

// Port of the WSJT-X v3.0.1 FT8 decoder (ft8_decode.f90, sync8.f90, ft8b.f90,
// subtractft8.f90, get_spectrum_baseline.f90, ft8_a7.f90).
const NSPS = 1920;
const NFFT1 = 2 * NSPS; // 3840
const NH1 = NFFT1 / 2; // 1920
const NSTEP = NSPS / 4; // 480
const NMAX = 15 * 12_000; // 180000
const NHSYM = Math.floor(NMAX / NSTEP) - 3; // 372
const NDOWN = 60;
const NN = 79;
const NP2 = 2812;
const NFRAME = NSPS * NN; // 151680
const NFFT1_LONG = 192000;
const NFFT2 = 3200;
const COSTAS_BLOCKS = 7;
const COSTAS_SYMBOL_LEN = 32;
const SYNC_TIME_SHIFTS = [0, 36, 72];
const TAPER_SIZE = 101;
const TAPER_LAST = TAPER_SIZE - 1;
const TWO_PI = 2 * Math.PI;
const SYNC_DF = SAMPLE_RATE / NFFT1; // 3.125 Hz
const SYNC_TSTEP = NSTEP / SAMPLE_RATE; // 0.04 s
const SYNC_JZ = 62;
const SYNC_MLAG = 13;
const SYNC_NSSY = NSPS / NSTEP; // 4
const SYNC_NFOS = NFFT1 / NSPS; // 2
const SYNC_JSTRT = Math.trunc(0.5 / SYNC_TSTEP); // 12
const MAX_PRECANDIDATES = 1000;
const FS2 = SAMPLE_RATE / NDOWN; // 200 Hz
const DT2 = 1.0 / FS2;
const DOWNSAMPLE_DF = SAMPLE_RATE / NFFT1_LONG;
const DOWNSAMPLE_BAUD = SAMPLE_RATE / NSPS;
const DOWNSAMPLE_SCALE = Math.sqrt(NFFT2 / NFFT1_LONG);
/** Extent of an FT8 signal around its base frequency (8 tones plus GFSK skirts). */
const SIGNAL_BAND_BELOW = DOWNSAMPLE_BAUD;
const SIGNAL_BAND_ABOVE = 8 * DOWNSAMPLE_BAUD;
/** ft8b time/frequency search grid: ±10 downsampled samples, ±2.5 Hz in 0.5 Hz steps. */
const SEARCH_TIME_HALF = 10;
const SEARCH_TIME_STEPS = 2 * SEARCH_TIME_HALF + 1;
const SEARCH_FREQ_HALF = 5;
const SEARCH_FREQ_STEP = 0.5;
const SEARCH_FREQ_STEPS = 2 * SEARCH_FREQ_HALF + 1;
const LLR_SCALE = 2.83;
const MAX_HARD_ERRORS = 36;
const MIN_SNR = -25;
const SUBTRACT_NFILT = 4000;
const SUBTRACT_HALF = SUBTRACT_NFILT / 2;
const SUBTRACT_BLOCK = 20;
const SUBTRACT_NBLOCKS = NFRAME / SUBTRACT_BLOCK; // 7584
/** CQ, CQ TEST, CQ FD, CQ RU and CQ WW in the first 29 bits (ft8b.f90 `mcq`, `mcqtest`, ...). */
const MCQ = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0];
const MCQTEST = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0,
];
const MCQFD = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0,
];
const MCQRU = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0,
];
const MCQWW = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0,
];
const CQ_AP_BITS = {
    NA_VHF: MCQTEST,
    EU_VHF: MCQTEST,
    FIELD_DAY: MCQFD,
    RTTY: MCQRU,
    WW_DIGI: MCQWW,
    ARRL_DIGI: MCQTEST,
};
const TAPER = buildTaper(TAPER_SIZE);
const COSTAS_SYNC = buildCostasSyncTemplates();
const { rotRe: SLIDE_ROT_RE, rotIm: SLIDE_ROT_IM, endRe: SLIDE_END_RE, endIm: SLIDE_END_IM, phaseRe: SLIDE_PHASE_RE, phaseIm: SLIDE_PHASE_IM, } = buildSlidingDftTables();
const BASELINE_WINDOW = buildBaselineWindow();
const GFSK_PULSE = buildGfskPulse(2.0);
const LPF = buildSubtractionFilter();
/**
 * Decode all FT8 signals in an audio buffer.
 * Input: mono audio samples at `sampleRate` Hz, duration ~15s.
 */
function decode(samples, options = {}) {
    const { nfa, nfb, npass, params } = resolveDecodeSettings(options);
    const history = options.history;
    const slot = historySlot(options);
    const previous = history?.beginSlot(slot) ?? [];
    const dd = prepareSamples(samples, options.sampleRate ?? SAMPLE_RATE);
    const workspace = createDecodeWorkspace();
    const collector = new DecodeCollector(history, slot);
    let sbase = new Float64Array(NH1 + 1);
    for (let ipass = 1; ipass <= npass; ipass++) {
        if (ipass === 3 && collector.decoded.length === 0)
            break;
        const pass = runPass(dd, nfa, nfb, ipass, params, workspace);
        sbase = pass.sbase;
        for (const d of pass.decodes)
            collector.add(toDecodedMessage(d));
    }
    // a7: stations decoded 30 s earlier, looked for in the residual signal.
    if (history && params.depth >= 3 && previous.length > 0) {
        computeLongSpectrum(dd, workspace);
        for (const entry of previous) {
            if (history.supersedes(slot, entry))
                continue;
            const result = runA7Entry(entry, sbase, workspace);
            if (result)
                collector.add(result);
        }
    }
    return collector.decoded;
}
/** Resolves the options into the band, number of passes and pass settings. */
function resolveDecodeSettings(options) {
    const nfa = options.freqLow ?? 200;
    const nfb = options.freqHigh ?? 3000;
    // Depths above 3 are accepted and behave like 3.
    const depth = Math.min(options.depth ?? 2, 3);
    const params = {
        depth,
        syncmin: options.syncMin ?? (depth <= 2 ? 2.1 : 1.3),
        maxCandidates: options.maxCandidates ?? 1000,
        contest: options.contest,
        book: options.hashCallBook,
    };
    return { nfa, nfb, npass: depth <= 1 ? 2 : 3, params };
}
/** Slot number of the decode, checking that `slotStart` comes with `history`. */
function historySlot(options) {
    if (options.history && options.slotStart === undefined) {
        throw new TypeError("decodeFT8: `slotStart` is required when `history` is given");
    }
    return options.slotStart === undefined ? 0 : slotNumber(options.slotStart);
}
/** The 15 s decode window at 12 kHz. */
function prepareSamples(samples, sampleRate) {
    return sampleRate === SAMPLE_RATE
        ? copySamplesToDecodeWindow(samples)
        : resample(samples, sampleRate, SAMPLE_RATE, NMAX);
}
/** Collects decodes, dropping repeated messages, and saves them for a7. */
class DecodeCollector {
    history;
    slot;
    decoded = [];
    seenMessages = new Set();
    constructor(history, slot) {
        this.history = history;
        this.slot = slot;
    }
    add(d) {
        const messageKey = normalizeMessageKey(d.msg);
        if (this.seenMessages.has(messageKey))
            return;
        this.seenMessages.add(messageKey);
        this.decoded.push(d);
        this.history?.save(this.slot, d.dt, d.freq, d.msg);
    }
}
function toDecodedMessage(d) {
    const { tones: _tones, dtSubtract: _dtSubtract, ...message } = d;
    return message;
}
/**
 * One decoding pass over [nfa, nfb] Hz: find candidates, decode them and
 * subtract each decoded signal from `dd`. Returns the decodes in order,
 * including repeated messages, and the spectrum baseline.
 */
function runPass(dd, nfa, nfb, ipass, params, workspace) {
    // Pass 1 uses amplitude bit metrics, later passes power metrics.
    const imetric = ipass === 1 ? 1 : 2;
    const { candidates, sbase } = sync8(dd, nfa, nfb, params.syncmin, params.maxCandidates);
    computeLongSpectrum(dd, workspace);
    // Bands [lo, hi] (Hz) of signals subtracted since the spectrum was computed.
    const staleBands = [];
    const decodes = [];
    for (const cand of candidates) {
        // WSJT-X keeps using the spectrum computed at the start of the pass. A
        // candidate overlapping a just-subtracted signal would then re-decode
        // that signal (and subtract it a second time with worse parameters),
        // so refresh the spectrum first.
        if (overlapsBands(cand.freq, staleBands)) {
            computeLongSpectrum(dd, workspace);
            staleBands.length = 0;
        }
        const ibin = Math.max(1, Math.round(cand.freq / SYNC_DF));
        const xbase = 10.0 ** (0.1 * (sbase[ibin] - 40.0));
        const result = ft8b(cand.freq, cand.dt, xbase, params.depth, imetric, params.contest, params.book, workspace);
        if (!result)
            continue;
        subtractft8(dd, result.tones, result.freq, result.dtSubtract, workspace);
        staleBands.push(result.freq - SIGNAL_BAND_BELOW, result.freq + SIGNAL_BAND_ABOVE);
        decodes.push({
            freq: result.freq,
            dt: result.dt - 0.5,
            snr: result.snr,
            msg: result.msg,
            sync: cand.sync,
            ...(result.ap ? { ap: result.ap } : {}),
            tones: result.tones,
            dtSubtract: result.dtSubtract,
        });
    }
    return { decodes, sbase };
}
/**
 * Whether a signal at `freq` Hz can affect decoding in [nfa, nfb] Hz: whether
 * it lies within reach of the spectra that sync8 and ft8b read for candidates
 * in the band, with one tone spacing to spare.
 */
function affectsBand(freq, nfa, nfb) {
    const reach = SIGNAL_BAND_ABOVE + SEARCH_FREQ_HALF * SEARCH_FREQ_STEP + DOWNSAMPLE_BAUD;
    return freq + SIGNAL_BAND_ABOVE > nfa - reach && freq - SIGNAL_BAND_BELOW < nfb + reach;
}
/**
 * a7 decode of one entry saved 30 s earlier. The spectrum of the residual
 * signal must have been computed into the workspace (`computeLongSpectrum`).
 */
function runA7Entry(entry, sbase, workspace) {
    const ibin = Math.max(1, Math.round(entry.freq / SYNC_DF));
    const xbase = 10.0 ** (0.1 * (sbase[ibin] - 40.0));
    const result = ft8a7d(entry, xbase, workspace);
    return result ? { ...result, sync: 0, ap: 7 } : null;
}
function normalizeMessageKey(msg) {
    return msg.trim().replace(/\s+/g, " ").toUpperCase();
}
/** Whether the band ft8b would use for a candidate at `freq` overlaps any of `bands`. */
function overlapsBands(freq, bands) {
    const search = SEARCH_FREQ_HALF * SEARCH_FREQ_STEP;
    const lo = freq - search - 1.5 * DOWNSAMPLE_BAUD;
    const hi = freq + search + 8.5 * DOWNSAMPLE_BAUD;
    for (let i = 0; i < bands.length; i += 2) {
        if (lo < bands[i + 1] && hi > bands[i])
            return true;
    }
    return false;
}
function createDecodeWorkspace() {
    return {
        cxRe: new Float64Array(NFFT1_LONG),
        cxIm: new Float64Array(NFFT1_LONG),
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
        bmete: new Float64Array(N_LDPC),
        llr: new Float64Array(N_LDPC),
        apmask: new Int8Array(N_LDPC),
        ss: new Float64Array(9),
        syncGrid: new Float64Array(SEARCH_TIME_STEPS * SEARCH_FREQ_STEPS),
        crefRe: new Float64Array(NFRAME),
        crefIm: new Float64Array(NFRAME),
        sum0Re: new Float64Array(SUBTRACT_NBLOCKS + 1),
        sum0Im: new Float64Array(SUBTRACT_NBLOCKS + 1),
        sumPlusRe: new Float64Array(SUBTRACT_NBLOCKS + 1),
        sumPlusIm: new Float64Array(SUBTRACT_NBLOCKS + 1),
        sumMinusRe: new Float64Array(SUBTRACT_NBLOCKS + 1),
        sumMinusIm: new Float64Array(SUBTRACT_NBLOCKS + 1),
        cfiltRe: new Float64Array(SUBTRACT_NBLOCKS + 1),
        cfiltIm: new Float64Array(SUBTRACT_NBLOCKS + 1),
        dphi: new Float64Array((NN + 2) * NSPS),
    };
}
function copySamplesToDecodeWindow(samples) {
    const out = new Float64Array(NMAX);
    const len = Math.min(samples.length, NMAX);
    for (let i = 0; i < len; i++)
        out[i] = samples[i];
    return out;
}
function computeLongSpectrum(dd, workspace) {
    const { cxRe, cxIm } = workspace;
    cxRe.fill(0);
    cxIm.fill(0);
    cxRe.set(dd);
    fftComplex(cxRe, cxIm, false);
}
// ── Candidate search (sync8.f90) ────────────────────────────────────────────
/**
 * Power spectra of 3840-sample FFTs of `x * scale`, stepping `step` samples.
 * Two real frames are transformed per complex FFT.
 * Returns s[bin * nframes + frame] for bins 0..NH1.
 */
function frameSpectra(dd, nframes, step, frameLen, window, scale) {
    const s = new Float64Array((NH1 + 1) * nframes);
    const re = new Float64Array(NFFT1);
    const im = new Float64Array(NFFT1);
    for (let j = 0; j < nframes; j += 2) {
        re.fill(0);
        im.fill(0);
        const ia = j * step;
        const ib = (j + 1) * step;
        const hasSecond = j + 1 < nframes;
        for (let i = 0; i < frameLen; i++) {
            const w = window ? window[i] : scale;
            if (ia + i < dd.length)
                re[i] = w * dd[ia + i];
            if (hasSecond && ib + i < dd.length)
                im[i] = w * dd[ib + i];
        }
        fftComplex(re, im, false);
        for (let k = 1; k <= NH1; k++) {
            const nk = (NFFT1 - k) % NFFT1;
            // X = A + iB with A, B real-input spectra.
            const aRe = 0.5 * (re[k] + re[nk]);
            const aIm = 0.5 * (im[k] - im[nk]);
            s[k * nframes + j] = aRe * aRe + aIm * aIm;
            if (hasSecond) {
                const bRe = 0.5 * (im[k] + im[nk]);
                const bIm = -0.5 * (re[k] - re[nk]);
                s[k * nframes + j + 1] = bRe * bRe + bIm * bIm;
            }
        }
    }
    return s;
}
function sync8(dd, nfa, nfb, syncmin, maxcand) {
    const s = frameSpectra(dd, NHSYM, NSTEP, NSPS, null, 1.0 / 300.0);
    const sbase = getSpectrumBaseline(dd, nfa, nfb);
    const ia = Math.max(1, Math.round(nfa / SYNC_DF));
    const ib = Math.min(NH1 - SYNC_NFOS * 7, Math.round(nfb / SYNC_DF));
    if (ib < ia)
        return { candidates: [], sbase };
    const iz = ib - ia + 1;
    const width = 2 * SYNC_JZ + 1;
    // Sum over the 7 tone bins of each Costas symbol, per frequency and time.
    const t0s = new Float64Array(iz * NHSYM);
    for (let i = ia; i <= ib; i++) {
        const row = (i - ia) * NHSYM;
        for (let tone = 0; tone <= 6; tone++) {
            const src = (i + SYNC_NFOS * tone) * NHSYM;
            for (let m = 0; m < NHSYM; m++)
                t0s[row + m] = t0s[row + m] + s[src + m];
        }
    }
    const sync2d = new Float64Array(iz * width);
    for (let i = ia; i <= ib; i++) {
        const row = (i - ia) * NHSYM;
        for (let j = -SYNC_JZ; j <= SYNC_JZ; j++) {
            let ta = 0;
            let tb = 0;
            let tc = 0;
            let t0a = 0;
            let t0b = 0;
            let t0c = 0;
            for (let n = 0; n < COSTAS_BLOCKS; n++) {
                // 0-based time index of Costas symbol n (Fortran m-1)
                const m = j + SYNC_JSTRT + SYNC_NSSY * n - 1;
                const sc = (i + SYNC_NFOS * COSTAS[n]) * NHSYM;
                if (m >= 0 && m < NHSYM) {
                    ta += s[sc + m];
                    t0a += t0s[row + m];
                }
                const mb = m + SYNC_NSSY * 36;
                if (mb >= 0 && mb < NHSYM) {
                    tb += s[sc + mb];
                    t0b += t0s[row + mb];
                }
                const mc = m + SYNC_NSSY * 72;
                if (mc >= 0 && mc < NHSYM) {
                    tc += s[sc + mc];
                    t0c += t0s[row + mc];
                }
            }
            let t = ta + tb + tc;
            let t0 = (t0a + t0b + t0c - t) / 6.0;
            const syncAbc = t0 > 0 ? t / t0 : 0;
            t = tb + tc;
            t0 = (t0b + t0c - t) / 6.0;
            const syncBc = t0 > 0 ? t / t0 : 0;
            sync2d[(i - ia) * width + j + SYNC_JZ] = Math.max(syncAbc, syncBc);
        }
    }
    const red = new Float64Array(iz);
    const red2 = new Float64Array(iz);
    const jpeak = new Int32Array(iz);
    const jpeak2 = new Int32Array(iz);
    for (let k = 0; k < iz; k++) {
        const row = k * width + SYNC_JZ;
        let best = -Infinity;
        for (let j = -SYNC_MLAG; j <= SYNC_MLAG; j++) {
            const v = sync2d[row + j];
            if (v > best) {
                best = v;
                jpeak[k] = j;
            }
        }
        red[k] = best;
        best = -Infinity;
        for (let j = -SYNC_JZ; j <= SYNC_JZ; j++) {
            const v = sync2d[row + j];
            if (v > best) {
                best = v;
                jpeak2[k] = j;
            }
        }
        red2[k] = best;
    }
    const npctile = Math.round(0.4 * iz);
    if (npctile < 1)
        return { candidates: [], sbase };
    const order = Array.from({ length: iz }, (_, k) => k).sort((a, b) => red[a] - red[b]);
    const base = red[order[npctile - 1]];
    const order2 = Array.from({ length: iz }, (_, k) => k).sort((a, b) => red2[a] - red2[b]);
    const base2 = red2[order2[npctile - 1]];
    for (let k = 0; k < iz; k++) {
        red[k] = red[k] / base;
        red2[k] = red2[k] / base2;
    }
    const candidates0 = [];
    for (let i = 0; i < Math.min(MAX_PRECANDIDATES, iz); i++) {
        const k = order[iz - 1 - i];
        const freq = (ia + k) * SYNC_DF;
        if (candidates0.length >= MAX_PRECANDIDATES)
            break;
        if (red[k] >= syncmin) {
            candidates0.push({ freq, dt: (jpeak[k] - 0.5) * SYNC_TSTEP, sync: red[k] });
        }
        if (jpeak2[k] === jpeak[k])
            continue;
        if (candidates0.length >= MAX_PRECANDIDATES)
            break;
        if (red2[k] >= syncmin) {
            candidates0.push({ freq, dt: (jpeak2[k] - 0.5) * SYNC_TSTEP, sync: red2[k] });
        }
    }
    // Save only the best of near-dupe freqs.
    for (let i = 1; i < candidates0.length; i++) {
        const ci = candidates0[i];
        for (let j = 0; j < i; j++) {
            const cj = candidates0[j];
            if (Math.abs(ci.freq - cj.freq) < 4.0 && Math.abs(ci.dt - cj.dt) < 0.04) {
                if (ci.sync >= cj.sync)
                    cj.sync = 0;
                if (ci.sync < cj.sync)
                    ci.sync = 0;
            }
        }
    }
    const candidates = candidates0.filter((c) => c.sync >= syncmin);
    candidates.sort((a, b) => b.sync - a.sync);
    return { candidates: candidates.slice(0, maxcand), sbase };
}
/** get_spectrum_baseline.f90 + baseline.f90: spectrum baseline in dB, indexed by bin (3.125 Hz). */
function getSpectrumBaseline(dd, nfaIn, nfbIn) {
    const nst = NFFT1 / 2;
    let nframes = 0;
    while (nframes < 93 && nframes * nst + NFFT1 <= NMAX)
        nframes++;
    const s = frameSpectra(dd, nframes, nst, NFFT1, BASELINE_WINDOW, 1);
    const savg = new Float64Array(NH1 + 1);
    for (let k = 1; k <= NH1; k++) {
        let sum = 0;
        for (let j = 0; j < nframes; j++)
            sum += s[k * nframes + j];
        savg[k] = sum;
    }
    let nfa = nfaIn;
    let nfb = nfbIn;
    const nwin = nfb - nfa;
    if (nfa < 100) {
        nfa = 100;
        if (nwin < 100)
            nfb = nfa + nwin;
    }
    if (nfb > 4910) {
        nfb = 4910;
        if (nwin < 100)
            nfa = nfb - nwin;
    }
    return baseline(savg, nfa, nfb);
}
function baseline(savg, nfa, nfb) {
    const sbase = new Float64Array(NH1 + 1);
    const nseg = 10;
    const npct = 10;
    const ia = Math.max(1, Math.round(nfa / SYNC_DF));
    const ib = Math.min(NH1, Math.round(nfb / SYNC_DF));
    if (ib <= ia)
        return sbase;
    const sdb = new Float64Array(NH1 + 1);
    for (let i = ia; i <= ib; i++)
        sdb[i] = 10.0 * Math.log10(Math.max(savg[i], 1e-30));
    const nlen = Math.trunc((ib - ia + 1) / nseg);
    const i0 = Math.trunc((ib - ia + 1) / 2);
    const xs = [];
    const ys = [];
    for (let n = 0; n < nseg; n++) {
        const ja = ia + n * nlen;
        const jb = ja + nlen - 1;
        const seg = Array.from(sdb.subarray(ja, jb + 1)).sort((a, b) => a - b);
        let jp = Math.round(nlen * 0.01 * npct);
        if (jp < 1)
            jp = 1;
        if (jp > nlen)
            jp = nlen;
        const base = seg[jp - 1];
        for (let i = ja; i <= jb; i++) {
            if (sdb[i] <= base && xs.length < 1000) {
                xs.push(i - i0);
                ys.push(sdb[i]);
            }
        }
    }
    const a = polyfit(xs, ys, 5);
    for (let i = ia; i <= ib; i++) {
        const t = i - i0;
        sbase[i] = a[0] + t * (a[1] + t * (a[2] + t * (a[3] + t * a[4]))) + 0.65;
    }
    return sbase;
}
/** Least-squares polynomial fit y ≈ Σ a[n] x^n (n < nterms). */
function polyfit(xs, ys, nterms) {
    const a = new Array(nterms).fill(0);
    if (xs.length < nterms)
        return a;
    // Fit in a scaled variable for numerical stability, then rescale.
    let scale = 1;
    for (const x of xs)
        scale = Math.max(scale, Math.abs(x));
    const mat = Array.from({ length: nterms }, () => new Array(nterms + 1).fill(0));
    for (let p = 0; p < xs.length; p++) {
        const u = xs[p] / scale;
        const pw = new Array(2 * nterms - 1);
        pw[0] = 1;
        for (let n = 1; n < pw.length; n++)
            pw[n] = pw[n - 1] * u;
        for (let r = 0; r < nterms; r++) {
            for (let c = 0; c < nterms; c++)
                mat[r][c] = mat[r][c] + pw[r + c];
            mat[r][nterms] = mat[r][nterms] + pw[r] * ys[p];
        }
    }
    for (let col = 0; col < nterms; col++) {
        let piv = col;
        for (let r = col + 1; r < nterms; r++) {
            if (Math.abs(mat[r][col]) > Math.abs(mat[piv][col]))
                piv = r;
        }
        if (Math.abs(mat[piv][col]) < 1e-300)
            return a;
        [mat[col], mat[piv]] = [mat[piv], mat[col]];
        for (let r = 0; r < nterms; r++) {
            if (r === col)
                continue;
            const f = mat[r][col] / mat[col][col];
            if (f === 0)
                continue;
            for (let c = col; c <= nterms; c++)
                mat[r][c] = mat[r][c] - f * mat[col][c];
        }
    }
    let sp = 1;
    for (let n = 0; n < nterms; n++) {
        a[n] = mat[n][nterms] / mat[n][n] / sp;
        sp *= scale;
    }
    return a;
}
// ── Per-candidate decoding (ft8b.f90) ───────────────────────────────────────
function ft8b(f1In, xdtIn, xbase, ndepth, imetric, contest, book, workspace) {
    const { s8 } = workspace;
    const { freq: f1, ibest, dtSubtract, nsync } = demodulate(f1In, xdtIn, workspace);
    const xdt = (ibest - 1) * DT2;
    let nsyncMin = imetric === 2 ? 7 : 6;
    if (ndepth <= 2)
        nsyncMin = 8;
    if (nsync <= nsyncMin)
        return null;
    buildBitMetrics(imetric, workspace);
    const { bmeta, bmetb, bmetc, bmetd, bmete, llr, apmask } = workspace;
    const maxosd = ndepth <= 1 ? -1 : 2;
    // Passes 1-5: regular decoding with each bit metric. Passes 6-7 (depth 3):
    // a priori decoding of "CQ ??? ???" (iaptype=1) with metrics a and c.
    const metrics = [bmeta, bmetb, bmetc, bmetd, bmete, bmeta, bmetc];
    const npasses = ndepth >= 3 ? 7 : 5;
    const mcq = contest ? CQ_AP_BITS[contest] : MCQ;
    for (let ipass = 1; ipass <= npasses; ipass++) {
        const metric = metrics[ipass - 1];
        for (let i = 0; i < N_LDPC; i++)
            llr[i] = LLR_SCALE * metric[i];
        apmask.fill(0);
        if (ipass > 5) {
            const apmag = maxAbs(llr) * 1.1;
            for (let i = 0; i < 29; i++) {
                apmask[i] = 1;
                llr[i] = apmag * (2 * mcq[i] - 1);
            }
            apmask[74] = 1;
            apmask[75] = 1;
            apmask[76] = 1;
            llr[74] = -apmag;
            llr[75] = -apmag;
            llr[76] = apmag;
        }
        const result = decode174_91(llr, apmask, maxosd, 2);
        if (!result)
            continue;
        const accepted = acceptCodeword(result, contest, book);
        if (!accepted)
            continue;
        // SNR relative to the spectrum baseline (WSJT-X xsnr2).
        const tones = getTones(result.cw);
        let xsig = 0;
        for (let i = 0; i < NN; i++)
            xsig += s8[tones[i] * NN + i] ** 2;
        let xsnr = 0.001;
        const arg = xsig / xbase / 3.0e6 - 1.0;
        if (arg > 0.1)
            xsnr = arg;
        xsnr = 10.0 * Math.log10(xsnr) - 27.0;
        // Likely false decode
        if (nsync <= 10 && xsnr < MIN_SNR)
            return null;
        if (xsnr < MIN_SNR)
            xsnr = MIN_SNR;
        const ap = ipass > 5 ? 1 : 0;
        return { msg: accepted, freq: f1, dt: xdt, dtSubtract, snr: xsnr, tones, ap };
    }
    return null;
}
/**
 * Refine time and frequency of a signal near `f1In` Hz starting near `xdtIn` s
 * (xdt + 0.5 as in sync8), then extract its soft symbols into the workspace.
 */
function demodulate(f1In, xdtIn, workspace) {
    const { cd0Re, cd0Im, ss, s8 } = workspace;
    let f1 = f1In;
    ft8Downsample(f1, workspace);
    // WSJT-X searches time at the candidate frequency and then frequency at
    // that time. The candidate frequency can be off by up to half a 3.125 Hz
    // bin, which biases the time search, so search time and frequency jointly.
    const i0 = Math.round((xdtIn + 0.5) * FS2);
    const search = searchTimeFrequency(cd0Re, cd0Im, i0, workspace.syncGrid);
    let ibest = search.ibest;
    f1 += search.delf;
    ft8Downsample(f1, workspace);
    for (let idt = -4; idt <= 4; idt++) {
        ss[idt + 4] = sync8d(cd0Re, cd0Im, ibest + idt, COSTAS_SYNC.re, COSTAS_SYNC.im);
    }
    let iloc = 0;
    for (let i = 1; i < 9; i++)
        if (ss[i] > ss[iloc])
            iloc = i;
    ibest += iloc - 4;
    // Sub-sample time estimate for signal subtraction
    let dx = 0;
    if (iloc > 0 && iloc < 8) {
        const ym = ss[iloc - 1];
        const y0 = ss[iloc];
        const yp = ss[iloc + 1];
        const c = yp + ym - 2 * y0;
        if (c < 0)
            dx = Math.max(-0.5, Math.min(0.5, (-(yp - ym) / 2 / c) * 1));
    }
    const dtSubtract = (ibest + dx - 0.5) * DT2;
    extractSoftSymbols(ibest, workspace);
    // Sync quality: hard sync sum, max 21
    let nsync = 0;
    for (let k = 0; k < COSTAS_BLOCKS; k++) {
        for (const offset of SYNC_TIME_SHIFTS) {
            let ip = 0;
            for (let t = 1; t < 8; t++) {
                if (s8[t * NN + k + offset] > s8[ip * NN + k + offset])
                    ip = t;
            }
            if (ip === COSTAS[k])
                nsync++;
        }
    }
    return { freq: f1, ibest, dtSubtract, nsync };
}
// ── a7 decoding (ft8_a7.f90) ────────────────────────────────────────────────
/**
 * Look for the station of `entry`, decoded 30 s earlier, at the same
 * frequency and time: the candidate message closest to the soft symbols wins
 * if it is clearly closer than the runner-up (ft8_a7d).
 */
function ft8a7d(entry, xbase, workspace) {
    const { call1, call2, grid4, candidates } = a7Candidates(entry);
    const { freq, ibest } = demodulate(entry.freq, entry.dt, workspace);
    buildBitMetrics(1, workspace);
    const { s8 } = workspace;
    const metrics = [workspace.bmeta, workspace.bmetb, workspace.bmetc, workspace.bmetd];
    const dmm = new Float64Array(candidates.length).fill(1e30);
    let dmin = 1e30;
    let best = -1;
    let pbest = 0;
    for (let k = 0; k < candidates.length; k++) {
        const cand = candidates[k];
        if (!cand)
            continue;
        // Distance: sum of |LLR| over the bits where the hard decision disagrees.
        let dm = Infinity;
        for (const metric of metrics) {
            let d = 0;
            for (let i = 0; i < N_LDPC; i++) {
                const v = LLR_SCALE * metric[i];
                if ((v >= 0 ? 1 : 0) !== cand.cw[i])
                    d += Math.abs(v);
            }
            if (d < dm)
                dm = d;
        }
        dmm[k] = dm;
        if (dm < dmin) {
            dmin = dm;
            best = k;
            pbest = 0;
            for (let i = 0; i < NN; i++)
                pbest += s8[cand.tones[i] * NN + i] ** 2;
        }
    }
    if (best < 0)
        return null;
    let dmin2 = 1e30;
    for (let k = 0; k < dmm.length; k++) {
        if (k !== best && dmm[k] < dmin2)
            dmin2 = dmm[k];
    }
    if (dmin > 100.0 || dmin2 / dmin < 1.3)
        return null;
    const msg = a7MessageText(candidates[best], call1, call2);
    if (!msg)
        return null;
    if (msg.startsWith("CQ ") && isStandardCall(call2) && grid4 === "")
        return null;
    if (msg.startsWith("QU1RK "))
        return null;
    const arg = pbest / xbase / 3.0e6 - 1.0;
    const snr = arg > 0 ? Math.max(MIN_SNR, 10.0 * Math.log10(arg) - 27.0) : MIN_SNR;
    return { msg, freq, dt: (ibest - 1) * DT2 - 0.5, snr };
}
function acceptCodeword(result, contest, book) {
    if (result.nharderrors < 0 || result.nharderrors > MAX_HARD_ERRORS)
        return null;
    if (result.cw.every((b) => b === 0))
        return null;
    const message77 = result.message91.slice(0, 77);
    const n3 = (message77[71] << 2) | (message77[72] << 1) | message77[73];
    const i3 = (message77[74] << 2) | (message77[75] << 1) | message77[76];
    if (i3 > 5 || (i3 === 0 && n3 > 6))
        return null;
    if (i3 === 0 && n3 === 2)
        return null;
    const { msg, success } = unpack77(message77, book);
    if (!success || msg.trim().length === 0)
        return null;
    // Rover and RTTY Roundup messages are rejected outside a contest.
    if (!contest && i3 >= 1 && i3 <= 3 && (msg.includes("/R") || msg.startsWith("TU; "))) {
        return null;
    }
    return msg;
}
function extractSoftSymbols(ibest, workspace) {
    const { cd0Re, cd0Im, s8, csRe, csIm, symbRe, symbIm } = workspace;
    for (let k = 0; k < NN; k++) {
        const i1 = ibest + k * COSTAS_SYMBOL_LEN;
        symbRe.fill(0);
        symbIm.fill(0);
        if (i1 >= 0 && i1 + COSTAS_SYMBOL_LEN - 1 <= NP2 - 1) {
            for (let j = 0; j < COSTAS_SYMBOL_LEN; j++) {
                symbRe[j] = cd0Re[i1 + j];
                symbIm[j] = cd0Im[i1 + j];
            }
        }
        fftComplex(symbRe, symbIm, false);
        for (let tone = 0; tone < 8; tone++) {
            const re = symbRe[tone];
            const im = symbIm[tone];
            const idx = tone * NN + k;
            csRe[idx] = re / 1000;
            csIm[idx] = im / 1000;
            s8[idx] = Math.sqrt(re * re + im * im);
        }
    }
}
/**
 * Bit metrics from coherent sums over 1, 2 and 3 symbols (a, b, c), the
 * normalized single-symbol metric (d) and the largest of a-c (e).
 * imetric=1 uses tone amplitudes, imetric=2 tone powers.
 */
function buildBitMetrics(imetric, workspace) {
    const { csRe, csIm, bmeta, bmetb, bmetc, bmetd, bmete, s2 } = workspace;
    const power = imetric === 2;
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
                    const i1 = i >> 6;
                    const i2 = (i & 63) >> 3;
                    const i3 = i & 7;
                    let sRe;
                    let sIm;
                    if (nsym === 1) {
                        sRe = csRe[GRAY_MAP[i3] * NN + ks - 1];
                        sIm = csIm[GRAY_MAP[i3] * NN + ks - 1];
                    }
                    else if (nsym === 2) {
                        sRe = csRe[GRAY_MAP[i2] * NN + ks - 1] + csRe[GRAY_MAP[i3] * NN + ks];
                        sIm = csIm[GRAY_MAP[i2] * NN + ks - 1] + csIm[GRAY_MAP[i3] * NN + ks];
                    }
                    else {
                        sRe =
                            csRe[GRAY_MAP[i1] * NN + ks - 1] +
                                csRe[GRAY_MAP[i2] * NN + ks] +
                                csRe[GRAY_MAP[i3] * NN + ks + 1];
                        sIm =
                            csIm[GRAY_MAP[i1] * NN + ks - 1] +
                                csIm[GRAY_MAP[i2] * NN + ks] +
                                csIm[GRAY_MAP[i3] * NN + ks + 1];
                    }
                    const p = sRe * sRe + sIm * sIm;
                    s2[i] = power ? p : Math.sqrt(p);
                }
                const i32 = 1 + (k - 1) * 3 + (ihalf - 1) * 87;
                for (let ib = 0; ib <= ibmax; ib++) {
                    const idx = i32 + ib - 1;
                    if (idx >= N_LDPC)
                        continue;
                    const bit = 1 << (ibmax - ib);
                    let max1 = -1e30;
                    let max0 = -1e30;
                    for (let i = 0; i < nt; i++) {
                        const v = s2[i];
                        if ((i & bit) !== 0) {
                            if (v > max1)
                                max1 = v;
                        }
                        else if (v > max0) {
                            max0 = v;
                        }
                    }
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
    for (let i = 0; i < N_LDPC; i++) {
        let e = bmeta[i];
        if (Math.abs(bmetb[i]) > Math.abs(e))
            e = bmetb[i];
        if (Math.abs(bmetc[i]) > Math.abs(e))
            e = bmetc[i];
        bmete[i] = e;
    }
    normalizeBmet(bmeta);
    normalizeBmet(bmetb);
    normalizeBmet(bmetc);
    normalizeBmet(bmetd);
    normalizeBmet(bmete);
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
function maxAbs(values) {
    let max = 0;
    for (let i = 0; i < values.length; i++) {
        const v = Math.abs(values[i]);
        if (v > max)
            max = v;
    }
    return max;
}
function getTones(cw) {
    const tones = new Array(NN).fill(0);
    for (let i = 0; i < 7; i++) {
        tones[i] = COSTAS[i];
        tones[36 + i] = COSTAS[i];
        tones[72 + i] = COSTAS[i];
    }
    let k = 7;
    for (let j = 1; j <= 58; j++) {
        const i = (j - 1) * 3;
        if (j === 30)
            k += 7;
        tones[k] = GRAY_MAP[cw[i] * 4 + cw[i + 1] * 2 + cw[i + 2]];
        k++;
    }
    return tones;
}
/**
 * Mix f0 to baseband and decimate by NDOWN (60x) by extracting frequency bins
 * of the long spectrum (ft8_downsample.f90).
 */
function ft8Downsample(f0, workspace) {
    const { cxRe, cxIm, cd0Re, cd0Im, shiftRe, shiftIm } = workspace;
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
    for (let i = ib; i <= it && k < NFFT2; i++) {
        cd0Re[k] = cxRe[i];
        cd0Im[k] = cxIm[i];
        k++;
    }
    for (let i = 0; i <= TAPER_LAST; i++) {
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
        let src = (i + shift) % NFFT2;
        if (src < 0)
            src += NFFT2;
        shiftRe[i] = cd0Re[src];
        shiftIm[i] = cd0Im[src];
    }
    cd0Re.set(shiftRe);
    cd0Im.set(shiftIm);
    fftComplex(cd0Re, cd0Im, true);
    for (let i = 0; i < NFFT2; i++) {
        cd0Re[i] = cd0Re[i] * DOWNSAMPLE_SCALE;
        cd0Im[i] = cd0Im[i] * DOWNSAMPLE_SCALE;
    }
}
/** Sync power for a complex, downsampled FT8 signal (sync8d.f90). */
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
/**
 * Joint search over start time (i0±10 downsampled samples) and frequency
 * offset (±2.5 Hz in 0.5 Hz steps) maximizing the sync8d Costas power.
 *
 * sync8d with a frequency tweak is the sum over the 21 Costas symbols of
 * |DFT of a 32-sample window at (tone*6.25 + delf) Hz|², so each window's DFT
 * is updated recursively (sliding DFT) as the start time advances.
 */
function searchTimeFrequency(cd0Re, cd0Im, i0, grid) {
    const nt = SEARCH_TIME_STEPS;
    const nf = SEARCH_FREQ_STEPS;
    const first = i0 - SEARCH_TIME_HALF;
    grid.fill(0);
    for (let block = 0; block < 3 * COSTAS_BLOCKS; block++) {
        const n = block % COSTAS_BLOCKS;
        const offset = n * COSTAS_SYMBOL_LEN + SYNC_TIME_SHIFTS[(block / COSTAS_BLOCKS) | 0] * COSTAS_SYMBOL_LEN;
        const tone = COSTAS[n];
        for (let d = 0; d < nf; d++) {
            const w = tone * nf + d;
            const rotRe = SLIDE_ROT_RE[w];
            const rotIm = SLIDE_ROT_IM[w];
            const endRe = SLIDE_END_RE[w];
            const endIm = SLIDE_END_IM[w];
            const phase = w * COSTAS_SYMBOL_LEN;
            let valid = false;
            let xr = 0;
            let xi = 0;
            for (let k = 0; k < nt; k++) {
                const i1 = first + k + offset;
                if (i1 < 0 || i1 + COSTAS_SYMBOL_LEN - 1 >= NP2) {
                    valid = false;
                    continue;
                }
                if (!valid) {
                    xr = 0;
                    xi = 0;
                    for (let j = 0; j < COSTAS_SYMBOL_LEN; j++) {
                        const c = SLIDE_PHASE_RE[phase + j];
                        const s = SLIDE_PHASE_IM[phase + j];
                        const dr = cd0Re[i1 + j];
                        const di = cd0Im[i1 + j];
                        xr += dr * c - di * s;
                        xi += dr * s + di * c;
                    }
                    valid = true;
                }
                else {
                    // X_{i} = e^{iω} (X_{i-1} - x_{i-1} + x_{i+31} e^{-iω32})
                    const lr = cd0Re[i1 + COSTAS_SYMBOL_LEN - 1];
                    const li = cd0Im[i1 + COSTAS_SYMBOL_LEN - 1];
                    const tr = xr - cd0Re[i1 - 1] + lr * endRe - li * endIm;
                    const ti = xi - cd0Im[i1 - 1] + lr * endIm + li * endRe;
                    xr = tr * rotRe - ti * rotIm;
                    xi = tr * rotIm + ti * rotRe;
                }
                grid[d * nt + k] = grid[d * nt + k] + xr * xr + xi * xi;
            }
        }
    }
    let smax = 0;
    let best = 0;
    for (let idx = 0; idx < nf * nt; idx++) {
        if (grid[idx] > smax) {
            smax = grid[idx];
            best = idx;
        }
    }
    const d = (best / nt) | 0;
    return { ibest: first + (best % nt), delf: (d - SEARCH_FREQ_HALF) * SEARCH_FREQ_STEP };
}
// ── Signal subtraction (subtractft8.f90) ────────────────────────────────────
/**
 * Subtract a decoded FT8 signal from `dd`.
 *
 * The complex amplitude of the signal relative to an ideal reference waveform
 * is estimated with a low-pass filter (cos² window, 4000 samples), so slow
 * amplitude/phase drifts and small frequency errors are tracked:
 *   camp(t)  = dd(t) * conj(cref(t))
 *   cfilt(t) = LPF[camp(t)]
 *   dd(t)   -= 2 * Re{cref(t) * cfilt(t)}
 * The filter output is evaluated exactly (running sums) every SUBTRACT_BLOCK
 * samples and linearly interpolated in between.
 */
function subtractft8(dd, tones, f0, dt, workspace) {
    const { crefRe, crefIm } = workspace;
    genFt8Cwave(tones, f0, workspace);
    const nstart = Math.round(dt * SAMPLE_RATE);
    const { cosTab, sinTab, sumw, massStart } = LPF;
    // Block prefix sums of camp, camp*e^{+iθm} and camp*e^{-iθm} (θ = 2π/NFILT).
    const nb = SUBTRACT_NBLOCKS;
    const p0Re = workspace.sum0Re;
    const p0Im = workspace.sum0Im;
    const ppRe = workspace.sumPlusRe;
    const ppIm = workspace.sumPlusIm;
    const pmRe = workspace.sumMinusRe;
    const pmIm = workspace.sumMinusIm;
    let a0r = 0;
    let a0i = 0;
    let apr = 0;
    let api = 0;
    let amr = 0;
    let ami = 0;
    p0Re[0] = 0;
    p0Im[0] = 0;
    ppRe[0] = 0;
    ppIm[0] = 0;
    pmRe[0] = 0;
    pmIm[0] = 0;
    for (let b = 0; b < nb; b++) {
        const iStart = b * SUBTRACT_BLOCK;
        for (let i = iStart; i < iStart + SUBTRACT_BLOCK; i++) {
            const j = nstart + i;
            if (j < 0 || j >= NMAX)
                continue;
            const d = dd[j];
            const xr = d * crefRe[i];
            const xi = -d * crefIm[i];
            const t = i % SUBTRACT_NFILT;
            const c = cosTab[t];
            const s = sinTab[t];
            const xrc = xr * c;
            const xis = xi * s;
            const xrs = xr * s;
            const xic = xi * c;
            a0r += xr;
            a0i += xi;
            apr += xrc - xis;
            api += xrs + xic;
            amr += xrc + xis;
            ami += xic - xrs;
        }
        p0Re[b + 1] = a0r;
        p0Im[b + 1] = a0i;
        ppRe[b + 1] = apr;
        ppIm[b + 1] = api;
        pmRe[b + 1] = amr;
        pmIm[b + 1] = ami;
    }
    // Filter output at block boundaries i = b*BLOCK: window covers [i-HALF, i+HALF).
    const hb = SUBTRACT_HALF / SUBTRACT_BLOCK;
    const outRe = workspace.cfiltRe;
    const outIm = workspace.cfiltIm;
    for (let b = 0; b <= nb; b++) {
        const lo = Math.max(0, b - hb);
        const hi = Math.min(nb, b + hb);
        const s0r = p0Re[hi] - p0Re[lo];
        const s0i = p0Im[hi] - p0Im[lo];
        const spr = ppRe[hi] - ppRe[lo];
        const spi = ppIm[hi] - ppIm[lo];
        const smr = pmRe[hi] - pmRe[lo];
        const smi = pmIm[hi] - pmIm[lo];
        const t = (b * SUBTRACT_BLOCK) % SUBTRACT_NFILT;
        const c = cosTab[t];
        const s = sinTab[t];
        // 0.5*S0 + 0.25*e^{-iθi}*S+ + 0.25*e^{+iθi}*S-
        let yr = 0.5 * s0r + 0.25 * (c * spr + s * spi) + 0.25 * (c * smr - s * smi);
        let yi = 0.5 * s0i + 0.25 * (c * spi - s * spr) + 0.25 * (c * smi + s * smr);
        // Normalize by the window mass inside the frame (end correction).
        let mass = sumw;
        if (b < hb)
            mass = massStart[b];
        else if (b > nb - hb)
            mass = massStart[nb - b];
        yr /= mass;
        yi /= mass;
        outRe[b] = yr;
        outIm[b] = yi;
    }
    for (let b = 0; b < nb; b++) {
        const y0r = outRe[b];
        const y0i = outIm[b];
        const dyr = (outRe[b + 1] - y0r) / SUBTRACT_BLOCK;
        const dyi = (outIm[b + 1] - y0i) / SUBTRACT_BLOCK;
        const iStart = b * SUBTRACT_BLOCK;
        for (let q = 0; q < SUBTRACT_BLOCK; q++) {
            const i = iStart + q;
            const j = nstart + i;
            if (j < 0 || j >= NMAX)
                continue;
            const yr = y0r + dyr * q;
            const yi = y0i + dyi * q;
            dd[j] = dd[j] - 2.0 * (yr * crefRe[i] - yi * crefIm[i]);
        }
    }
}
/** Complex FT8 reference waveform (gen_ft8wave.f90 with icmplx=1). */
function genFt8Cwave(tones, f0, workspace) {
    const { crefRe, crefIm, dphi } = workspace;
    const nsym = NN;
    const nsps = NSPS;
    const dphiPeak = TWO_PI / nsps;
    const pulse = GFSK_PULSE;
    dphi.fill(0);
    for (let j = 0; j < nsym; j++) {
        const ib = j * nsps;
        const tone = tones[j];
        if (tone === 0)
            continue;
        const f = dphiPeak * tone;
        for (let i = 0; i < 3 * nsps; i++)
            dphi[ib + i] = dphi[ib + i] + f * pulse[i];
    }
    const first = dphiPeak * tones[0];
    const last = dphiPeak * tones[nsym - 1];
    for (let i = 0; i < 2 * nsps; i++) {
        dphi[i] = dphi[i] + first * pulse[nsps + i];
        dphi[nsym * nsps + i] = dphi[nsym * nsps + i] + last * pulse[i];
    }
    const carrier = (TWO_PI * f0) / SAMPLE_RATE;
    let phi = 0;
    for (let k = 0; k < NFRAME; k++) {
        crefRe[k] = Math.cos(phi);
        crefIm[k] = Math.sin(phi);
        phi += dphi[nsps + k] + carrier;
        if (phi > TWO_PI)
            phi -= TWO_PI;
    }
    const nramp = Math.round(nsps / 8);
    for (let i = 0; i < nramp; i++) {
        const up = (1 - Math.cos((TWO_PI * i) / (2 * nramp))) / 2;
        crefRe[i] = crefRe[i] * up;
        crefIm[i] = crefIm[i] * up;
        const k1 = nsym * nsps - nramp + i;
        const down = (1 + Math.cos((TWO_PI * i) / (2 * nramp))) / 2;
        crefRe[k1] = crefRe[k1] * down;
        crefIm[k1] = crefIm[k1] * down;
    }
}
// ── Tables ──────────────────────────────────────────────────────────────────
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
function buildSlidingDftTables() {
    const n = 8 * SEARCH_FREQ_STEPS;
    const rotRe = new Float64Array(n);
    const rotIm = new Float64Array(n);
    const endRe = new Float64Array(n);
    const endIm = new Float64Array(n);
    const phaseRe = new Float64Array(n * COSTAS_SYMBOL_LEN);
    const phaseIm = new Float64Array(n * COSTAS_SYMBOL_LEN);
    for (let tone = 0; tone < 8; tone++) {
        for (let d = 0; d < SEARCH_FREQ_STEPS; d++) {
            const w = tone * SEARCH_FREQ_STEPS + d;
            const delf = (d - SEARCH_FREQ_HALF) * SEARCH_FREQ_STEP;
            const omega = (TWO_PI * (tone * DOWNSAMPLE_BAUD + delf)) / FS2;
            rotRe[w] = Math.cos(omega);
            rotIm[w] = Math.sin(omega);
            endRe[w] = Math.cos(-omega * COSTAS_SYMBOL_LEN);
            endIm[w] = Math.sin(-omega * COSTAS_SYMBOL_LEN);
            for (let j = 0; j < COSTAS_SYMBOL_LEN; j++) {
                phaseRe[w * COSTAS_SYMBOL_LEN + j] = Math.cos(-omega * j);
                phaseIm[w * COSTAS_SYMBOL_LEN + j] = Math.sin(-omega * j);
            }
        }
    }
    return { rotRe, rotIm, endRe, endIm, phaseRe, phaseIm };
}
/** Nuttall window normalized as in get_spectrum_baseline.f90. */
function buildBaselineWindow() {
    const w = new Float64Array(NFFT1);
    const a0 = 0.3635819;
    const a1 = -0.4891775;
    const a2 = 0.1365995;
    const a3 = -0.0106411;
    let sum = 0;
    for (let i = 0; i < NFFT1; i++) {
        w[i] =
            a0 +
                a1 * Math.cos((TWO_PI * i) / NFFT1) +
                a2 * Math.cos((2 * TWO_PI * i) / NFFT1) +
                a3 * Math.cos((3 * TWO_PI * i) / NFFT1);
        sum += w[i];
    }
    for (let i = 0; i < NFFT1; i++)
        w[i] = ((w[i] / sum) * NSPS * 2) / 300.0;
    return w;
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
function buildGfskPulse(bt) {
    const pulse = new Float64Array(3 * NSPS);
    const c = Math.PI * Math.sqrt(2 / Math.log(2)) * bt;
    for (let i = 0; i < pulse.length; i++) {
        const tt = (i + 1 - 1.5 * NSPS) / NSPS;
        pulse[i] = 0.5 * (erfApprox(c * (tt + 0.5)) - erfApprox(c * (tt - 0.5)));
    }
    return pulse;
}
function buildSubtractionFilter() {
    const cosTab = new Float64Array(SUBTRACT_NFILT);
    const sinTab = new Float64Array(SUBTRACT_NFILT);
    for (let t = 0; t < SUBTRACT_NFILT; t++) {
        cosTab[t] = Math.cos((TWO_PI * t) / SUBTRACT_NFILT);
        sinTab[t] = Math.sin((TWO_PI * t) / SUBTRACT_NFILT);
    }
    const w = (j) => Math.cos((Math.PI * j) / SUBTRACT_NFILT) ** 2;
    let sumw = 0;
    for (let j = -SUBTRACT_HALF; j < SUBTRACT_HALF; j++)
        sumw += w(j);
    // Window mass available b blocks from the frame edge: offsets [-b*BLOCK, HALF).
    const hb = SUBTRACT_HALF / SUBTRACT_BLOCK;
    const massStart = new Float64Array(hb + 1);
    for (let b = 0; b <= hb; b++) {
        let m = 0;
        for (let j = -b * SUBTRACT_BLOCK; j < SUBTRACT_HALF; j++)
            m += w(j);
        massStart[b] = m;
    }
    return { cosTab, sinTab, sumw, massStart };
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

// Kept out of sight of bundlers, which would otherwise try to resolve it when
// bundling for the browser.
const WORKER_THREADS = "node:worker_threads";
function isNode() {
    return typeof process !== "undefined" && typeof process.versions?.node === "string";
}
/** Number of logical cores, or 1 if unknown. */
function coreCount() {
    const cores = typeof navigator === "undefined" ? undefined : navigator.hardwareConcurrency;
    if (cores)
        return cores;
    if (isNode()) {
        const os = process.getBuiltinModule?.("node:os");
        if (os)
            return os.availableParallelism();
    }
    return 1;
}
function defaultWorker() {
    if (typeof Worker !== "undefined") {
        return new Worker(new URL("./ft8ts-worker.mjs", import.meta.url), { type: "module" });
    }
    return nodeDecoderWorker(new URL("./ft8ts-worker-node.mjs", import.meta.url));
}
/**
 * Starts the Node.js worker script at `url` (such as `dist/ft8ts-worker-node.mjs`)
 * in a worker thread, as a `DecoderWorker`. The thread does not keep the
 * process alive while it is idle.
 */
async function nodeDecoderWorker(url, options = {}) {
    const { Worker: NodeWorker } = await import(
    /* webpackIgnore: true */ /* @vite-ignore */ WORKER_THREADS);
    const thread = new NodeWorker(url, options.execArgv ? { execArgv: options.execArgv } : {});
    thread.unref();
    let outstanding = 0;
    let terminated = false;
    const worker = {
        onmessage: null,
        onerror: null,
        postMessage(message, transfer) {
            // Keep the process alive until the answer arrives.
            if (outstanding++ === 0)
                thread.ref();
            thread.postMessage(message, transfer);
        },
        terminate() {
            terminated = true;
            void thread.terminate();
        },
    };
    thread.on("message", (data) => {
        if (--outstanding === 0)
            thread.unref();
        worker.onmessage?.({ data });
    });
    thread.on("error", (error) => worker.onerror?.(error));
    thread.on("exit", (code) => {
        if (!terminated)
            worker.onerror?.({ message: `decoder worker exited with code ${code}` });
    });
    return worker;
}
/** Narrowest sub-band (Hz) given to a thread; narrower bands use fewer threads. */
const MIN_BAND_WIDTH = 100;
/** Number of decoding threads for `cores` logical cores, as WSJT-X 3 chooses it. */
function defaultThreadCount(cores) {
    if (cores <= 1)
        return 1;
    if (cores <= 4)
        return cores - 1;
    if (cores <= 8)
        return cores - 2;
    if (cores <= 15)
        return cores - 3;
    return 12;
}
/**
 * Decodes FT8 in several threads at once: Web Workers in browsers,
 * worker_threads in Node.js. Create one pool and use it for
 * every slot; the workers are started on first use and kept until
 * `terminate()`.
 *
 * ```ts
 * const pool = new FT8DecoderPool();
 * const decoded = await pool.decode(samples, { sampleRate: 48000, depth: 3 });
 * ```
 *
 * Results are those of `decodeFT8` with the same options, up to small
 * differences: as in WSJT-X, each thread finds candidates in its own
 * sub-band, and sees the signals decoded by the other threads only from the
 * next pass on.
 */
class FT8DecoderPool {
    threads;
    workerFactory;
    customFactory;
    workers = [];
    queue = Promise.resolve();
    constructor(options = {}) {
        this.threads = Math.max(1, Math.floor(options.threads ?? defaultThreadCount(coreCount())));
        this.customFactory = options.workerFactory !== undefined;
        this.workerFactory = options.workerFactory ?? defaultWorker;
    }
    /**
     * Decode all FT8 signals in an audio buffer, like `decodeFT8`. Calls are
     * run one after another. With one thread, or without any kind of worker, the
     * buffer is decoded on the calling thread.
     */
    decode(samples, options = {}) {
        const run = this.queue.then(() => this.run(samples, options));
        this.queue = run.catch(() => { });
        return run;
    }
    /** Stop the workers. The pool starts new ones if it is used again. */
    terminate() {
        for (const w of this.workers)
            w.terminate();
        this.workers.length = 0;
    }
    async run(samples, options) {
        const { nfa, nfb, npass, params } = resolveDecodeSettings(options);
        const nthreads = Math.min(this.threads, Math.floor((nfb - nfa) / MIN_BAND_WIDTH));
        if (nthreads <= 1 || !this.canStartWorkers())
            return decode(samples, options);
        const history = options.history;
        const slot = historySlot(options);
        const previous = history?.beginSlot(slot) ?? [];
        const dd = prepareSamples(samples, options.sampleRate ?? SAMPLE_RATE);
        const bands = splitBand(nfa, nfb, nthreads);
        const started = await Promise.all(Array.from({ length: nthreads - this.workers.length }, () => this.workerFactory()));
        for (const w of started)
            this.workers.push(new WorkerChannel(w));
        const workers = this.workers.slice(0, nthreads);
        const book = params.book;
        const snapshot = book?.snapshot() ?? null;
        await Promise.all(workers.map((w, i) => {
            const copy = dd.slice();
            return w.request({
                type: "init",
                dd: copy,
                nfa: bands[i][0],
                nfb: bands[i][1],
                depth: params.depth,
                syncmin: params.syncmin,
                maxCandidates: params.maxCandidates,
                contest: params.contest,
                book: snapshot,
            }, [copy.buffer]);
        }));
        const collector = new DecodeCollector(history, slot);
        // Signals near its sub-band and callsigns that each worker has yet to hear
        // about from the others.
        let subtract = workers.map(() => []);
        let calls = workers.map(() => []);
        for (let ipass = 1; ipass <= npass; ipass++) {
            if (ipass === 3 && collector.decoded.length === 0)
                break;
            const responses = await Promise.all(workers.map((w, i) => w.request({ type: "pass", ipass, subtract: subtract[i], calls: calls[i] })));
            subtract = workers.map(() => []);
            calls = workers.map(() => []);
            responses.forEach((r, i) => {
                if (r.type !== "pass")
                    return;
                for (const d of r.decodes)
                    collector.add(toDecodedMessage(d));
                for (const call of r.calls)
                    book?.save(call);
                for (let j = 0; j < workers.length; j++) {
                    if (j === i)
                        continue;
                    const [lo, hi] = bands[j];
                    subtract[j].push(...r.decodes.filter((d) => affectsBand(d.freq, lo, hi)));
                    calls[j].push(...r.calls);
                }
            });
        }
        // a7: each station decoded 30 s earlier is looked for by the worker of
        // its frequency. Supersession is checked again in order, as a7 decodes
        // saved into the history can supersede later entries.
        if (history && params.depth >= 3 && previous.length > 0) {
            const entries = previous.filter((e) => !history.supersedes(slot, e));
            const byWorker = workers.map(() => []);
            const owner = entries.map((e) => bandIndex(bands, e.freq));
            entries.forEach((e, k) => {
                byWorker[owner[k]].push(e);
            });
            const responses = await Promise.all(workers.map((w, i) => w.request({ type: "a7", subtract: subtract[i], entries: byWorker[i] })));
            const next = workers.map(() => 0);
            entries.forEach((entry, k) => {
                const i = owner[k];
                const r = responses[i];
                const result = r.type === "a7" ? r.results[next[i]++] : null;
                if (!result || history.supersedes(slot, entry))
                    return;
                collector.add(result);
            });
        }
        return collector.decoded;
    }
    canStartWorkers() {
        return this.customFactory || typeof Worker !== "undefined" || isNode();
    }
}
/**
 * Split [nfa, nfb] Hz into `n` sub-bands as decoder.f90 does: widths of
 * round((nfb - nfa) / n), each starting 1 Hz above the end of the previous one.
 */
function splitBand(nfa, nfb, n) {
    const nfdelta = Math.round(Math.abs(nfb - nfa) / n);
    const bands = [];
    let lo = nfa;
    for (let i = 0; i < n; i++) {
        const hi = i === n - 1 ? nfb : Math.min(nfa + (i + 1) * nfdelta, nfb - 1);
        bands.push([lo, hi]);
        lo = hi + 1;
    }
    return bands;
}
/** Index of the sub-band containing `freq`, or of the nearest one. */
function bandIndex(bands, freq) {
    for (let i = 0; i < bands.length - 1; i++)
        if (freq <= bands[i][1])
            return i;
    return bands.length - 1;
}
/** Requests to one worker, answered in order. */
class WorkerChannel {
    worker;
    pending = [];
    constructor(worker) {
        this.worker = worker;
        worker.onmessage = (event) => {
            this.pending.shift()?.resolve(event.data);
        };
        worker.onerror = (event) => {
            const message = typeof event === "object" && event !== null && "message" in event
                ? String(event.message)
                : "decoder worker failed";
            for (const p of this.pending.splice(0))
                p.reject(new Error(message));
        };
    }
    request(message, transfer = []) {
        return new Promise((resolve, reject) => {
            this.pending.push({
                resolve: (r) => (r.type === "error" ? reject(new Error(r.message)) : resolve(r)),
                reject,
            });
            this.worker.postMessage(message, transfer);
        });
    }
    terminate() {
        this.worker.terminate();
        for (const p of this.pending.splice(0))
            p.reject(new Error("decoder pool terminated"));
    }
}

export { FT8DecoderPool, FT8History, HashCallBook, decode$1 as decodeFT4, decode as decodeFT8, defaultThreadCount, encode as encodeFT4, encode$1 as encodeFT8 };
//# sourceMappingURL=ft8ts.mjs.map
