"""Score the play/person cases with the NEW model, then re-export ONNX for the harness."""
import os
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

OUT = "/home/tt/Documents/Ultimafia/rules_ml/finetune2_out"
MAXLEN = 96

CASES = [
    ("that vote is fucking terrible bruh", 0), ("that vote is fucking terrible", 0),
    ("fucking terrible bruh", 0), ("your vote is terrible", 0), ("this vote is garbage", 0),
    ("shit play", 0), ("that was a terrible play", 0), ("your reads are trash", 0),
    ("you are fucking terrible", 1), ("you are terrible", 1), ("you're garbage", 1),
    # regressions to watch
    ("shut up", 0), ("STFU let gov hammer", 0), ("you're gting", 1),
    ("you're great at the game", 0), ("that's dumb", 0), ("bob lives in ohio", 1),
    ("can XYZ shut the fuck up?", 1), ("im suing", 1), ("Z dumbtell", 0),
]

tok = AutoTokenizer.from_pretrained(OUT)
model = AutoModelForSequenceClassification.from_pretrained(OUT)
model.eval()   # not optional: dropout otherwise corrupts these numbers

enc = tok([c for c, _ in CASES], padding="max_length", truncation=True,
          max_length=MAXLEN, return_tensors="pt")
with torch.no_grad():
    p = torch.softmax(model(**enc).logits, dim=-1)[:, 1].numpy()

print("%-38s %-6s %-6s %s" % ("case", "expect", "p", "verdict"), flush=True)
wrong = 0
for (c, want), q in zip(CASES, p):
    got = 1 if q >= 0.5 else 0
    bad = "" if got == want else "   <-- WRONG"
    if bad:
        wrong += 1
    print("%-38s %-6s %.3f  %s%s" % (c[:38], "FLAG" if want else "ok", q,
                                     "FLAG" if got else "ok", bad), flush=True)
print("\n%d/%d correct" % (len(CASES) - wrong, len(CASES)), flush=True)

# re-export for the harness
onnx_path = OUT + "/model.onnx"
d = tok(["dummy"], padding="max_length", truncation=True, max_length=MAXLEN, return_tensors="pt")
torch.onnx.export(model, (d["input_ids"], d["attention_mask"]), onnx_path, dynamo=False,
                  input_names=["input_ids", "attention_mask"], output_names=["logits"],
                  opset_version=17, do_constant_folding=True)
from onnxruntime.quantization import quantize_dynamic, QuantType
q = OUT + "/model.int8.onnx"
quantize_dynamic(onnx_path, q, weight_type=QuantType.QInt8)
print("\nre-exported int8 onnx: %.1f MB" % (os.path.getsize(q) / 1e6), flush=True)
