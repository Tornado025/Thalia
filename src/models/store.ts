import { Directory, File, Paths } from 'expo-file-system'
import { Platform } from 'react-native'
import { create } from 'zustand'

import { getEngine } from '../asr'
import { hasDownloadUrl, models, type ModelInfo } from './manifest'

const FREE_SPACE_MARGIN = 1.1

export const modelFile = (m: ModelInfo) => new File(Paths.document, 'models', m.file)

/** On disk with the expected size (covers both downloads and files copied over USB). */
export function isInstalled(m: ModelInfo): boolean {
  if (Platform.OS === 'web') return false
  try {
    const f = modelFile(m)
    return f.exists && (!m.sizeBytes || f.size === m.sizeBytes)
  } catch {
    return false
  }
}

type ModelsState = {
  installed: Record<string, boolean>
  /** 0..1 while downloading / verifying. */
  progress: Record<string, number | undefined>
  error: Record<string, string | undefined>
  refresh: () => void
  download: (m: ModelInfo) => Promise<void>
  cancel: (m: ModelInfo) => void
  remove: (m: ModelInfo) => Promise<void>
}

const tasks = new Map<string, { cancel: () => void }>()

export const useModels = create<ModelsState>()((set, get) => ({
  installed: Object.fromEntries(models.map((m) => [m.id, isInstalled(m)])),
  progress: {},
  error: {},

  refresh() {
    set({ installed: Object.fromEntries(models.map((m) => [m.id, isInstalled(m)])) })
  },

  async download(m) {
    const setErr = (msg?: string) => set({ error: { ...get().error, [m.id]: msg } })
    const setProg = (p?: number) => set({ progress: { ...get().progress, [m.id]: p } })
    setErr(undefined)
    if (!hasDownloadUrl(m)) return setErr('No download link yet')
    if (Paths.availableDiskSpace < m.sizeBytes * FREE_SPACE_MARGIN) return setErr('Not enough free space')

    new Directory(Paths.document, 'models').create({ intermediates: true, idempotent: true })
    const dest = modelFile(m)
    const task = File.createDownloadTask(m.url, dest, {
      onProgress: ({ bytesWritten, totalBytes }) => setProg(totalBytes ? bytesWritten / totalBytes : 0),
    })
    tasks.set(m.id, task)
    setProg(0)
    try {
      const file = await task.downloadAsync()
      if (!file) return // cancelled
      const sha = await file.digest('SHA-256')
      if (sha !== m.sha256.toLowerCase()) {
        file.delete()
        return setErr('Download was corrupted — try again')
      }
      get().refresh()
    } catch (e) {
      if (dest.exists) dest.delete()
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      tasks.delete(m.id)
      setProg(undefined)
    }
  },

  cancel(m) {
    tasks.get(m.id)?.cancel()
    tasks.delete(m.id)
    set({ progress: { ...get().progress, [m.id]: undefined } })
  },

  async remove(m) {
    await getEngine().release()
    const f = modelFile(m)
    if (f.exists) f.delete()
    get().refresh()
  },
}))
