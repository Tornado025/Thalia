import { Pause, Play } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, StyleSheet } from 'react-native'

import { audioFileExists } from '../../audio/paths'
import { usePlayback } from '../../audio/player'
import { formatDuration } from '../format'
import { color, radius, touch } from '../theme'
import { Card } from './Card'
import { Txt } from './Txt'
import { Waveform } from './Waveform'

/** Play/pause + waveform scrubber + time, for one recording. */
export function AudioRow({ id, uri, durationMs, peaks }: { id: string; uri: string; durationMs: number; peaks: number[] }) {
  const { playing, positionSec, toggle, seek, id: activeId } = usePlayback()
  const [width, setWidth] = useState(0)
  const active = activeId === id
  const progress = active && durationMs ? (positionSec * 1000) / durationMs : 0

  if (!audioFileExists(uri)) {
    return (
      <Card>
        <Txt variant="caption">No audio for this recording</Txt>
      </Card>
    )
  }

  return (
    <Card style={styles.row}>
      <PlayButton playing={active && playing} onPress={() => toggle(id, uri)} />
      <Pressable
        style={{ flex: 1 }}
        accessibilityRole="adjustable"
        accessibilityLabel="Seek"
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onPress={(e) => {
          if (active && width) seek(e.nativeEvent.locationX / width)
        }}>
        <Waveform peaks={peaks} progress={progress} height={32} />
      </Pressable>
      <Txt variant="label" style={{ minWidth: 76, textAlign: 'right' }}>
        {formatDuration(active ? positionSec * 1000 : 0)} / {formatDuration(durationMs)}
      </Txt>
    </Card>
  )
}

export function PlayButton({ playing, onPress, size = touch.min }: { playing: boolean; onPress: () => void; size?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={playing ? 'Pause' : 'Play'}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.play, { width: size, height: size, opacity: pressed ? 0.8 : 1 }]}>
      {playing ? <Pause size={20} color={color.bg} fill={color.bg} /> : <Play size={20} color={color.bg} fill={color.bg} />}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  play: { borderRadius: radius.pill, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center' },
})
