import { router } from 'expo-router'
import { Paths } from 'expo-file-system'
import { Check, Pause, Play, Trash2, X } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { engineKind } from '@/asr'
import type { NoiseLevel } from '@/audio/noise'
import { PEAK_COUNT, placeholderPeaks } from '@/audio/waveform'
import { newId } from '@/db/client'
import { deleteRecording, getRecording, insertRecording } from '@/db/recordings'
import { transcribeRecording } from '@/state/transcribe'
import { useSettings } from '@/state/useSettings'
import { Txt, Waveform } from '@/ui/components'
import { formatDuration, VEHICLE_LABEL } from '@/ui/format'
import { color, radius, space, touch } from '@/ui/theme'

const NOISE_COPY: Record<NoiseLevel, string> = { clean: 'Clean', moderate: 'Moderate', heavy: 'Heavy' }
const MAX_MS = 5 * 60_000
const CONFIRM_DISCARD_MS = 5_000

/**
 * M1: fake timer + simulated levels; no audio is captured (mock engine).
 * M2 replaces the simulation with the PCM recorder, noise meter and WAV writer.
 */
export default function RecordingScreen() {
  const vehicle = useSettings((s) => s.vehicle)
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const [levels, setLevels] = useState<number[]>(() => new Array(PEAK_COUNT).fill(0.05))
  const [noise] = useState<NoiseLevel>('clean')
  const [progress, setProgress] = useState<number | null>(null)
  const tick = useRef(0)

  useEffect(() => {
    if (paused || progress !== null) return
    const id = setInterval(() => {
      tick.current++
      setElapsed((e) => Math.min(MAX_MS, e + 100))
      const next = placeholderPeaks(String(tick.current), 1)[0]
      setLevels((l) => [...l.slice(1), next])
    }, 100)
    return () => clearInterval(id)
  }, [paused, progress])

  useEffect(() => {
    if (elapsed >= MAX_MS) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed])

  const discard = () => {
    if (elapsed < CONFIRM_DISCARD_MS) return router.back()
    Alert.alert('Discard this recording?', undefined, [
      { text: 'Keep recording', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ])
  }

  async function finish() {
    if (progress !== null) return
    setProgress(0)
    const id = newId()
    await insertRecording({
      id,
      vehicleType: vehicle,
      wavPath: `${Paths.document.uri}recordings/${id}.wav`,
      durationMs: elapsed,
      noiseLevel: noise,
      waveform: placeholderPeaks(id),
    })
    runTranscription(id)
  }

  async function runTranscription(id: string) {
    try {
      setProgress(0)
      await transcribeRecording(id, setProgress)
      router.replace(`/transcript/${id}`)
    } catch (e) {
      setProgress(null)
      Alert.alert('Transcription failed', e instanceof Error ? e.message : String(e), [
        {
          text: 'Delete recording', style: 'destructive',
          onPress: async () => {
            const rec = await getRecording(id)
            if (rec) await deleteRecording(rec)
            router.back()
          },
        },
        { text: 'Retry', onPress: () => runTranscription(id) },
      ])
    }
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={discard} style={styles.iconBtn}>
          <X size={22} color={color.dText} />
        </Pressable>
        <View style={styles.status}>
          <View style={[styles.dot, paused && { backgroundColor: color.dMuted }]} />
          <Txt variant="semibold" style={{ color: color.dText }}>
            {paused ? 'Paused' : 'Listening'} · {formatDuration(elapsed)}
          </Txt>
        </View>
        <View style={styles.pill}>
          <Txt variant="label" style={{ color: color.dText }}>{VEHICLE_LABEL[vehicle]}</Txt>
        </View>
      </View>

      {engineKind === 'mock' && (
        <Txt variant="caption" style={{ color: color.dMuted, textAlign: 'center' }}>
          Mock engine — no audio is captured yet
        </Txt>
      )}

      <View style={styles.noiseCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt variant="overline" style={{ color: color.dMuted }}>Background noise</Txt>
          <Txt variant="semibold" style={{ color: color.dText }}>{NOISE_COPY[noise]}</Txt>
        </View>
        <View style={styles.meter}>
          {(['clean', 'moderate', 'heavy'] as const).map((l, i) => (
            <View
              key={l}
              style={[styles.meterSeg, i <= ['clean', 'moderate', 'heavy'].indexOf(noise) && { backgroundColor: i === 2 ? color.recRed : color.accent }]}
            />
          ))}
        </View>
        {noise === 'heavy' && (
          <Txt variant="caption" style={{ color: color.dMuted }}>Too loud — hold the phone closer to your mouth.</Txt>
        )}
      </View>

      <View style={styles.wave}>
        <Waveform peaks={levels} height={96} barColor={color.accent} />
      </View>

      <View style={styles.transcriptArea}>
        <Txt variant="body" style={{ color: color.dMuted, textAlign: 'center' }}>Transcribing after you stop</Txt>
      </View>

      <View style={styles.bottom}>
        <Pressable accessibilityRole="button" onPress={discard} style={styles.sideBtn}>
          <Trash2 size={22} color={color.dText} />
          <Txt variant="label" style={{ color: color.dText }}>Discard</Txt>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Done" onPress={finish} style={styles.done}>
          <Check size={44} color={color.ink} strokeWidth={2.6} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setPaused((p) => !p)} style={styles.sideBtn}>
          {paused ? <Play size={22} color={color.dText} /> : <Pause size={22} color={color.dText} />}
          <Txt variant="label" style={{ color: color.dText }}>{paused ? 'Resume' : 'Pause'}</Txt>
        </Pressable>
      </View>

      {progress !== null && (
        <View style={styles.overlay} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color={color.accent} />
          <Txt variant="subTitle" style={{ color: color.dText }}>Transcribing… {progress}%</Txt>
          <Txt variant="caption" style={{ color: color.dMuted }}>Running on this phone, offline</Txt>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.dBg, paddingHorizontal: space.screen, gap: 16 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  iconBtn: { width: touch.min, height: touch.min, borderRadius: radius.input, backgroundColor: color.dRaised, alignItems: 'center', justifyContent: 'center' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.recRed },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: color.dRaised },
  noiseCard: { backgroundColor: color.dSurface, borderColor: color.dBorder, borderWidth: 1, borderRadius: radius.card, padding: 14, gap: 10 },
  meter: { flexDirection: 'row', gap: 6 },
  meterSeg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: color.dRaised },
  wave: { paddingVertical: 12 },
  transcriptArea: { flex: 1, justifyContent: 'center' },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 },
  sideBtn: { width: 88, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: radius.card, backgroundColor: color.dSurface },
  done: { width: 96, height: 96, borderRadius: 48, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center' },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: color.scrim, alignItems: 'center', justifyContent: 'center', gap: 12 },
})
