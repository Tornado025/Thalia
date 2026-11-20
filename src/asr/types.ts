export type Word = { text: string; start?: number; end?: number; p?: number }
export type ASRResult = { text: string; words: Word[]; elapsedMs: number }

export type TranscribeOptions = {
  language: 'kn'
  prompt?: string
  onProgress?: (pct: number) => void
}

export interface ASREngine {
  load(modelPath: string): Promise<void>
  transcribe(wavPath: string, opts: TranscribeOptions): Promise<ASRResult>
  release(): Promise<void>
  isLoaded(): boolean
}
