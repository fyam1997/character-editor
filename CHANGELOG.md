# Changelog

## [0.5.0] — 2026-06-12

### Refactored
- Inspect dialog: moved from inline usage in GenerateDialog/ChatRoom to
  centralized DialogStack Pinia store + Dialogs.vue component
- Dialog stack: new Pinia store (`dialogStack`) manages visibility stack
  and centralized Escape keydown handler; only the topmost dialog closes
- InspectDialog is now a pure presentational component with no stack logic

### Fixed
- Escape in inspect dialog now only closes the inspect dialog, not parent
- Escape works regardless of focus state (document-level listener)

## [0.4.0] — 2026-06-12

### Added
- Debug checkbox "Reopen Last Session" — when enabled, auto-selects the last
  active chat session for the current card on entry

### Changed
- MarkdownField: clicking the rendered preview places the cursor at the clicked
  line/column instead of jumping to the end of text
- MarkdownField: undo/redo history is now preserved across editing sessions for
  each field (textarea kept alive with `v-show` instead of `v-if`/`v-else`)

### Fixed
- MarkdownField: `startEdit` now uses DOM tree walker to correctly map clicks in
  rendered preview to source cursor position, handling headings, lists
  (including nested/indented), code blocks, and blockquotes
- MarkdownField: clicks past the end of a rendered line now place the cursor at
  the line end instead of the line start (handle `caretRangeFromPoint` offset 0
  quirk via bounding rect measurement)

### Refactored
- MarkdownField: extracted repeated inline markdown token scanning into
  data-driven `TOKEN_PATTERNS` + `scanToken` helper; extracted
  `closestTextNodeByY` helper; net -62 lines, zero functional change

## [0.3.0] — 2026-06-11

### Added
- Extension editor: type-aware key-value table with dynamic add/remove rows,
  JSON modal for bulk editing, and proper null/undefined handling
- Inspect dialog now editable with a textarea and Confirm button — edit the
  request payload and confirm to call the API with your changes
- Generate dialog: loading indicator (animated dots) in result area while
  generating, matching the chat room style

### Changed
- Generate dialog: `theme` and `outputInstruction` are now standalone system
  messages instead of being concatenated into the main prompt

### Fixed
- Inspect dialog Confirm now respects the Mock Response toggle, routing to mock
  stream when enabled instead of calling the real API
- Extension row disappearing on input and focus loss during keystroke
- New extension row being immediately discarded after creation

### Changed
- Moved `plan-0.3.0.md` into `docs/plans/`, added plan and spec references to
  AGENTS.md, cleaned up stale CONTEXT.md and ADR files

## [0.2.6] — 2026-06-08

### Added
- Debug collapsible section in system config with Inspect Request and Mock
  Response toggles for inspecting API payload or streaming a mock response
- Chat messages animate with TransitionGroup for smoother appearance and removal

### Fixed
- Escape and Ctrl+A behaviour in inspect dialog
- TDZ error from `assembledInfo` watch ordering

## [0.2.5] — 2026-06-08

### Changed
- UI backgrounds unified to three-tone scheme for better visual hierarchy
- Empty MarkdownField shows a border for better affordance

## [0.2.4] — 2026-06-08

### Added
- Generate dialog and chat room now respect the system config's `mainPrompt` and
  the card's `system_prompt` (with `{{original}}` substitution), instead of using
  a hardcoded writing-assistant prompt
- "Inspect Request" checkbox in the system config panel (above API config) — when
  checked, clicking Generate or Send displays the API request payload in a popup
  dialog instead of calling the LLM

## [0.2.3] — 2026-06-08

### Changed
- Import/export logic extracted into standalone `src/utils/card-io.ts` — both
  `Sidebar.vue` (import) and `App.vue` (export) now delegate to it

### Fixed
- On import, `first_mes` is now always placed at `alternate_greetings[0]`,
  even when `alternate_greetings` already has entries (previously only set when
  the list was empty)

## [0.2.2] — 2026-06-07

### Changed
- Greetings and lorebook panels: replaced top-right "+ Add" buttons with inline
  `--- + ---` dividers between each list item for positional insertion, plus a
  top and bottom divider outside the list
- Greetings and lorebook panels: add/remove animations via TransitionGroup
  (slide+fade on enter/leave, smooth repositioning on move)
- Top dividers now indented (`ml-8`/`mr-8`) to match internal item dividers
- Removed unused `computed` import in CollapsibleSection

## [0.2.1] — 2026-06-07

### Fixed
- Generate dialog prompt and theme fields now properly bind via `v-model` instead
  of `:model-value` without `@update:model-value`, so edits commit back to the
  underlying refs and are saved to localStorage

## [0.2.0] — 2026-06-07

### Added
- AI Generate Dialog: ✨ button on individual fields opens a context-selection
  dialog that calls the LLM to compose (empty field) or polish (filled field) content
- Generate target on: greeting items, character fields (Description, Personality,
  Scenario, Example Chat), and lore entry content
- Dialog shows character context (auto-included), selectable greetings and lore
  entries, editable prompt with per-field-per-mode memory, and optional theme input
- Result streams into an editable textarea with Confirm/Discard controls
- Esc key closes the dialog (unless generating)
- Theme text field stored per field+mode in localStorage

### Changed
- Character field context is always included if non-empty (no checkboxes)
- Lore entries in the dialog auto-select based on key-matching against selected
  greeting texts (instead of random pick)
- ParseMesExample now handles multi-line continuations and optional space after
  `{{user}}:` / `{{char}}:` prefixes
- Chat message header color matches left border (blue/green/yellow/gray); only
  System messages are dimmed
- Empty greetings and lore entries are hidden from the dialog
- AI system prompt tightened to respond with only raw content, no decoration

### Fixed
- Prompt auto-saves to localStorage on every edit (was only saving on Generate)
- Empty greeting/lore entries no longer preselected in dialog

## [0.1.6] — 2026-06-07

### Added
- Regenerate (↻) button on assistant messages — deletes the message and all
  below it, then re-streams a fresh response from the API
- `isAssistantMsg` guard to show the refresh button only on assistant messages

### Fixed
- Chat message delete now persists to IndexedDB (was mutating a reactive proxy
  instead of a fresh Dexie object)
- Session dropdown no longer stays open after selecting or creating a session
- Greeting-bound session creation: each greeting click now creates a new session
  instead of re-selecting an existing one; sessions are no longer tied to the
  greeting prop

### Changed
- Chat room decoupled from the `greeting` prop — sessions are managed directly
  via the store, allowing multiple sessions with the same greeting

## [0.1.5] — 2026-06-07

### Added
- Lore entries concatenated with `\n` and wrapped in a single system message
  `[Details of the fictional world the RP is set in:\n...]` for both before-char
  and after-char positions
- Greeting list and lore entry list use stable local IDs (instead of index or content)
  as Vue keys so drag-and-drop reorder works without refresh
- Lore entries now render markdown in chat via `MarkdownField` (`readonly` mode)
- `sortInsertionOrder` button assigns insertion_order from 100 in descending order

### Changed
- Chat messages render as markdown (including dialogue highlighting) instead of
  raw text
- `MarkdownField` accepts a `readonly` prop to render markdown without edit controls

## [0.1.4] — 2026-06-07

### Added
- Drag-and-drop reordering for Greetings list and Lore Book entries list
  via SortableJS with a ⠿ handle on each item
- `useSortable` composable (`src/utils/useSortable.ts`) for wiring SortableJS
  to Vue reactive arrays

### Changed
- Greeting cards and lore entry cards now include a drag handle in the header
- Both lists remain fully functional with the existing ▲▼ move buttons

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
