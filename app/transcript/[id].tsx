import { router, useLocalSearchParams } from 'expo-router'
import { ArrowRight, Check, CheckCircle2, Pencil, Square, SquareCheck } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { addCorrection } from '@/db/corrections'
import { getRecording, updateRecording, type Recording } from '@/db/recordings'
import {
  buildJobCard, findTerms, findUncertain, joinWords, lexicon, toAllKannada, uniqueTerms, type NWord,
} from '@/nlp'
import { useSettings } from '@/state/useSettings'
import { AudioRow, Button, Card, ChipRow, Header, IconButton, Segmented, TermText, Txt } from '@/ui/components'
import { color, font, radius, size, space, touch } from '@/ui/theme'

type View_ = 'mixed' | 'kannada' | 'english'

export default function TranscriptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { saveCorrections, set } = useSettings()
  const [rec, setRec] = useState<Recording | null>(null)
  const [words, setWords] = useState<NWord[]>([])
  const [view, setView] = useState<View_>('mixed')
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [justFixed, setJustFixed] = useState(false)

  useEffect(() => {
    getRecording(id).then((r) => {
      setRec(r)
      setWords(r?.words ?? [])
    })
  }, [id])

  const terms = useMemo(() => findTerms(words, lexicon), [words])
  // Edited words get p = 1, so a corrected word is never flagged again.
  const current = useMemo(() => findUncertain(words, lexicon)[0], [words])

  if (!rec) {
    return <SafeAreaView style={styles.center}><ActivityIndicator color={color.ink} /></SafeAreaView>
  }

  async function applyWord(index: number, next: string) {
    const w = words[index]
    const text = next.trim().replace(/\s+/g, ' ')
    if (!text) return
    const replacement: NWord[] = text.split(' ').map((t) => ({ ...w, text: t, p: 1, fixedFrom: undefined }))
    const updated = [...words.slice(0, index), ...replacement, ...words.slice(index + 1)]
    setWords(updated)
    setEditing(null)

    const before = w.fixedFrom?.includes(' ') ? w.text : (w.fixedFrom ?? w.text)
    if (before !== text) {
      await addCorrection(rec!.id, before, text, saveCorrections)
      setJustFixed(true)
    }
    await updateRecording(rec!.id, { words: updated, text: joinWords(updated), terms: findTerms(updated, lexicon) })
  }

  function startEdit(index: number) {
    setEditing(index)
    setDraft(words[index].text)
  }

  async function createJobCard() {
    const text = joinWords(words)
    // Rebuild the card if the transcript changed, keeping what the user typed in vehicle fields.
    const jobCard =
      text === rec!.text && rec!.jobCard
        ? rec!.jobCard
        : { ...buildJobCard(text, terms, { type: rec!.vehicleType, name: rec!.vehicleName ?? undefined }), ...(rec!.jobCard ? { vehicle: rec!.jobCard.vehicle } : {}) }
    await updateRecording(rec!.id, { words, text, terms, jobCard })
    router.push(`/job/${rec!.id}`)
  }

  const prevWord = (i: number) => (i > 0 ? words[i - 1].text.replace(/[^\p{L}\p{M}\p{N}]+$/u, '') + ' ' : '')
  const editingWord = editing !== null ? words[editing] : null

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <Header title="Review transcript" />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <AudioRow id={rec.id} uri={rec.wavPath} durationMs={rec.durationMs} peaks={rec.waveform} />
        <Segmented
          options={[
            { value: 'mixed', label: 'Mixed' },
            { value: 'kannada', label: 'ಕನ್ನಡ' },
            { value: 'english', label: 'English', disabled: true },
          ]}
          value={view}
          onChange={setView}
        />

        <Card style={{ paddingVertical: 14 }}>
          {view === 'mixed' ? (
            <TermText words={words} terms={terms} uncertain={current ? [current.index] : []} onPressWord={startEdit} />
          ) : (
            <Txt variant="body" style={{ fontSize: size.transcript, lineHeight: size.transcript * 1.65 }}>
              {toAllKannada(words, lexicon).text}
            </Txt>
          )}
          {view === 'mixed' && <Txt variant="caption" style={{ marginTop: 8 }}>Tap any word to correct it</Txt>}
        </Card>

        {editingWord && editing !== null && (
          <Card style={{ gap: 10 }}>
            <Txt variant="overline">Correct this word</Txt>
            {editingWord.fixedFrom && (
              <Txt variant="caption">Auto-fixed — the model heard “{editingWord.fixedFrom}”</Txt>
            )}
            <TextInput
              value={draft}
              onChangeText={setDraft}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => applyWord(editing, draft)}
              style={styles.input}
              accessibilityLabel="Corrected word"
            />
            <View style={styles.row}>
              <Button label="Cancel" kind="secondary" onPress={() => setEditing(null)} style={{ flex: 1 }} />
              <Button label="Save" kind="dark" icon={Check} onPress={() => applyWord(editing, draft)} style={{ flex: 1 }} />
            </View>
          </Card>
        )}

        {current && editing === null && (
          <View style={styles.unsure}>
            <Txt variant="semibold" style={{ color: color.uncertainText }}>Not sure about one word — which did you say?</Txt>
            <View style={styles.row}>
              {current.candidates.map((c) => (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  onPress={() => applyWord(current.index, c)}
                  style={({ pressed }) => [styles.candidate, pressed && { opacity: 0.8 }]}>
                  <Txt variant="semibold">{prevWord(current.index) + c}</Txt>
                </Pressable>
              ))}
              <IconButton icon={Pencil} label="Type it yourself" onPress={() => startEdit(current.index)} />
            </View>
          </View>
        )}

        {justFixed && !current && (
          <View style={styles.fixed}>
            <CheckCircle2 size={18} color={color.successText} />
            <Txt variant="semibold" style={{ color: color.successText, flex: 1 }}>
              {saveCorrections ? 'Fixed — added to your training queue' : 'Fixed'}
            </Txt>
          </View>
        )}

        {terms.length > 0 && (
          <View style={{ gap: 8 }}>
            <Txt variant="overline">Parts & faults detected</Txt>
            <ChipRow labels={uniqueTerms(terms).map((t) => t.term)} />
          </View>
        )}

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: saveCorrections }}
          onPress={() => set({ saveCorrections: !saveCorrections })}
          style={styles.check}>
          {saveCorrections ? <SquareCheck size={24} color={color.ink} /> : <Square size={24} color={color.muted} />}
          <Txt variant="body" style={{ flex: 1 }}>Save my corrections to improve the model</Txt>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Button big label="Create job card" iconRight={ArrowRight} onPress={createJobCard} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  page: { paddingHorizontal: space.screen, paddingBottom: 24, gap: space.gapL },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  input: {
    minHeight: touch.min, borderWidth: 1, borderColor: color.borderStrong, borderRadius: radius.input,
    paddingHorizontal: 12, fontFamily: font.body, fontSize: size.transcript, color: color.ink, backgroundColor: color.surface,
  },
  unsure: { backgroundColor: color.uncertainBg, borderRadius: radius.card, padding: 14, gap: 10, borderLeftWidth: 4, borderLeftColor: color.uncertainAccent },
  candidate: {
    minHeight: touch.min, paddingHorizontal: 14, borderRadius: radius.input, backgroundColor: color.surface,
    borderWidth: 1, borderColor: color.uncertainAccent, justifyContent: 'center',
  },
  fixed: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: color.successBg, borderRadius: radius.input, padding: 12 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: touch.min },
  footer: { paddingHorizontal: space.screen, paddingTop: 8, paddingBottom: 8, borderTopWidth: 1, borderTopColor: color.border, backgroundColor: color.bg },
})
