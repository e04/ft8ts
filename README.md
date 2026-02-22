# ft8ts

[![Tests](https://github.com/e04/ft8ts/actions/workflows/test.yml/badge.svg)](https://github.com/e04/ft8ts/actions/workflows/test.yml)

FT8 encoder and decoder in TypeScript. A port of the Fortran implementation from [WSJT-X](https://wsjt.sourceforge.io/wsjtx.html) v2.7.0.

## Overview

FT8 is a digital amateur radio mode designed for weak-signal communication. This library provides pure TypeScript implementations of both encoding and decoding, suitable for use in Node.js or the browser.

## Demo

### Browser

https://e04.github.io/ft8ts/example/browser/index.html

### CLI

#### Encode

```bash
npx tsx example/generate-ft8-wav.ts "CQ JK1IFA PM95" [--out output.wav] [--df 1000]
```

#### Decode

```bash
npx tsx example/decode-ft8-wav.ts ./src/__test__/190227_155815.wav [--low 200] [--high 3000] [--depth 2]
```

## Benchmark

The benchmark below was compiled with reference to [Comparing PyFT8 with WSJT-x and FT8_lib](https://www.reddit.com/r/amateurradio/comments/1qt27ss/comparing_pyft8_with_wsjtx_and_ft8_lib/).

| Call a | Call b | Message | WSJT-x (FAST) | [PyFT8](https://github.com/G1OJS/PyFT8) | [ft8_lib](https://github.com/kgoba/ft8_lib) | ft8ts (depth=1) | ft8ts (depth=2) | ft8ts (depth=3) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| W1FC | F5BZB | -8 | Y | Y | Y | Y | Y | Y |
| WM3PEN | EA6VQ | -9 | Y | Y | Y | Y | Y | Y |
| CQ | F5RXL | IN94 | Y | Y | Y | Y | Y | Y |
| N1JFU | EA6EE | R-07 | Y | Y | Y | Y | Y | Y |
| A92EE | F5PSR | -14 | Y | Y | Y | Y | Y | Y |
| K1BZM | EA3GP | -9 | Y | Y | | Y | Y | Y |
| W0RSJ | EA3BMU | RR73 | Y | Y | | Y | Y | Y |
| K1JT | HA0DU | KN07 | Y | Y | Y | Y | Y | Y |
| W1DIG | SV9CVY | -14 | Y | Y | | Y | Y | Y |
| K1JT | EA3AGB | -15 | Y | Y | | Y | Y | Y |
| XE2X | HA2NP | RR73 | Y | Y | Y | | | Y |
| N1PJT | HB9CQK | -10 | Y | Y | Y | Y | Y | Y |
| K1BZM | EA3CJ | JN01 | Y | | | | | |
| KD2UGC | F6GCP | R-23 | Y | | | | | |
| WA2FZW | DL5AXX | RR73 | | | | | | |
| N1API | HA6FQ | -23 | | | | | Y | Y |
| N1API | F2VX | 73 | | | | | | |
| K1JT | HA5WA | 73 | | | | | Y | Y |
| CQ | EA2BFM | IN83 | | | | | | |

At its maximum depth mode (Depth 3), it successfully decodes 14 messages, outperforming both `PyFT8` (12) and `FT8_lib` (8), and matching the total message count of `WSJT-x FAST mode`.

## Installation

`npm i @e04/ft8ts`

## Usage

### API

```typescript
import { encodeFT8, decodeFT8 } from "@e04/ft8ts";

// Encode a message to audio samples (Float32Array)
const samples = encodeFT8("CQ JK1IFA PM95", {
  sampleRate: 12000,
  baseFrequency: 1000,
});

// Decode audio samples to messages
const decoded = decodeFT8(samples, 12000, {
  freqLow: 200,
  freqHigh: 3000,
  depth: 2,
});

for (const d of decoded) {
  console.log(`${d.freq} Hz  SNR ${d.snr} dB  ${d.msg}`);
}
```

### Decode Options

| Option | Default | Description |
|--------|---------|-------------|
| `freqLow` | 200 | Lower frequency bound (Hz) |
| `freqHigh` | 3000 | Upper frequency bound (Hz) |
| `syncMin` | 1.2 | Minimum sync threshold |
| `depth` | 2 | Decoding depth: 1=fast BP only, 2=BP+OSD, 3=deep |
| `maxCandidates` | 300 | Maximum candidates to process |

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
