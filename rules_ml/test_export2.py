"""Find an ONNX export recipe that int8-quantises cleanly.

Variant A: torch dynamo exporter, single-file (no external data)
Variant B: optimum-cli export (maintained transformers path)
"""
import os, subprocess, sys, torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

NAME = "sentence-transformers/all-MiniLM-L6-v2"
BASE = "/home/tt/Documents/Ultimafia/rules_ml/export_test2"
os.makedirs(BASE, exist_ok=True)


def try_quantise(onnx_path, tag):
    try:
        from onnxruntime.quantization import quantize_dynamic, QuantType
        q = onnx_path.replace(".onnx", ".int8.onnx")
        quantize_dynamic(onnx_path, q, weight_type=QuantType.QInt8)
        mb = os.path.getsize(q) / 1e6
        import onnxruntime as ort
        import numpy as np
        s = ort.InferenceSession(q)
        ids = np.ones((1, 96), dtype=np.int64); am = np.ones((1, 96), dtype=np.int64)
        out = s.run(None, {"input_ids": ids, "attention_mask": am})
        print("[%s] int8 OK: %.1f MB, logits %s" % (tag, mb, out[0].shape), flush=True)
        return True
    except Exception as e:
        print("[%s] int8 FAILED: %s" % (tag, str(e)[:160]), flush=True)
        return False


# --- Variant A: dynamo exporter, single file -------------------------------
print("=== Variant A: torch dynamo, external_data=False ===", flush=True)
try:
    tok = AutoTokenizer.from_pretrained(NAME)
    model = AutoModelForSequenceClassification.from_pretrained(NAME, num_labels=2)
    model.eval()
    d = tok(["hello world"], padding="max_length", truncation=True, max_length=96, return_tensors="pt")
    pa = BASE + "/model.onnx"
    kw = dict(input_names=["input_ids", "attention_mask"], output_names=["logits"],
              opset_version=17, do_constant_folding=True)
    try:
        torch.onnx.export(model, (d["input_ids"], d["attention_mask"]), pa, dynamo=False, **kw)
        print("  (legacy exporter)", flush=True)
    except Exception as e:
        print("  legacy exporter unavailable (%s); trying dynamo with external_data=False" % str(e)[:80], flush=True)
        torch.onnx.export(model, (d["input_ids"], d["attention_mask"]), pa,
                          external_data=False, **kw)
    print("  size: %.1f MB" % (os.path.getsize(pa) / 1e6), flush=True)
    try_quantise(pa, "A")
except Exception as e:
    print("  Variant A export failed:", str(e)[:200], flush=True)

# --- Variant B: optimum-cli ------------------------------------------------
print("\n=== Variant B: optimum-cli ===", flush=True)
pb = BASE + "/opt"
r = subprocess.run([sys.executable, "-m", "optimum.exporters.onnx",
                    "--model", NAME, "--task", "text-classification", pb],
                   capture_output=True, text=True)
print("  rc=%d" % r.returncode, flush=True)
if r.returncode != 0:
    print("  stderr:", (r.stderr or "")[-300:], flush=True)
else:
    for f in os.listdir(pb):
        if f.endswith(".onnx"):
            fp = os.path.join(pb, f)
            print("  %s  %.1f MB" % (f, os.path.getsize(fp) / 1e6), flush=True)
            try_quantise(fp, "B")
