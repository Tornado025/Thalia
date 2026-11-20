import type { SQLiteDatabase } from 'expo-sqlite'

/** Each entry upgrades user_version by one. Append only — never edit a shipped migration. */
export const MIGRATIONS: string[] = [
  `CREATE TABLE recordings (
     id TEXT PRIMARY KEY,
     created_at INTEGER NOT NULL,
     vehicle_type TEXT NOT NULL,
     vehicle_name TEXT,
     title TEXT,
     wav_path TEXT NOT NULL,
     duration_ms INTEGER NOT NULL,
     noise_level TEXT,
     waveform_json TEXT,
     model_id TEXT,
     raw_text TEXT,
     text TEXT,
     words_json TEXT,
     terms_json TEXT,
     job_card_json TEXT,
     status TEXT NOT NULL DEFAULT 'draft',
     transcribe_ms INTEGER,
     user_corrected INTEGER NOT NULL DEFAULT 0
   );
   CREATE INDEX recordings_created ON recordings(created_at DESC);
   CREATE TABLE corrections (
     id TEXT PRIMARY KEY,
     recording_id TEXT NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
     before TEXT NOT NULL, after TEXT NOT NULL, created_at INTEGER NOT NULL
   );
   CREATE TABLE benchmarks (
     id TEXT PRIMARY KEY, created_at INTEGER, device TEXT, model_id TEXT, clip TEXT,
     audio_ms INTEGER, load_ms INTEGER, transcribe_ms INTEGER, rtf REAL, text TEXT
   );`,
  `CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);`,
]

export async function migrate(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
  let version = row?.user_version ?? 0
  while (version < MIGRATIONS.length) {
    // One exec call, so no other query on this connection can interleave with the
    // transaction (withTransactionAsync is not exclusive and broke first launch on web).
    try {
      await db.execAsync(`BEGIN; ${MIGRATIONS[version]}; PRAGMA user_version = ${version + 1}; COMMIT;`)
    } catch (e) {
      await db.execAsync('ROLLBACK').catch(() => {})
      throw e
    }
    version++
  }
}
