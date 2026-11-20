import { Directory, File, Paths } from 'expo-file-system'
import { Platform } from 'react-native'

import { encodeWav } from './wav'

const isWeb = Platform.OS === 'web'

/** Where a recording's WAV lives. expo-file-system has no web backend, so the browser preview gets a placeholder. */
export function recordingWavPath(id: string): string {
  if (isWeb) return `web-preview://recordings/${id}.wav`
  return new File(Paths.document, 'recordings', `${id}.wav`).uri
}

/** Write 16 kHz mono PCM16 as `recordings/<id>.wav`; returns its URI. */
export async function saveRecordingWav(id: string, samples: Int16Array): Promise<string> {
  const uri = recordingWavPath(id)
  if (isWeb) return uri
  new Directory(Paths.document, 'recordings').create({ intermediates: true, idempotent: true })
  const file = new File(uri)
  file.create({ overwrite: true })
  await file.write(encodeWav(samples))
  return uri
}

export function audioFileExists(uri: string): boolean {
  if (isWeb) return false
  try {
    return new File(uri).exists
  } catch {
    return false
  }
}
