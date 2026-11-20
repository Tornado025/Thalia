import { Pressable, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native'

import { color, radius, space } from '../theme'

export function Card({ style, onPress, dark, ...rest }: ViewProps & { onPress?: () => void; dark?: boolean }) {
  const s: ViewStyle[] = [styles.card, dark ? styles.dark : styles.light, style as ViewStyle]
  if (onPress) {
    return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [...s, pressed && { opacity: 0.85 }]} {...rest} />
  }
  return <View style={s} {...rest} />
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, paddingVertical: space.cardV, paddingHorizontal: space.cardH, borderWidth: 1 },
  light: { backgroundColor: color.surface, borderColor: color.border },
  dark: { backgroundColor: color.ink, borderColor: color.ink },
})
