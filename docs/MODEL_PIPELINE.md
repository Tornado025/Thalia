# Thalia — Model pipeline: Hugging Face → GGML q8_0 → phone

Do this on a laptop or Kaggle/Colab, once per model. Our three fine-tuned models:

| id | Base | Training | Expected q8_0 size |
|---|---|---|---|
| `small` | openai/whisper-small | full fine-tune | ≈ 250 MB |
| `indic` | IndicWhisper-Kannada | LoRA | depends on base size |
| `medium` | openai/whisper-medium | LoRA | ≈ 800 MB |

> bitsandbytes 8-bit (used during training) is GPU-only and cannot run on a phone. The phone
> uses whisper.cpp's own 8-bit format (`q8_0`). That's what this pipeline produces.

## 1. Merge LoRA (indic, medium only)
```python
# merge_lora.py  — python merge_lora.py <base_id> <lora_dir> <out_dir>
import sys
from transformers import WhisperForConditionalGeneration, WhisperProcessor
from peft import PeftModel
base_id, lora_dir, out = sys.argv[1:4]
base = WhisperForConditionalGeneration.from_pretrained(base_id, torch_dtype="auto")
model = PeftModel.from_pretrained(base, lora_dir).merge_and_unload()
model.save_pretrained(out, safe_serialization=False)   # converter reads pytorch_model.bin
WhisperProcessor.from_pretrained(base_id).save_pretrained(out)
```
For `small` (full fine-tune), make sure the folder has the weights + tokenizer files
(`vocab.json`, `added_tokens.json`, etc.). If it only has `model.safetensors`, re-save with
`safe_serialization=False`.

## 2. Convert to GGML
```sh
git clone https://github.com/openai/whisper            # needed for mel filters
git clone https://github.com/ggml-org/whisper.cpp
python whisper.cpp/models/convert-h5-to-ggml.py ./merged-small ./whisper ./out-small
# → out-small/ggml-model.bin  (fp16)
```

## 3. Quantize to 8-bit
```sh
cd whisper.cpp && cmake -B build && cmake --build build -j --config Release && cd ..
whisper.cpp/build/bin/quantize out-small/ggml-model.bin thalia-small-q8_0.bin q8_0
```
Optional for the report: also make a `q5_0` of `small` to show the size/accuracy trade-off.

## 4. Validate on the laptop (do this before touching the app)
Smoke test:
```sh
whisper.cpp/build/bin/whisper-cli -m thalia-small-q8_0.bin -l kn -nt -f test_clip.wav \
  --prompt "drain bolt, coolant, air out, clutch plate, pickup, silencer"
```
Full check — run the held-out **test split** through both the fp16 `.bin` and the `q8_0`
`.bin`, then compute WER / CER / JTA with the same normalization as the research eval (jiwer,
lowercase, strip punctuation). Script sketch:
```python
# eval_ggml.py  — python eval_ggml.py <model.bin> <test_manifest.jsonl> <lexicon.json>
import json, subprocess, sys, jiwer
model, manifest, lex = sys.argv[1:4]
terms = [e["term"] for e in json.load(open(lex))]
refs, hyps = [], []
for line in open(manifest):
    r = json.loads(line)
    out = subprocess.run(["whisper.cpp/build/bin/whisper-cli", "-m", model, "-l", "kn",
                          "-nt", "-np", "-f", r["path"]], capture_output=True, text=True).stdout
    refs.append(r["text"]); hyps.append(out.strip())
norm = lambda s: jiwer.RemovePunctuation()(s.lower())
R, H = [norm(x) for x in refs], [norm(x) for x in hyps]
hit = tot = 0
for r, h in zip(R, H):
    for t in terms:
        n = r.count(t); tot += n; hit += min(n, h.count(t))
print(json.dumps({"wer": jiwer.wer(R, H), "cer": jiwer.cer(R, H), "jta": hit / max(tot, 1)}))
```
**Accept a model if q8_0 is within ~1 point WER of fp16.** Record all numbers — they go into
`assets/models.json` → `eval` and into the report.

## 5. Publish
```sh
sha256sum thalia-*-q8_0.bin
huggingface-cli upload <your-hf-user>/thalia-models thalia-small-q8_0.bin
```
Use a public HF model repo (or GitHub Release). Direct download URL format:
`https://huggingface.co/<user>/thalia-models/resolve/main/thalia-small-q8_0.bin`.
Fill `url`, `sha256`, `sizeBytes`, `eval` for each model in `assets/models.json`.

## 6. In the app
- Downloaded to `documentDirectory/models/`, verified by sha256 (ARCHITECTURE §5).
- Loaded with `initWhisper({ filePath })`; transcribe with `language: 'kn'`, glossary `prompt`.
- One context at a time; `release()` before switching.
- During early dev you can `adb push thalia-small-q8_0.bin` to the app's files dir to skip
  downloads, but the app must not ship with it bundled.

## 7. On-device measurements (report)
On ≥ 2 Android phones (note model name, SoC, RAM), for each model, using the in-app
Benchmark screen with the bundled test clips:
- model load time (ms), transcribe time, **RTF = transcribe time / audio length**
- peak RAM (Android Studio profiler or `adb shell dumpsys meminfo <package>`)
- output text → WER/CER/JTA vs reference (export CSV, score on laptop with eval script)

Final report table: model × phone → size, WER, CER, JTA, RTF, load ms, RAM; plus fp16 vs q8_0.
