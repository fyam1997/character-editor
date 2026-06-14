import type { CharacterCardV2, CharacterCardV3, LorebookEntry } from '../types';

export function coerceV2toV3(v2: CharacterCardV2): CharacterCardV3 {
  const d = v2.data;
  const book = d.character_book;
  return {
    spec: 'chara_card_v3',
    spec_version: '3.0',
    data: {
      name: d.name,
      description: d.description,
      personality: d.personality,
      scenario: d.scenario,
      first_mes: d.first_mes,
      mes_example: d.mes_example,
      creator_notes: d.creator_notes,
      system_prompt: d.system_prompt,
      post_history_instructions: d.post_history_instructions,
      alternate_greetings: d.alternate_greetings,
      group_only_greetings: [],
      character_book: book
        ? {
            name: book.name,
            description: book.description,
            scan_depth: book.scan_depth,
            token_budget: book.token_budget,
            recursive_scanning: book.recursive_scanning,
            extensions: book.extensions,
            entries: book.entries.map((e) => {
              const entry: LorebookEntry = {
                keys: e.keys,
                content: e.content,
                extensions: e.extensions,
                enabled: e.enabled,
                insertion_order: e.insertion_order,
                case_sensitive: e.case_sensitive,
                name: e.name,
                priority: e.priority,
                id: e.id,
                comment: e.comment,
                selective: e.selective,
                secondary_keys: e.secondary_keys,
                constant: e.constant,
                position: e.position,
              };
              return entry;
            }),
          }
        : undefined,
      tags: d.tags,
      creator: d.creator,
      character_version: d.character_version,
      extensions: d.extensions,
    },
  };
}
