import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { NotoSansKannada_400Regular, NotoSansKannada_600SemiBold } from '@expo-google-fonts/noto-sans-kannada'
import { SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { getDb } from '@/db/client'
import { color } from '@/ui/theme'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
    SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
    NotoSansKannada_400Regular, NotoSansKannada_600SemiBold,
  })
  const [dbReady, setDbReady] = useState(false)

  useEffect(() => {
    getDb().then(() => setDbReady(true))
  }, [])

  const ready = (fontsLoaded || !!fontError) && dbReady
  useEffect(() => {
    if (ready) SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="recording" options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: color.dBg } }} />
        <Stack.Screen name="transcript/[id]" />
        <Stack.Screen name="job/[id]" />
        <Stack.Screen name="compare" />
      </Stack>
    </GestureHandlerRootView>
  )
}
