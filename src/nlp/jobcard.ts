import type { TermSpan } from './terms'

export type VehicleType = 'bike' | 'scooter' | 'car'

export type WorkItem = { text: string; done: boolean }
export type PartRow = { name: string; qty: string; price: string }

export type JobCard = {
  vehicle: { type: VehicleType; name: string; regNo: string; customer: string; service: string }
  complaint: string
  diagnosis: string
  work: WorkItem[]
  parts: PartRow[]
  labour: string
}

/** Words that mark a sentence as describing work done / to do. */
export const ACTION_CUES = [
  'ತೆಗೆ', 'ಬಿಚ್ಚ', 'ಹಾಕಿ', 'ಬದಲಾಯಿಸಿ', 'ಕ್ಲೀನ್',
  'check', 'change', 'replace', 'clean', 'adjust', 'tighten', 'fill', 'refill',
]

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.?!।])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

const hasTerm = (sentence: string, term: string) => {
  const s = sentence.toLowerCase()
  const t = term.toLowerCase()
  let at = s.indexOf(t)
  while (at >= 0) {
    // Whole word on the left; a Kannada suffix may follow on the right.
    const before = s[at - 1]
    const after = s[at + t.length]
    if ((!before || !/[a-z0-9]/.test(before)) && (!after || !/[a-z0-9]/.test(after))) return true
    at = s.indexOf(t, at + 1)
  }
  return false
}

/** Auto-fill a job card from the transcript. A starting point — every field is editable. */
export function buildJobCard(
  text: string,
  terms: TermSpan[],
  vehicle: { type: VehicleType; name?: string },
): JobCard {
  const sentences = splitSentences(text)
  const byCat = (c: TermSpan['category']) => [...new Set(terms.filter((t) => t.category === c).map((t) => t.term))]
  const faults = byCat('fault')
  const actions = byCat('action')
  const parts = byCat('part')

  const faultSentences = sentences.filter((s) => faults.some((f) => hasTerm(s, f)))
  const actionSentences = sentences.filter(
    (s) => actions.some((a) => hasTerm(s, a)) || ACTION_CUES.some((c) => (/[a-z]/i.test(c) ? hasTerm(s, c) : s.includes(c))),
  )

  return {
    vehicle: { type: vehicle.type, name: vehicle.name ?? '', regNo: '', customer: '', service: parts[0] ? `${capitalize(parts[0])} service` : '' },
    complaint: faultSentences[0] ?? sentences[0] ?? '',
    diagnosis: faultSentences.join(' '),
    work: actionSentences.map((s) => ({ text: s, done: false })),
    parts: parts.map((name) => ({ name, qty: '', price: '' })),
    labour: '',
  }
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
