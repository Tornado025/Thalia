import { Paths } from 'expo-file-system'
import { Platform } from 'react-native'

/** Where a recording's WAV lives. expo-file-system has no web backend, so the browser preview gets a placeholder. */
export function recordingWavPath(id: string): string {
  if (Platform.OS === 'web') return `web-preview://recordings/${id}.wav`
  return `${Paths.document.uri}recordings/${id}.wav`
}
