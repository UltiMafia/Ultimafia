"""Parity: int8 ONNX (batch=1) vs PyTorch, on the flagged cases."""
import numpy as np
import onnxruntime as ort
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

OUT = "/home/tt/Documents/Ultimafia/rules_ml/finetune2_out"
MAXLEN = 96
CASES = ["you're great at the game", "unvote me or you're gting", "you're gting", "that's dumb",
         "you're dumb", "shut up", "can XYZ shut the fuck up?", "STFU let gov hammer",
         "bob lives in ohio", "you are a moron", "Z dumbtell", "im suing", "gg wp", "nice one"]

tok = AutoTokenizer.from_pretrained(OUT)
model = AutoModelForSequenceClassification.from_pretrained(OUT)
model.eval()
s = ort.InferenceSession(OUT + "/model.int8.onnx")
names = [i.name for i in s.get_inputs()]

diffs = []
for c in CASES:
    e = tok([c], padding="max_length", truncation=True, max_length=MAXLEN, return_tensors="np")
    feed = {k: v for k, v in e.items() if k in names}
    lg = s.run(None, feed)[0][0]
    z = np.exp(lg - lg.max())
    po = float((z / z.sum())[1])
    et = tok([c], padding="max_length", truncation=True, max_length=MAXLEN, return_tensors="pt")
    with torch.no_grad():
        pt = float(torch.softmax(model(**et).logits, dim=-1)[0, 1])
    diffs.append(abs(po - pt))
    print("  %-30s onnx=%.4f torch=%.4f  diff=%.2e" % (c, po, pt, abs(po - pt)), flush=True)

print("\nmax|diff| = %.3e  (int8 quantisation error expected ~1e-2)" % max(diffs), flush=True)
