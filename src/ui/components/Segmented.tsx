import { Pressable, StyleSheet, View } from 'react-native'

import { color, touch } from '../theme'
import { Txt } from './Txt'

export type SegOption<T extends string> = { value: T; label: string; disabled?: boolean }

export function Segmented<T extends string>({ options, value, onChange }: {
  options: SegOption<T>[]; value: T; onChange: (v: T) => void
}) {
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on, disabled: !!o.disabled }}
            disabled={o.disabled}
            onPress={() => onChange(o.value)}
            style={[styles.seg, on && styles.on, o.disabled && { opacity: 0.5 }]}>
            <Txt variant="semibold" style={{ fontSize: 14, color: on ? color.ink : color.muted }}>{o.label}</Txt>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: color.segmentBg, borderRadius: 12, padding: 4, gap: 4 },
  seg: { flex: 1, minHeight: touch.min, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  on: {
    backgroundColor: color.surface,
    shadowColor: color.ink, shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
})
