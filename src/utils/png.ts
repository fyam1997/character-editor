const PNG_SIG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
const IEND_TYPE = new Uint8Array([73, 69, 78, 68]) // 'IEND'

function findIEND(buf: Uint8Array): number {
  for (let i = 8; i <= buf.length - 12; i++) {
    const len = (buf[i] << 24) | (buf[i + 1] << 16) | (buf[i + 2] << 8) | buf[i + 3]
    if (
      buf[i + 4] === IEND_TYPE[0] &&
      buf[i + 5] === IEND_TYPE[1] &&
      buf[i + 6] === IEND_TYPE[2] &&
      buf[i + 7] === IEND_TYPE[3]
    ) {
      return i + 4 + 4 + len + 4
    }
  }
  return -1
}

export function extractJsonFromPng(buf: ArrayBuffer): {
  json: unknown
  pngBytes: ArrayBuffer
} {
  const bytes = new Uint8Array(buf)
  const iendEnd = findIEND(bytes)
  if (iendEnd === -1) throw new Error('Invalid PNG: no IEND chunk found')
  const jsonStart = iendEnd
  const jsonStr = new TextDecoder().decode(bytes.slice(jsonStart))
  return {
    json: JSON.parse(jsonStr),
    pngBytes: buf.slice(0, jsonStart),
  }
}

export function embedJsonInPng(
  pngBytes: ArrayBuffer,
  json: unknown
): Blob {
  const jsonStr = JSON.stringify(json)
  const jsonBytes = new TextEncoder().encode(jsonStr)
  const result = new Uint8Array(pngBytes.byteLength + jsonBytes.length)
  result.set(new Uint8Array(pngBytes), 0)
  result.set(jsonBytes, pngBytes.byteLength)
  return new Blob([result], { type: 'image/png' })
}

export function isPng(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 8) return false
  const sig = new Uint8Array(buf, 0, 8)
  return PNG_SIG.every((b, i) => b === sig[i])
}
