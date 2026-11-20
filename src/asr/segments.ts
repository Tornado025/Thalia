import type { Word } from './types'

export type Segment = { text: string; t0: number; t1: number }

/**
 * whisper.cpp segments → words. Segment times are in centiseconds; each word
 * gets a share of its segment's span proportional to its length. whisper.rn
 * gives no per-word probability, so `p` stays undefined (uncertain.ts falls back
 * to edit distance against the lexicon).
 */
export function segmentsToWords(segments: Segment[]): Word[] {
  const words: Word[] = []
  for (const seg of segments) {
    const parts = seg.text.trim().split(/\s+/).filter(Boolean)
    if (!parts.length) continue
    const start = seg.t0 / 100
    const span = Math.max(0, seg.t1 / 100 - start)
    const total = parts.reduce((n, p) => n + p.length, 0)
    let at = start
    for (const text of parts) {
      const dur = (span * text.length) / total
      words.push({ text, start: round(at), end: round(at + dur) })
      at += dur
    }
  }
  return words
}

const round = (x: number) => Math.round(x * 100) / 100
