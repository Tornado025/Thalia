export const PEAK_COUNT = 48

/** Downsample PCM16 to `n` peak values in 0..1 for the History row. */
export function peaks(samples: Int16Array, n = PEAK_COUNT): number[] {
  const out = new Array<number>(n).fill(0)
  if (!samples.length) return out
  const per = samples.length / n
  for (let b = 0; b < n; b++) {
    let max = 0
    const end = Math.min(samples.length, Math.floor((b + 1) * per))
    for (let i = Math.floor(b * per); i < end; i++) {
      const a = Math.abs(samples[i])
      if (a > max) max = a
    }
    out[b] = Math.min(1, max / 32767)
  }
  return out
}

/** Deterministic pseudo-waveform for recordings without audio (mock flow). */
export function placeholderPeaks(seed: string, n = PEAK_COUNT): number[] {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return Array.from({ length: n }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0
    const env = Math.sin((Math.PI * (i + 1)) / (n + 1))
    return Math.round((0.15 + 0.85 * env * ((h % 1000) / 1000)) * 100) / 100
  })
}
