export type CharacterBookEntry = {
  keys: string[];
  content: string;
  extensions: Record<string, unknown>;
  enabled: boolean;
  insertion_order: number;
  case_sensitive?: boolean;
  name?: string;
  priority?: number;
  id?: number;
  comment?: string;
  selective?: boolean;
  secondary_keys?: string[];
  constant?: boolean;
  position?: 'before_char' | 'after_char';
};

export type CharacterBook = {
  name?: string;
  description?: string;
  scan_depth?: number;
  token_budget?: number;
  recursive_scanning?: boolean;
  extensions: Record<string, unknown>;
  entries: CharacterBookEntry[];
};

export type CharacterCardV2 = {
  spec: 'chara_card_v2';
  spec_version: '2.0';
  data: {
    name: string;
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
    creator_notes: string;
    system_prompt: string;
    post_history_instructions: string;
    alternate_greetings: string[];
    character_book?: CharacterBook;
    tags: string[];
    creator: string;
    character_version: string;
    extensions: Record<string, unknown>;
  };
};

export type CharacterCardV3 = {
  spec: 'chara_card_v3';
  spec_version: '3.0';
  data: {
    name: string;
    nickname?: string;
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
    creator_notes: string;
    creator_notes_multilingual?: Record<string, string>;
    system_prompt: string;
    post_history_instructions: string;
    alternate_greetings: string[];
    group_only_greetings: string[];
    character_book?: Lorebook;
    tags: string[];
    creator: string;
    character_version: string;
    source?: string[];
    assets?: Asset[];
    creation_date?: number;
    modification_date?: number;
    extensions: Record<string, unknown>;
  };
};

export type Asset = {
  type: 'icon' | 'background' | 'emotion' | 'user_icon';
  uri: string;
  name: string;
  ext: string;
};

export type Lorebook = {
  name?: string;
  description?: string;
  scan_depth?: number;
  token_budget?: number;
  recursive_scanning?: boolean;
  extensions: Record<string, unknown>;
  entries: LorebookEntry[];
};

export type LorebookEntry = {
  keys: string[];
  content: string;
  extensions: Record<string, unknown>;
  enabled: boolean;
  insertion_order: number;
  case_sensitive?: boolean;
  name?: string;
  priority?: number;
  id?: number | string;
  comment?: string;
  selective?: boolean;
  secondary_keys?: string[];
  constant?: boolean;
  position?: 'before_char' | 'after_char';
  use_regex?: boolean;
};

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
};

export type CardRecord = {
  id?: number;
  name: string;
  cardJson: CharacterCardV2 | CharacterCardV3;
  pngBlob?: Blob;
  createdAt: string;
  updatedAt: string;
};

export type ChatSession = {
  id?: number;
  cardId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};


