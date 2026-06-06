import type { CharacterCardV2, ChatMessage } from '../types'

function parseMesExample(mesExample: string): ChatMessage[] {
  const result: ChatMessage[] = []
  const sections = mesExample.split('<START>').filter(s => s.trim())

  for (const section of sections) {
    const lines = section.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      if (trimmed.startsWith('{{user}}: ')) {
        result.push({ role: 'system', content: trimmed.slice('{{user}}: '.length), name: 'example_user' })
      } else if (trimmed.startsWith('{{char}}: ')) {
        result.push({ role: 'system', content: trimmed.slice('{{char}}: '.length), name: 'example_assistant' })
      }
    }
  }

  return result
}

function resolvePrompt(presetPrompt: string, cardOverride: string): string {
  if (!cardOverride) return presetPrompt
  if (cardOverride.includes('{{original}}')) {
    return cardOverride.replace('{{original}}', presetPrompt)
  }
  return cardOverride
}

function replacePlaceholders(text: string, charName: string): string {
  return text.replace(/{{char}}/g, charName).replace(/{{user}}/g, 'User')
}

function getLoreEntries(data: CharacterCardV2['data']): { beforeChar: ChatMessage[]; afterChar: ChatMessage[] } {
  const beforeChar: ChatMessage[] = []
  const afterChar: ChatMessage[] = []
  const book = data.character_book
  if (!book?.entries) return { beforeChar, afterChar }

  const active = book.entries.filter(e => e.constant && e.enabled)
  active.sort((a, b) => (a.insertion_order ?? 0) - (b.insertion_order ?? 0))

  for (const e of active) {
    if (e.position === 'before_char') {
      beforeChar.push({ role: 'system', content: e.content })
    } else {
      afterChar.push({ role: 'system', content: e.content })
    }
  }

  return { beforeChar, afterChar }
}

export interface AssembledResult {
  messages: ChatMessage[]
  sessionStart: number
  sessionCount: number
}

export function assembleApiMessages(
  cardJson: CharacterCardV2 | null,
  systemPrompts: { mainPrompt: string; auxiliaryPrompt: string; postHistoryPrompt: string },
  sessionMessages: ChatMessage[]
): AssembledResult {
  const result: ChatMessage[] = []

  if (!cardJson) {
    return { messages: sessionMessages.map(m => ({ role: m.role, content: m.content })), sessionStart: 0, sessionCount: sessionMessages.length }
  }

  const data = cardJson.data
  const charName = data.name || 'Character'
  const mainPrompt = systemPrompts.mainPrompt || ''
  const auxiliaryPrompt = systemPrompts.auxiliaryPrompt || ''
  const postHistoryPrompt = systemPrompts.postHistoryPrompt || ''

  // 1. Main prompt
  const mainContent = resolvePrompt(mainPrompt, data.system_prompt)
  if (mainContent) {
    result.push({ role: 'system', content: replacePlaceholders(mainContent, charName) })
  }

  // Lorebook entries before character description
  const lore = getLoreEntries(data)
  for (const msg of lore.beforeChar) {
    result.push({ ...msg, content: replacePlaceholders(msg.content, charName) })
  }

  // 2. Description
  if (data.description) {
    result.push({ role: 'system', content: replacePlaceholders(data.description, charName) })
  }

  // 3. Personality
  if (data.personality) {
    result.push({ role: 'system', content: replacePlaceholders(`[${charName}'s personality: ${data.personality}]`, charName) })
  }

  // 4. Scenario
  if (data.scenario) {
    result.push({ role: 'system', content: replacePlaceholders(`[Circumstances and context of the dialogue: ${data.scenario}]`, charName) })
  }

  // 5. Lorebook entries after character description
  for (const msg of lore.afterChar) {
    result.push({ ...msg, content: replacePlaceholders(msg.content, charName) })
  }

  // 6. Auxiliary prompt
  if (auxiliaryPrompt) {
    result.push({ role: 'system', content: replacePlaceholders(auxiliaryPrompt, charName) })
  }

  // 7. Example chat
  if (data.mes_example) {
    result.push({ role: 'system', content: '[Example Chat]' })
    const examples = parseMesExample(data.mes_example)
    for (const ex of examples) {
      result.push({ ...ex, content: replacePlaceholders(ex.content, charName) })
    }
  }

  // 9. Start new chat
  result.push({ role: 'system', content: '[Start a new Chat]' })

  const sessionStart = result.length

  // 10. Chat messages from session - skip old-format system message
  let startIdx = 0
  if (sessionMessages.length > 0 && sessionMessages[0].role === 'system') {
    startIdx = 1
  }
  const sessionCount = sessionMessages.length - startIdx
  for (let i = startIdx; i < sessionMessages.length; i++) {
    result.push({ ...sessionMessages[i], content: replacePlaceholders(sessionMessages[i].content, charName) })
  }

  // 12. Post-history prompt (at the end)
  const postContent = resolvePrompt(postHistoryPrompt, data.post_history_instructions)
  if (postContent) {
    result.push({ role: 'system', content: replacePlaceholders(postContent, charName) })
  }

  return { messages: result, sessionStart, sessionCount }
}
