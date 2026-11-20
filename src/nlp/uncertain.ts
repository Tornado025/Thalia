import { editDistance, type Lexicon } from './lexicon'
import { splitToken, type NWord } from './tokens'

export type Uncertain = { index: number; word: string; candidates: string[] }

export const LOW_P = 0.5
const MAX_CANDIDATES = 3

/**
 * Max edit distance for the no-probability fallback. Short words get 1 because
 * at distance 2 too many ordinary words collide (`hole` ↔ `bolt`).
 */
const maxDistance = (len: number) => (len <= 5 ? 1 : 2)

/**
 * A word is uncertain if `p < 0.5`, or — when the engine gave no `p` — it is a
 * Latin word close to (but not equal to) a lexicon word. Candidates are the
 * word as-is, what it was auto-fixed from, and the nearest lexicon words.
 */
export function findUncertain(words: NWord[], lex: Lexicon): Uncertain[] {
  const vocab = [...new Set(lex.flatMap((e) => e.term.toLowerCase().split(/\s+/)))]
  const out: Uncertain[] = []

  words.forEach((w, index) => {
    const { latin } = splitToken(w.text)
    const lower = latin.toLowerCase()
    const near = lower
      ? vocab
          .map((v) => ({ v, d: editDistance(lower, v) }))
          .filter(({ d }) => d > 0 && d <= 2)
          .sort((a, b) => a.d - b.d)
      : []

    let uncertain: boolean
    if (w.p !== undefined) {
      uncertain = w.p < LOW_P
    } else {
      uncertain =
        lower.length >= 4 && !vocab.includes(lower) && near.some(({ d }) => d <= maxDistance(lower.length))
    }
    if (!uncertain) return

    const current = latin || w.text
    const fromWords = w.fixedFrom?.split(' ') ?? []
    const original = fromWords.length === 1 ? fromWords[0] : undefined
    const candidates = [current, original, ...near.map(({ v }) => v)].filter(
      (c, i, all): c is string => !!c && all.findIndex((x) => x?.toLowerCase() === c.toLowerCase()) === i,
    )
    out.push({ index, word: w.text, candidates: candidates.slice(0, MAX_CANDIDATES) })
  })
  return out
}
