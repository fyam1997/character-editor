# Plan: Character Card Editor

## Purpose

A browser-based tool for authoring and testing Character Card V2 documents.
Serves two modes:
- **Card authors** — create cards from scratch, fill in all fields, export PNG/JSON
- **Frontend users** — import an existing card (PNG or JSON), tweak fields, test via
  built-in chat room, re-export

## Layout

```
┌──────────────────┬────────────────────────────────┬──────────────────────────────┐
│   SIDEBAR        │      SPEC EDITOR               │      CHAT ROOM               │
│   (200px)        │      (flex. remaining)         │      (flex. remaining)        │
│                  │                                │                              │
│  Logo            │  Character Base Spec           │  Greeting: "..."             │
│  [Import]        │  ┌─────────────────────────┐   │  ┌──────────────────────────┐│
│  [Export]        │  │  name                   │   │  │  System: card JSON       ││
│                  │  │  description            │   │  ├──────────────────────────┤│
│  ─ Cards ────    │  │  personality            │   │  │  Asst: greeting msg      ││
│  Card A  ✕      │  │  scenario               │   │  │  User: hello             ││
│  Card B  ✕      │  │  first_mes              │   │  │  Asst: hi there!         ││
│  Card C  ✕      │  │  mes_example            │   │  │                          ││
│  Card D  ✕      │  │  creator_notes          │   │  │                          ││
│                  │  │  system_prompt          │   │  ├──────────────────────────┤│
│  [⚙ System Config]│  │  post_history_instructions│  │  [Message input]  [Send]  ││
│                  │  │  tags                   │   │  └──────────────────────────┘│
│                  │  │  creator                │   │                              │
│                  │  │  character_version      │   │                              │
│                  │  │  extensions             │   │                              │
│                  │  ├─────────────────────────┤   │                              │
│                  │  │  Greetings              │   │                              │
│                  │  │  [Add greeting]         │   │                              │
│                  │  │  ┌─ Greeting 1 ── [▶] ┐│   │                              │
│                  │  │  │  textarea          ││   │                              │
│                  │  │  └────────────────────┘│   │                              │
│                  │  │  ┌─ Greeting 2 ── [▶] ┐│   │                              │
│                  │  │  │  textarea          ││   │                              │
│                  │  │  └────────────────────┘│   │                              │
│                  │  ├─────────────────────────┤   │                              │
│                  │  │  Character Lore Book    │   │                              │
│                  │  │  [Add entry]            │   │                              │
│                  │  │  ┌─ Entry 1 ── [▼] ──┐ │   │                              │
│                  │  │  │ keys, content, ... │ │   │                              │
│                  │  │  └────────────────────┘ │   │                              │
│                  │  │  ┌─ Entry 2 ── [▼] ──┐ │   │                              │
│                  │  │  │ keys, content, ... │ │   │                              │
│                  │  │  └────────────────────┘ │   │                              │
│                  │  └─────────────────────────┘   │                              │
└──────────────────┴────────────────────────────────┴──────────────────────────────┘
```

### Sidebar
- Import button, Export button
- List of cards in Card History (IndexedDB), each with a delete button
- System config icon (opens a modal/drawer for API settings — shared across all cards)

### Spec Editor (middle column)
- Scrollable, three sections stacked vertically:
  1. **Character Base Spec** — all V2 data fields (except greetings and lorebook)
  2. **Greetings** — list of textareas, add/remove/reorder, each with a ▶ button to start chat
  3. **Character Lore Book** — collapsible accordion entries with advanced toggle

### Chat Room (right column)
- Greeting indicator (which greeting started this session)
- Message history: reads current card JSON + greeting + messages
- Auto-sends on card change (user can also manually re-send)
- Input box + Send button

## Data Flow

### Import
- Drag-and-drop or file picker
- Auto-detect: if PNG signature → extract JSON appended after IEND chunk. If `.json` → parse directly
- Store in IndexedDB: `{ id, name, cardJson, pngBlob?, importedAt }`

### Export
- JSON: `JSON.stringify(card)` → download `.json`
- PNG: reconstruct PNG from stored blob, append current JSON, download `.png`

### Auto-save
- Any change to the form (debounced) writes to IndexedDB in-place
- No explicit save button

### Chat
- Click ▶ on a greeting → set greeting as first message, open chat column
- Prompt construction (v1): send entire card JSON as system message, greeting as first assistant message, then message exchange
- API: OpenAI-compatible endpoint, configurable base URL / key / model, called directly from browser (no proxy)

## Fields: Character Lore Book Entry (collapsible accordion)

Default view (always visible):
- keys, content, enabled toggle

Hidden behind "Advanced" toggle:
- name, priority, id, comment, case_sensitive, constant, position, insertion_order

Conditional (show only when `selective === true`):
- secondary_keys

## Fields: Extensions

Dynamic key-value table. User adds a key (string), value is a freeform JSON editor
(textarea with JSON validation). Preserves all existing keys on import/export.

## Storage Schema (IndexedDB)

```
cards store:
  key: auto-incremented id
  value: {
    id: number
    name: string
    cardJson: TavernCardV2
    pngBlob?: Blob          // raw PNG bytes from import, null for JSON imports
    createdAt: ISO string
    updatedAt: ISO string
  }
```

## Spec Exclusions (out of scope)

- V1 support
- Multi-user / accounts / cloud sync
- Backend proxy server for chat
- Advanced prompt engineering (lorebook injection, PHI placement — to be added later)

## Next Steps

1. Scaffold Vite + Vue 3 + Tailwind project
2. Implement IndexedDB storage layer
3. Build sidebar with card list, import/export
4. Build Character Base Spec form (VeeValidate + Zod)
5. Build Greetings panel
6. Build Lore Book panel (collapsible entries)
7. Build Chat Room with OpenAI-compatible client
8. Wire up ▶ button flow: greeting → chat
9. PNG extract/embed utilities
