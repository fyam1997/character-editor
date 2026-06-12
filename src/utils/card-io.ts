import type { CharacterCardV2, CharacterCardV3 } from '../types';
import { isPng, extractJsonFromPng, embedJsonInPng } from './png';

export interface ImportResult {
  json: CharacterCardV2 | CharacterCardV3;
  pngBlob?: Blob;
}

function locateIEND(buf: Uint8Array): number {
  for (let i = 8; i <= buf.length - 12; i++) {
    const len = (buf[i] << 24) | (buf[i + 1] << 16) | (buf[i + 2] << 8) | buf[i + 3];
    if (buf[i + 4] === 73 && buf[i + 5] === 69 && buf[i + 6] === 78 && buf[i + 7] === 68) {
      return i + 4 + 4 + len + 4;
    }
  }
  return -1;
}

export function importCard(buf: ArrayBuffer): ImportResult {
  let json: CharacterCardV2 | CharacterCardV3;
  let pngBlob: Blob | undefined;

  if (isPng(buf)) {
    const extracted = extractJsonFromPng(buf);
    pngBlob = new Blob([buf], { type: 'image/png' });
    if (extracted.json) {
      json = extracted.json as CharacterCardV2 | CharacterCardV3;
    } else {
      const bytes = new Uint8Array(buf);
      const iend = locateIEND(bytes);
      if (iend === -1) throw new Error('Invalid PNG');
      json = JSON.parse(new TextDecoder().decode(bytes.slice(iend))) as CharacterCardV2 | CharacterCardV3;
    }
  } else {
    json = JSON.parse(new TextDecoder().decode(buf)) as CharacterCardV2 | CharacterCardV3;
  }

  if (json.spec !== 'chara_card_v2' && json.spec !== 'chara_card_v3') {
    const root = json as Record<string, unknown>;
    const src = (root.data as Record<string, unknown>) ?? root;
    if (src.name === undefined && src.description === undefined) {
      throw new Error('Unrecognized card format');
    }
    json = {
      spec: 'chara_card_v3',
      spec_version: '3.0',
      data: {
        name: (src.name as string) ?? '',
        description: (src.description as string) ?? '',
        personality: (src.personality as string) ?? '',
        scenario: (src.scenario as string) ?? '',
        first_mes: (src.first_mes as string) ?? '',
        mes_example: (src.mes_example as string) ?? '',
        creator_notes: (src.creator_notes as string) ?? '',
        system_prompt: (src.system_prompt as string) ?? '',
        post_history_instructions: (src.post_history_instructions as string) ?? '',
        alternate_greetings: (src.alternate_greetings as string[]) ?? [],
        group_only_greetings: [],
        tags: (src.tags as string[]) ?? [],
        creator: (src.creator as string) ?? '',
        character_version: (src.character_version as string) ?? '',
        extensions: (src.extensions as Record<string, unknown>) ?? {},
      },
    };
  }

  if (json.spec === 'chara_card_v2') {
    const f = json.data.first_mes;
    const g = json.data.alternate_greetings;
    if (f) {
      if (!g || g.length === 0) {
        json.data.alternate_greetings = [f];
      } else {
        g[0] = f;
      }
    }
  }

  return { json, pngBlob };
}

export function prepareExport(cardJson: CharacterCardV2 | CharacterCardV3): CharacterCardV2 | CharacterCardV3 {
  const plain = JSON.parse(JSON.stringify(cardJson));
  if (plain.spec === 'chara_card_v2') {
    const greetings = plain.data.alternate_greetings;
    plain.data.first_mes = greetings[0] ?? '';
    plain.data.alternate_greetings = greetings.slice(1);
  }
  return plain;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAsJson(cardJson: CharacterCardV2 | CharacterCardV3): Blob {
  return new Blob([JSON.stringify(cardJson, null, 2)], { type: 'application/json' });
}

export async function exportAsPng(cardJson: CharacterCardV2 | CharacterCardV3, pngBytes: ArrayBuffer): Promise<Blob> {
  return embedJsonInPng(pngBytes, cardJson);
}

export function createExportFilename(name: string, ext: string): string {
  return `${name || 'character'}.${ext}`;
}
