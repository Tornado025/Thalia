import Constants from 'expo-constants'
import { router, useFocusEffect } from 'expo-router'
import { ArrowRight, CheckCircle2, Download, Trash2, X } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { engineKind } from '@/asr'
import { countCorrectedClips } from '@/db/corrections'
import { formatPct, formatSize, hasDownloadUrl, models, type ModelInfo } from '@/models/manifest'
import { useModels } from '@/models/store'
import { useSettings } from '@/state/useSettings'
import { Button, Card, TitleBlock, Txt } from '@/ui/components'
import { color, radius, space, touch } from '@/ui/theme'

function ModelStatus({ m }: { m: ModelInfo }) {
  const { installed, progress, error, download, cancel, remove } = useModels()
  const p = progress[m.id]

  if (engineKind === 'mock') {
    return <StatusLine icon={Download} text={`Mock engine · needs ${m.minRamGB} GB+ RAM on device`} />
  }
  if (installed[m.id]) {
    return (
      <View style={styles.statusRow}>
        <StatusLine icon={CheckCircle2} text="Installed on this phone" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${m.name}`}
          hitSlop={10}
          onPress={() =>
            Alert.alert(`Delete ${m.name}?`, `Frees ${formatSize(m.sizeBytes)}. You can download it again later.`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => remove(m) },
            ])
          }>
          <Trash2 size={18} color={color.muted} />
        </Pressable>
      </View>
    )
  }
  if (p !== undefined) {
    return (
      <View style={styles.statusRow}>
        <View style={styles.bar}><View style={[styles.barFill, { width: `${Math.round(p * 100)}%` }]} /></View>
        <Txt variant="label" style={{ width: 44, textAlign: 'right' }}>{Math.round(p * 100)}%</Txt>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel download" hitSlop={10} onPress={() => cancel(m)}>
          <X size={18} color={color.muted} />
        </Pressable>
      </View>
    )
  }
  return (
    <View style={{ gap: 8 }}>
      {error[m.id] && <Txt variant="caption" style={{ color: color.recRed }}>{error[m.id]}</Txt>}
      {hasDownloadUrl(m) ? (
        <Button label={`Download (${formatSize(m.sizeBytes)})`} kind="secondary" icon={Download} onPress={() => download(m)} />
      ) : (
        <StatusLine icon={Download} text={`Not on this phone · needs ${m.minRamGB} GB+ RAM`} />
      )}
    </View>
  )
}

function StatusLine({ icon: Icon, text }: { icon: typeof Download; text: string }) {
  return (
    <View style={styles.status}>
      <Icon size={14} color={color.muted} />
      <Txt variant="caption">{text}</Txt>
    </View>
  )
}

export default function ModelsScreen() {
  const { activeModelId, boostWorkshopWords, set } = useSettings()
  const { installed, refresh } = useModels()
  const [queued, setQueued] = useState(0)

  useFocusEffect(useCallback(() => {
    countCorrectedClips().then(setQueued)
    refresh()
  }, [refresh]))

  function select(m: ModelInfo) {
    if (engineKind === 'whisper' && !installed[m.id]) {
      Alert.alert(`${m.name} is not on this phone`, 'Download it first, then select it.')
      return
    }
    set({ activeModelId: m.id })
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page}>
        <TitleBlock title="Models" subtitle="All run offline, 8-bit, on this phone" />

        {models.map((m) => {
          const on = m.id === activeModelId
          return (
            <Pressable
              key={m.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => select(m)}
              style={[styles.model, { borderColor: on ? color.ink : color.border }]}>
              <View style={styles.modelHead}>
                <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>
                <View style={{ flex: 1 }}>
                  <Txt variant="semibold">{m.name}</Txt>
                  <Txt variant="caption">{m.base}</Txt>
                </View>
              </View>
              <View style={styles.stats}>
                <Stat label="Size" value={formatSize(m.sizeBytes)} />
                <Stat label="WER" value={formatPct(m.eval.wer)} />
                <Stat label="CER" value={formatPct(m.eval.cer)} />
                <Stat label="Jargon acc." value={formatPct(m.eval.jta)} />
              </View>
              <ModelStatus m={m} />
            </Pressable>
          )
        })}

        <Txt variant="caption">WER / CER / jargon accuracy: research eval of the full-precision models (test split, beam 5).</Txt>

        <Button label="Compare all 3 on one clip" kind="secondary" iconRight={ArrowRight} onPress={() => router.push('/compare')} />

        <Card style={styles.queue}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="semibold">Training queue</Txt>
            <Txt variant="caption">{queued} corrected clip{queued === 1 ? '' : 's'} ready for the next fine-tune</Txt>
          </View>
          {/* Export (manifest.jsonl + WAV zip) lands in M4. */}
          <Button label="Export" kind="dark" disabled />
        </Card>

        <Card style={styles.queue}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="semibold">Boost workshop words</Txt>
            <Txt variant="caption">Prompts the model with the part-name glossary</Txt>
          </View>
          <Switch
            value={boostWorkshopWords}
            onValueChange={(v) => set({ boostWorkshopWords: v })}
            trackColor={{ true: color.accent, false: color.borderStrong }}
            thumbColor={color.surface}
            accessibilityLabel="Boost workshop words"
          />
        </Card>

        <Txt variant="caption" style={{ textAlign: 'center' }}>
          Thalia v{Constants.expoConfig?.version ?? '1.0.0'} · engine: {engineKind}
        </Txt>
      </ScrollView>
    </SafeAreaView>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Txt variant="overline">{label}</Txt>
      <Txt variant="semibold" style={{ fontSize: 14 }}>{value}</Txt>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { padding: space.screen, gap: 14 },
  model: { backgroundColor: color.surface, borderRadius: radius.card, borderWidth: 2, padding: 14, gap: 12 },
  modelHead: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: touch.min },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: color.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: color.ink },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.ink },
  stats: { flexDirection: 'row', gap: 8 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 28 },
  bar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: color.segmentBg, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: color.accent },
  queue: { flexDirection: 'row', alignItems: 'center', gap: 12 },
})
