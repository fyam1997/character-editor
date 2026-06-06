# Changelog

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
