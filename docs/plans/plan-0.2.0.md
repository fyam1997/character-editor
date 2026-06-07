# Plan: AI Generate Dialog (v0.2)

> **Status**: Proposed
> **Tag**: `v0.2.0`

## Purpose

Add an ✨ button to specific card fields that opens a generate dialog. The dialog
lets the user select context from other parts of the card (character fields,
greetings, lore entries) and write/use a prompt to call the LLM. The response is
inserted into the target field.

Two modes:
- **Generate** — target field is empty, write new content from scratch
- **Polish** — target field has content, rewrite/improve it

## Trigger Points

Three locations get an ✨ button:

| Location | File | Placement | Target |
|----------|------|-----------|--------|
| Greeting item | `src/panels/GreetingsPanel.vue` | Left of "▶ Start Chat", top-right of greeting card | That greeting's text |
| Character field | `src/panels/CharacterPanel.vue` | Top-right of each field (Desc, Personality, Scenario, ExChat), next to label | That field's value |
| Lore entry content | `src/components/EntryCard.vue` | Top-right of content section, next to "Content" label | That entry's content |

## Dialog Component

**File**: `src/components/GenerateDialog.vue`

Teleport-to-body overlay (follows existing InfoPanel preview modal pattern:
`fixed inset-0 z-50 bg-black/80`). Centered panel, max-width ~640px, max-height
~80vh with scroll.

### Sections (top to bottom)

**1. Context Sources — 4 checkboxes (Description, Personality, Scenario, Example Chat)**
- Each checkbox has the field name and a brief content preview (truncated)
- Pre-checked if the field is non-empty, unchecked if empty
- Disabled (greyed out) if the field is empty — user cannot check an empty field
- If all 4 are empty, this entire section is hidden

**2. Greetings — selection list**
- Renders all `alternate_greetings`, each with a checkbox + truncated preview
- Default: randomly pre-select 3 (or fewer if less than 3 exist)
- User can override selections (toggle any checkbox)
- If no greetings exist, this section is hidden

**3. Lore Entries — selection list**
- Renders all `character_book.entries`, each with a checkbox + truncated preview
- Default: randomly pre-select 3 (or fewer if less than 3 exist)
- User can override selections
- If no lorebook or no entries, this section is hidden

**4. Editable Prompt — textarea**
- Pre-filled with a default prompt based on target field + mode (see below)
- User can edit freely
- **Memory**: each field+mode combination stores the last user-edited prompt in
  localStorage. On open, if a saved prompt exists, restore it instead of the
  default. Two separate memories per field (one for generate, one for polish).
- **Reset button**: restores the textarea to the default prompt (and clears memory)

**5. Generate Button — sticky footer**
- Fixed/sticky at the bottom of the dialog
- Calls the API, streams response, inserts into target field
- States: idle → generating (spinner/disabled) → done (close)
- Error handling: show inline error message, keep dialog open

### Default Prompts

Each field has a generate prompt and a polish prompt. `{{char}}` and `{{user}}`
are replaced with the card's name and "User" respectively.

```
description:
  generate: "Write a character description for {{char}}. Include their appearance, demeanor, background, and notable traits. Write in third person."
  polish:   "Improve this character description to be more vivid and detailed. Keep the established identity and facts intact."

personality:
  generate: "Describe {{char}}'s personality — their traits, quirks, mannerisms, values, and behavioral patterns. Be specific and nuanced."
  polish:   "Improve this personality description to be more nuanced and specific. Preserve the established traits while adding depth."

scenario:
  generate: "Write an opening scenario describing where and how {{char}} meets {{user}}. Set the mood and establish context."
  polish:   "Improve this scenario to be more atmospheric and engaging. Keep the core situation intact."

mes_example:
  generate: "Write example dialogue showing {{char}}'s voice and personality. Use '{{char}}: dialogue' and '{{user}}: dialogue' format."
  polish:   "Improve this example chat to better capture {{char}}'s voice. Keep core interactions, enhance characterization through dialogue."

greeting:
  generate: "Write a greeting message for {{char}} — their opening line to {{user}}. Establish the character's voice and set the scene."
  polish:   "Improve this greeting to be more in-character and engaging. Keep the core message intact."

lore:
  generate: "Write lore content for this entry based on its key triggers: {{keys}}. Provide worldbuilding or character background that enriches the roleplay."
  polish:   "Improve this lore entry to be more detailed and useful. Keep the core information while adding depth."
```

## Assembly Utility

**File**: `src/utils/generate.ts`

### `assembleGeneratePrompt(targetField, mode, context, userPrompt, cardJson): ChatMessage[]`

Builds a messages array for the API call:

1. **System**: Instruction to act as a writing assistant for character card authoring
2. **Context block**: Selected context fields formatted as labeled text blocks:
   - Selected character fields (label: "=== Description ===", "=== Personality ===", etc.)
   - Selected greetings (label: "=== Greeting Example 1 ===", etc.)
   - Selected lore entries (label: "=== Lore: {entry_name_or_keys} ===")
3. **Current content** (polish mode only): "=== Current Content ===\n{currentContent}"
4. **User prompt**: The user's edited prompt text

### Memory

```typescript
function loadPromptMemory(field: string, mode: 'generate' | 'polish'): string | null
function savePromptMemory(field: string, mode: 'generate' | 'polish', prompt: string): void
function clearPromptMemory(field: string, mode: 'generate' | 'polish'): void
```

Stored in localStorage under key `generatePrompt:{field}:{mode}`.

### Integration

Reuses existing `streamChat()` from `src/utils/api.ts` and `store.apiConfig` for
the API endpoint, key, and model. The dialog wraps the async generator and
appends streamed text to the target field's model value.

## Files Changed

| File | Action |
|------|--------|
| `src/components/GenerateDialog.vue` | **New** — dialog component |
| `src/utils/generate.ts` | **New** — prompt assembly + memory |
| `src/panels/GreetingsPanel.vue` | Add ✨ button per greeting, emit event |
| `src/panels/CharacterPanel.vue` | Add ✨ button per field, emit event |
| `src/components/EntryCard.vue` | Add ✨ button on content, emit event |
| `src/App.vue` | Wire events → open dialog, insert result |

## Non-goals

- Streaming UI in dialog (text just accumulates; no per-token rendering)
- Multiple generation requests in parallel
- Editing the assembled context (no ability to reorder or trim snippets before sending)
- Image generation

## Steps

1. Create `src/utils/generate.ts` — default prompts, assembly function, memory
2. Create `src/components/GenerateDialog.vue` — dialog component
3. Wire ✨ button into `GreetingsPanel.vue`
4. Wire ✨ button into `CharacterPanel.vue`
5. Wire ✨ button into `EntryCard.vue`
6. Wire dialog open/close + result insertion in `App.vue`
