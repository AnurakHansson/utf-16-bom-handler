import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectBOM,
  addBOM,
  removeBOM,
  convertEncoding,
  BOM_UTF16LE,
  BOM_UTF16BE,
} from '../src/core.js';

test('detectBOM returns null for empty input', () => {
  assert.deepEqual(detectBOM(new Uint8Array([])), { encoding: null, bom: null });
});

test('detectBOM returns null for one-byte input', () => {
  assert.deepEqual(detectBOM(new Uint8Array([0xff])), { encoding: null, bom: null });
});

test('detectBOM identifies UTF-16LE BOM', () => {
  const bytes = new Uint8Array([0xff, 0xfe, 0x41, 0x00]);
  assert.deepEqual(detectBOM(bytes), { encoding: 'utf-16le', bom: BOM_UTF16LE });
});

test('detectBOM identifies UTF-16BE BOM', () => {
  const bytes = new Uint8Array([0xfe, 0xff, 0x00, 0x41]);
  assert.deepEqual(detectBOM(bytes), { encoding: 'utf-16be', bom: BOM_UTF16BE });
});

test('detectBOM ignores data that merely starts with a BOM byte', () => {
  const bytes = new Uint8Array([0xff, 0x41, 0xfe, 0x00]);
  assert.deepEqual(detectBOM(bytes), { encoding: null, bom: null });
});

test('detectBOM throws TypeError for non-Uint8Array', () => {
  assert.throws(() => detectBOM('fffe'), TypeError);
  assert.throws(() => detectBOM([0xff, 0xfe]), TypeError);
});

test('addBOM prepends LE BOM when missing', () => {
  const data = new Uint8Array([0x41, 0x00]);
  const result = addBOM(data, 'utf-16le');
  assert.deepEqual(result, new Uint8Array([0xff, 0xfe, 0x41, 0x00]));
  assert.notStrictEqual(result, data);
});

test('addBOM prepends BE BOM when missing', () => {
  const data = new Uint8Array([0x00, 0x41]);
  const result = addBOM(data, 'utf-16be');
  assert.deepEqual(result, new Uint8Array([0xfe, 0xff, 0x00, 0x41]));
});

test('addBOM does not duplicate an existing matching BOM', () => {
  const data = new Uint8Array([0xff, 0xfe, 0x41, 0x00]);
  const result = addBOM(data, 'utf-16le');
  assert.strictEqual(result, data);
});

test('addBOM defaults to utf-16le when encoding omitted', () => {
  const data = new Uint8Array([0x41, 0x00]);
  assert.deepEqual(addBOM(data), new Uint8Array([0xff, 0xfe, 0x41, 0x00]));
});

test('addBOM throws RangeError for invalid encoding', () => {
  assert.throws(() => addBOM(new Uint8Array([0x41]), 'utf-8'), RangeError);
});

test('removeBOM strips LE BOM', () => {
  const data = new Uint8Array([0xff, 0xfe, 0x41, 0x00]);
  const result = removeBOM(data);
  assert.deepEqual(result, new Uint8Array([0x41, 0x00]));
});

test('removeBOM strips BE BOM', () => {
  const data = new Uint8Array([0xfe, 0xff, 0x00, 0x41]);
  const result = removeBOM(data);
  assert.deepEqual(result, new Uint8Array([0x00, 0x41]));
});

test('removeBOM returns original array when no BOM present', () => {
  const data = new Uint8Array([0x41, 0x00]);
  assert.strictEqual(removeBOM(data), data);
});

test('convertEncoding swaps byte order from LE to BE', () => {
  const data = new Uint8Array([0xff, 0xfe, 0x41, 0x00, 0x42, 0x00]);
  const result = convertEncoding(data, 'utf-16be');
  assert.deepEqual(result, new Uint8Array([0xfe, 0xff, 0x00, 0x41, 0x00, 0x42]));
});

test('convertEncoding swaps byte order from BE to LE', () => {
  const data = new Uint8Array([0xfe, 0xff, 0x00, 0x41, 0x00, 0x42]);
  const result = convertEncoding(data, 'utf-16le');
  assert.deepEqual(result, new Uint8Array([0xff, 0xfe, 0x41, 0x00, 0x42, 0x00]));
});

test('convertEncoding returns original array when target matches source', () => {
  const data = new Uint8Array([0xff, 0xfe, 0x41, 0x00]);
  assert.strictEqual(convertEncoding(data, 'utf-16le'), data);
});

test('convertEncoding handles empty input', () => {
  const data = new Uint8Array([]);
  const result = convertEncoding(data, 'utf-16be');
  assert.deepEqual(result, data);
  assert.notStrictEqual(result, data);
});

test('convertEncoding throws RangeError for odd-length input', () => {
  const data = new Uint8Array([0x41, 0x00, 0x42]);
  assert.throws(() => convertEncoding(data, 'utf-16le'), RangeError);
});

test('convertEncoding throws RangeError for invalid target encoding', () => {
  assert.throws(() => convertEncoding(new Uint8Array([0x41, 0x00]), 'utf-8'), RangeError);
});
