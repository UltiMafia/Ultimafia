"""Real metrics from the hand-check set, with the stratification undone by weighting.

Sampling strata (by the model's own call): flag 509, ok 1230, boundary 164 ->
we took 150/150/100. So a raw average over the judged rows is biased; weighting
each row by (stratum size / stratum sampled) recovers the population estimate.
"""
import json

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
SET = [json.loads(l) for l in open(DIR + "/eval_set.jsonl", encoding="utf-8")]
try:
    DONE = json.load(open(DIR + "/eval_done.json"))
except Exception:
    DONE = []
print("judged: %d / %d" % (len(DONE), len(SET)), flush=True)


def stratum(r):
    if r["model_p"] >= 0.70:
        return "flag"
    if r["model_p"] <= 0.30:
        return "ok"
    return "boundary"


# stratum sizes in the held-out pool vs how many we sampled
POOL = {"flag": 509, "ok": 1230, "boundary": 164}
SAMP = {"flag": 150, "ok": 150, "boundary": 100}
by_i = {i: r for i, r in enumerate(SET)}

tp = fp = fn = tn = 0.0
model_flag_human_flag = model_flag_human_ok = 0
agree = 0
rows = []
for d in DONE:
    r = by_i.get(d["i"])
    if not r:
        continue
    w = POOL[stratum(r)] / SAMP[stratum(r)]
    m = 1 if d["model"] == "flag" else 0
    h = 1 if d["human"] == "flag" else 0
    rows.append((r, d, w))
    if m == 1 and h == 1: tp += w
    if m == 1 and h == 0: fp += w
    if m == 0 and h == 1: fn += w
    if m == 1 and h == 0: model_flag_human_ok += 1
    if m == 1 and h == 1: model_flag_human_flag += 1
    agree += (m == h)

pr = tp / (tp + fp) if tp + fp else 0.0
rc = tp / (tp + fn) if tp + fn else 0.0
f1 = 2 * pr * rc / (pr + rc) if pr + rc else 0.0
print("\n=== weighted (undone stratification) ===", flush=True)
print("  precision = %.3f   recall = %.3f   F1 = %.3f" % (pr, rc, f1), flush=True)
print("  raw agreement = %d/%d = %.1f%%" % (agree, len(rows), 100 * agree / max(len(rows), 1)), flush=True)

print("\n=== where it is wrong ===", flush=True)
for name, sel in (("model FLAGGED, human said ok", lambda r, d: d["model"] == "flag" and d["human"] == "ok"),
                  ("model passed, human flagged", lambda r, d: d["model"] == "ok" and d["human"] == "flag")):
    bad = [(r, d) for (r, d, w) in rows if sel(r, d)]
    print("\n  %s: %d" % (name, len(bad)), flush=True)
    for r, d in bad[:8]:
        print("    p=%.2f | %s" % (r["model_p"], r["message"][:74].replace("\n", " ")), flush=True)

# the owner's example
print("\n=== the owner's example ===", flush=True)
import numpy as np, torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
OUT = DIR + "/finetune2_out"
tok = AutoTokenizer.from_pretrained(OUT)
model = AutoModelForSequenceClassification.from_pretrained(OUT)
model.eval()
EX = ["i want to get home and play this but the fucking train isnt moving in this tunnel for 10 minutes and I have a 7% battey",
      "the fucking train is late again", "this fucking traffic is awful",
      "you are fucking awful", "fucking terrible vote"]
e = tok(EX, padding="max_length", truncation=True, max_length=96, return_tensors="pt")
with torch.no_grad():
    p = torch.softmax(model(**e).logits, dim=-1)[:, 1].numpy()
for c, q in zip(EX, p):
    print("  p=%.3f  %s" % (q, c[:70]), flush=True)
