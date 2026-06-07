# Character Card Editor

A tool for authoring and editing Character Card V2 documents — the JSON schema
used by AI-chat frontends (SillyTavern, Agnai, etc.) to define character
personas, prompts, lorebooks, and greeting messages.

## Language

**Character Card**
A self-contained JSON document conforming to the V2 spec that defines an AI
character's identity, behavior, prompts, lorebook, and greeting messages.
_Avoid_: Bot, agent, persona file

**Editor**
The application being built. Serves two user modes: card authors who create
cards from scratch, and frontend users who load an existing card to tweak it.
_Avoid_: Studio, workshop, manager

**V2**
The Character Card V2 specification — `spec: "chara_card_v2"`, `spec_version: "2.0"`,
all fields nested under `data`.
_Avoid_: V1 (out of scope)

**Card History**
Cards the user has imported or created, persisted in IndexedDB as a list. Each
record holds the parsed card JSON plus the raw PNG bytes (if imported from PNG).
Replaces the concept of local files or a save directory.
_Avoid_: Recent files, local collection

**Generate**
A feature that uses the configured LLM to compose or polish card fields. Two
modes: *generate* (field is empty, write new content) and *polish* (field has
content, rewrite/improve). Triggered via an ✨ button on individual fields,
opens a context-selection dialog.
_Avoid_: Autocomplete, AI fill, magic button

## Stack

- **Build tool**: Vite
- **Framework**: Vue 3 (Composition API, `<script setup>`)
- **Validation**: VeeValidate + Zod
- **State**: Pinia (if needed)
- **Styling**: TailwindCSS, hand-rolled components
- **Storage**: IndexedDB (via idb-keyval or Dexie)
- **Chat API**: OpenAI-compatible endpoint (configurable base URL, key, model — no proxy server)
