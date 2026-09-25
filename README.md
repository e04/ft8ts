# ft8ts

[![Tests](https://github.com/e04/ft8ts/actions/workflows/test.yml/badge.svg)](https://github.com/e04/ft8ts/actions/workflows/test.yml)

FT8/FT4 encoder and decoder in pure TypeScript. A port of the Fortran implementation from [WSJT-X](https://wsjt.sourceforge.io/wsjtx.html) v3.0.1.

## Overview

FT8/FT4 are digital amateur radio modes designed for weak-signal communication, developed by Joe Taylor (K1JT) and Steve Franke (K9AN).

This library provides pure TypeScript implementations of both encoding and decoding for FT8/FT4, suitable for use in Node.js or the browser.

## Demo

### Browser

https://e04.github.io/ft8ts/example/browser/index.html

### CLI

```bash
# Decode WAV file (FT8 or FT4)
npx @e04/ft8ts decode foo.wav [--mode ft8|ft4] [--low 200] [--high 3000] [--depth 2] [--contest NA_VHF]

# Encode message to WAV file
npx @e04/ft8ts encode "CQ JK1IFA PM95" [--out output.wav] [--df 1000]
```

## Benchmark

The benchmark below was compiled with reference to [Comparing PyFT8 with WSJT-x and FT8_lib](https://www.reddit.com/r/amateurradio/comments/1qt27ss/comparing_pyft8_with_wsjtx_and_ft8_lib/) (sample: `210703_133430.wav`).

| Call a | Call b | Message | WSJT-x(default) | WSJT-x (fast) | [PyFT8](https://github.com/G1OJS/PyFT8) | [ft8_lib](https://github.com/kgoba/ft8_lib) | ft8ts (depth=1) | ft8ts (depth=2, 3) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| W1FC | F5BZB | -8 | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| WM3PEN | EA6VQ | -9 | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| CQ | F5RXL | IN94 | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| N1JFU | EA6EE | R-07 | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| A92EE | F5PSR | -14 | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| K1BZM | EA3GP | -9 | ☑️ | ☑️ | ☑️ | | ☑️ | ☑️ |
| W0RSJ | EA3BMU | RR73 | ☑️ | ☑️ | ☑️ | | ☑️ | ☑️ |
| K1JT | HA0DU | KN07 | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| W1DIG | SV9CVY | -14 | ☑️ | ☑️ | ☑️ | | ☑️ | ☑️ |
| K1JT | EA3AGB | -15 | ☑️ | ☑️ | ☑️ | | ☑️ | ☑️ |
| XE2X | HA2NP | RR73 | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| N1PJT | HB9CQK | -10 | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| K1BZM | EA3CJ | JN01 | ☑️ | ☑️ | | | ☑️ | ☑️ |
| KD2UGC | F6GCP | R-23 | ☑️ | ☑️ | | | ☑️ | ☑️ |
| WA2FZW | DL5AXX | RR73 | ☑️ | | | | ☑️ | ☑️ |
| N1API | HA6FQ | -23 | ☑️ | | | | | ☑️ |
| N1API | F2VX | 73 | ☑️ | | | | | ☑️ |
| K1JT | HA5WA | 73 | ☑️ | | | | | ☑️ |
| CQ | EA2BFM | IN83 | ☑️ | | | | | ☑️ |
| K1BZM | DK8NE | -10 | | | | | | ☑️ |

At depth 2 (default) and depth 3, ft8ts decodes all 20 rows in the table above, plus `CQ DX DL8YHR JO41` (-16 dB), which is not listed in the original comparison: 21 messages in total, the same as WSJT-X 2.7.0 at its deepest setting. Even depth 1 (15 rows) outperforms `PyFT8` (12), `FT8_lib` (8), and `WSJT-x FAST mode` (14).

## Installation

`npm i @e04/ft8ts`

## Usage

### API

```typescript
import { encodeFT8, decodeFT8, encodeFT4, decodeFT4, HashCallBook } from "@e04/ft8ts";

// Encode a message to audio samples (Float32Array)
const samples = encodeFT8("CQ JK1IFA PM95", {
  sampleRate: 12000,
  baseFrequency: 1000,
});

// Create a HashCallBook to resolve hashed callsigns.
// Reuse the same instance across multiple decode calls so that
// callsigns learned from earlier frames can resolve hashes in later ones.
const book = new HashCallBook();

// Decode audio samples to messages
const decoded = decodeFT8(samples, {
  sampleRate: 12000,
  freqLow: 200,
  freqHigh: 3000,
  depth: 2,
  hashCallBook: book,
});

for (const d of decoded) {
  console.log(`${d.freq} Hz  SNR ${d.snr} dB  ${d.msg}`);
}
```

### FT4

```typescript
import { encodeFT4, decodeFT4, HashCallBook } from "@e04/ft8ts";

// Encode FT4 message
const samples = encodeFT4("CQ JK1IFA PM95", {
  sampleRate: 12000,
  baseFrequency: 1000,
});

// Decode FT4
const book = new HashCallBook();
const decoded = decodeFT4(samples, {
  sampleRate: 12000,
  freqLow: 200,
  freqHigh: 3000,
  depth: 2,
  hashCallBook: book,
});
```

### a7 decoding across slots

At depth 3, the FT8 decoder can also use the decodes of the slot 30 s earlier, like WSJT-X's "a7" decoding: a station decoded then and not decoded now is looked for at the same frequency with the messages it is likely to send next (`RRR`, `RR73`, `73`, reports, its grid, ...), which finds signals a few dB weaker than regular decoding. Pass the same `FT8History` for consecutive slots together with the slot's start time:

```typescript
import { decodeFT8, FT8History, HashCallBook } from "@e04/ft8ts";

const book = new HashCallBook();
const history = new FT8History();

// Call once per 15 s slot
function onSlot(samples: Float32Array, slotStart: Date) {
  const decoded = decodeFT8(samples, { depth: 3, hashCallBook: book, history, slotStart });
  for (const d of decoded) {
    // d.ap is 7 for a7 decodes (1 for the "CQ ??? ???" AP pass)
    console.log(`${d.freq} Hz  SNR ${d.snr} dB  ${d.msg}${d.ap ? `  a${d.ap}` : ""}`);
  }
}
```

Like other a priori decodes, a7 decodes are more likely to be false than regular ones; they are marked with `ap`.

### Decode Options

| Option | Default | Description |
|--------|---------|-------------|
| `sampleRate` | 12000 | Input audio sample rate (Hz) |
| `freqLow` | 200 | Lower frequency bound (Hz) |
| `freqHigh` | 3000 | Upper frequency bound (Hz) |
| `syncMin` | FT8: 2.1 (depth ≤ 2) / 1.3 (depth 3), FT4: 1.18 | Minimum sync threshold |
| `depth` | 2 | Decoding depth: 1=fast BP only, 2=BP+OSD, 3=deep (values above 3 behave like 3) |
| `maxCandidates` | 1000 (FT8) / 200 (FT4) | Maximum candidates to process |
| `contest` | — | FT8 only. WSJT-X "Special operating activity": `NA_VHF`, `EU_VHF`, `FIELD_DAY`, `RTTY`, `WW_DIGI` or `ARRL_DIGI`. Without it, standard messages containing `/R` or starting with `TU;` are rejected as likely false decodes, as in WSJT-X 3 |
| `hashCallBook` | — | `HashCallBook` instance for resolving hashed callsigns |
| `history` | — | FT8 only. `FT8History` instance for a7 decoding (see above); decodes are saved at any depth, a7 runs at depth 3 |
| `slotStart` | — | FT8 only. Start of (or any time within) the slot being decoded, as a `Date` or ms since epoch. Required with `history` |

## Build

```bash
npm run build
```

## License

GPL-3.0

## References

- [WSJT-X](https://wsjt.sourceforge.io/wsjtx.html) — Original Fortran implementation (v3.0.1), licensed under [GPL v3](https://www.gnu.org/licenses/gpl-3.0.html)

## Related Projects

- **[PyFT8](https://github.com/G1OJS/PyFT8)** — A pure Python implementation of an FT8 encoder and decoder.

- **[ft8_lib](https://github.com/kgoba/ft8_lib)** — A lightweight C implementation of an FT8 and FT4 encoder and decoder.

- **[wsjtx_lib](https://github.com/paulh002/wsjtx_lib)** — A C++ library that wraps the original WSJT-X Fortran source code.

- **[wsjtx-lib-nodejs](https://github.com/boybook/wsjtx_lib_nodejs)** — A Node.js native C++ extension and TypeScript wrapper for `wsjtx_lib`.

- **[ft8js](https://github.com/e04/ft8js)** - My previous experimental project using WebAssembly (WASM) with ft8_lib.
