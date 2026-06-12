import { getMetadata, addMetadata } from 'meta-png';
import { Base64 } from 'js-base64';
import type { CharacterCardV2, CharacterCardV3 } from '../types';

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

  let encoded = getMetadata(bytes, 'ccv3');
  if (encoded) {
    const decoded = Base64.decode(encoded);
    return { json: JSON.parse(decoded), pngBytes: buf };
  }

  // Fallback for v2 card
  encoded = getMetadata(bytes, 'chara');
  if (encoded) {
    const decoded = Base64.decode(encoded);
    return { json: JSON.parse(decoded), pngBytes: buf };
  }

  return { json: null, pngBytes: buf };
}

export function embedJsonInPng(
  pngBytes: ArrayBuffer,
  json: CharacterCardV2 | CharacterCardV3,
  options?: { embedV2Fallback?: boolean },
): Blob {
  const compact = JSON.stringify(json);
  const encoded = Base64.encode(compact);
  let bytes = new Uint8Array(pngBytes);

  if (json.spec === 'chara_card_v3') {
    bytes = addMetadata(bytes, 'ccv3', encoded);
    if (options?.embedV2Fallback) {
      const v2compact = JSON.stringify(json);
      const v2encoded = Base64.encode(v2compact);
      bytes = addMetadata(bytes, 'chara', v2encoded);
    }
  } else {
    bytes = addMetadata(bytes, 'chara', encoded);
  }

  return new Blob([bytes], { type: 'image/png' });
}
