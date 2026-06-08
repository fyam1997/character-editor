import type { CharacterCardV2 } from '../types'
import { isPng, extractJsonFromPng, embedJsonInPng } from './png'

export interface ImportResult {
  json: CharacterCardV2
  pngBlob?: Blob
}

function locateIEND(buf: Uint8Array): number {
  for (let i = 8; i <= buf.length - 12; i++) {
    const len = (buf[i] << 24) | (buf[i + 1] << 16) | (buf[i + 2] << 8) | buf[i + 3]
    if (
      buf[i + 4] === 73 && buf[i + 5] === 69 && buf[i + 6] === 78 && buf[i + 7] === 68
    ) {
      return i + 4 + 4 + len + 4
    }
  }
  return -1
}

export function importCard(buf: ArrayBuffer): ImportResult {
  let json: CharacterCardV2
  let pngBlob: Blob | undefined

  if (isPng(buf)) {
    const extracted = extractJsonFromPng(buf)
    pngBlob = new Blob([buf], { type: 'image/png' })
    if (extracted.json) {
      json = extracted.json as CharacterCardV2
    } else {
      const bytes = new Uint8Array(buf)
      const iend = locateIEND(bytes)
      if (iend === -1) throw new Error('Invalid PNG')
      json = JSON.parse(new TextDecoder().decode(bytes.slice(iend))) as CharacterCardV2
    }
  } else {
    json = JSON.parse(new TextDecoder().decode(buf)) as CharacterCardV2
  }

  if (json.spec !== 'chara_card_v2') {
    const root = json as Record<string, unknown>
    const src = (root.data as Record<string, unknown>) ?? root
    if (src.name === undefined && src.description === undefined) {
      throw new Error('Unrecognized card format')
    }
    json = {
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: {
        name: '',
        description: '',
        personality: '',
        scenario: '',
        first_mes: '',
        mes_example: '',
        creator_notes: '',
        system_prompt: '',
        post_history_instructions: '',
        alternate_greetings: [],
        tags: [],
        creator: '',
        character_version: '',
        extensions: {},
        ...(src as Record<string, unknown>),
      } as CharacterCardV2['data'],
    }
  }

  const f = json.data.first_mes
  const g = json.data.alternate_greetings
  if (f) {
    if (!g || g.length === 0) {
      json.data.alternate_greetings = [f]
    } else {
      g[0] = f
    }
  }

  return { json, pngBlob }
}

export function prepareExport(cardJson: CharacterCardV2): CharacterCardV2 {
  const plain: CharacterCardV2 = JSON.parse(JSON.stringify(cardJson))
  const greetings = plain.data.alternate_greetings
  plain.data.first_mes = greetings[0] ?? ''
  plain.data.alternate_greetings = greetings.slice(1)
  return plain
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportAsJson(cardJson: CharacterCardV2): Blob {
  return new Blob([JSON.stringify(cardJson, null, 2)], { type: 'application/json' })
}

export async function exportAsPng(cardJson: CharacterCardV2, pngBytes: ArrayBuffer): Promise<Blob> {
  return embedJsonInPng(pngBytes, cardJson)
}

export function createExportFilename(name: string, ext: string): string {
  return `${name || 'character'}.${ext}`
}
