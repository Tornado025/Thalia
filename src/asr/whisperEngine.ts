// The package's exports map has no root entry, so import its index explicitly.
import { initWhisper, type WhisperContext } from 'whisper.rn/index'

import { segmentsToWords } from './segments'
import type { ASREngine, ASRResult, TranscribeOptions } from './types'

const MAX_THREADS = 4

/** whisper.rn expects plain filesystem paths. */
const toPath = (uri: string) => decodeURI(uri.replace(/^file:\/\//, ''))

/**
 * whisper.cpp via whisper.rn. Keeps one context; loading a different model
 * releases the current one first (only one model in memory at a time).
 */
export function createWhisperEngine(): ASREngine {
  let ctx: WhisperContext | null = null
  let loadedPath: string | null = null

  return {
    async load(modelPath: string) {
      if (ctx && loadedPath === modelPath) return
      if (ctx) {
        await ctx.release()
        ctx = null
        loadedPath = null
      }
      ctx = await initWhisper({ filePath: toPath(modelPath) })
      loadedPath = modelPath
    },
    async transcribe(wavPath: string, opts: TranscribeOptions): Promise<ASRResult> {
      if (!ctx) throw new Error('No model loaded')
      const t0 = Date.now()
      const { promise } = ctx.transcribe(toPath(wavPath), {
        language: opts.language,
        prompt: opts.prompt,
        maxThreads: MAX_THREADS,
        tokenTimestamps: true,
        onProgress: opts.onProgress,
      })
      const r = await promise
      return { text: r.result.trim(), words: segmentsToWords(r.segments), elapsedMs: Date.now() - t0 }
    },
    async release() {
      await ctx?.release()
      ctx = null
      loadedPath = null
    },
    isLoaded: () => ctx !== null,
  }
}
