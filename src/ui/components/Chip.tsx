import { StyleSheet, View } from 'react-native'

import { color, radius } from '../theme'
import { Txt } from './Txt'

type Tone = 'term' | 'uncertain' | 'success' | 'neutral' | 'dark'

const tones: Record<Tone, { bg: string; fg: string }> = {
  term: { bg: color.termBg, fg: color.termText },
  uncertain: { bg: color.uncertainBg, fg: color.uncertainText },
  success: { bg: color.successBg, fg: color.successText },
  neutral: { bg: color.segmentBg, fg: color.textSecondary },
  dark: { bg: color.dTermBg, fg: color.dTermText },
}

export function Chip({ label, tone = 'term', pill }: { label: string; tone?: Tone; pill?: boolean }) {
  const t = tones[tone]
  return (
    <View style={[styles.chip, { backgroundColor: t.bg, borderRadius: pill ? radius.pill : radius.chip }]}>
      <Txt variant="label" style={{ color: t.fg }}>{label}</Txt>
    </View>
  )
}

export function ChipRow({ labels, tone }: { labels: string[]; tone?: Tone }) {
  return (
    <View style={styles.row}>
      {labels.map((l) => <Chip key={l} label={l} tone={tone} />)}
    </View>
  )
}

/** Draft / Saved status pill. */
export function StatusPill({ status }: { status: 'draft' | 'saved' }) {
  return <Chip pill label={status === 'saved' ? 'Saved' : 'Draft'} tone={status === 'saved' ? 'success' : 'neutral'} />
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
})
