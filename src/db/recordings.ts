import { File } from 'expo-file-system'

import type { NoiseLevel } from '../audio/noise'
import type { JobCard, NWord, TermSpan, VehicleType } from '../nlp'
import { getDb } from './client'

export type RecordingStatus = 'draft' | 'saved'

export type Recording = {
  id: string
  createdAt: number
  vehicleType: VehicleType
  vehicleName: string | null
  title: string | null
  wavPath: string
  durationMs: number
  noiseLevel: NoiseLevel | null
  waveform: number[]
  modelId: string | null
  rawText: string | null
  text: string | null
  words: NWord[]
  terms: TermSpan[]
  jobCard: JobCard | null
  status: RecordingStatus
  transcribeMs: number | null
  userCorrected: boolean
}

type Row = {
  id: string; created_at: number; vehicle_type: string; vehicle_name: string | null; title: string | null
  wav_path: string; duration_ms: number; noise_level: string | null; waveform_json: string | null
  model_id: string | null; raw_text: string | null; text: string | null; words_json: string | null
  terms_json: string | null; job_card_json: string | null; status: string; transcribe_ms: number | null
  user_corrected: number
}

const parse = <T,>(s: string | null, fallback: T): T => (s ? (JSON.parse(s) as T) : fallback)

function fromRow(r: Row): Recording {
  return {
    id: r.id,
    createdAt: r.created_at,
    vehicleType: r.vehicle_type as VehicleType,
    vehicleName: r.vehicle_name,
    title: r.title,
    wavPath: r.wav_path,
    durationMs: r.duration_ms,
    noiseLevel: r.noise_level as NoiseLevel | null,
    waveform: parse(r.waveform_json, []),
    modelId: r.model_id,
    rawText: r.raw_text,
    text: r.text,
    words: parse(r.words_json, []),
    terms: parse(r.terms_json, []),
    jobCard: parse(r.job_card_json, null),
    status: r.status as RecordingStatus,
    transcribeMs: r.transcribe_ms,
    userCorrected: !!r.user_corrected,
  }
}

const COLUMNS: Record<keyof Recording, string> = {
  id: 'id', createdAt: 'created_at', vehicleType: 'vehicle_type', vehicleName: 'vehicle_name', title: 'title',
  wavPath: 'wav_path', durationMs: 'duration_ms', noiseLevel: 'noise_level', waveform: 'waveform_json',
  modelId: 'model_id', rawText: 'raw_text', text: 'text', words: 'words_json', terms: 'terms_json',
  jobCard: 'job_card_json', status: 'status', transcribeMs: 'transcribe_ms', userCorrected: 'user_corrected',
}
const JSON_FIELDS = new Set<keyof Recording>(['waveform', 'words', 'terms', 'jobCard'])

function toDb(key: keyof Recording, value: unknown): string | number | null {
  if (value === undefined || value === null) return null
  if (JSON_FIELDS.has(key)) return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? 1 : 0
  return value as string | number
}

export type NewRecording = Pick<Recording, 'id' | 'vehicleType' | 'wavPath' | 'durationMs'> & Partial<Recording>

export async function insertRecording(r: NewRecording): Promise<void> {
  const full: Partial<Recording> = { createdAt: Date.now(), status: 'draft', userCorrected: false, ...r }
  const keys = Object.keys(full) as (keyof Recording)[]
  const db = await getDb()
  await db.runAsync(
    `INSERT INTO recordings (${keys.map((k) => COLUMNS[k]).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
    keys.map((k) => toDb(k, full[k])),
  )
}

export async function updateRecording(id: string, patch: Partial<Omit<Recording, 'id'>>): Promise<void> {
  const keys = Object.keys(patch) as (keyof typeof patch)[]
  if (!keys.length) return
  const db = await getDb()
  await db.runAsync(
    `UPDATE recordings SET ${keys.map((k) => `${COLUMNS[k]} = ?`).join(', ')} WHERE id = ?`,
    [...keys.map((k) => toDb(k, patch[k])), id],
  )
}

export async function getRecording(id: string): Promise<Recording | null> {
  const db = await getDb()
  const row = await db.getFirstAsync<Row>('SELECT * FROM recordings WHERE id = ?', id)
  return row ? fromRow(row) : null
}

/** Newest first; `query` matches transcript text, vehicle, title and terms. */
export async function listRecordings(query = '', limit = 200): Promise<Recording[]> {
  const db = await getDb()
  const q = query.trim()
  const rows = q
    ? await db.getAllAsync<Row>(
        `SELECT * FROM recordings
         WHERE text LIKE $q OR vehicle_name LIKE $q OR vehicle_type LIKE $q OR title LIKE $q OR terms_json LIKE $q
         ORDER BY created_at DESC LIMIT $limit`,
        { $q: `%${q}%`, $limit: limit },
      )
    : await db.getAllAsync<Row>('SELECT * FROM recordings ORDER BY created_at DESC LIMIT ?', limit)
  return rows.map(fromRow)
}

/** Deletes the row (corrections cascade) and its WAV file. */
export async function deleteRecording(r: Recording): Promise<void> {
  const db = await getDb()
  await db.runAsync('DELETE FROM recordings WHERE id = ?', r.id)
  try {
    const f = new File(r.wavPath)
    if (f.exists) f.delete()
  } catch {
    // Audio already gone — nothing to clean up.
  }
}
