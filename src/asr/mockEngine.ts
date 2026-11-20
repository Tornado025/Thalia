import type { ASREngine, ASRResult, TranscribeOptions, Word } from './types'

// Pilot sentence exactly as a general model returns it: three jargon errors
// (dry bolt, layer out, black) and one low-confidence word ("black").
export const PILOT_RAW =
  'ಇವಾಗ ನೋಡಿ ಇಲ್ಲಿ dry bolt ತೆಗೆದು ಬರಲಿಲ್ಲ coolant. ಇದು coolant ಎಳ್ಕೊಳೋಕೆ layer out ಆಗ್ಬೇಕು. ಕೆಲವೊಂದು time ಈ hole black ಆಗಿರುತ್ತೆ.'

const LOW_CONFIDENCE: Record<string, number> = { black: 0.38 }

export function pilotWords(): Word[] {
  return PILOT_RAW.split(' ').map((text, i) => ({
    text,
    start: i * 0.4,
    end: i * 0.4 + 0.35,
    p: LOW_CONFIDENCE[text] ?? 0.92,
  }))
}

const DELAY_MS = 1500

export function createMockEngine(): ASREngine {
  let loaded = false
  return {
    async load() {
      loaded = true
    },
    async transcribe(_wavPath: string, opts: TranscribeOptions): Promise<ASRResult> {
      const t0 = Date.now()
      const steps = 10
      for (let i = 1; i <= steps; i++) {
        await new Promise((r) => setTimeout(r, DELAY_MS / steps))
        opts.onProgress?.(Math.round((i / steps) * 100))
      }
      return { text: PILOT_RAW, words: pilotWords(), elapsedMs: Date.now() - t0 }
    },
    async release() {
      loaded = false
    },
    isLoaded: () => loaded,
  }
}
