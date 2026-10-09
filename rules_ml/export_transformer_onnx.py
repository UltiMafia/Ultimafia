"""Export the fine-tuned transformer to int8 ONNX for the Node harness.

Uses the legacy exporter: the dynamo exporter writes split external-weight files
whose shape inference breaks onnxruntime's dynamic quantiser.
"""
import os
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

OUT = "/home/tt/Documents/Ultimafia/rules_ml/finetune2_out"
MAXLEN = 96

tok = AutoTokenizer.from_pretrained(OUT)
model = AutoModelForSequenceClassification.from_pretrained(OUT)
model.eval()
d = tok(["dummy text"], padding="max_length", truncation=True, max_length=MAXLEN, return_tensors="pt")

p = OUT + "/model.onnx"
torch.onnx.export(model, (d["input_ids"], d["attention_mask"]), p, dynamo=False,
                  input_names=["input_ids", "attention_mask"], output_names=["logits"],
                  opset_version=17, do_constant_folding=True)
print("fp32 onnx: %.1f MB" % (os.path.getsize(p) / 1e6), flush=True)

from onnxruntime.quantization import quantize_dynamic, QuantType
q = OUT + "/model.int8.onnx"
quantize_dynamic(p, q, weight_type=QuantType.QInt8)
print("int8 onnx: %.1f MB" % (os.path.getsize(q) / 1e6), flush=True)

import numpy as np
import onnxruntime as ort
s = ort.InferenceSession(q)
print("inputs:", [i.name for i in s.get_inputs()], flush=True)

# parity: onnx vs torch on the flagged cases
CASES = ["you're great at the game", "unvote me or you're gting", "you're gting", "that's dumb",
         "you're dumb", "shut up", "can XYZ shut the fuck up?", "STFU let gov hammer",
         "bob lives in ohio", "you are a moron", "Z dumbtell", "im suing"]
e = tok(CASES, padding="max_length", truncation=True, max_length=MAXLEN, return_tensors="np")
feed = {k: v for k, v in e.items() if k in [i.name for i in s.get_inputs()]}
lg = s.run(None, feed)[0]
z = lg - lg.max(axis=1, keepdims=True)
p_onnx = (np.exp(z) / np.exp(z).sum(axis=1, keepdims=True))[:, 1]
with torch.no_grad():
    p_torch = torch.softmax(model(**d).logits, dim=-1)[:, 1].numpy() if False else None
et = tok(CASES, padding="max_length", truncation=True, max_length=MAXLEN, return_tensors="pt")
with torch.no_grad():
    p_torch = torch.softmax(model(**et).logits, dim=-1)[:, 1].numpy()
print("\ncases: onnx vs torch", flush=True)
for c, a, b in zip(CASES, p_onnx, p_torch):
    print("  %-30s onnx=%.3f torch=%.3f" % (c, a, b), flush=True)
print("max|diff| = %.2e" % float(np.abs(p_onnx - p_torch).max()), flush=True)
