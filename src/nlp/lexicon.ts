import lexiconJson from '../../assets/lexicon.json'

export type Category = 'part' | 'fault' | 'action' | 'other'
export type Variant = string | { text: string; onlyAfter?: string[] }
export type LexEntry = {
  term: string
  kn: string
  category: Category
  variants: Variant[]
  meaning?: string
}
export type Lexicon = LexEntry[]

export const lexicon: Lexicon = lexiconJson as Lexicon

/** Rough whisper token budget: ~3 chars per BPE token for Latin text. */
const CHARS_PER_TOKEN = 3

/** Glossary prompt for whisper: comma-joined Latin terms, truncated to ~maxTokens. */
export function buildPrompt(lex: Lexicon, maxTokens = 200): string {
  const budget = maxTokens * CHARS_PER_TOKEN
  let out = ''
  for (const e of lex) {
    const next = out ? `${out}, ${e.term}` : e.term
    if (next.length > budget) break
    out = next
  }
  return out
}

export function editDistance(a: string, b: string): number {
  if (a === b) return 0
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[b.length]
}
