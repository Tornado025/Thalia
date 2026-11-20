import type { Word } from '../asr/types'
import type { Category, Lexicon } from './lexicon'
import { splitToken, wordsFromText } from './tokens'

/** Lexicon term found at words[start..end) (end exclusive). */
export type TermSpan = { start: number; end: number; term: string; category: Category }

type Pattern = { words: string[]; latin: boolean; term: string; category: Category }

/**
 * Find lexicon terms in a word list, in Latin form (`engineನ` matches `engine`)
 * or Kannada form (lexicon `kn`, suffix allowed on the last word).
 * Longest match wins; spans never overlap.
 */
export function findTerms(input: Word[] | string, lex: Lexicon): TermSpan[] {
  const words = typeof input === 'string' ? wordsFromText(input) : input
  const parts = words.map((w) => splitToken(w.text))
  const patterns: Pattern[] = lex.flatMap((e) => [
    { words: e.term.toLowerCase().split(/\s+/), latin: true, term: e.term, category: e.category },
    { words: e.kn.split(/\s+/), latin: false, term: e.term, category: e.category },
  ])
  patterns.sort((a, b) => b.words.length - a.words.length)

  const spans: TermSpan[] = []
  let i = 0
  while (i < parts.length) {
    const pat = patterns.find((p) => matchesAt(p, i))
    if (pat) {
      spans.push({ start: i, end: i + pat.words.length, term: pat.term, category: pat.category })
      i += pat.words.length
    } else i++
  }
  return spans

  function matchesAt(pat: Pattern, at: number): boolean {
    const n = pat.words.length
    if (at + n > parts.length) return false
    for (let k = 0; k < n; k++) {
      const p = parts[at + k]
      const isLast = k === n - 1
      if (k > 0 && p.pre) return false
      if (!isLast && p.post) return false
      if (pat.latin) {
        if (p.latin.toLowerCase() !== pat.words[k] || (!isLast && p.rest)) return false
      } else {
        const core = p.latin + p.rest
        if (isLast ? !core.startsWith(pat.words[k]) : core !== pat.words[k]) return false
      }
    }
    return true
  }
}

/** Distinct terms in order of first appearance. */
export function uniqueTerms(spans: TermSpan[]): TermSpan[] {
  const seen = new Set<string>()
  return spans.filter((s) => !seen.has(s.term) && seen.add(s.term))
}
