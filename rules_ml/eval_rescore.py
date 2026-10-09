"""Re-score the hand-checked rows with the CURRENT model and compare to the human labels.

The stored 'model' field in eval_done.json is the OLD model's call, so it cannot be used
to judge the new model. Score the messages fresh.
"""
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
print("hand-checked rows: %d" % len(rows), flush=True)

tok = AutoTokenizer.from_pretrained(OUT)
model = AutoModelForSequenceClassification.from_pretrained(OUT)
model.eval()
msgs = [r["message"] for r, d in rows]
p = []
B = 64
for i in range(0, len(msgs), B):
    e = tok(msgs[i:i + B], padding="max_length", truncation=True, max_length=96,
            return_tensors="pt")
    with torch.no_grad():
        p.append(torch.softmax(model(**e).logits, dim=-1)[:, 1].numpy())
p = np.concatenate(p)

# stratification weights: the set was drawn 150/150/100 from pools of 509/1230/164
def stratum(r):
    if r["model_p"] >= 0.70:
        return "flag"
    if r["model_p"] <= 0.30:
        return "ok"
    return "boundary"

POOL = {"flag": 509, "ok": 1230, "boundary": 164}
SAMP = {"flag": 150, "ok": 150, "boundary": 100}

y = np.array([1 if d["human"] == "flag" else 0 for r, d in rows])
w = np.array([POOL[stratum(r)] / SAMP[stratum(r)] for r, d in rows])

print("\n%-6s %8s %8s %8s %8s %8s" % ("thr", "flagged", "prec", "recall", "F1", "agree"), flush=True)
for thr in (0.35, 0.40, 0.50, 0.70, 0.90):
    pred = (p >= thr).astype(int)
    tp = (w * (pred & y)).sum(); fp = (w * (pred & (1 - y))).sum()
    fn = (w * ((1 - pred) & y)).sum()
    pr = tp / (tp + fp) if tp + fp else 0
    rc = tp / (tp + fn) if tp + fn else 0
    f1 = 2 * pr * rc / (pr + rc) if pr + rc else 0
    ag = (pred == y).mean()
    print("%-6.2f %8d %8.3f %8.3f %8.3f %8.3f" % (thr, pred.sum(), pr, rc, f1, ag), flush=True)

print("\n=== before/after on YOUR examples (new model) ===", flush=True)
CHECK = ["u got a fucking cc", "that vote is fucking terrible bruh",
         "i want to get home and play this but the fucking train isnt moving in this tunnel for 10 minutes and I have a 7% battey",
         "gamethrower why you driving a bus over me lmao", "He's not gay lol",
         "you're gting", "you are fucking terrible", "can XYZ shut the fuck up?",
         "bob lives in ohio", "shut up"]
e = tok(CHECK, padding="max_length", truncation=True, max_length=96, return_tensors="pt")
with torch.no_grad():
    q = torch.softmax(model(**e).logits, dim=-1)[:, 1].numpy()
for c, v in zip(CHECK, q):
    print("  p=%.3f  %s" % (v, c[:64]), flush=True)
