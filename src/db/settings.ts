import type { StateStorage } from 'zustand/middleware'

import { getDb } from './client'

/**
 * zustand persist storage backed by our own DB. (expo-sqlite/kv-store races its
 * own setup transaction against the first read/write and crashed first launch.)
 */
export const settingsStorage: StateStorage = {
  async getItem(key) {
    const db = await getDb()
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key)
    return row?.value ?? null
  },
  async setItem(key, value) {
    const db = await getDb()
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, value)
  },
  async removeItem(key) {
    const db = await getDb()
    await db.runAsync('DELETE FROM settings WHERE key = ?', key)
  },
}
