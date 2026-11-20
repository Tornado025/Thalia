import { StyleSheet, View } from 'react-native'

import { color } from '../theme'

/** Bar waveform; bars before `progress` (0..1) are drawn in `playedColor`. */
export function Waveform({ peaks, progress = 0, height = 32, barColor = color.borderStrong, playedColor = color.ink }: {
  peaks: number[]; progress?: number; height?: number; barColor?: string; playedColor?: string
}) {
  return (
    <View style={[styles.row, { height }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {peaks.map((p, i) => (
        <View
          key={i}
          style={[styles.bar, {
            height: Math.max(3, p * height),
            backgroundColor: i / peaks.length < progress ? playedColor : barColor,
          }]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  bar: { flex: 1, borderRadius: 2 },
})
