import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite'

import { migrate } from './migrations'

let dbPromise: Promise<SQLiteDatabase> | null = null

export function getDb(): Promise<SQLiteDatabase> {
  dbPromise ??= openDatabaseAsync('thalia.db').then(async (db) => {
    await migrate(db)
    return db
  })
  return dbPromise
}

/** Short random id (no crypto dependency needed for local row keys). */
export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}
