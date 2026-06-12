import { z } from 'zod';

export const characterBookEntrySchema = z.object({
  keys: z.array(z.string()).default([]),
  content: z.string().default(''),
  extensions: z.record(z.unknown()).default({}),
  enabled: z.boolean().default(true),
  insertion_order: z.number().default(100),
  case_sensitive: z.boolean().optional(),
  name: z.string().optional(),
  priority: z.number().optional(),
  id: z.number().optional(),
  comment: z.string().optional(),
  selective: z.boolean().optional(),
  secondary_keys: z.array(z.string()).optional(),
  constant: z.boolean().optional(),
  position: z.enum(['before_char', 'after_char']).optional(),
});

export const characterBookSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  scan_depth: z.number().optional(),
  token_budget: z.number().optional(),
  recursive_scanning: z.boolean().optional(),
  extensions: z.record(z.unknown()).default({}),
  entries: z.array(characterBookEntrySchema).default([]),
});

export const cardDataSchema = z.object({
  name: z.string().default(''),
  description: z.string().default(''),
  personality: z.string().default(''),
  scenario: z.string().default(''),
  first_mes: z.string().default(''),
  mes_example: z.string().default(''),
  creator_notes: z.string().default(''),
  system_prompt: z.string().default(''),
  post_history_instructions: z.string().default(''),
  alternate_greetings: z.array(z.string()).default([]),
  character_book: characterBookSchema.optional(),
  tags: z.array(z.string()).default([]),
  creator: z.string().default(''),
  character_version: z.string().default(''),
  extensions: z.record(z.unknown()).default({}),
});

export const cardSchema = z.object({
  spec: z.literal('chara_card_v2'),
  spec_version: z.literal('2.0'),
  data: cardDataSchema,
});
