import Constants from 'expo-constants'
import { router, useFocusEffect } from 'expo-router'
import { ArrowRight, Download } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { engineKind } from '@/asr'
import { countCorrectedClips } from '@/db/corrections'
import { formatPct, formatSize, hasDownloadUrl, models, type ModelInfo } from '@/models/manifest'
import { useSettings } from '@/state/useSettings'
import { Button, Card, TitleBlock, Txt } from '@/ui/components'
import { color, radius, space, touch } from '@/ui/theme'

function statusLine(m: ModelInfo): string {
  if (engineKind === 'mock') return `Mock engine · needs ${m.minRamGB} GB+ RAM on device`
  // Download + sha256 check arrive in M3 (src/models/downloader.ts).
  return hasDownloadUrl(m) ? `Not downloaded · needs ${m.minRamGB} GB+ RAM` : 'Download link not published yet'
}

export default function ModelsScreen() {
  const { activeModelId, boostWorkshopWords, set } = useSettings()
  const [queued, setQueued] = useState(0)

  useFocusEffect(useCallback(() => { countCorrectedClips().then(setQueued) }, []))

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
              onPress={() => set({ activeModelId: m.id })}
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
              <View style={styles.status}>
                <Download size={14} color={color.muted} />
                <Txt variant="caption">{statusLine(m)}</Txt>
              </View>
            </Pressable>
          )
        })}

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
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  queue: { flexDirection: 'row', alignItems: 'center', gap: 12 },
})
