import { SAMPLE_RATE } from './wav'

export type NoiseLevel = 'clean' | 'moderate' | 'heavy'

// Tunable thresholds on the noise floor (dBFS).
export const CLEAN_BELOW_DB = -45
export const HEAVY_ABOVE_DB = -30
export const FRAME_MS = 100
export const FLOOR_WINDOW_MS = 3000
const SILENCE_DB = -100

export const FRAME_SAMPLES = (SAMPLE_RATE * FRAME_MS) / 1000

/** RMS level of one frame in dBFS (0 = full scale). */
export function rmsDbfs(frame: Int16Array): number {
  if (!frame.length) return SILENCE_DB
  let sum = 0
  for (let i = 0; i < frame.length; i++) {
    const s = frame[i] / 32768
    sum += s * s
  }
  const rms = Math.sqrt(sum / frame.length)
  return rms > 0 ? Math.max(SILENCE_DB, 20 * Math.log10(rms)) : SILENCE_DB
}

/** Noise floor = 10th percentile of the last 3 s of frame levels. */
export function noiseFloor(frameDbs: number[]): number {
  const recent = frameDbs.slice(-FLOOR_WINDOW_MS / FRAME_MS)
  if (!recent.length) return SILENCE_DB
  const sorted = [...recent].sort((a, b) => a - b)
  return sorted[Math.floor((sorted.length - 1) * 0.1)]
}

export function bucket(floorDb: number): NoiseLevel {
  if (floorDb < CLEAN_BELOW_DB) return 'clean'
  if (floorDb > HEAVY_ABOVE_DB) return 'heavy'
  return 'moderate'
}

/** Most frequent bucket over a recording (ties → the noisier one). */
export function dominantBucket(levels: NoiseLevel[]): NoiseLevel {
  const order: NoiseLevel[] = ['heavy', 'moderate', 'clean']
  const count = (l: NoiseLevel) => levels.filter((x) => x === l).length
  return order.reduce((best, l) => (count(l) > count(best) ? l : best), levels.length ? order[0] : 'clean')
}
