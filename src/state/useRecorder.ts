import { requestRecordingPermissionsAsync, setAudioModeAsync, useAudioStream } from 'expo-audio'
import { useEffect, useRef, useState } from 'react'

import { PcmCollector, type CapturedAudio } from '../audio/collector'
import type { NoiseLevel } from '../audio/noise'
import { SAMPLE_RATE } from '../audio/wav'
import { PEAK_COUNT } from '../audio/waveform'

export type RecorderState = 'idle' | 'denied' | 'recording' | 'paused' | 'stopped' | 'error'

const UI_TICK_MS = 100

/**
 * Microphone capture as 16 kHz mono PCM16 via expo-audio's AudioStream.
 * Exposes live elapsed time, noise bucket and waveform levels for the Recording screen.
 */
export function useRecorder() {
  const collector = useRef(new PcmCollector())
  const [state, setState] = useState<RecorderState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [noise, setNoise] = useState<NoiseLevel>('clean')
  const [levels, setLevels] = useState<number[]>(() => new Array(PEAK_COUNT).fill(0.05))

  const { stream } = useAudioStream({
    sampleRate: SAMPLE_RATE,
    channels: 1,
    encoding: 'int16',
    onBuffer: (b) => collector.current.push(new Int16Array(b.data), b.sampleRate),
  })

  useEffect(() => {
    if (state !== 'recording') return
    const id = setInterval(() => {
      const c = collector.current
      setElapsedMs(c.elapsedMs)
      setNoise(c.noise)
      setLevels(c.liveLevels())
    }, UI_TICK_MS)
    return () => clearInterval(id)
  }, [state])

  async function start() {
    const perm = await requestRecordingPermissionsAsync()
    if (!perm.granted) {
      setState('denied')
      return
    }
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
      collector.current = new PcmCollector()
      await stream.start()
      setState('recording')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setState('error')
    }
  }

  function setPaused(paused: boolean) {
    collector.current.paused = paused
    setState(paused ? 'paused' : 'recording')
  }

  /** Stop capturing and return the 16 kHz audio. */
  function stop(): CapturedAudio {
    stream.stop()
    setState('stopped')
    return collector.current.finish()
  }

  /** Stop and drop everything captured. */
  function discard() {
    if (state === 'recording' || state === 'paused') stream.stop()
    collector.current = new PcmCollector()
    setState('stopped')
  }

  return { state, error, elapsedMs, noise, levels, start, setPaused, stop, discard }
}
