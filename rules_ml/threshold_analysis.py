"""1) What threshold actually buys what precision/recall (held-out test).
   2) Where 'that vote is fucking terrible bruh' sits, and what the judge called it.
"""
import json, random
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
OUT = DIR + "/finetune2_out"
SEED = 42


def lab(r):
    return 1 if (r["noul"] >= 0.5 and r.get("choice") != "no_violation") else 0


rows = [json.loads(l) for l in open(DIR + "/decisions_final_clef.jsonl", encoding="utf-8")]
by_game = {}
for r in rows:
    by_game.setdefault(str(r.get("game_id")), []).append(r)
games = sorted(by_game)
random.Random(SEED).shuffle(games)
n = len(games)
test_g = set(games[:int(n * 0.20)])
te = [r for g in test_g for r in by_game[g]]
y = np.array([lab(r) for r in te])

tok = AutoTokenizer.from_pretrained(OUT)
model = AutoModelForSequenceClassification.from_pretrained(OUT)
model.eval()

probs = []
B = 64
for i in range(0, len(te), B):
    batch = [r["target"] for r in te[i:i + B]]
    e = tok(batch, padding="max_length", truncation=True, max_length=96, return_tensors="pt")
    with torch.no_grad():
        probs.append(torch.softmax(model(**e).logits, dim=-1)[:, 1].numpy())
p = np.concatenate(probs)

print("test rows=%d positives=%d" % (len(y), int(y.sum())), flush=True)
print("\n%-8s %8s %8s %8s %8s %8s" % ("thr", "flag", "TP", "FP", "prec", "recall"), flush=True)
for thr in (0.30, 0.35, 0.40, 0.50, 0.70, 0.85, 0.90):
    pred = (p >= thr).astype(int)
    tp = int(((pred == 1) & (y == 1)).sum()); fp = int(((pred == 1) & (y == 0)).sum())
    fn = int(((pred == 0) & (y == 1)).sum())
    pr = tp / (tp + fp) if tp + fp else 0.0
    rc = tp / (tp + fn) if tp + fn else 0.0
    print("%-8.2f %8d %8d %8d %8.3f %8.3f" % (thr, int(pred.sum()), tp, fp, pr, rc), flush=True)

print("\n=== the flagged blindspot ===", flush=True)
for c in ["that vote is fucking terrible bruh", "that vote is fucking terrible",
          "fucking terrible bruh", "your vote is terrible", "you are terrible"]:
    e = tok([c], padding="max_length", truncation=True, max_length=96, return_tensors="pt")
    with torch.no_grad():
        q = float(torch.softmax(model(**e).logits, dim=-1)[0, 1])
    print("  %-36s transformer=%.3f" % (c, q), flush=True)

m = [r for r in rows if "terrible" in (r["target"] or "").lower()]
print("\nrows in the corpus containing 'terrible': %d" % len(m), flush=True)
pos = sum(1 for r in m if lab(r))
print("  labelled violation: %d" % pos, flush=True)
for r in m[:8]:
    print("    clef=%.2f %-24s %r" % (r["noul"], str(r.get("choice"))[:24], r["target"][:52]), flush=True)
