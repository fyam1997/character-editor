# Changelog

## [0.1.1-alpha] — 2026-06-06

### Fixed
- New card now saves to IndexedDB immediately, appears in card list
- Base Spec form no longer uses VeeValidate for data ownership — binds
  directly to the store, fixing Add Greeting and Add Lore Book buttons
  not responding (was caused by `syncToStore` replacing `cardJson.data`
  with a VeeValidate proxy, breaking nested reactivity)
- Removed VeeValidate `useField` from all form components; store is now
  the single source of truth, VeeValidate retained for validation only
- Auto-save now properly persists edits to IndexedDB. Moved save logic
  into Pinia store with `flushSave()` and `toPlain()` to strip reactive
  proxies before IDB write (fixes DataCloneError). Pending changes are
  flushed before card switching.
- Card list only reorders on actual edits, not on card switch
  (`flushSave` skips if no pending save timer; watch filters out
  card-load triggers via reference equality check)
- All textareas now auto-grow to fit content (no scrollbar, no resize
  handle) via `v-grow` directive
- Extracted EntryCard to separate SFC, fixing runtime template compiler
  warning when adding lore entries
- Rearranged BaseSpecForm into three sections: Info (name, creator,
  version, tags), Character (desc, personality, scenario, creator_notes),
  Override Prompt (system_prompt, post_history_instructions)
- Removed first_mes and mes_example from BaseSpecForm; first greeting
  in GreetingsPanel now syncs with first_mes automatically
- Removed ExtensionsEditor (extensions preserved on import/export)
- All editor sections are now collapsible cards with sticky headers
  and fade animation; split into standalone panel files under
  src/panels/ (InfoPanel, CharacterPanel, OverridePromptPanel)
- GreetingsPanel and LoreBookPanel moved from components/ to panels/
- 8px gap between panels

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
