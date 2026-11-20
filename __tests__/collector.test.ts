import { PcmCollector, resampleTo16k } from '../src/audio/collector'
import { parseWavHeader, encodeWav } from '../src/audio/wav'

const tone = (n: number, amp: number) => Int16Array.from({ length: n }, (_, i) => Math.round(amp * Math.sin(i / 5)))

describe('PcmCollector', () => {
  it('tracks elapsed time and skips audio while paused', () => {
    const c = new PcmCollector()
    c.push(tone(16000, 1000), 16000)
    c.paused = true
    c.push(tone(16000, 1000), 16000)
    c.paused = false
    c.push(tone(8000, 1000), 16000)
    expect(c.elapsedMs).toBe(1500)
    expect(c.finish().durationMs).toBe(1500)
  })

  it('produces 16 kHz audio whose WAV header reads back as 16 kHz mono', () => {
    const c = new PcmCollector()
    for (let i = 0; i < 20; i++) c.push(tone(4800, 2000), 48000) // 2 s at 48 kHz
    const out = c.finish()
    expect(out.samples.length).toBe(32000)
    expect(out.durationMs).toBe(2000)
    expect(parseWavHeader(encodeWav(out.samples))).toMatchObject({ sampleRate: 16000, channels: 1, bitsPerSample: 16, durationMs: 2000 })
    expect(out.waveform).toHaveLength(48)
  })

  it('reports the noise bucket from the floor level', () => {
    const quiet = new PcmCollector()
    quiet.push(tone(16000 * 3, 50), 16000)
    expect(quiet.noise).toBe('clean')
    expect(quiet.finish().noiseLevel).toBe('clean')

    const loud = new PcmCollector()
    loud.push(tone(16000 * 3, 12000), 16000)
    expect(loud.noise).toBe('heavy')
  })

  it('gives 48 live levels in 0..1, padded at the start', () => {
    const c = new PcmCollector()
    c.push(tone(1600 * 3, 8000), 16000) // 3 frames
    const levels = c.liveLevels()
    expect(levels).toHaveLength(48)
    expect(levels.slice(0, 45).every((x) => x === 0.05)).toBe(true)
    expect(levels[47]).toBeGreaterThan(0.5)
  })
})

describe('resampleTo16k', () => {
  it('passes 16 kHz through unchanged', () => {
    const s = tone(100, 100)
    expect(resampleTo16k(s, 16000)).toBe(s)
  })
  it('averages when downsampling 48 kHz', () => {
    expect(Array.from(resampleTo16k(Int16Array.from([3, 6, 9, 30, 30, 30]), 48000))).toEqual([6, 30])
  })
  it('interpolates when upsampling 8 kHz', () => {
    expect(Array.from(resampleTo16k(Int16Array.from([0, 100, 200]), 8000))).toEqual([0, 50, 100, 150, 200, 200])
  })
})
