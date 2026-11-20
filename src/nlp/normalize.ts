import type { Word } from '../asr/types'
import type { Lexicon } from './lexicon'
import { cleanWords, joinWords, splitToken, wordsFromText, type NWord } from './tokens'

export type Replacement = { from: string; to: string; index: number }
export type NormalizeResult = { text: string; words: NWord[]; replacements: Replacement[] }

type Rule = { words: string[]; term: string; onlyAfter?: string[] }

function rulesFor(lex: Lexicon): Rule[] {
  const rules: Rule[] = []
  for (const e of lex) {
    for (const v of e.variants) {
      const text = typeof v === 'string' ? v : v.text
      const onlyAfter = typeof v === 'string' ? undefined : v.onlyAfter?.map((s) => s.toLowerCase())
      rules.push({ words: text.toLowerCase().split(/\s+/), term: e.term, onlyAfter })
    }
  }
  // Longest match first: more words, then more characters.
  return rules.sort(
    (a, b) => b.words.length - a.words.length || b.words.join(' ').length - a.words.join(' ').length,
  )
}

/**
 * Replace known mishearings with the canonical lexicon term.
 * Case-insensitive, Latin tokens only, whole-word (a Kannada suffix may follow
 * the last word: `dry boltನ` → `drain boltನ`). Context-restricted variants only
 * fire when the previous word is in `onlyAfter`.
 */
export function normalizeWords(input: Word[], lex: Lexicon): NormalizeResult {
  const words = cleanWords(input)
  const parts = words.map((w) => splitToken(w.text))
  const rules = rulesFor(lex)
  const out: NWord[] = []
  const replacements: Replacement[] = []

  let i = 0
  while (i < words.length) {
    const rule = rules.find((r) => matchesAt(r, i))
    if (!rule) {
      out.push(words[i++])
      continue
    }
    const n = rule.words.length
    const src = words.slice(i, i + n)
    const first = parts[i]
    const last = parts[i + n - 1]
    const from = parts.slice(i, i + n).map((p) => p.latin).join(' ')
    const ps = src.map((w) => w.p).filter((p): p is number => p !== undefined)
    const termWords = rule.term.split(' ')
    replacements.push({ from, to: rule.term, index: out.length })
    termWords.forEach((tw, j) => {
      out.push({
        text: (j === 0 ? first.pre : '') + tw + (j === termWords.length - 1 ? last.rest + last.post : ''),
        start: src[0].start,
        end: src[n - 1].end,
        p: ps.length ? Math.min(...ps) : undefined,
        fixedFrom: from,
      })
    })
    i += n
  }
  return { text: joinWords(out), words: out, replacements }

  function matchesAt(rule: Rule, at: number): boolean {
    const n = rule.words.length
    if (at + n > parts.length) return false
    for (let k = 0; k < n; k++) {
      const p = parts[at + k]
      if (p.latin.toLowerCase() !== rule.words[k]) return false
      if (k > 0 && p.pre) return false
      if (k < n - 1 && (p.rest || p.post)) return false
    }
    if (rule.onlyAfter) {
      const prev = parts[at - 1]
      if (!prev || prev.rest || prev.post || !rule.onlyAfter.includes(prev.latin.toLowerCase())) {
        return false
      }
    }
    return true
  }
}

export function normalize(text: string, lex: Lexicon): NormalizeResult {
  return normalizeWords(wordsFromText(text), lex)
}
