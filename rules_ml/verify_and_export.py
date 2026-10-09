"""1) score the trained PyTorch model (is training actually good?)
   2) export the same weights via optimum and int8-quantise
   3) score the quantised ONNX to prove the serving path is correct
"""
import os, subprocess, sys
import numpy as np
import torch

OUT = "/home/tt/Documents/Ultimafia/rules_ml/finetune_out"
OPT = "/home/tt/Documents/Ultimafia/rules_ml/finetune_onnx"
MAXLEN = 96

SANITY = [("Z dumbtell", 0), ("that awkward pause feels like a dumbtell", 0),
          ("fos on bob for that vote", 0), ("gt is possible here but not locked", 0),
          ("you're great at the game", 0), ("you're really good at this", 0),
          ("great game", 0), ("gg wp", 0), ("good job", 0),
          ("im suing", 1), ("you are a moron", 1),
          ("i can report you and u can get reported for ogi", 1), ("shut the fuck up", 1),
          ("u gt btw", 1), ("yes link a game so i can report u >:3", 1),
          ("you're gamethrowing", 1), ("you are gamethrowing", 1),
          ("you're throwing this game", 1), ("stop gamethrowing", 1)]

from transformers import AutoTokenizer, AutoModelForSequenceClassification
tok = AutoTokenizer.from_pretrained(OUT)
model = AutoModelForSequenceClassification.from_pretrained(OUT)
model.eval()


def score_torch(t):
    e = tok(t, padding="max_length", truncation=True, max_length=MAXLEN, return_tensors="pt")
    with torch.no_grad():
        return float(torch.softmax(model(**e).logits, dim=-1)[0, 1])


print("=== trained PyTorch model ===", flush=True)
ok = 0
for s, w in SANITY:
    p = score_torch(s)
    g = 1 if p >= 0.5 else 0
    ok += (g == w)
    print("  %-46s %-5s %.3f  %s%s" % (s[:46], "FLAG" if w else "ok", p,
                                       "FLAG" if g else "ok", "" if g == w else "  <-- WRONG"), flush=True)
print("  TORCH SANE %d/%d" % (ok, len(SANITY)), flush=True)

print("\n=== exporting via optimum ===", flush=True)
r = subprocess.run([sys.executable, "-m", "optimum.exporters.onnx", "--model", OUT,
                    "--task", "text-classification", OPT], capture_output=True, text=True)
print("  rc=%d" % r.returncode, flush=True)
if r.returncode:
    print("  err:", (r.stderr or "")[-400:], flush=True)
    sys.exit(1)

fp = os.path.join(OPT, "model.onnx")
print("  fp32: %.1f MB" % (os.path.getsize(fp) / 1e6), flush=True)
from onnxruntime.quantization import quantize_dynamic, QuantType
qp = os.path.join(OPT, "model.int8.onnx")
try:
    quantize_dynamic(fp, qp, weight_type=QuantType.QInt8)
    print("  int8: %.1f MB" % (os.path.getsize(qp) / 1e6), flush=True)
except Exception as e:
    print("  int8 failed:", str(e)[:200], flush=True)
    sys.exit(1)

import onnxruntime as ort
sess = ort.InferenceSession(qp)
IN = [i.name for i in sess.get_inputs()]
print("  onnx inputs:", IN, flush=True)


def score_onnx(t):
    e = tok(t, padding="max_length", truncation=True, max_length=MAXLEN, return_tensors="np")
    feed = {k: v for k, v in e.items() if k in IN}
    logits = sess.run(None, feed)[0][0]
    z = logits - logits.max()
    return float((np.exp(z) / np.exp(z).sum())[1])


print("\n=== int8 ONNX (optimum export) ===", flush=True)
ok = 0
for s, w in SANITY:
    p = score_onnx(s)
    g = 1 if p >= 0.5 else 0
    ok += (g == w)
    print("  %-46s %-5s %.3f  %s%s" % (s[:46], "FLAG" if w else "ok", p,
                                       "FLAG" if g else "ok", "" if g == w else "  <-- WRONG"), flush=True)
print("  ONNX SANE %d/%d" % (ok, len(SANITY)), flush=True)
