import Dexie, { type EntityTable } from 'dexie';
import type { CardRecord, ChatSession } from '../types';

const db = new Dexie('CharacterEditor') as Dexie & {
  cards: EntityTable<CardRecord, 'id'>;
  chatSessions: EntityTable<ChatSession, 'id'>;
};

db.version(1).stores({
  cards: '++id, name, updatedAt',
});

db.version(2).stores({
  cards: '++id, name, updatedAt',
  chatSessions: '++id, cardId, updatedAt',
});

db.version(3).stores({
  cards: '++id, name, updatedAt',
  chatSessions: '++id, cardId, updatedAt',
});

export { db };
