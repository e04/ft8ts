# ft8ts

[![Tests](https://github.com/e04/ft8ts/actions/workflows/test.yml/badge.svg)](https://github.com/e04/ft8ts/actions/workflows/test.yml)

FT8 and FT4 encoder and decoder in pure TypeScript. A port of the Fortran implementation from [WSJT-X](https://wsjt.sourceforge.io/wsjtx.html) v2.7.0.

## Overview

FT8 and FT4 are digital amateur radio modes designed for weak-signal communication, developed by Joe Taylor (K1JT) and Steve Franke (K9AN).

This library provides pure TypeScript implementations of both encoding and decoding for FT8 and FT4, suitable for use in Node.js or the browser.

## Demo

### Browser

https://e04.github.io/ft8ts/example/browser/index.html

### CLI

```bash
# Decode WAV file (FT8 or FT4)
npx @e04/ft8ts decode foo.wav [--mode ft8|ft4] [--low 200] [--high 3000] [--depth 2]

# Encode message to WAV file
npx @e04/ft8ts encode "CQ JK1IFA PM95" [--out output.wav] [--df 1000]
```

## Benchmark

The benchmark below was compiled with reference to [Comparing PyFT8 with WSJT-x and FT8_lib](https://www.reddit.com/r/amateurradio/comments/1qt27ss/comparing_pyft8_with_wsjtx_and_ft8_lib/).

| Call a | Call b | Message | WSJT-x(default) | WSJT-x (fast) | [PyFT8](https://github.com/G1OJS/PyFT8) | [ft8_lib](https://github.com/kgoba/ft8_lib) | ft8ts (depth=1) | ft8ts (depth=2) | ft8ts (depth=3) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| W1FC | F5BZB | -8 | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| WM3PEN | EA6VQ | -9 | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| CQ | F5RXL | IN94 | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| N1JFU | EA6EE | R-07 | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| A92EE | F5PSR | -14 | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| K1BZM | EA3GP | -9 | ☑️ | ☑️ | ☑️ | | ☑️ | ☑️ | ☑️ |
| W0RSJ | EA3BMU | RR73 | ☑️ | ☑️ | ☑️ | | ☑️ | ☑️ | ☑️ |
| K1JT | HA0DU | KN07 | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| W1DIG | SV9CVY | -14 | ☑️ | ☑️ | ☑️ | | ☑️ | ☑️ | ☑️ |
| K1JT | EA3AGB | -15 | ☑️ | ☑️ | ☑️ | | ☑️ | ☑️ | ☑️ |
| XE2X | HA2NP | RR73 | ☑️ | ☑️ | ☑️ | ☑️ | | | ☑️ |
| N1PJT | HB9CQK | -10 | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| K1BZM | EA3CJ | JN01 | ☑️ | ☑️ | | | | | |
| KD2UGC | F6GCP | R-23 | ☑️ | ☑️ | | | | | |
| WA2FZW | DL5AXX | RR73 | ☑️ | | | | | | |
| N1API | HA6FQ | -23 | ☑️ | | | | | ☑️ | ☑️ |
| N1API | F2VX | 73 | ☑️ | | | | | | |
| K1JT | HA5WA | 73 | ☑️ | | | | | ☑️ | ☑️ |
| CQ | EA2BFM | IN83 | ☑️ | | | | | | |

At its maximum depth mode (Depth 3), it successfully decodes 14 messages, outperforming both `PyFT8` (12) and `FT8_lib` (8), and matching the total message count of `WSJT-x FAST mode`.

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

### Decode Options

| Option | Default | Description |
|--------|---------|-------------|
| `sampleRate` | 12000 | Input audio sample rate (Hz) |
| `freqLow` | 200 | Lower frequency bound (Hz) |
| `freqHigh` | 3000 | Upper frequency bound (Hz) |
| `syncMin` | 1.2 | Minimum sync threshold |
| `depth` | 2 | Decoding depth: 1=fast BP only, 2=BP+OSD, 3=deep |
| `maxCandidates` | 300 (FT8) / 100 (FT4) | Maximum candidates to process |
| `hashCallBook` | — | `HashCallBook` instance for resolving hashed callsigns |

## Build

```bash
npm run build
```

## License

GPL-3.0

## References

- [WSJT-X](https://wsjt.sourceforge.io/wsjtx.html) — Original Fortran implementation (v2.7.0), licensed under [GPL v3](https://www.gnu.org/licenses/gpl-3.0.html)

## Related Projects

- **[PyFT8](https://github.com/G1OJS/PyFT8)** — Python implementation.
- **[ft8_lib](https://github.com/kgoba/ft8_lib)** — C++ implementation.
- **[ft8js](https://github.com/e04/ft8js)** - My previous experimental project using WebAssembly (WASM) with ft8_lib.
