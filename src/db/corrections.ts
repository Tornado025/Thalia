import { getDb, newId } from './client'

/** Log a correction; `queue` also marks the clip for the training export. */
export async function addCorrection(recordingId: string, before: string, after: string, queue = true): Promise<void> {
  const db = await getDb()
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO corrections (id, recording_id, before, after, created_at) VALUES (?, ?, ?, ?, ?)',
      newId(), recordingId, before, after, Date.now(),
    )
    if (queue) await db.runAsync('UPDATE recordings SET user_corrected = 1 WHERE id = ?', recordingId)
  })
}

/** Corrected clips waiting in the training queue. */
export async function countCorrectedClips(): Promise<number> {
  const db = await getDb()
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM recordings WHERE user_corrected = 1')
  return row?.n ?? 0
}
