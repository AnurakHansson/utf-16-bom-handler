# utf16-bom-handler

Detects, adds, and removes UTF-16 byte order marks, and converts between UTF-16LE and UTF-16BE byte orders.

```js
import { detectBOM, addBOM, removeBOM, convertEncoding } from './src/index.js';

const leWithBOM = new Uint8Array([0xff, 0xfe, 0x41, 0x00]);
console.log(detectBOM(leWithBOM)); // { encoding: 'utf-16le', bom: Uint8Array [0xff, 0xfe] }

const bare = new Uint8Array([0x41, 0x00]);
console.log(addBOM(bare, 'utf-16le')); // Uint8Array [0xff, 0xfe, 0x41, 0x00]
console.log(removeBOM(leWithBOM));    // Uint8Array [0x41, 0x00]

const be = convertEncoding(leWithBOM, 'utf-16be');
console.log(be); // Uint8Array [0xfe, 0xff, 0x00, 0x41]
```

## Why this exists

Working with UTF-16 text at the byte level is common when reading files, network buffers, or binary formats that use UTF-16. The BOM tells you the byte order, but many workflows want to strip it or change the byte order entirely. This library provides the four operations that cover most of those cases without pulling in an entire text encoding package.

The trade-off is scope: this handles only UTF-16 BOMs and byte-order conversion. It does not decode or encode text, validate code point sequences, or deal with UTF-8 BOMs. That keeps the code small and predictable.

## Awkward edge

`convertEncoding` throws a `RangeError` on odd-length input because UTF-16 code units are always two bytes. An odd-length buffer cannot be valid UTF-16, so treating it as silently convertible would hide a data corruption bug.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

