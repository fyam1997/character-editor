import type { CharacterCardV2, ChatMessage } from '../types'

export type GenerateField = 'description' | 'personality' | 'scenario' | 'mes_example' | 'greeting' | 'lore'
export type GenerateMode = 'generate' | 'polish'

const DEFAULT_PROMPTS: Record<GenerateField, { generate: string; polish: string }> = {
  description: {
    generate: "Write a character description for {{char}}. Include their appearance, demeanor, background, and notable traits. Write in third person.",
    polish: "Improve this character description to be more vivid and detailed. Keep the established identity and facts intact.",
  },
  personality: {
    generate: "Describe {{char}}'s personality — their traits, quirks, mannerisms, values, and behavioral patterns. Be specific and nuanced.",
    polish: "Improve this personality description to be more nuanced and specific. Preserve the established traits while adding depth.",
  },
  scenario: {
    generate: "Write an opening scenario describing where and how {{char}} meets {{user}}. Set the mood and establish context.",
    polish: "Improve this scenario to be more atmospheric and engaging. Keep the core situation intact.",
  },
  mes_example: {
    generate: "Write example dialogue showing {{char}}'s voice and personality. Use '{{char}}: dialogue' and '{{user}}: dialogue' format.",
    polish: "Improve this example chat to better capture {{char}}'s voice. Keep core interactions, enhance characterization through dialogue.",
  },
  greeting: {
    generate: "Write a greeting message for {{char}} — their opening line to {{user}}. Establish the character's voice and set the scene.",
    polish: "Improve this greeting to be more in-character and engaging. Keep the core message intact.",
  },
  lore: {
    generate: "Write lore content for this entry based on its key triggers: {{keys}}. Provide worldbuilding or character background that enriches the roleplay.",
    polish: "Improve this lore entry to be more detailed and useful. Keep the core information while adding depth.",
  },
}

function replacePlaceholders(text: string, charName: string): string {
  return text.replace(/{{char}}/g, charName).replace(/{{user}}/g, 'User')
}

export function getDefaultPrompt(field: GenerateField, mode: GenerateMode, keys?: string): string {
  let prompt = DEFAULT_PROMPTS[field][mode]
  if (field === 'lore' && keys) {
    prompt = prompt.replace('{{keys}}', keys)
  }
  return prompt
}

function memoryKey(field: GenerateField, mode: GenerateMode): string {
  return `generatePrompt:${field}:${mode}`
}

export function loadPromptMemory(field: GenerateField, mode: GenerateMode): string | null {
  try { return localStorage.getItem(memoryKey(field, mode)) } catch { return null }
}

export function savePromptMemory(field: GenerateField, mode: GenerateMode, prompt: string): void {
  try { localStorage.setItem(memoryKey(field, mode), prompt) } catch {}
}

export function clearPromptMemory(field: GenerateField, mode: GenerateMode): void {
  try { localStorage.removeItem(memoryKey(field, mode)) } catch {}
}

export function assembleGeneratePrompt(
  cardJson: CharacterCardV2,
  mode: GenerateMode,
  currentContent: string,
  selectedGreetings: number[],
  selectedLoreEntries: number[],
  userPrompt: string,
  theme?: string,
): ChatMessage[] {
  const msgs: ChatMessage[] = []
  const charName = cardJson.data.name || 'Character'
  const data = cardJson.data

  const styleLine = theme?.trim() ? `Write in the following style/theme: ${theme.trim()}. ` : ''
  msgs.push({
    role: 'system',
    content: 'You are a writing assistant for authoring character cards for roleplay. '
      + 'You help write and improve character descriptions, personalities, scenarios, '
      + `example chats, greetings, and lorebook entries. ${styleLine}Write in the same style and format as the provided context.`,
  })

  const blocks: string[] = []

  if (data.description)
    blocks.push(`=== Description ===\n${data.description}`)
  if (data.personality)
    blocks.push(`=== Personality ===\n${data.personality}`)
  if (data.scenario)
    blocks.push(`=== Scenario ===\n${data.scenario}`)
  if (data.mes_example)
    blocks.push(`=== Example Chat ===\n${data.mes_example}`)

  for (const idx of selectedGreetings) {
    const g = data.alternate_greetings[idx]
    if (g) blocks.push(`=== Greeting Example ${idx + 1} ===\n${g}`)
  }

  const book = data.character_book
  if (book?.entries) {
    for (const idx of selectedLoreEntries) {
      const e = book.entries[idx]
      if (e?.content) {
        const label = e.name || e.keys?.join(', ') || `Entry ${idx + 1}`
        blocks.push(`=== Lore: ${label} ===\n${e.content}`)
      }
    }
  }

  if (mode === 'polish' && currentContent) {
    blocks.push(`=== Content to Improve ===\n${currentContent}`)
  }

  if (blocks.length > 0) {
    msgs.push({
      role: 'system',
      content: 'Here is relevant context about the character:\n\n' + blocks.join('\n\n'),
    })
  }

  msgs.push({
    role: 'user',
    content: replacePlaceholders(userPrompt, charName),
  })

  return msgs
}
