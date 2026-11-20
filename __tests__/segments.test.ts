import { segmentsToWords } from '../src/asr/segments'

describe('segmentsToWords', () => {
  it('splits segments into words with proportional times (centiseconds → seconds)', () => {
    const words = segmentsToWords([
      { text: ' drain bolt ತೆಗೆದು', t0: 100, t1: 300 },
      { text: '   ', t0: 300, t1: 310 },
      { text: 'coolant.', t0: 300, t1: 400 },
    ])
    expect(words.map((w) => w.text)).toEqual(['drain', 'bolt', 'ತೆಗೆದು', 'coolant.'])
    expect(words[0].start).toBe(1)
    expect(words[2].end).toBe(3)
    expect(words[3]).toEqual({ text: 'coolant.', start: 3, end: 4 })
    expect(words.every((w) => w.p === undefined)).toBe(true)
  })
})
