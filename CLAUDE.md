# Thalia — Kannada mechanic speech-to-job-card app

Thalia lets a Bengaluru two/four-wheeler mechanic speak about a repair in Kannada–English
code-mixed speech and get back an accurate transcript and an auto-filled job card. All
speech recognition runs **on the phone, offline**, using our own fine-tuned Whisper models
quantized to 8-bit (GGML `q8_0`) and run through **whisper.cpp via `whisper.rn`**.

College project (RVCE, CSE). Read these before writing code:

| Doc | What it covers |
|---|---|
| `docs/PRD.md` | Users, problem, features, scope |
| `docs/ARCHITECTURE.md` | Stack, folders, data flow, interfaces, DB schema |
| `docs/SCREENS.md` | Every screen, its states, design tokens |
| `docs/MODEL_PIPELINE.md` | HF model → GGML q8_0 → phone; validation |
| `docs/ROADMAP.md` | Milestones with acceptance criteria — work in this order |
| `design/` | HTML mockups of every screen (reference for layout, colors, copy) |

## Stack (decided — don't swap without asking)
- Expo (latest SDK) + React Native + **TypeScript (strict)** + **Expo Router**
- **Development build**, NOT Expo Go (`expo-dev-client`). `whisper.rn` has native code.
- ASR: `whisper.rn` (whisper.cpp). Models are GGML `.bin`, `q8_0`.
- Storage: `expo-sqlite` (metadata), `expo-file-system` (WAV audio + model files)
- Playback: `expo-audio`. Recording: 16 kHz mono 16-bit PCM → WAV (see ARCHITECTURE §Audio)
- State: `zustand`. Icons: `lucide-react-native`. Fonts: Inter, Space Grotesk, Noto Sans Kannada
- Share/export: `expo-sharing`, `expo-print` (job card PDF)

## Commands
```sh
npx expo start --dev-client              # daily dev (after a dev build is installed)
eas build -p android --profile development   # rebuild only when native deps/config change
npx expo run:android                     # local build over USB (needs Android Studio)
npm test                                 # jest — unit tests for src/nlp, src/audio/wav
npx tsc --noEmit                         # type check
```

## Rules
1. **All ASR goes through the `ASREngine` interface** (`src/asr/types.ts`). Screens never import
   `whisper.rn` directly. `EXPO_PUBLIC_ASR_ENGINE=mock|whisper` picks the engine, so UI work
   can continue with the mock.
2. **Never bundle model files in the app.** Models are downloaded at runtime from the URLs in
   `assets/models.json` into the document directory. The APK must stay small.
3. **Only one whisper context in memory at a time.** Call `release()` before loading another
   model (Compare screen runs models sequentially).
4. Audio fed to whisper must be **16 kHz, mono, 16-bit PCM WAV**. Don't record m4a/aac.
5. **Transcript convention = mixed script:** Kannada words in Kannada script, English words in
   Latin script, English stem + Kannada suffix joined (`bikeಗೆ`, `engineನ`). Never
   transliterate or "fix" script in post-processing except via the lexicon.
6. Post-processing (`src/nlp/`) is plain deterministic TypeScript — no LLM, no network.
   Every function there gets unit tests; use the pilot sentences in `docs/ARCHITECTURE.md`
   as fixtures.
7. Expo APIs (`expo-file-system`, `expo-audio`) changed in recent SDKs — check the current
   docs for the installed SDK version instead of relying on memory.
8. Touch targets ≥ 44 px, text contrast ≥ 4.5:1. Mechanics use this with dirty hands in
   bright, noisy workshops — big buttons, high contrast.
9. Keep UI copy short. English UI with Kannada helper lines where shown in `design/`.
10. Use the design tokens in `src/ui/theme.ts` (values in `docs/SCREENS.md`); no ad-hoc hex codes.

## Fill-ins (owner: team)
- Model download URLs + sha256 in `assets/models.json` (see `docs/MODEL_PIPELINE.md` §5)
- Full ~200-term lexicon in `assets/lexicon.json` (seed entries are in ARCHITECTURE)
- Design canvas: https://claude.ai/artifact/399NGUjg5XGTgEM4TZoLqs
