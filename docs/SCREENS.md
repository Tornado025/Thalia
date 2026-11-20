# Thalia — Screens & Design

Mockups for every screen are in `design/*.dc.html` (open in a text editor — they're
reference markup for layout, spacing, colors and copy; they won't render standalone).
Live canvas: https://claude.ai/artifact/399NGUjg5XGTgEM4TZoLqs

## Design tokens (`src/ui/theme.ts`)
```ts
export const color = {
  bg: '#F3F4F6', surface: '#FFFFFF', ink: '#111418', textSecondary: '#3B414A',
  muted: '#565D68', border: '#DDE1E6', borderStrong: '#C9CED5', segmentBg: '#E4E7EB',
  accent: '#F5A524',                 // high-vis amber — fills only, always with ink text on it
  termBg: '#FDEFD2', termText: '#6B4100',          // workshop-term chips/highlights
  uncertainBg: '#E8EEFC', uncertainText: '#15307A', uncertainAccent: '#1F4FD1',
  successBg: '#E3F4EA', successText: '#145A32',
  // dark (recording screen)
  dBg: '#121417', dSurface: '#1B1E22', dRaised: '#22262B', dBorder: '#2C3137',
  dText: '#F3F4F6', dMuted: '#A8B0BC', dTermBg: '#4A3410', dTermText: '#FFD48A',
  recRed: '#FF5A4E',
}
export const radius = { card: 14, input: 12, chip: 6, pill: 999 }
export const font = {
  display: 'SpaceGrotesk_700Bold',   // screen titles 26, sub-screen titles 21
  heading: 'SpaceGrotesk_600SemiBold',
  body: 'Inter_400Regular', medium: 'Inter_500Medium', semibold: 'Inter_600SemiBold', bold: 'Inter_700Bold',
  kannada: 'NotoSansKannada_400Regular', kannadaBold: 'NotoSansKannada_600SemiBold',
}
// sizes: body 15, transcript 17 (live 19), label 13, caption 12, overline 11 uppercase +0.06em
// spacing: screen padding 20, card padding 12×14, gaps 8/10/14
```
Rules: touch targets ≥ 44; primary CTAs 52–54 tall; never put amber text on white (fails
contrast) — amber is a fill; uncertain = blue dashed underline; wrong term = blue strikethrough;
correct/highlighted term = amber-tint chip. Mixed text: render Kannada runs in the Kannada font
and Latin runs in Inter (`TermText` component splits by script).

## Navigation
Tabs: **Record** (home) · **History** · **Models**. Stack screens over tabs: Recording (modal,
full-screen dark), Transcript, Job card, Compare.

## 1. Home / Record — `(tabs)/index.tsx` · design/Main.dc.html
- Header: amber logo tile (wrench) + "Thalia" + `ಥಾಲಿಯಾ`; right: "Offline · on-device" pill.
- Active model card → Models tab.
- "Vehicle on the bay" segmented: Bike / Scooter / Car (persist last choice).
- 148 px amber mic button with two soft rings → Recording. "Tap and describe the job" +
  `ಕನ್ನಡದಲ್ಲಿ ಮಾತಾಡಿ — English part names are fine`.
- "Recent recordings" (latest 1–2) + "See all" → History.
- States: no model downloaded → mic replaced by "Download a model to start" card → Models.
  Mic permission denied → explain + open settings.

## 2. Recording — `recording.tsx` · design/Recording.dc.html (dark)
- Top: close (discard, confirm if > 5 s) · red dot + "Listening · mm:ss" · vehicle pill.
- Noise card: label, 3-segment meter, tip line when heavy.
- Live waveform bars (from PCM levels).
- Transcript area: v1 shows "Transcribing after you stop" placeholder; M7 adds live text.
- Bottom: Discard · big amber ✓ Done · Pause/Resume.
- On Done: stop → write WAV → insert recording row (status draft) → transcribe with progress
  overlay → normalize → navigate to Transcript.

## 3. Review & correct — `transcript/[id].tsx` · design/Transcript.dc.html
- Back · "Review transcript".
- Audio player row (play/pause, scrubber, time).
- Segmented: Mixed / ಕನ್ನಡ / English (English disabled with "coming soon" unless implemented).
- Transcript card: terms as amber-tint inline chips; uncertain word blue dashed underline.
  Tap any word → inline edit. Auto-fixed words show a small "auto-fixed" tooltip on tap.
- "Not sure about one word — which did you say?" card with candidates + pencil (type it).
  After pick: green "Fixed — added to your training queue".
- "Parts & faults detected" chips.
- Checkbox "Save my corrections to improve the model".
- Sticky CTA "Create job card →".

## 4. Job card — `job/[id].tsx` · design/JobCard.dc.html
- Back · "Job card" · Draft/Saved pill.
- Dark summary card: Vehicle, Reg. no., Customer, Service (all editable; placeholders shown).
- Complaint · ದೂರು (with mic button to re-dictate just this field), Diagnosis.
- Work done checklist (editable, add item).
- Parts & labour rows (name · qty · price), Labour total.
- Bottom: Share (text / PDF) · "Save to history" (status → saved) → History.

## 5. History — `(tabs)/history.tsx` · design/History.dc.html
- Title + "Every recording, with its audio and job card".
- Search (matches text, vehicle, terms) + voice-search button (records → transcribes → fills query).
- Grouped by Today / Yesterday / date. Each row: play/pause, "Vehicle · Title", time ·
  duration (shows position while playing), Draft/Saved pill, 48-bar waveform (played part in
  ink), 2-line transcript snippet, term chips, "Job card ›". Only one row plays at a time.
- Long-press row → Delete (removes WAV too) / Re-transcribe with another model.
- Empty state: "No recordings yet" + button → Record.

## 6. Models — `(tabs)/models.tsx` · design/Models.dc.html
- Title + "All run offline, 8-bit, on this phone".
- Radio cards per model: name, base, Size, WER, CER, Jargon acc. (from models.json `eval`;
  show "–" if null), status line (Installed · Download (size) with progress · needs N GB RAM).
- "Compare all 3 on one clip" → Compare.
- Training queue card: "N corrected clips" + Export.
- Long-press footer version text → Benchmark (dev).

## 7. Compare — `compare.tsx` · design/Compare.dc.html
- Back · "Compare models".
- Clip picker (from History or bundled test clips) with play.
- "Run all models" → runs each downloaded model sequentially (release between), shows
  per-model card: name, time taken, output with terms highlighted / wrong terms struck.
  If the clip has a corrected transcript, mark differences against it.
- Not-downloaded models: dashed card "Download to compare".
