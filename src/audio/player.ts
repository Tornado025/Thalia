import { createAudioPlayer, type AudioPlayer } from 'expo-audio'
import { create } from 'zustand'

type Playback = {
  /** Recording id currently loaded in the shared player. */
  id: string | null
  playing: boolean
  positionSec: number
  durationSec: number
  toggle: (id: string, uri: string) => void
  seek: (fraction: number) => void
  stop: () => void
}

let player: AudioPlayer | null = null

/** One shared player: starting a clip stops whatever else was playing. */
export const usePlayback = create<Playback>()((set, get) => {
  function ensurePlayer(): AudioPlayer {
    if (player) return player
    player = createAudioPlayer(null, { updateInterval: 100 })
    player.addListener('playbackStatusUpdate', (s) => {
      if (s.didJustFinish) {
        player?.pause()
        player?.seekTo(0)
        set({ playing: false, positionSec: 0 })
        return
      }
      set({ playing: s.playing, positionSec: s.currentTime, durationSec: s.duration || get().durationSec })
    })
    return player
  }

  return {
    id: null,
    playing: false,
    positionSec: 0,
    durationSec: 0,
    toggle(id, uri) {
      const p = ensurePlayer()
      if (get().id !== id) {
        p.replace({ uri })
        set({ id, positionSec: 0, durationSec: 0 })
        p.play()
        return
      }
      if (p.playing) p.pause()
      else p.play()
    },
    seek(fraction) {
      const { durationSec } = get()
      if (player && durationSec) player.seekTo(fraction * durationSec)
    },
    stop() {
      player?.pause()
      set({ id: null, playing: false, positionSec: 0 })
    },
  }
})
