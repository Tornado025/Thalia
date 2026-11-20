import { bucket, dominantBucket, FRAME_MS, noiseFloor, rmsDbfs, type NoiseLevel } from './noise'
import { durationMs, SAMPLE_RATE } from './wav'
import { PEAK_COUNT, peaks } from './waveform'

export type CapturedAudio = {
  samples: Int16Array // 16 kHz mono
  durationMs: number
  waveform: number[]
  noiseLevel: NoiseLevel
}

const LIVE_FLOOR_DB = -60

/**
 * Accumulates PCM16 chunks from the microphone stream. Keeps per-100 ms frame
 * levels for the live noise meter and waveform; resamples to 16 kHz on finish.
 * Pure (no native APIs) so it is unit-tested.
 */
export class PcmCollector {
  private chunks: Int16Array[] = []
  private length = 0
  private rate = SAMPLE_RATE
  private frame: number[] = []
  private frameDbs: number[] = []
  private buckets: NoiseLevel[] = []
  paused = false

  push(chunk: Int16Array, sampleRate: number) {
    if (this.paused || !chunk.length) return
    this.rate = sampleRate
    this.chunks.push(chunk)
    this.length += chunk.length

    const frameSize = Math.round((sampleRate * FRAME_MS) / 1000)
    for (let i = 0; i < chunk.length; i++) {
      this.frame.push(chunk[i])
      if (this.frame.length === frameSize) {
        this.frameDbs.push(rmsDbfs(Int16Array.from(this.frame)))
        this.buckets.push(bucket(noiseFloor(this.frameDbs)))
        this.frame = []
      }
    }
  }

  /** Recorded time so far (excludes paused time). */
  get elapsedMs() {
    return durationMs(this.length, this.rate)
  }

  /** Current noise bucket from the floor of the last 3 s. */
  get noise(): NoiseLevel {
    return this.buckets.length ? this.buckets[this.buckets.length - 1] : 'clean'
  }

  /** Last `n` frame levels mapped to 0..1 for the live waveform (oldest first). */
  liveLevels(n = PEAK_COUNT): number[] {
    const recent = this.frameDbs.slice(-n)
    const scaled = recent.map((db) => Math.max(0.05, Math.min(1, (db - LIVE_FLOOR_DB) / -LIVE_FLOOR_DB)))
    return [...new Array<number>(n - scaled.length).fill(0.05), ...scaled]
  }

  finish(): CapturedAudio {
    const raw = new Int16Array(this.length)
    let at = 0
    for (const c of this.chunks) {
      raw.set(c, at)
      at += c.length
    }
    const samples = resampleTo16k(raw, this.rate)
    return {
      samples,
      durationMs: durationMs(samples.length),
      waveform: peaks(samples),
      noiseLevel: dominantBucket(this.buckets),
    }
  }
}

/**
 * Resample PCM16 to 16 kHz. Downsampling averages each output sample's input
 * window (a cheap low-pass against aliasing); upsampling interpolates linearly.
 */
export function resampleTo16k(input: Int16Array, fromRate: number): Int16Array {
  if (fromRate === SAMPLE_RATE || !input.length) return input
  const ratio = fromRate / SAMPLE_RATE
  const out = new Int16Array(Math.floor(input.length / ratio))
  for (let i = 0; i < out.length; i++) {
    if (ratio > 1) {
      const start = Math.floor(i * ratio)
      const end = Math.min(input.length, Math.floor((i + 1) * ratio))
      let sum = 0
      for (let j = start; j < end; j++) sum += input[j]
      out[i] = Math.round(sum / Math.max(1, end - start))
    } else {
      const pos = i * ratio
      const j = Math.floor(pos)
      const next = input[Math.min(j + 1, input.length - 1)]
      out[i] = Math.round(input[j] + (next - input[j]) * (pos - j))
    }
  }
  return out
}
