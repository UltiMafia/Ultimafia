"""Verify the ONNX export + int8 quantisation path works with this torch/transformers."""
import os, torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

NAME = "sentence-transformers/all-MiniLM-L6-v2"
OUT = "/home/tt/Documents/Ultimafia/rules_ml/export_test"
os.makedirs(OUT, exist_ok=True)

tok = AutoTokenizer.from_pretrained(NAME)
model = AutoModelForSequenceClassification.from_pretrained(NAME, num_labels=2)
model.eval()
d = tok(["hello world"], padding="max_length", truncation=True, max_length=96, return_tensors="pt")

p = OUT + "/model.onnx"
torch.onnx.export(model, (d["input_ids"], d["attention_mask"]), p,
                  input_names=["input_ids", "attention_mask"], output_names=["logits"],
                  dynamic_axes={"input_ids": {0: "batch", 1: "seq"},
                                "attention_mask": {0: "batch", 1: "seq"},
                                "logits": {0: "batch"}}, opset_version=17)
print("fp32 onnx: %.1f MB" % (os.path.getsize(p) / 1e6), flush=True)

from onnxruntime.quantization import quantize_dynamic, QuantType
q = OUT + "/model.int8.onnx"
quantize_dynamic(p, q, weight_type=QuantType.QInt8)
print("int8 onnx: %.1f MB" % (os.path.getsize(q) / 1e6), flush=True)

import onnxruntime as ort
s = ort.InferenceSession(q)
out = s.run(None, {"input_ids": d["input_ids"].numpy(),
                   "attention_mask": d["attention_mask"].numpy()})
print("int8 inference OK, logits shape", out[0].shape, flush=True)
print("EXPORT TEST PASSED", flush=True)
