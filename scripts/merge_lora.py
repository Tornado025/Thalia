"""Merge a LoRA adapter into its Whisper base (docs/MODEL_PIPELINE.md §1).

python scripts/merge_lora.py <base_id> <lora_dir> <out_dir>
"""
import sys

from peft import PeftModel
from transformers import WhisperForConditionalGeneration, WhisperProcessor

base_id, lora_dir, out = sys.argv[1:4]
base = WhisperForConditionalGeneration.from_pretrained(base_id, torch_dtype="auto")
model = PeftModel.from_pretrained(base, lora_dir).merge_and_unload()
model.save_pretrained(out, safe_serialization=False)  # convert-h5-to-ggml.py reads pytorch_model.bin
WhisperProcessor.from_pretrained(base_id).save_pretrained(out)
