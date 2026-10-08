"""Measure real CPU fine-tuning throughput for MiniLM-L6 on this machine."""
import json, time
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
NAME = "sentence-transformers/all-MiniLM-L6-v2"

rows = [json.loads(l) for l in open(DIR + "/decisions_final.jsonl")]
texts = [r["target"] for r in rows]
y = [1 if (r["noul"] >= 0.5 and r.get("choice") != "no_violation") else 0 for r in rows]
n = len(texts)
print("docs=%d positives=%d  torch threads=%d" % (n, sum(y), torch.get_num_threads()), flush=True)

tok = AutoTokenizer.from_pretrained(NAME)
model = AutoModelForSequenceClassification.from_pretrained(NAME, num_labels=2)
print("params: %.1fM" % (sum(p.numel() for p in model.parameters()) / 1e6), flush=True)
model.train()
opt = torch.optim.AdamW(model.parameters(), lr=2e-5)

BS, MAXLEN = 32, 64
enc = tok(texts[:BS], padding="max_length", truncation=True, max_length=MAXLEN, return_tensors="pt")
lb = torch.tensor(y[:BS])

for _ in range(2):  # warmup
    out = model(**enc, labels=lb); out.loss.backward(); opt.step(); opt.zero_grad()

N = 20
t0 = time.time()
for _ in range(N):
    out = model(**enc, labels=lb); out.loss.backward(); opt.step(); opt.zero_grad()
dt = (time.time() - t0) / N
rate = BS / dt
print("\nper-step (batch %d, len %d): %.3fs  ->  %.1f examples/sec" % (BS, MAXLEN, dt, rate), flush=True)
for epochs in (3, 5):
    secs = n * epochs / rate
    print("  %d docs x %d epochs = %d passes -> %.0f s (%.1f min)" % (n, epochs, n * epochs, secs, secs / 60), flush=True)
for scale in (50000,):
    secs = scale * 3 / rate
    print("  if labelled %d docs x 3 epochs -> %.1f h" % (scale, secs / 3600), flush=True)
