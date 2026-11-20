import { router } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'

import type { Recording } from '../../db/recordings'
import { uniqueTerms } from '../../nlp'
import { formatClock, formatDuration, VEHICLE_LABEL } from '../format'
import { color, touch } from '../theme'
import { Card } from './Card'
import { ChipRow, StatusPill } from './Chip'
import { Txt } from './Txt'
import { Waveform } from './Waveform'

export function recordingLabel(r: Recording) {
  return `${r.vehicleName || VEHICLE_LABEL[r.vehicleType]} · ${r.title ?? 'Untitled job'}`
}

/** History / Home row. Tap opens the transcript; "Job card ›" opens the card. */
export function RecordingRow({ rec, onLongPress, compact }: { rec: Recording; onLongPress?: () => void; compact?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={recordingLabel(rec)}
      onPress={() => router.push(`/transcript/${rec.id}`)}
      onLongPress={onLongPress}>
      <Card style={styles.card}>
        <View style={styles.top}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="semibold" numberOfLines={1}>{recordingLabel(rec)}</Txt>
            <Txt variant="caption">{formatClock(rec.createdAt)} · {formatDuration(rec.durationMs)}</Txt>
          </View>
          <StatusPill status={rec.status} />
        </View>
        {!compact && rec.waveform.length > 0 && <Waveform peaks={rec.waveform} height={28} />}
        {!compact && rec.text ? (
          <Txt variant="body" numberOfLines={2} style={{ color: color.textSecondary, fontSize: 14 }}>{rec.text}</Txt>
        ) : null}
        <View style={styles.bottom}>
          <View style={{ flex: 1 }}>
            <ChipRow labels={uniqueTerms(rec.terms).map((t) => t.term).slice(0, compact ? 3 : 5)} />
          </View>
          {rec.jobCard && (
            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={() => router.push(`/job/${rec.id}`)}
              style={styles.link}>
              <Txt variant="semibold" style={{ fontSize: 14 }}>Job card</Txt>
              <ChevronRight size={16} color={color.ink} />
            </Pressable>
          )}
        </View>
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  link: { flexDirection: 'row', alignItems: 'center', minHeight: touch.min, paddingLeft: 8 },
})
