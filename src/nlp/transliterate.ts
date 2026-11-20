import type { Word } from '../asr/types'
import type { Lexicon } from './lexicon'
import { findTerms } from './terms'
import { isLatinWord, joinWords, splitToken, wordsFromText } from './tokens'

export type KannadaResult = { text: string; unknownLatin: string[] }

/**
 * All-Kannada view: Latin lexicon terms → their `kn` form, keeping attached
 * suffixes and punctuation. Unknown Latin words are left as-is and reported
 * (no on-device transliterator in v1).
 */
export function toAllKannada(input: Word[] | string, lex: Lexicon): KannadaResult {
  const words = typeof input === 'string' ? wordsFromText(input) : input
  const kn = new Map(lex.map((e) => [e.term, e.kn]))
  const out: string[] = []
  const unknown = new Set<string>()

  let i = 0
  for (const span of [...findTerms(words, lex), null]) {
    const stop = span ? span.start : words.length
    for (; i < stop; i++) {
      const { latin } = splitToken(words[i].text)
      if (latin && isLatinWord(latin) && !/^\d+$/.test(latin)) unknown.add(latin)
      out.push(words[i].text)
    }
    if (!span) break
    const first = splitToken(words[span.start].text)
    const last = splitToken(words[span.end - 1].text)
    const isLatinSpan = !!first.latin
    out.push(
      isLatinSpan
        ? first.pre + kn.get(span.term) + last.rest + last.post
        : joinWords(words.slice(span.start, span.end)),
    )
    i = span.end
  }
  return { text: out.join(' '), unknownLatin: [...unknown] }
}
