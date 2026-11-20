import { router } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { space } from '../theme'
import { IconButton } from './Button'
import { Txt } from './Txt'

/** Sub-screen header: back · title · optional right slot. */
export function Header({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.row}>
      <IconButton icon={ChevronLeft} label="Back" kind="ghost" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <Txt variant="subTitle" style={{ flex: 1 }} numberOfLines={1}>{title}</Txt>
      {right}
    </View>
  )
}

/** Tab-screen title block. */
export function TitleBlock({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Txt variant="title">{title}</Txt>
      {subtitle ? <Txt variant="caption" style={{ fontSize: 14 }}>{subtitle}</Txt> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space.screen - 10, paddingVertical: 6 },
})
