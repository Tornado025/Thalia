import { router } from 'expo-router'
import { Check, MicOff, Pause, Play, Trash2, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { engineKind } from '@/asr'
import type { NoiseLevel } from '@/audio/noise'
import { saveRecordingWav } from '@/audio/paths'
import { newId } from '@/db/client'
import { deleteRecording, getRecording, insertRecording } from '@/db/recordings'
import { transcribeRecording } from '@/state/transcribe'
import { useRecorder } from '@/state/useRecorder'
import { useSettings } from '@/state/useSettings'
import { Button, Txt, Waveform } from '@/ui/components'
import { formatDuration, VEHICLE_LABEL } from '@/ui/format'
import { color, radius, space, touch } from '@/ui/theme'

const NOISE_COPY: Record<NoiseLevel, string> = { clean: 'Clean', moderate: 'Moderate', heavy: 'Heavy' }
const NOISE_ORDER: NoiseLevel[] = ['clean', 'moderate', 'heavy']
const MAX_MS = 5 * 60_000
const CONFIRM_DISCARD_MS = 5_000

export default function RecordingScreen() {
  const vehicle = useSettings((s) => s.vehicle)
  const rec = useRecorder()
  const [progress, setProgress] = useState<number | null>(null)
  const paused = rec.state === 'paused'

  useEffect(() => {
    rec.start()
    // Start once on open; the stream is released when the screen unmounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (rec.elapsedMs >= MAX_MS && rec.state === 'recording') finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.elapsedMs])

  const close = () => {
    rec.discard()
    router.back()
  }

  const discard = () => {
    if (rec.elapsedMs < CONFIRM_DISCARD_MS) return close()
    Alert.alert('Discard this recording?', undefined, [
      { text: 'Keep recording', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: close },
    ])
  }

  async function finish() {
    if (progress !== null || (rec.state !== 'recording' && rec.state !== 'paused')) return
    setProgress(0)
    const audio = rec.stop()
    const id = newId()
    try {
      const wavPath = await saveRecordingWav(id, audio.samples)
      await insertRecording({
        id,
        vehicleType: vehicle,
        wavPath,
        durationMs: audio.durationMs,
        noiseLevel: audio.noiseLevel,
        waveform: audio.waveform,
      })
    } catch (e) {
      setProgress(null)
      Alert.alert('Could not save the recording', e instanceof Error ? e.message : String(e), [{ text: 'OK', onPress: () => router.back() }])
      return
    }
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
            const r = await getRecording(id)
            if (r) await deleteRecording(r)
            router.back()
          },
        },
        { text: 'Retry', onPress: () => runTranscription(id) },
      ])
    }
  }

  if (rec.state === 'denied' || rec.state === 'error') {
    return (
      <SafeAreaView style={[styles.page, styles.center]}>
        <MicOff size={48} color={color.dText} />
        <Txt variant="subTitle" style={{ color: color.dText, textAlign: 'center' }}>
          {rec.state === 'denied' ? 'Microphone is off for Thalia' : 'Could not start the microphone'}
        </Txt>
        <Txt variant="body" style={{ color: color.dMuted, textAlign: 'center' }}>
          {rec.state === 'denied'
            ? 'Allow microphone access in Settings to record jobs. Audio stays on this phone.'
            : rec.error}
        </Txt>
        {rec.state === 'denied' && <Button big label="Open Settings" onPress={() => Linking.openSettings()} style={{ alignSelf: 'stretch' }} />}
        <Button big label="Close" kind="secondary" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
      </SafeAreaView>
    )
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
            {rec.state === 'idle' ? 'Starting…' : paused ? 'Paused' : 'Listening'} · {formatDuration(rec.elapsedMs)}
          </Txt>
        </View>
        <View style={styles.pill}>
          <Txt variant="label" style={{ color: color.dText }}>{VEHICLE_LABEL[vehicle]}</Txt>
        </View>
      </View>

      <View style={styles.noiseCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt variant="overline" style={{ color: color.dMuted }}>Background noise</Txt>
          <Txt variant="semibold" style={{ color: color.dText }}>{NOISE_COPY[rec.noise]}</Txt>
        </View>
        <View style={styles.meter}>
          {NOISE_ORDER.map((l, i) => (
            <View
              key={l}
              style={[styles.meterSeg, i <= NOISE_ORDER.indexOf(rec.noise) && { backgroundColor: i === 2 ? color.recRed : color.accent }]}
            />
          ))}
        </View>
        {rec.noise === 'heavy' && (
          <Txt variant="caption" style={{ color: color.dMuted }}>Too loud — hold the phone closer to your mouth.</Txt>
        )}
      </View>

      <View style={styles.wave}>
        <Waveform peaks={rec.levels} height={96} barColor={paused ? color.dBorder : color.accent} />
      </View>

      <View style={styles.transcriptArea}>
        <Txt variant="body" style={{ color: color.dMuted, textAlign: 'center' }}>Transcribing after you stop</Txt>
        {engineKind === 'mock' && (
          <Txt variant="caption" style={{ color: color.dMuted, textAlign: 'center', marginTop: 6 }}>
            Mock engine — audio is saved, the transcript is a sample sentence
          </Txt>
        )}
      </View>

      <View style={styles.bottom}>
        <Pressable accessibilityRole="button" onPress={discard} style={styles.sideBtn}>
          <Trash2 size={22} color={color.dText} />
          <Txt variant="label" style={{ color: color.dText }}>Discard</Txt>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Done" onPress={finish} style={styles.done}>
          <Check size={44} color={color.ink} strokeWidth={2.6} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => rec.setPaused(!paused)} style={styles.sideBtn}>
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
  center: { alignItems: 'center', justifyContent: 'center', gap: 14 },
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
