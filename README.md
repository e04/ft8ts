# ft8ts

FT8 encoder and decoder in TypeScript. A port of the Fortran implementation from [WSJT-X](https://wsjt.sourceforge.io/wsjtx.html) v2.7.0.

## Overview

FT8 is a digital amateur radio mode designed for weak-signal communication. This library provides pure TypeScript implementations of both encoding and decoding, suitable for use in Node.js or the browser.

## Demo

### Browser

https://e04.github.io/ft8ts/example/browser/index.html

### CLI

#### Encode

```bash
npx tsx example/generate-ft8-wav.ts "<message>" [--out output.wav] [--df 1000]
```

#### Decode

```bash
npx tsx example/decode-ft8-wav.ts ./src/__test__/190227_155815.wav [--low 200] [--high 3000] [--depth 2]
```

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
