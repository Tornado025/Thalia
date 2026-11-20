import { PILOT_RAW, pilotWords } from '../src/asr/mockEngine'
import {
  buildJobCard,
  buildPrompt,
  editDistance,
  findTerms,
  findUncertain,
  lexicon,
  normalize,
  normalizeWords,
  splitSentences,
  splitToken,
  toAllKannada,
  type Lexicon,
} from '../src/nlp'

const PILOT_FIXED =
  'ಇವಾಗ ನೋಡಿ ಇಲ್ಲಿ drain bolt ತೆಗೆದು ಬರಲಿಲ್ಲ coolant. ಇದು coolant ಎಳ್ಕೊಳೋಕೆ air out ಆಗ್ಬೇಕು. ಕೆಲವೊಂದು time ಈ hole block ಆಗಿರುತ್ತೆ.'

describe('splitToken', () => {
  it('separates punctuation, Latin stem and Kannada suffix', () => {
    expect(splitToken('(boltನ,')).toEqual({ pre: '(', latin: 'bolt', rest: 'ನ', post: ',' })
    expect(splitToken('coolant.')).toEqual({ pre: '', latin: 'coolant', rest: '', post: '.' })
    expect(splitToken('ತೆಗೆದು')).toEqual({ pre: '', latin: '', rest: 'ತೆಗೆದು', post: '' })
  })
})

describe('normalize', () => {
  it('fixes the pilot sentence', () => {
    const r = normalize(PILOT_RAW, lexicon)
    expect(r.text).toBe(PILOT_FIXED)
    expect(r.replacements.map((x) => [x.from, x.to])).toEqual([
      ['dry bolt', 'drain bolt'],
      ['layer out', 'air out'],
      ['black', 'block'],
    ])
  })

  it('only fixes "black" after hole/passage', () => {
    expect(normalize('ಈ wire black ಇದೆ', lexicon).text).toBe('ಈ wire black ಇದೆ')
    expect(normalize('passage black ಆಗಿದೆ', lexicon).text).toBe('passage block ಆಗಿದೆ')
  })

  it('is case-insensitive, whole-word, and keeps Kannada suffixes', () => {
    expect(normalize('Dry Boltನ ತೆಗೆ', lexicon).text).toBe('drain boltನ ತೆಗೆ')
    expect(normalize('dry bolts', lexicon).text).toBe('dry bolts')
    expect(normalize('dry, bolt', lexicon).text).toBe('dry, bolt')
  })

  it('cleans whitespace and stray punctuation', () => {
    expect(normalize('  coolant   .  ಇದು ', lexicon).text).toBe('coolant. ಇದು')
  })

  it('carries word confidence through a replacement', () => {
    const r = normalizeWords(pilotWords(), lexicon)
    const block = r.words.find((w) => w.text === 'block')!
    expect(block.p).toBeLessThan(0.5)
    expect(block.fixedFrom).toBe('black')
  })

  it('prefers the longest variant', () => {
    const lex: Lexicon = [
      { term: 'oil', kn: 'ಆಯಿಲ್', category: 'part', variants: ['all'] },
      { term: 'engine oil', kn: 'ಇಂಜಿನ್ ಆಯಿಲ್', category: 'part', variants: ['engine all'] },
    ]
    expect(normalize('engine all ಹಾಕಿ', lex).text).toBe('engine oil ಹಾಕಿ')
  })
})

describe('findTerms', () => {
  it('finds the pilot terms in order', () => {
    expect(findTerms(PILOT_FIXED, lexicon).map((t) => t.term)).toEqual([
      'drain bolt',
      'coolant',
      'coolant',
      'air out',
      'block',
    ])
  })

  it('matches a term with a Kannada suffix attached', () => {
    const lex: Lexicon = [{ term: 'engine', kn: 'ಇಂಜಿನ್', category: 'part', variants: [] }]
    expect(findTerms('ಈ engineನ sound', lex)).toEqual([{ start: 1, end: 2, term: 'engine', category: 'part' }])
  })

  it('matches Kannada forms', () => {
    expect(findTerms('ಡ್ರೈನ್ ಬೋಲ್ಟ್ ತೆಗೆದು', lexicon).map((t) => [t.term, t.start, t.end])).toEqual([['drain bolt', 0, 2]])
  })

  it('does not match inside other words', () => {
    expect(findTerms('blocked coolants', lexicon)).toEqual([])
  })
})

