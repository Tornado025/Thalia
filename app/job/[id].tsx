import { router, useLocalSearchParams } from 'expo-router'
import { Plus, Share2, Square, SquareCheck, Trash2 } from 'lucide-react-native'
import { useEffect, useState, type ReactNode } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { getRecording, updateRecording, type Recording } from '@/db/recordings'
import { jobCardText } from '@/export/jobcardText'
import type { JobCard } from '@/nlp'
import { Button, Card, Header, IconButton, StatusPill, Txt } from '@/ui/components'
import { VEHICLE_LABEL } from '@/ui/format'
import { color, font, radius, size, space, touch } from '@/ui/theme'

export default function JobCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [rec, setRec] = useState<Recording | null>(null)
  const [card, setCard] = useState<JobCard | null>(null)

  useEffect(() => {
    getRecording(id).then((r) => {
      setRec(r)
      setCard(r?.jobCard ?? null)
    })
  }, [id])

  // Persist every edit; the initial load is the same object as rec.jobCard, so it is skipped.
  useEffect(() => {
    if (card && rec && card !== rec.jobCard) updateRecording(id, { jobCard: card, vehicleName: card.vehicle.name || null })
  }, [id, card, rec])

  if (!rec || !card) {
    return (
      <SafeAreaView style={styles.center}>
        {rec && !card ? <Txt>No job card yet — create one from the transcript.</Txt> : <ActivityIndicator color={color.ink} />}
      </SafeAreaView>
    )
  }

  const edit = setCard
  const c = card
  const setVehicle = (k: keyof JobCard['vehicle']) => (v: string) => edit({ ...c, vehicle: { ...c.vehicle, [k]: v } })
  const setWork = (i: number, patch: Partial<JobCard['work'][number]>) =>
    edit({ ...c, work: c.work.map((w, j) => (j === i ? { ...w, ...patch } : w)) })
  const setPart = (i: number, patch: Partial<JobCard['parts'][number]>) =>
    edit({ ...c, parts: c.parts.map((p, j) => (j === i ? { ...p, ...patch } : p)) })

  async function save() {
    await updateRecording(id, { jobCard: c, vehicleName: c.vehicle.name || null, status: 'saved' })
    router.dismissTo('/history')
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <Header title="Job card" right={<StatusPill status={rec.status} />} />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Card dark style={styles.summary}>
          <DarkField label="Vehicle" value={c.vehicle.name} placeholder={VEHICLE_LABEL[c.vehicle.type]} onChangeText={setVehicle('name')} />
          <DarkField label="Reg. no." value={c.vehicle.regNo} placeholder="KA-XX-XX-XXXX" autoCapitalize="characters" onChangeText={setVehicle('regNo')} />
          <DarkField label="Customer" value={c.vehicle.customer} placeholder="Customer name" onChangeText={setVehicle('customer')} />
          <DarkField label="Service" value={c.vehicle.service} placeholder="Service" onChangeText={setVehicle('service')} />
        </Card>

        <Section title="Complaint · ದೂರು">
          <Input multiline value={c.complaint} onChangeText={(v) => edit({ ...c, complaint: v })} placeholder="What the customer reported" />
        </Section>
        <Section title="Diagnosis">
          <Input multiline value={c.diagnosis} onChangeText={(v) => edit({ ...c, diagnosis: v })} placeholder="What you found" />
        </Section>

        <Section title="Work done">
          {c.work.map((w, i) => (
            <View key={i} style={styles.row}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: w.done }}
                onPress={() => setWork(i, { done: !w.done })}
                style={styles.checkBtn}>
                {w.done ? <SquareCheck size={24} color={color.ink} /> : <Square size={24} color={color.muted} />}
              </Pressable>
              <Input multiline value={w.text} onChangeText={(v) => setWork(i, { text: v })} style={{ flex: 1 }} />
              <IconButton icon={Trash2} label="Remove item" kind="ghost" onPress={() => edit({ ...c, work: c.work.filter((_, j) => j !== i) })} />
            </View>
          ))}
          <Button label="Add item" kind="secondary" icon={Plus} onPress={() => edit({ ...c, work: [...c.work, { text: '', done: false }] })} />
        </Section>

        <Section title="Parts & labour">
          {c.parts.map((p, i) => (
            <View key={i} style={styles.row}>
              <Input value={p.name} onChangeText={(v) => setPart(i, { name: v })} placeholder="Part" style={{ flex: 1 }} />
              <Input value={p.qty} onChangeText={(v) => setPart(i, { qty: v })} placeholder="Qty" keyboardType="numeric" style={{ width: 60 }} />
              <Input value={p.price} onChangeText={(v) => setPart(i, { price: v })} placeholder="₹" keyboardType="numeric" style={{ width: 80 }} />
            </View>
          ))}
          <Button label="Add part" kind="secondary" icon={Plus} onPress={() => edit({ ...c, parts: [...c.parts, { name: '', qty: '', price: '' }] })} />
          <View style={[styles.row, { marginTop: 4 }]}>
            <Txt variant="semibold" style={{ flex: 1 }}>Labour</Txt>
            <Input value={c.labour} onChangeText={(v) => edit({ ...c, labour: v })} placeholder="₹" keyboardType="numeric" style={{ width: 120 }} />
          </View>
        </Section>
      </ScrollView>

      <View style={styles.footer}>
        <Button big label="Share" kind="secondary" icon={Share2} onPress={() => Share.share({ message: jobCardText(c) })} style={{ flex: 1 }} />
        <Button big label="Save to history" onPress={save} style={{ flex: 1.4 }} />
      </View>
    </SafeAreaView>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Txt variant="overline">{title}</Txt>
      {children}
    </View>
  )
}

function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor={color.muted} {...props} style={[styles.input, props.multiline && { paddingVertical: 10 }, props.style]} />
}

function DarkField({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.darkField}>
      <Txt variant="overline" style={{ color: color.dMuted, width: 84 }}>{label}</Txt>
      <TextInput placeholderTextColor={color.dMuted} {...props} style={styles.darkInput} accessibilityLabel={label} />
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.screen },
  page: { paddingHorizontal: space.screen, paddingBottom: 24, gap: 18 },
  summary: { gap: 2, paddingVertical: 6 },
  darkField: { flexDirection: 'row', alignItems: 'center', minHeight: touch.min },
  darkInput: { flex: 1, color: color.dText, fontFamily: font.semibold, fontSize: size.body, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkBtn: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' },
  input: {
    minHeight: touch.min, borderWidth: 1, borderColor: color.border, borderRadius: radius.input, backgroundColor: color.surface,
    paddingHorizontal: 12, fontFamily: font.body, fontSize: size.body, color: color.ink,
  },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: space.screen, paddingVertical: 8, borderTopWidth: 1, borderTopColor: color.border },
})
