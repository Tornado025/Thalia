import { Tabs } from 'expo-router'
import { Cpu, History, Mic } from 'lucide-react-native'

import { color, font } from '@/ui/theme'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.ink,
        tabBarInactiveTintColor: color.muted,
        tabBarStyle: { backgroundColor: color.surface, borderTopColor: color.border, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: font.semibold, fontSize: 12 },
        sceneStyle: { backgroundColor: color.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Record', tabBarIcon: ({ color: c }) => <Mic color={c} size={22} /> }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color: c }) => <History color={c} size={22} /> }} />
      <Tabs.Screen name="models" options={{ title: 'Models', tabBarIcon: ({ color: c }) => <Cpu color={c} size={22} /> }} />
    </Tabs>
  )
}
