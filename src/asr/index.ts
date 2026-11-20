import { Platform } from 'react-native'

import { createMockEngine } from './mockEngine'
import type { ASREngine } from './types'

export type EngineKind = 'mock' | 'whisper'

// whisper.rn is native-only; the browser preview always uses the mock.
export const engineKind: EngineKind =
  process.env.EXPO_PUBLIC_ASR_ENGINE === 'whisper' && Platform.OS !== 'web' ? 'whisper' : 'mock'

let engine: ASREngine | null = null

// Single shared engine: only one whisper context may be in memory at a time.
export function getEngine(): ASREngine {
  if (!engine) {
    engine =
      engineKind === 'whisper'
        ? // Lazy require keeps the native module out of the web bundle.
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          (require('./whisperEngine') as typeof import('./whisperEngine')).createWhisperEngine()
        : createMockEngine()
  }
  return engine
}

export type { ASREngine, ASRResult, Word } from './types'
