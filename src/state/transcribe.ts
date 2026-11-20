import { engineKind, getEngine } from '../asr'
import { getRecording, updateRecording } from '../db/recordings'
import { buildJobCard, buildPrompt, findTerms, lexicon, normalizeWords } from '../nlp'
import { useSettings } from './useSettings'

const titleFor = (terms: { term: string; category: string }[]) => {
  const t = terms.find((x) => x.category === 'part') ?? terms[0]
  return t ? t.term.charAt(0).toUpperCase() + t.term.slice(1) : null
}

/**
 * Transcribe a stored recording with the active model, normalize with the
 * lexicon, auto-build the job card and save everything on the row.
 */
export async function transcribeRecording(id: string, onProgress?: (pct: number) => void): Promise<void> {
  const rec = await getRecording(id)
  if (!rec) throw new Error('Recording not found')
  const { activeModelId, boostWorkshopWords } = useSettings.getState()

  const engine = getEngine()
  // The whisper engine resolves the model file path in M3; the mock ignores it.
  if (!engine.isLoaded()) await engine.load(activeModelId)
  const result = await engine.transcribe(rec.wavPath, {
    language: 'kn',
    prompt: boostWorkshopWords ? buildPrompt(lexicon) : undefined,
    onProgress,
  })

  const norm = normalizeWords(result.words.length ? result.words : [{ text: result.text }], lexicon)
  const terms = findTerms(norm.words, lexicon)
  await updateRecording(id, {
    modelId: engineKind === 'mock' ? `mock:${activeModelId}` : activeModelId,
    rawText: result.text,
    text: norm.text,
    words: norm.words,
    terms,
    title: rec.title ?? titleFor(terms),
    jobCard: buildJobCard(norm.text, terms, { type: rec.vehicleType, name: rec.vehicleName ?? undefined }),
    transcribeMs: result.elapsedMs,
  })
}
