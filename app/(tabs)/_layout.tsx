import { Tabs } from 'expo-router'
import { Cpu, History, Mic } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { color, font } from '@/ui/theme'

export default function TabLayout() {
  const insets = useSafeAreaInsets()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.ink,
        tabBarInactiveTintColor: color.muted,
        // Keep labels clear of the Android gesture bar / iOS home indicator.
        tabBarStyle: {
          backgroundColor: color.surface, borderTopColor: color.border,
          height: 64 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 6,
        },
        tabBarLabelStyle: { fontFamily: font.semibold, fontSize: 12 },
        sceneStyle: { backgroundColor: color.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Record', tabBarIcon: ({ color: c }) => <Mic color={c} size={22} /> }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color: c }) => <History color={c} size={22} /> }} />
      <Tabs.Screen name="models" options={{ title: 'Models', tabBarIcon: ({ color: c }) => <Cpu color={c} size={22} /> }} />
    </Tabs>
  )
}
