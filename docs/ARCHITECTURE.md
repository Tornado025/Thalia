# Thalia — Architecture

## 1. Overview
```
┌──────────────────────── Expo app (TypeScript) ────────────────────────┐
│ app/ (Expo Router screens)                                            │
│   ↓ uses                                                              │
│ src/state (zustand) ─ src/db (expo-sqlite) ─ src/models (manifest,    │
│                                              downloader)              │
│ src/audio (PCM recorder → WAV, noise meter, player)                   │
│ src/nlp  (normalize, terms, uncertain words, job card, transliterate) │
│ src/asr  ASREngine ─┬─ mockEngine   (dev without models)              │
│                     └─ whisperEngine (whisper.rn) ── native ──┐       │
└───────────────────────────────────────────────────────────────┼───────┘
                                                whisper.cpp (C++, CPU)
                                                + ggml q8_0 model file
```
Everything runs on the phone. No backend.

## 2. Folder structure
```
app/
  _layout.tsx                 root stack, fonts, DB init
  (tabs)/_layout.tsx          tabs: Record | History | Models
  (tabs)/index.tsx            Home / Record
  (tabs)/history.tsx
  (tabs)/models.tsx
  recording.tsx               full-screen modal
  transcript/[id].tsx         review & correct
  job/[id].tsx                job card
  compare.tsx
src/
  asr/        types.ts  mockEngine.ts  whisperEngine.ts  index.ts
  audio/      recorder.ts  wav.ts  noise.ts  waveform.ts  player.ts
  models/     manifest.ts  downloader.ts  store.ts
  nlp/        lexicon.ts  normalize.ts  terms.ts  uncertain.ts  jobcard.ts  transliterate.ts
  db/         client.ts  migrations.ts  recordings.ts  corrections.ts
  export/     trainingExport.ts  jobcardPdf.ts
  state/      useSettings.ts  useRecorder.ts
  ui/         theme.ts  components/ (Button, Card, Chip, Segmented, TabBar, TermText, Waveform, AudioRow …)
assets/
  lexicon.json  models.json  fonts/
  test-clips/   2–3 short WAVs for dev + the in-app benchmark (small, < 1 MB each)
__tests__/    nlp + wav unit tests
```

## 3. ASR engine interface
```ts
// src/asr/types.ts
export type Word = { text: string; start?: number; end?: number; p?: number }
export type ASRResult = { text: string; words: Word[]; elapsedMs: number }
export interface ASREngine {
  load(modelPath: string): Promise<void>
  transcribe(wavPath: string, opts: { language: 'kn'; prompt?: string;
             onProgress?: (pct: number) => void }): Promise<ASRResult>
  release(): Promise<void>
  isLoaded(): boolean
}
```
- `mockEngine` returns the pilot sentence below (with its real errors and one low-`p` word)
  after ~1.5 s, so the whole UI, normalization and job card can be built without models.
- `whisperEngine`: `initWhisper({ filePath })`, `ctx.transcribe(wavPath, { language: 'kn',
  prompt, tokenTimestamps: true, maxThreads: 4, onProgress })`, `ctx.release()`.
  Map whisper segments/tokens into `words`. If per-token probabilities are available in the
  result, put them in `p`; if not, leave `p` undefined (uncertain.ts has a fallback).