describe('findUncertain', () => {
  it('flags the low-confidence pilot word with block/black candidates', () => {
    const { words } = normalizeWords(pilotWords(), lexicon)
    const u = findUncertain(words, lexicon)
    expect(u).toHaveLength(1)
    expect(words[u[0].index].text).toBe('block')
    expect(u[0].candidates).toEqual(['block', 'black'])
  })

  it('falls back to edit distance when there is no p', () => {
    const u = findUncertain([{ text: 'ಈ' }, { text: 'coolent' }, { text: 'hole' }, { text: 'coolant' }], lexicon)
    expect(u).toEqual([{ index: 1, word: 'coolent', candidates: ['coolent', 'coolant'] }])
  })
})

describe('toAllKannada', () => {
  it('replaces lexicon terms and reports unknown Latin words', () => {
    const r = toAllKannada(PILOT_FIXED, lexicon)
    expect(r.text).toBe(
      'ಇವಾಗ ನೋಡಿ ಇಲ್ಲಿ ಡ್ರೈನ್ ಬೋಲ್ಟ್ ತೆಗೆದು ಬರಲಿಲ್ಲ ಕೂಲೆಂಟ್. ಇದು ಕೂಲೆಂಟ್ ಎಳ್ಕೊಳೋಕೆ ಏರ್ ಔಟ್ ಆಗ್ಬೇಕು. ಕೆಲವೊಂದು time ಈ hole ಬ್ಲಾಕ್ ಆಗಿರುತ್ತೆ.',
    )
    expect(r.unknownLatin).toEqual(['time', 'hole'])
  })
})

describe('buildJobCard', () => {
  it('builds a card from the pilot transcript', () => {
    const card = buildJobCard(PILOT_FIXED, findTerms(PILOT_FIXED, lexicon), { type: 'bike', name: 'Bajaj NS200' })
    expect(card.parts.map((p) => p.name)).toEqual(['drain bolt', 'coolant'])
    expect(card.complaint).toBe('ಕೆಲವೊಂದು time ಈ hole block ಆಗಿರುತ್ತೆ.')
    expect(card.diagnosis).toBe(card.complaint)
    expect(card.work.map((w) => w.text)).toEqual([
      'ಇವಾಗ ನೋಡಿ ಇಲ್ಲಿ drain bolt ತೆಗೆದು ಬರಲಿಲ್ಲ coolant.',
      'ಇದು coolant ಎಳ್ಕೊಳೋಕೆ air out ಆಗ್ಬೇಕು.',
    ])
    expect(card.work.every((w) => !w.done)).toBe(true)
    expect(card.vehicle).toMatchObject({ type: 'bike', name: 'Bajaj NS200', service: 'Drain bolt service' })
  })

  it('falls back to the first sentence when there is no fault term', () => {
    const card = buildJobCard('silencer change ಮಾಡಿ. ಆಮೇಲೆ ನೋಡೋಣ.', [], { type: 'car' })
    expect(card.complaint).toBe('silencer change ಮಾಡಿ.')
    expect(card.diagnosis).toBe('')
  })
})

describe('helpers', () => {
  it('splits sentences', () => {
    expect(splitSentences('a. b? c')).toEqual(['a.', 'b?', 'c'])
  })
  it('computes edit distance', () => {
    expect(editDistance('black', 'block')).toBe(1)
    expect(editDistance('', 'abc')).toBe(3)
  })
  it('builds a truncated glossary prompt', () => {
    expect(buildPrompt(lexicon)).toBe('drain bolt, air out, block, coolant, clutch plate, pickup, silencer')
    expect(buildPrompt(lexicon, 5)).toBe('drain bolt')
  })
})
