"""Export the 4-class head to int8 ONNX for the Node harness.

Same approach as the binary export: legacy exporter (dynamo=False) with a FIXED batch of 1,
because the dynamo path emits external-weight files that break int8 shape inference.
"""
import os
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from onnxruntime.quantization import quantize_dynamic, QuantType

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
SRC = DIR + "/finetune_cls3_out"
MAXLEN = 96

tok = AutoTokenizer.from_pretrained(SRC)
model = AutoModelForSequenceClassification.from_pretrained(SRC)
model.eval()

d = tok(["dummy"], padding="max_length", truncation=True, max_length=MAXLEN, return_tensors="pt")
fp32 = SRC + "/model.onnx"
torch.onnx.export(model, (d["input_ids"], d["attention_mask"]), fp32, dynamo=False,
                  input_names=["input_ids", "attention_mask"], output_names=["logits"],
                  opset_version=17, do_constant_folding=True)
print("fp32 onnx: %.1f MB" % (os.path.getsize(fp32) / 1e6), flush=True)

int8 = SRC + "/model.int8.onnx"
quantize_dynamic(fp32, int8, weight_type=QuantType.QInt8)
print("int8 onnx: %.1f MB" % (os.path.getsize(int8) / 1e6), flush=True)

# parity: PyTorch vs the int8 graph, one case at a time (fixed batch=1)
import onnxruntime as ort
so = ort.SessionOptions()
so.log_severity_level = 3
s = ort.InferenceSession(int8, so)
CASES = ["you're great at the game", "unvote me or you're gting", "you're gting",
         "that's dumb", "you're dumb", "shut up", "can XYZ shut the fuck up?",
         "bob lives in ohio", "you are a moron", "im suing", "he's not gay lol",
         "u got a fucking cc"]
worst = 0.0
for c in CASES:
    e = tok([c], padding="max_length", truncation=True, max_length=MAXLEN, return_tensors="pt")
    with torch.no_grad():
        pt = torch.softmax(model(**e).logits, dim=-1).numpy()[0]
    o = s.run(None, {"input_ids": e["input_ids"].numpy().astype(np.int64),
                     "attention_mask": e["attention_mask"].numpy().astype(np.int64)})[0][0]
    o = np.exp(o - o.max()) / np.exp(o - o.max()).sum()
    dmax = float(np.abs(pt - o).max())
    worst = max(worst, dmax)
    print("  %-32s pt=%s int8=%s  maxdiff=%.4f" % (
        c[:32], np.round(pt, 3), np.round(o, 3), dmax), flush=True)
print("\nworst abs diff: %.4f" % worst, flush=True)
