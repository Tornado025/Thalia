import { router, useFocusEffect } from 'expo-router'
import { Mic, Search } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Alert, SectionList, StyleSheet, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { deleteRecording, listRecordings, type Recording } from '@/db/recordings'
import { Button, RecordingRow, TitleBlock, Txt, recordingLabel } from '@/ui/components'
import { dayLabel } from '@/ui/format'
import { color, font, radius, size, space, touch } from '@/ui/theme'

function groupByDay(recs: Recording[]) {
  const groups: { title: string; data: Recording[] }[] = []
  for (const r of recs) {
    const title = dayLabel(r.createdAt)
    const last = groups[groups.length - 1]
    if (last?.title === title) last.data.push(r)
    else groups.push({ title, data: [r] })
  }
  return groups
}

export default function HistoryScreen() {
  const [query, setQuery] = useState('')
  const [recs, setRecs] = useState<Recording[] | null>(null)

  const load = useCallback(() => {
    listRecordings(query).then(setRecs)
  }, [query])
  useFocusEffect(load)

  function confirmDelete(r: Recording) {
    Alert.alert(recordingLabel(r), 'Delete this recording and its audio?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRecording(r).then(load) },
    ])
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <SectionList
        sections={recs ? groupByDay(recs) : []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 4 }}>
            <TitleBlock title="History" subtitle="Every recording, with its audio and job card" />
            <View style={styles.search}>
              <Search size={18} color={color.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search recordings"
                placeholderTextColor={color.muted}
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
                accessibilityLabel="Search recordings"
              />
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => <Txt variant="overline" style={{ marginTop: 10 }}>{section.title}</Txt>}
        renderItem={({ item }) => <RecordingRow rec={item} onLongPress={() => confirmDelete(item)} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          recs === null ? undefined : query ? (
            <Txt variant="caption" style={{ textAlign: 'center', marginTop: 24 }}>No recordings match “{query}”</Txt>
          ) : (
            <View style={styles.empty}>
              <Txt variant="subTitle">No recordings yet</Txt>
              <Txt variant="caption" style={{ textAlign: 'center' }}>Record a job and it shows up here with its transcript and job card.</Txt>
              <Button label="Record a job" icon={Mic} onPress={() => router.navigate('/')} />
            </View>
          )
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  page: { padding: space.screen, gap: 10 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: touch.min, paddingHorizontal: 12,
    borderRadius: radius.input, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border,
  },
  searchInput: { flex: 1, fontFamily: font.body, fontSize: size.body, color: color.ink, paddingVertical: 10 },
  empty: { alignItems: 'center', gap: 10, marginTop: 48 },
})
