# Thalia

Kannada–English mechanic speech → transcript → job card, fully on-device.
RVCE CSE project. Start with [`CLAUDE.md`](CLAUDE.md) and the docs in [`docs/`](docs/).

## Setup

```sh
npm install
cp .env.example .env.local      # EXPO_PUBLIC_ASR_ENGINE=whisper (or mock: no model needed)
npm test                        # jest: src/nlp + src/audio
npx tsc --noEmit                # type check
npx expo lint
```

The app uses native modules, so it needs a **development build** (not Expo Go).
Local Android builds need JDK 17 and the Android SDK (platform 37, build-tools 37, NDK 27.1) with
`JAVA_HOME` / `ANDROID_HOME` set; Gradle gets a 4 GB heap via `plugins/withGradleHeap.js`.

```sh
npx eas-cli@latest build -p android --profile development   # once, or when native deps change
npx expo start --dev-client                                 # daily
# or, with Android Studio + a phone over USB:
npx expo run:android
```

## Layout

| Path | What |
|---|---|
| `app/` | Expo Router screens (tabs: Record · History · Models; stack: recording, transcript, job, compare) |
| `src/asr` | `ASREngine` interface, mock engine, whisper.rn engine |
| `src/nlp` | normalize, findTerms, findUncertain, toAllKannada, buildJobCard — pure + unit-tested |
| `src/audio` | PCM collector + resampler, WAV encode/parse/save, noise meter, waveform peaks, shared player |
| `src/db` | expo-sqlite client, migrations, recordings, corrections |
| `src/ui` | theme tokens + components |
| `scripts/` | model pipeline helpers (`merge_lora.py`, `eval_ggml.py`) |
| `docs/`, `design/` | spec and screen mockups |

## Status (see [`docs/ROADMAP.md`](docs/ROADMAP.md))

- [x] **M0** skeleton — Expo SDK 58, strict TS, Expo Router, theme + components, tabs, `eas.json`.
  Dev build verified on an Android 16 emulator (Pixel 8, arm64); Kannada fonts render.
- [x] **M1** mock end-to-end — mock engine, `src/nlp` with pilot-fixture tests, DB + migrations,
  Home → Recording (fake timer) → Transcript (auto-fix, "Not sure" card, inline edit) → Job card → History.
- [x] **M2** real audio — expo-audio `AudioStream` → 16 kHz mono PCM16 WAV, live noise meter + waveform,
  pause/resume, mic-permission screen, one-at-a-time playback in Transcript + History.
  Verified on a Redmi Note 13 Pro 5G (HyperOS): live waveform/noise meter, record, play back.
- [ ] **M3** whisper.rn engine, model store (download + sha256, delete, USB copy), no-model state — on-device run pending
- [ ] **M4** correction export, PDF share, re-dictate (plain-text share is done)
- [ ] **M5** Compare + Benchmark
- [ ] **M6** hardening + report data

## Models

Three q8_0 models (converted from the trained HF checkpoints with `docs/MODEL_PIPELINE.md`):
`thalia-small` (Whisper-small, 235 min, 264 MB, default), `thalia-indic` (IndicWhisper-Kannada medium,
823 MB, most accurate), `thalia-small60` (Whisper-small, 60 min, 264 MB). Until they are hosted, copy one
to a USB-connected phone with `scripts/push-model.sh models/ggml/thalia-small-q8_0.bin`.

Trained weights are **not** in this repo (`models/` is gitignored). Convert them to GGML `q8_0`
following [`docs/MODEL_PIPELINE.md`](docs/MODEL_PIPELINE.md), publish to Hugging Face, and fill
`url` / `sha256` / `sizeBytes` / `eval` in [`assets/models.json`](assets/models.json).
