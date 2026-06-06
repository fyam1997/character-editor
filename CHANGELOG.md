# Changelog

## [0.1.3] — 2026-06-07

### Added
- Chat room header with inline system config panel on the right
- System Prompts section (Main Prompt, Auxiliary Prompt, Post-History Prompt)
- Prompt assembly engine: builds structured system messages from card data,
  lorebook, and prompts with `{{char}}`/`{{user}}` placeholder replacement
- Example Chat field to Character panel
- `mes_example` is parsed and injected as example dialogue in chat context

### Changed
- System Config moved from modal overlay to a side panel within the chat
  section, split into two collapsible groups (AI API Config, System Prompts)
- ChatRoom uses assembled prompt pipeline instead of raw card JSON dump
- Chat messages now skip old-format system message and use structured prompts

### Fixed
- Message deletion now re-fetches session from IndexedDB before mutating

## [0.1.2] — 2026-06-06

### Added
- MarkdownField component: all text fields render markdown by default,
  click to edit raw with auto-grow textarea and auto-focus
- Dialogue highlighting: quoted text rendered in green, italic in grey
- Non-V2 JSON imports auto-wrap root-level fields into V2 format
- PNG import/export uses `meta-png` for proper `chara` tEXt chunk
  embedding, falls back to append method for legacy PNGs
- Chat sessions: persistent per-card in IndexedDB with session
  dropdown, tick on active session, delete per session
- Chat messages rendered as cards with role-colored left border
- Delete button on each chat message and greeting
- API config persisted to localStorage

### Fixed
- Character book entries not read from non-V2 JSON imports
- PNG import/export not working (was using raw append method)
- Chat fetch errors now caught and displayed as assistant messages
  instead of unhandled promise rejections

## [0.1.1] — 2026-06-06

### Fixed
- Auto-save now persists edits to IndexedDB (was broken by DataCloneError
  from Vue reactive proxies; store now strips proxies before IDB write)
- "New card" now immediately appears in card list
- Greeting and Lore Book buttons were not responding after card switch
  (VeeValidate proxy overwriting store data — removed VeeValidate from
  data ownership, binds form fields directly to the Pinia store)
- EntryCard extracted to separate SFC (was using runtime template compiler)

### Changed
- Editor layout: all sections (Info, Character, Override Prompt, Greetings,
  Lore Book) are collapsible cards with sticky headers and height animation
- Panels split into standalone files under src/panels/ (previously a single
  BaseSpecForm component); GreetingsPanel and LoreBookPanel moved there
- BaseSpecForm reorganized into Info, Character, Override Prompt sections;
  first_mes merged into first greeting; ExtensionsEditor removed
- Export bar moved to bottom of editor column (JSON and PNG buttons)
- Image preview added to Info panel (upload PNG, click to view full size)
- Info panel layout: image and right content in 1:3 grid, name on own row
- At least one greeting required (delete disabled when only one remains)
- Tags and lore keys inputs use local v-model, committed on blur/Enter
- Comma-separated values (tags, keys) now allow typing commas freely
- Dark-themed scrollbar styling; scrollbar gutter reserved to prevent
  layout shift; sidebar scrollbar does not reserve space
- Collapse/expand state persisted to localStorage across all cards

## [0.1.0] — 2026-06-06

### Added
- Project scaffold: Vite + Vue 3 + TypeScript + TailwindCSS
- IndexedDB storage layer (Dexie) for persisting cards
- Sidebar: card history list, new/import/export, delete
- Character Base Spec form with all V2 fields (VeeValidate + Zod)
- Extensions editor: dynamic key-value table with JSON editing
- Greetings panel: list of greeting textareas with add/remove
- Lore Book panel: collapsible accordion entries with metadata,
  advanced toggle, conditional secondary_keys
- Chat Room: OpenAI-compatible streaming API with send/cancel
- System Config modal: API base URL, key, model
- PNG import/export: extract JSON from PNG, embed JSON into PNG
- Auto-save: debounced writes to IndexedDB on any change
- Pinia store for active card state and API config

### Technical
- Vue 3 Composition API with `<script setup>`
- VeeValidate + Zod for form validation
- Dexie for IndexedDB queries
- Pinia for state management
- TailwindCSS utility-first styling, hand-rolled components
- No backend proxy — browser-to-API directly
