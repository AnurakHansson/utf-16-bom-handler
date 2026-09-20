/**
 * BOM constants as Uint8Arrays. A BOM is a single Unicode code point,
 * U+FEFF, serialized in the byte order of the surrounding text. UTF-16LE
 * stores it as FF FE; UTF-16BE stores it as FE FF. UTF-8's BOM is EF BB BF
 * but this library intentionally handles only UTF-16 byte order marks.
 */
export const BOM_UTF16LE = new Uint8Array([0xff, 0xfe]);
export const BOM_UTF16BE = new Uint8Array([0xfe, 0xff]);

/**
 * Result object for BOM detection. The BOM is always exactly two bytes for
 * UTF-16, so a three-way check is unnecessary. `encoding` is one of
 * 'utf-16le', 'utf-16be', or null when no BOM is present.
 */

/**
 * Detects the byte order mark at the start of a Uint8Array.
 * @param {Uint8Array} bytes
 * @returns {{ encoding: 'utf-16le' | 'utf-16be' | null, bom: Uint8Array | null }}
 */
export function detectBOM(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('bytes must be a Uint8Array');
  }
  if (bytes.length >= 2 && bytes[0] === BOM_UTF16LE[0] && bytes[1] === BOM_UTF16LE[1]) {
    return { encoding: 'utf-16le', bom: BOM_UTF16LE };
  }
  if (bytes.length >= 2 && bytes[0] === BOM_UTF16BE[0] && bytes[1] === BOM_UTF16BE[1]) {
    return { encoding: 'utf-16be', bom: BOM_UTF16BE };
  }
  return { encoding: null, bom: null };
}

/**
 * Adds a UTF-16 byte order mark to the beginning of the byte sequence.
 * If the sequence already starts with the requested BOM, it is returned
 * unchanged to avoid duplicate marks.
 * @param {Uint8Array} bytes
 * @param {'utf-16le' | 'utf-16be'} encoding
 * @returns {Uint8Array} new array with BOM prepended
 */
export function addBOM(bytes, encoding = 'utf-16le') {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('bytes must be a Uint8Array');
  }
  if (encoding !== 'utf-16le' && encoding !== 'utf-16be') {
    throw new RangeError("encoding must be 'utf-16le' or 'utf-16be'");
  }

  const bom = encoding === 'utf-16le' ? BOM_UTF16LE : BOM_UTF16BE;
  const existing = detectBOM(bytes);
  if (existing.encoding === encoding) {
    return bytes;
  }

  const result = new Uint8Array(bom.length + bytes.length);
  result.set(bom, 0);
  result.set(bytes, bom.length);
  return result;
}

/**
 * Removes any UTF-16 byte order mark from the start of the sequence.
 * @param {Uint8Array} bytes
 * @returns {Uint8Array} new array without BOM, or the original if none present
 */
export function removeBOM(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('bytes must be a Uint8Array');
  }
  const { bom } = detectBOM(bytes);
  if (bom === null) {
    return bytes;
  }
  return bytes.subarray(bom.length);
}

/**
 * Converts UTF-16 bytes from one byte order to the other.
 * The input must be valid UTF-16 code unit pairs aligned to even byte offsets.
 * Odd-length input throws because it cannot contain whole code units.
 * The BOM, if present, is swapped as well.
 * @param {Uint8Array} bytes
 * @param {'utf-16le' | 'utf-16be'} targetEncoding
 * @returns {Uint8Array} converted bytes in the target encoding
 */
export function convertEncoding(bytes, targetEncoding) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('bytes must be a Uint8Array');
  }
  if (targetEncoding !== 'utf-16le' && targetEncoding !== 'utf-16be') {
    throw new RangeError("targetEncoding must be 'utf-16le' or 'utf-16be'");
  }
  if (bytes.length % 2 !== 0) {
    throw new RangeError('UTF-16 byte length must be even');
  }

  const source = detectBOM(bytes).encoding;
  if (source === targetEncoding) {
    return bytes;
  }

  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 2) {
    result[i] = bytes[i + 1];
    result[i + 1] = bytes[i];
  }
  return result;
}
