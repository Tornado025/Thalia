/** Whisper input format: 16 kHz, mono, 16-bit PCM. */
export const SAMPLE_RATE = 16000
export const CHANNELS = 1
export const BITS_PER_SAMPLE = 16
export const HEADER_BYTES = 44

export type WavInfo = { sampleRate: number; channels: number; bitsPerSample: number; dataBytes: number; durationMs: number }

/** Build a canonical 44-byte-header RIFF/WAVE file around little-endian PCM16 samples. */
export function encodeWav(samples: Int16Array, sampleRate = SAMPLE_RATE, channels = CHANNELS): Uint8Array {
  const dataBytes = samples.length * 2
  const buf = new ArrayBuffer(HEADER_BYTES + dataBytes)
  const v = new DataView(buf)
  const blockAlign = channels * (BITS_PER_SAMPLE / 8)
  writeAscii(v, 0, 'RIFF')
  v.setUint32(4, 36 + dataBytes, true)
  writeAscii(v, 8, 'WAVE')
  writeAscii(v, 12, 'fmt ')
  v.setUint32(16, 16, true) // fmt chunk size
  v.setUint16(20, 1, true) // PCM
  v.setUint16(22, channels, true)
  v.setUint32(24, sampleRate, true)
  v.setUint32(28, sampleRate * blockAlign, true) // byte rate
  v.setUint16(32, blockAlign, true)
  v.setUint16(34, BITS_PER_SAMPLE, true)
  writeAscii(v, 36, 'data')
  v.setUint32(40, dataBytes, true)
  for (let i = 0; i < samples.length; i++) v.setInt16(HEADER_BYTES + i * 2, samples[i], true)
  return new Uint8Array(buf)
}

export function parseWavHeader(bytes: Uint8Array): WavInfo {
  if (bytes.length < HEADER_BYTES) throw new Error('Not a WAV file: too short')
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (readAscii(v, 0, 4) !== 'RIFF' || readAscii(v, 8, 4) !== 'WAVE') throw new Error('Not a RIFF/WAVE file')
  const channels = v.getUint16(22, true)
  const sampleRate = v.getUint32(24, true)
  const bitsPerSample = v.getUint16(34, true)
  const dataBytes = v.getUint32(40, true)
  const bytesPerSec = sampleRate * channels * (bitsPerSample / 8)
  return { sampleRate, channels, bitsPerSample, dataBytes, durationMs: Math.round((dataBytes / bytesPerSec) * 1000) }
}

/** Little-endian PCM16 bytes (e.g. a recorder chunk) → samples. */
export function pcm16FromBytes(bytes: Uint8Array): Int16Array {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const out = new Int16Array(Math.floor(bytes.length / 2))
  for (let i = 0; i < out.length; i++) out[i] = v.getInt16(i * 2, true)
  return out
}

export const durationMs = (sampleCount: number, sampleRate = SAMPLE_RATE) =>
  Math.round((sampleCount / sampleRate) * 1000)

function writeAscii(v: DataView, at: number, s: string) {
  for (let i = 0; i < s.length; i++) v.setUint8(at + i, s.charCodeAt(i))
}

function readAscii(v: DataView, at: number, n: number) {
  let s = ''
  for (let i = 0; i < n; i++) s += String.fromCharCode(v.getUint8(at + i))
  return s
}
