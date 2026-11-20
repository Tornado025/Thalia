"""WER / CER / jargon-term accuracy of a GGML model via whisper-cli (docs/MODEL_PIPELINE.md §4).

python scripts/eval_ggml.py <model.bin> <test_manifest.jsonl> <lexicon.json> [whisper-cli path]
Manifest lines: {"path": "...wav", "text": "reference transcript", ...}
"""
import json
import subprocess
import sys

import jiwer

model, manifest, lex = sys.argv[1:4]
cli = sys.argv[4] if len(sys.argv) > 4 else "whisper.cpp/build/bin/whisper-cli"
terms = [e["term"] for e in json.load(open(lex, encoding="utf-8"))]

refs, hyps = [], []
for line in open(manifest, encoding="utf-8"):
    r = json.loads(line)
    out = subprocess.run(
        [cli, "-m", model, "-l", "kn", "-nt", "-np", "-f", r["path"]],
        capture_output=True, text=True, check=True,
    ).stdout
    refs.append(r["text"])
    hyps.append(out.strip())

norm = lambda s: jiwer.RemovePunctuation()(s.lower())  # noqa: E731
R, H = [norm(x) for x in refs], [norm(x) for x in hyps]
hit = tot = 0
for r, h in zip(R, H):
    for t in terms:
        n = r.count(t)
        tot += n
        hit += min(n, h.count(t))
print(json.dumps({"n": len(R), "wer": jiwer.wer(R, H), "cer": jiwer.cer(R, H), "jta": hit / max(tot, 1)}))
