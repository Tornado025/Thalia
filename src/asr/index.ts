import { createMockEngine } from './mockEngine'
import type { ASREngine } from './types'

export type EngineKind = 'mock' | 'whisper'

export const engineKind: EngineKind =
  process.env.EXPO_PUBLIC_ASR_ENGINE === 'whisper' ? 'whisper' : 'mock'

let engine: ASREngine | null = null

// Single shared engine: only one whisper context may be in memory at a time.
export function getEngine(): ASREngine {
  if (!engine) {
    if (engineKind === 'whisper') {
      // whisperEngine (whisper.rn) lands in M3 — see docs/ROADMAP.md.
      throw new Error('EXPO_PUBLIC_ASR_ENGINE=whisper is not implemented yet (M3)')
    }
    engine = createMockEngine()
  }
  return engine
}

export type { ASREngine, ASRResult, Word } from './types'
