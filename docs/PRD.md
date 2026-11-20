# Thalia — Product Requirements

## 1. Problem
Mechanics in Bengaluru explain diagnoses and repairs in Kannada mixed with English part names
("drain bolt", "clutch plate", "pickup"), often with Kannada suffixes (`bikeಗೆ`), in noisy
workshops. General speech recognition gets the Kannada right but gets roughly half of the
technical terms wrong, and each wrong term changes the meaning (pilot: "drain bolt" → "dry
bolt", "air out" → "layer out", "hole block" → "hole black").

Our team has fine-tuned three Whisper-family models on ~5 h of annotated mechanic speech.
Thalia puts those models in a mechanic's pocket and turns speech into a usable job card.

## 2. Users
- **Primary — mechanic:** speaks Kannada, comfortable with English part names, may not like
  typing, hands often dirty, works in noise. Wants: speak once, get a job card.
- **Secondary — garage owner / service advisor:** wants a searchable record of jobs to share
  with customers (WhatsApp / PDF).
- **Secondary — our research team:** wants to compare models on real clips and collect
  corrected transcripts for the next fine-tuning round.

## 3. Core flow
Record → (live recording view) → Review & correct transcript → Auto job card → Save → History

## 4. Features (v1)

| # | Feature | Notes |
|---|---|---|
| F1 | One-tap recording | Big mic button; pick vehicle type (Bike / Scooter / Car) first |
| F2 | Noise indicator | Clean / Moderate / Heavy from live audio level, with a tip when heavy |
| F3 | On-device transcription | Offline; selected model; Kannada (`kn`) with glossary prompt |
| F4 | Mixed-script transcript | Kannada script + Latin English; workshop terms highlighted |
| F5 | Script view toggle | Mixed / all-Kannada (transliterate Latin terms via lexicon `kn` field) / English (beta, optional) |
| F6 | "Not sure" prompt | For low-confidence words near a lexicon term, offer 2 choices + type-it-yourself |
| F7 | Glossary normalization | Known mishearings auto-corrected (dry bolt → drain bolt) |
| F8 | Auto job card | Vehicle, complaint, diagnosis, work-done checklist, parts, labour; every field editable; re-dictate a field |
| F9 | Share job card | As text or PDF via the system share sheet |
| F10 | History | Every recording with audio playback, waveform, transcript snippet, term chips, status, link to job card; search |
| F11 | Model manager | 3 models: download / delete / set active; size; WER / CER / jargon accuracy from our eval |
| F12 | Compare | Run one clip through every downloaded model; show outputs side by side with term errors marked |
| F13 | Training queue | Corrected transcripts stored with audio; export as JSONL + WAV zip |

## 5. Out of scope for v1
- Cloud sync, accounts, login
- iOS release (Android first; iOS only if time permits)
- Live streaming transcription while recording (nice-to-have, M7)
- Customer database / billing
- Engine-fault sound classification

## 6. Non-functional
- Works fully offline after first model download.
- Default model (whisper-small, q8_0, ≈250 MB) must run on a mid-range Android phone with 4 GB RAM.
- Transcribing a 60 s clip should finish in reasonable time on that phone — **measure and
  report** the real-time factor (see MODEL_PIPELINE §7); don't promise a number in the UI.
- Audio and transcripts never leave the phone unless the user explicitly shares/exports.

## 7. Success (for the project report)
- App runs end-to-end on ≥ 2 real Android phones with all 3 models.
- Table: per model × per phone — WER, CER, jargon term accuracy (JTA), real-time factor,
  peak RAM, model load time, file size, fp16 vs q8_0 accuracy difference.
- Demo: same workshop clip through baseline vs our models on the Compare screen.
