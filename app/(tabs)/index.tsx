import { router, useFocusEffect } from 'expo-router'
import { ChevronRight, Cpu, Download, Mic, Wrench } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { engineKind } from '@/asr'
import { listRecordings, type Recording } from '@/db/recordings'
import { modelById } from '@/models/manifest'
import { useModels } from '@/models/store'
import type { VehicleType } from '@/nlp'
import { useSettings } from '@/state/useSettings'
import { Button, Card, RecordingRow, Segmented, Txt } from '@/ui/components'
import { color, radius, space } from '@/ui/theme'

const VEHICLES: { value: VehicleType; label: string }[] = [
  { value: 'bike', label: 'Bike' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'car', label: 'Car' },
]

export default function HomeScreen() {
  const { vehicle, activeModelId, set } = useSettings()
  const model = modelById(activeModelId)
  const { installed, refresh } = useModels()
  const ready = engineKind === 'mock' || (model ? installed[model.id] : false)
  const [recent, setRecent] = useState<Recording[]>([])

  useFocusEffect(
    useCallback(() => {
      listRecordings('', 2).then(setRecent)
      refresh()
    }, [refresh]),
  )

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.logo}><Wrench size={22} color={color.ink} strokeWidth={2} /></View>
            <View>
              <Txt variant="subTitle" style={{ lineHeight: 24 }}>Thalia</Txt>
              <Txt variant="caption">ಥಾಲಿಯಾ</Txt>
            </View>
          </View>
          <View style={styles.offline}>
            <Cpu size={14} color={color.bg} />
            <Txt variant="label" style={{ color: color.bg, fontSize: 12 }}>Offline · on-device</Txt>
          </View>
        </View>

        <Card onPress={() => router.navigate('/models')} style={styles.modelCard}>
          <View style={{ gap: 2, flex: 1 }}>
            <Txt variant="overline">Active model</Txt>
            <Txt variant="semibold">
              {model?.name ?? 'None'} · 8-bit{engineKind === 'mock' ? ' · mock engine' : ''}
            </Txt>
          </View>
          <View style={styles.change}>
            <Txt variant="label" style={{ color: color.ink }}>Change</Txt>
            <ChevronRight size={16} color={color.ink} />
          </View>
        </Card>

        <View style={{ gap: 8 }}>
          <Txt variant="overline">Vehicle on the bay</Txt>
          <Segmented options={VEHICLES} value={vehicle} onChange={(v) => set({ vehicle: v })} />
        </View>

        {!ready ? (
          <Card style={styles.noModel}>
            <Download size={32} color={color.ink} />
            <Txt variant="subTitle" style={{ textAlign: 'center' }}>Download a model to start</Txt>
            <Txt variant="caption" style={{ textAlign: 'center', fontSize: 14 }}>
              Speech recognition runs on this phone. {model?.name ?? 'The model'} isn’t here yet.
            </Txt>
            <Button big label="Go to Models" onPress={() => router.navigate('/models')} style={{ alignSelf: 'stretch' }} />
          </Card>
        ) : (
        <View style={styles.micWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start recording"
            onPress={() => router.push('/recording')}
            style={({ pressed }) => [styles.ring2, pressed && { transform: [{ scale: 0.97 }] }]}>
            <View style={styles.ring1}>
              <View style={styles.mic}><Mic size={56} color={color.ink} strokeWidth={2} /></View>
            </View>
          </Pressable>
          <Txt variant="semibold" style={{ fontSize: 17, marginTop: 6 }}>Tap and describe the job</Txt>
          <Txt variant="caption" style={{ fontSize: 13, textAlign: 'center' }}>ಕನ್ನಡದಲ್ಲಿ ಮಾತಾಡಿ — English part names are fine</Txt>
        </View>
        )}

        {recent.length > 0 && (
          <View style={{ gap: 10 }}>
            <View style={styles.sectionHead}>
              <Txt variant="overline">Recent recordings</Txt>
              <Pressable accessibilityRole="link" hitSlop={12} onPress={() => router.navigate('/history')}>
                <Txt variant="label" style={{ color: color.ink }}>See all</Txt>
              </Pressable>
            </View>
            {recent.map((r) => <RecordingRow key={r.id} rec={r} compact />)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const MIC = 148

const styles = StyleSheet.create({
  page: { padding: space.screen, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 12, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center' },
  offline: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: color.ink },
  modelCard: { flexDirection: 'row', alignItems: 'center' },
  change: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  micWrap: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  noModel: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  ring2: { padding: 14, borderRadius: radius.pill, backgroundColor: color.ringOuter },
  ring1: { padding: 12, borderRadius: radius.pill, backgroundColor: color.ringInner },
  mic: { width: MIC, height: MIC, borderRadius: MIC / 2, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
})
