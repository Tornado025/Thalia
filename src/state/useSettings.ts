import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { settingsStorage } from '../db/settings'
import { defaultModel } from '../models/manifest'
import type { VehicleType } from '../nlp'

type Settings = {
  vehicle: VehicleType
  activeModelId: string
  /** Glossary prompt on/off — the report's ablation switch. */
  boostWorkshopWords: boolean
  /** Opt-in: corrected clips go to the training queue. */
  saveCorrections: boolean
  set: (patch: Partial<Omit<Settings, 'set'>>) => void
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      vehicle: 'bike',
      activeModelId: defaultModel.id,
      boostWorkshopWords: true,
      saveCorrections: true,
      set: (patch) => set(patch),
    }),
    { name: 'thalia-settings', storage: createJSONStorage(() => settingsStorage) },
  ),
)
