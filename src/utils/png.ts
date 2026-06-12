import { getMetadata, addMetadata } from 'meta-png';
import { Base64 } from 'js-base64';

export function isPng(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 8) return false;
  const sig = new Uint8Array(buf, 0, 8);
  return (
    sig[0] === 137 &&
    sig[1] === 80 &&
    sig[2] === 78 &&
    sig[3] === 71 &&
    sig[4] === 13 &&
    sig[5] === 10 &&
    sig[6] === 26 &&
    sig[7] === 10
  );
}

export function extractJsonFromPng(buf: ArrayBuffer): {
  json: unknown;
  pngBytes: ArrayBuffer;
} {
  const bytes = new Uint8Array(buf);
  const encoded = getMetadata(bytes, 'chara');
  let json: unknown;
  if (encoded) {
    const decoded = Base64.decode(encoded);
    json = JSON.parse(decoded);
    console.log(json);
  } else {
    json = null;
  }
  return { json, pngBytes: buf };
}

export function embedJsonInPng(pngBytes: ArrayBuffer, json: unknown): Blob {
  const compact = JSON.stringify(json);
  const encoded = Base64.encode(compact);
  const bytes = new Uint8Array(pngBytes);
  const result = addMetadata(bytes, 'chara', encoded);
  return new Blob([result], { type: 'image/png' });
}