- `src/asr/index.ts` picks the engine from `process.env.EXPO_PUBLIC_ASR_ENGINE`.
- Prompt = comma-joined lexicon terms (Latin forms), truncated to ~200 tokens. Settings
  toggle "Boost workshop words" can turn it off (useful for the report's ablation).

## 4. Audio
- Recording format: **16 kHz, mono, 16-bit PCM**, written as a WAV file in
  `documentDirectory/recordings/<id>.wav`. Same file is used for transcription and playback.
- `expo-audio`'s default recorder output (m4a/aac) is not accepted by whisper — capture raw
  PCM instead. Use the PCM stream library that `whisper.rn`'s realtime-transcription docs
  pair with `AudioPcmStreamAdapter` (check the whisper.rn README for the current package),
  buffer chunks, and write the WAV header yourself in `wav.ts` (unit-tested).
- `noise.ts`: per 100 ms frame compute RMS → dBFS. Noise floor = 10th percentile of the last
  3 s. Buckets (tunable constants): floor < −45 dBFS clean, −45…−30 moderate, > −30 heavy.
  Store the dominant bucket on the recording.
- `waveform.ts`: downsample to 48 peak values for the History row; store as JSON on the
  recording so History doesn't decode audio.
- Max recording length 5 min (whisper.cpp handles long audio internally in 30 s windows).

## 5. Models
`assets/models.json` (filled in from MODEL_PIPELINE §5):
```json
[
  { "id": "small",  "name": "Thalia Small",  "base": "Whisper small · full fine-tune",
    "file": "thalia-small-q8_0.bin", "url": "<URL>", "sha256": "<SHA>",
    "sizeBytes": 0, "minRamGB": 3, "default": true,
    "eval": { "wer": null, "cer": null, "jta": null } },
  { "id": "indic",  "name": "Thalia Indic",  "base": "IndicWhisper-Kannada · LoRA merged", "...": "..." },
  { "id": "medium", "name": "Thalia Medium", "base": "Whisper medium · LoRA merged", "minRamGB": 6, "...": "..." }
]
```
- `downloader.ts`: resumable download to `documentDirectory/models/<file>`, progress
  callback, verify sha256 after download, delete on mismatch. Check free space first.
- `store.ts`: which models are on disk, which is active (persisted), load/release lifecycle.
  Load the active model lazily on first transcription and keep it loaded.
- Warn (don't block) if device RAM < `minRamGB`.

## 6. Post-processing (`src/nlp`) — pure functions, unit-tested
Lexicon entry (`assets/lexicon.json`):
```json
{ "term": "drain bolt", "kn": "ಡ್ರೈನ್ ಬೋಲ್ಟ್", "category": "part",
  "variants": ["dry bolt"], "meaning": "Bolt that releases coolant or oil" }
```
`category`: `part | fault | action | other`. A variant is a string, or
`{ "text": "black", "onlyAfter": ["hole", "passage"] }` for context-restricted fixes.
Seed entries (already in `assets/lexicon.json`):
| term | kn | category | variants |
|---|---|---|---|
| drain bolt | ಡ್ರೈನ್ ಬೋಲ್ಟ್ | part | dry bolt |
| air out | ಏರ್ ಔಟ್ | action | layer out |
| block | ಬ್ಲಾಕ್ | fault | black (only after "hole"/"passage") |
| coolant | ಕೂಲೆಂಟ್ | part | |
| clutch plate | ಕ್ಲಚ್ ಪ್ಲೇಟ್ | part | |
| pickup | ಪಿಕಪ್ | fault | |
| silencer | ಸೈಲೆನ್ಸರ್ | part | |

Pipeline:
1. `normalize(text, lexicon)` — whitespace/punctuation cleanup; replace variants with
   canonical term (case-insensitive, Latin tokens only, whole-word, longest match first;
   context-restricted variants like `black` only when the rule's context matches). Returns
   text + list of replacements made (shown as auto-fixed).
2. `findTerms(text, lexicon)` — spans of lexicon terms (incl. with Kannada suffix attached,
   e.g. `engineನ` matches `engine`). Drives highlighting + chips.
3. `findUncertain(words, lexicon)` — word is uncertain if `p < 0.5`, OR (no `p`) a Latin
   token within edit distance ≤ 2 of a lexicon term but not equal to it. Return up to 3
   candidates. UI shows the first uncertain item at a time.
4. `toAllKannada(text, lexicon)` — replace Latin terms with lexicon `kn`; unknown Latin
   words left as-is (flag for later; IndicXlit not on device in v1).
5. `buildJobCard(text, terms, vehicle)` → `JobCard`:
   - parts = terms with category `part` (qty/price empty)
   - actions = sentences containing action cues (`ತೆಗೆ`, `ಬಿಚ್ಚ`, `check`, `change`, `replace`,
     `clean`, `adjust`, `ಹಾಕಿ`, `ಬದಲಾಯಿಸಿ`, air out …) → checklist items, unchecked
   - complaint = first sentence mentioning a `fault` term (else first sentence)
   - diagnosis = sentences with fault terms, joined
   - everything editable; the card is a starting point, not a final answer

Fixture (pilot, raw model-style output):
`ಇವಾಗ ನೋಡಿ ಇಲ್ಲಿ dry bolt ತೆಗೆದು ಬರಲಿಲ್ಲ coolant. ಇದು coolant ಎಳ್ಕೊಳೋಕೆ layer out ಆಗ್ಬೇಕು. ಕೆಲವೊಂದು time ಈ hole black ಆಗಿರುತ್ತೆ.`
Expected after normalize: `drain bolt`, `air out`, `hole block`; terms = drain bolt, coolant ×2, air out, block.

## 7. Database (expo-sqlite)
```sql
CREATE TABLE recordings (
  id TEXT PRIMARY KEY,            -- uuid
  created_at INTEGER NOT NULL,    -- ms epoch
  vehicle_type TEXT NOT NULL,     -- bike | scooter | car
  vehicle_name TEXT,              -- e.g. "Bajaj NS200" (editable on job card)
  title TEXT,                     -- short label, default from first part term
  wav_path TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  noise_level TEXT,               -- clean | moderate | heavy
  waveform_json TEXT,             -- 48 peaks
  model_id TEXT,
  raw_text TEXT,                  -- exactly what the model returned
  text TEXT,                      -- after normalize + user corrections
  words_json TEXT,                -- normalized words with timing / p / fixedFrom (drives highlights + "Not sure")
  terms_json TEXT,
  job_card_json TEXT,
  status TEXT NOT NULL DEFAULT 'draft',   -- draft | saved
  transcribe_ms INTEGER,
  user_corrected INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE corrections (
  id TEXT PRIMARY KEY, recording_id TEXT NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  before TEXT NOT NULL, after TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE benchmarks (
  id TEXT PRIMARY KEY, created_at INTEGER, device TEXT, model_id TEXT, clip TEXT,
  audio_ms INTEGER, load_ms INTEGER, transcribe_ms INTEGER, rtf REAL, text TEXT
);
```
Use a `migrations.ts` with a `user_version` pragma.

## 8. Training export
`trainingExport.ts`: all recordings with `user_corrected = 1` (and an opt-in setting) →
`manifest.jsonl` lines `{clip_id, path, duration, channel: "thalia-app", noise_level, text}`
(same schema as the research dataset) + the WAVs → zip → share sheet.

## 9. Benchmark mode (for the report)
Hidden dev screen (long-press version label on Models tab): for each downloaded model, for each
bundled test clip: load (time it), transcribe (time it), compute RTF = transcribe_ms /
audio_ms, store in `benchmarks`, export CSV. Release between models.
