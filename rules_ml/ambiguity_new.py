"""Agreement by confidence stratum, using the CURRENT model's probabilities."""
import json
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
OUT = DIR + "/finetune2_out"
SET = [json.loads(l) for l in open(DIR + "/eval_set.jsonl", encoding="utf-8")]
DONE = json.load(open(DIR + "/eval_done.json"))
by_i = {i: r for i, r in enumerate(SET)}
rows = [(by_i[d["i"]], d) for d in DONE if d["i"] in by_i]
print("judged: %d" % len(rows), flush=True)

tok = AutoTokenizer.from_pretrained(OUT)
model = AutoModelForSequenceClassification.from_pretrained(OUT)
model.eval()
p = []
msgs = [r["message"] for r, d in rows]
for i in range(0, len(msgs), 64):
    e = tok(msgs[i:i + 64], padding="max_length", truncation=True, max_length=96,
            return_tensors="pt")
    with torch.no_grad():
        p.append(torch.softmax(model(**e).logits, dim=-1)[:, 1].numpy())
p = np.concatenate(p)
y = np.array([1 if d["human"] == "flag" else 0 for r, d in rows])


def band(v):
    if v >= 0.70:
        return "confident FLAG  (p>=0.70)"
    if v <= 0.30:
        return "confident OK    (p<=0.30)"
    return "UNCERTAIN       (0.30-0.70)"


print("\n%-28s %5s %8s %8s %8s" % ("stratum (current model)", "n", "you flag", "agree", "rate"), flush=True)
for s in ("confident FLAG  (p>=0.70)", "confident OK    (p<=0.30)", "UNCERTAIN       (0.30-0.70)"):
    idx = [i for i, v in enumerate(p) if band(v) == s]
    if not idx:
        continue
    yy = y[idx]
    pred = (p[idx] >= 0.5).astype(int)
    ag = (pred == yy).mean()
    print("%-28s %5d %8d %8d %7.0f%%" % (s, len(idx), int(yy.sum()), int((pred == yy).sum()),
                                         100 * ag), flush=True)

print("\n=== does the model know when it is unsure? ===", flush=True)
print("  (an honest model has low accuracy only in the uncertain band)", flush=True)
print("  you flagged %d/%d overall (%.0f%%)" % (int(y.sum()), len(y), 100 * y.mean()), flush=True)

print("\n=== your own consistency ===", flush=True)
seen = {}
dup = 0
for r, d in rows:
    k = r["message"]
    if k in seen and seen[k] != d["human"]:
        dup += 1
    seen[k] = d["human"]
print("  same message judged both ways: %d" % dup, flush=True)
