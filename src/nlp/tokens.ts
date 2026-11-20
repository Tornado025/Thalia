import type { Word } from '../asr/types'

/** A transcript word after normalization; `fixedFrom` is set when the lexicon replaced it. */
export type NWord = Word & { fixedFrom?: string }

/**
 * Anatomy of one whitespace token, e.g. `"(boltನ,"` →
 * pre `"("`, latin `"bolt"`, rest `"ನ"`, post `","`.
 * `rest` is whatever follows the Latin stem (usually a Kannada suffix);
 * for a pure-Kannada token `latin` is empty and `rest` holds the word.
 */
export type TokenParts = { pre: string; latin: string; rest: string; post: string }

const EDGE = /^([^\p{L}\p{N}]*)([\s\S]*?)([^\p{L}\p{N}\p{M}]*)$/u
const LATIN_STEM = /^([A-Za-z0-9][A-Za-z0-9'-]*)([\s\S]*)$/

export function splitToken(text: string): TokenParts {
  const [, pre, core, post] = EDGE.exec(text) ?? ['', '', text, '']
  const m = LATIN_STEM.exec(core)
  return m ? { pre, latin: m[1], rest: m[2], post } : { pre, latin: '', rest: core, post }
}

export const isLatinWord = (s: string) => /^[A-Za-z0-9][A-Za-z0-9'-]*$/.test(s)

const PUNCT_ONLY = /^[^\p{L}\p{N}]+$/u

/**
 * Whitespace/punctuation cleanup at word level: drops empty words and glues
 * stray punctuation tokens (`coolant .`) onto the previous word.
 */
export function cleanWords(words: Word[]): NWord[] {
  const out: NWord[] = []
  for (const w of words) {
    const text = w.text.trim().replace(/\s+/g, ' ')
    if (!text) continue
    if (PUNCT_ONLY.test(text) && out.length) {
      const last = out[out.length - 1]
      out[out.length - 1] = { ...last, text: last.text + text, end: w.end ?? last.end }
      continue
    }
    // Whisper sometimes emits a "word" containing spaces; split it, sharing its timing/p.
    for (const part of text.split(' ')) out.push({ ...w, text: part })
  }
  return out
}

export function wordsFromText(text: string): NWord[] {
  return cleanWords(text.split(/\s+/).map((t) => ({ text: t })))
}

export const joinWords = (words: Word[]) => words.map((w) => w.text).join(' ')
