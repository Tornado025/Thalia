import { bucket, dominantBucket, noiseFloor, rmsDbfs } from '../src/audio/noise'
import { encodeWav, parseWavHeader, pcm16FromBytes } from '../src/audio/wav'
import { peaks, placeholderPeaks } from '../src/audio/waveform'

const ascii = (b: Uint8Array, at: number, n: number) => String.fromCharCode(...b.slice(at, at + n))

describe('wav', () => {
  const samples = new Int16Array(16000 * 2).map((_, i) => (i % 100) * 10 - 500) // 2 s

  it('writes a 16 kHz mono 16-bit header', () => {
    const wav = encodeWav(samples)
    expect(wav.length).toBe(44 + samples.length * 2)
    expect(ascii(wav, 0, 4)).toBe('RIFF')
    expect(ascii(wav, 8, 8)).toBe('WAVEfmt ')
    expect(ascii(wav, 36, 4)).toBe('data')
    const v = new DataView(wav.buffer)
    expect(v.getUint32(4, true)).toBe(36 + samples.length * 2)
    expect(v.getUint16(20, true)).toBe(1) // PCM
    expect(v.getUint32(28, true)).toBe(32000) // byte rate
    expect(v.getUint16(32, true)).toBe(2) // block align
  })

  it('round-trips header info and samples', () => {
    const wav = encodeWav(samples)
    expect(parseWavHeader(wav)).toEqual({ sampleRate: 16000, channels: 1, bitsPerSample: 16, dataBytes: 64000, durationMs: 2000 })
    expect(Array.from(pcm16FromBytes(wav.slice(44)))).toEqual(Array.from(samples))
  })

  it('rejects non-WAV data', () => {
    expect(() => parseWavHeader(new Uint8Array(44))).toThrow('RIFF')
  })
})

describe('noise', () => {
  it('measures dBFS', () => {
    expect(rmsDbfs(new Int16Array(1600))).toBe(-100)
    expect(rmsDbfs(new Int16Array(1600).fill(32767))).toBeCloseTo(0, 1)
    expect(rmsDbfs(new Int16Array(1600).fill(3277))).toBeCloseTo(-20, 0)
  })

  it('takes the 10th percentile of the last 3 s as the floor', () => {
    const old = new Array(50).fill(-10)
    const recent = Array.from({ length: 30 }, (_, i) => -60 + i)
    expect(noiseFloor([...old, ...recent])).toBe(-58)
  })

  it('buckets levels', () => {
    expect(bucket(-50)).toBe('clean')
    expect(bucket(-40)).toBe('moderate')
    expect(bucket(-20)).toBe('heavy')
    expect(dominantBucket(['clean', 'moderate', 'moderate'])).toBe('moderate')
    expect(dominantBucket(['clean', 'heavy'])).toBe('heavy')
    expect(dominantBucket([])).toBe('clean')
  })
})

describe('waveform', () => {
  it('downsamples to 48 peaks in 0..1', () => {
    const s = new Int16Array(4800)
    s[0] = 32767
    s[4799] = -16384
    const p = peaks(s)
    expect(p).toHaveLength(48)
    expect(p[0]).toBe(1)
    expect(p[47]).toBeCloseTo(0.5, 2)
    expect(p[10]).toBe(0)
  })

  it('makes deterministic placeholder peaks', () => {
    expect(placeholderPeaks('abc')).toEqual(placeholderPeaks('abc'))
    expect(placeholderPeaks('abc').every((x) => x >= 0 && x <= 1)).toBe(true)
  })
})
