import type { LucideIcon } from 'lucide-react-native'
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native'

import { color, radius, touch } from '../theme'
import { Txt } from './Txt'

type Kind = 'primary' | 'dark' | 'secondary' | 'ghost'

const kinds: Record<Kind, { bg: string; fg: string; border?: string }> = {
  primary: { bg: color.accent, fg: color.ink },
  dark: { bg: color.ink, fg: color.bg },
  secondary: { bg: color.surface, fg: color.ink, border: color.borderStrong },
  ghost: { bg: 'transparent', fg: color.ink },
}

type Props = {
  label: string
  onPress?: () => void
  kind?: Kind
  icon?: LucideIcon
  iconRight?: LucideIcon
  big?: boolean
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
}

export function Button({ label, onPress, kind = 'primary', icon: Icon, iconRight: IconRight, big, disabled, loading, style }: Props) {
  const k = kinds[kind]
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { minHeight: big ? touch.cta : touch.min, backgroundColor: k.bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
        k.border ? { borderWidth: 1, borderColor: k.border } : null,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={k.fg} />
      ) : (
        <View style={styles.row}>
          {Icon && <Icon size={18} color={k.fg} strokeWidth={2.2} />}
          <Txt variant="semibold" style={{ color: k.fg, fontSize: big ? 16 : 14 }}>{label}</Txt>
          {IconRight && <IconRight size={18} color={k.fg} strokeWidth={2.2} />}
        </View>
      )}
    </Pressable>
  )
}

/** Square icon-only button, ≥ 44 px. */
export function IconButton({ icon: Icon, onPress, label, kind = 'secondary', size = touch.min }: {
  icon: LucideIcon; onPress?: () => void; label: string; kind?: Kind; size?: number
}) {
  const k = kinds[kind]
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.icon,
        { width: size, height: size, backgroundColor: k.bg, opacity: pressed ? 0.8 : 1 },
        k.border ? { borderWidth: 1, borderColor: k.border } : null,
      ]}>
      <Icon size={20} color={k.fg} strokeWidth={2.2} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.input, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { borderRadius: radius.input, alignItems: 'center', justifyContent: 'center' },
})
