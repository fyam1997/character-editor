import Dexie, { type EntityTable } from 'dexie'
import type { CardRecord } from '../types'

const db = new Dexie('CharacterEditor') as Dexie & {
  cards: EntityTable<CardRecord, 'id'>
}

db.version(1).stores({
  cards: '++id, name, updatedAt',
})

export { db }
