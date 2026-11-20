import manifestJson from '../../assets/models.json'

export type ModelEval = { wer: number | null; cer: number | null; jta: number | null }
export type ModelInfo = {
  id: string
  name: string
  base: string
  file: string
  url: string
  sha256: string
  sizeBytes: number
  minRamGB: number
  default: boolean
  eval: ModelEval
}

export const models: ModelInfo[] = manifestJson as ModelInfo[]
export const defaultModel: ModelInfo = models.find((m) => m.default) ?? models[0]
export const modelById = (id: string | null | undefined) => models.find((m) => m.id === id)

/** True once the team has filled the URL in assets/models.json. */
export const hasDownloadUrl = (m: ModelInfo) => /^https?:\/\//.test(m.url)

export function formatSize(bytes: number): string {
  if (!bytes) return '–'
  const mb = bytes / 1024 / 1024
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`
}

export const formatPct = (x: number | null) => (x === null ? '–' : `${x.toFixed(1)}%`)
