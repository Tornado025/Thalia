# Thalia — Roadmap

Work top to bottom. Each milestone ends with its acceptance check passing. Two tracks can run
in parallel: **App** (M0–M6) and **Models** (MODEL_PIPELINE §1–5). They meet at M3.

## M0 — Project skeleton
- `npx create-expo-app@latest thalia -t default` (TypeScript), Expo Router, strict TS
- Install: expo-dev-client, expo-sqlite, expo-file-system, expo-audio, expo-sharing,
  expo-print, zustand, lucide-react-native, @expo-google-fonts/{inter,space-grotesk,noto-sans-kannada}
- `src/ui/theme.ts` with tokens from SCREENS.md; base components (Button, Card, Chip,
  Segmented, TabBar, TermText)
- Tabs Record / History / Models with placeholder screens
- `eas.json` development profile; first dev build installed on an Android phone
- ✅ App opens on the phone from the dev build; tabs switch; fonts render Kannada correctly

## M1 — Mock end-to-end flow
- `ASREngine` + `mockEngine`; `EXPO_PUBLIC_ASR_ENGINE=mock`
- `src/nlp`: lexicon loader, normalize, findTerms, findUncertain, toAllKannada, buildJobCard
  — **with jest tests using the pilot fixture**
- DB + migrations; recordings CRUD
- Screens: Home → Recording (fake timer) → Transcript → Job card → History, all wired
- ✅ Full flow works with mock text; "dry bolt" shows as auto-fixed "drain bolt"; "Not sure"
  card resolves "hole block"; job card has parts drain bolt + coolant; saved item appears in
  History. `npm test` green.

## M2 — Real audio
- PCM recorder → 16 kHz mono WAV (`wav.ts` tested: header bytes, duration)
- Noise meter + live waveform on Recording; waveform peaks stored
- Playback in Transcript + History (one at a time, progress)
- ✅ Record 20 s, see it in History with correct duration, play it back; WAV opens in Audacity
  as 16 kHz mono

## M3 — Real model on device
- `whisperEngine` via whisper.rn; load active model lazily, keep loaded
- Model manager: models.json, download with progress + sha256 check, set active, delete
- Transcription progress overlay; store raw_text, model_id, transcribe_ms
- ✅ With `thalia-small-q8_0.bin`: record a Kannada mechanic sentence offline (airplane mode)
  → mixed-script transcript appears; switching to another model works without crash

## M4 — Correction loop + job card polish
- Inline word edit, uncertain-word card, corrections table, user_corrected flag
- Job card editing, re-dictate field, Share text + PDF
- Training export (manifest.jsonl + WAVs zip)
- ✅ Correct a word → appears in training export; shared PDF opens in WhatsApp

## M5 — Compare + Benchmark
- Compare screen (sequential runs, release between)
- Benchmark dev screen → `benchmarks` table → CSV export
- ✅ CSV with load/transcribe/RTF for all 3 models on one phone

## M6 — Hardening + report data
- Empty/error states (no model, no space, mic denied, transcription failed → retry)
- Search in History; delete recording; re-transcribe with another model
- Run benchmarks on ≥ 2 phones; fill `eval` in models.json from MODEL_PIPELINE §4
- ✅ Report table complete; demo script rehearsed

## M7 — Stretch
- Live text while recording (`RealtimeTranscriber`)
- English view via a translation step
- iOS build
