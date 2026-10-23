"""Final hand-check metrics.

Two things that matter for honesty here:
  * score with the SHIPPED int8 model, not fp32
  * split rows into those judged BEFORE the rubric was frozen (indices 0-121, which the
    targeting rule was written using) and those judged after - the latter are the clean
    measurement. A single pooled number would flatter us.
"""
import json
import numpy as np
from transformers import AutoTokenizer
import onnxruntime as ort

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
CLS = DIR + "/finetune_cls3_out"
MAXLEN = 96
FITTED = 122   # rows 0..121 were used to derive the targeting rule

SET = [json.loads(l) for l in open(DIR + "/eval_set.jsonl", encoding="utf-8")]
DONE = json.load(open(DIR + "/eval_done.json"))
try:
    SKIP = json.load(open(DIR + "/eval_skipped.json"))
except Exception:
    SKIP = []
print("judged: %d   skipped: %d   total: %d" % (len(DONE), len(SKIP), len(SET)))

by_i = {i: r for i, r in enumerate(SET)}
rows = [(by_i[d["i"]], d) for d in DONE if d["i"] in by_i]
rows.sort(key=lambda x: x[1]["i"])
print("usable judgements: %d" % len(rows))

tok = AutoTokenizer.from_pretrained(CLS)
so = ort.SessionOptions(); so.log_severity_level = 3
sess = ort.InferenceSession(CLS + "/model.int8.onnx", so)


def pviol(text):
    e = tok([text], padding="max_length", truncation=True, max_length=MAXLEN)
    lg = sess.run(None, {"input_ids": np.array(e["input_ids"], dtype=np.int64),
                         "attention_mask": np.array(e["attention_mask"], dtype=np.int64)})[0][0]
    pr = np.exp(lg - lg.max()); pr = pr / pr.sum()
    return float(1.0 - pr[0])


p = np.array([pviol(r["message"]) for r, d in rows])
y = np.array([1 if d["human"] == "flag" else 0 for r, d in rows])

# stratification weights: the set was drawn 150/150/100 from pools of 509/1230/164
def stratum(r):
    if r["model_p"] >= 0.70:
        return "flag"
    if r["model_p"] <= 0.30:
        return "ok"
    return "boundary"

POOL = {"flag": 509, "ok": 1230, "boundary": 164}
SAMP = {"flag": 150, "ok": 150, "boundary": 100}
w = np.array([POOL[stratum(r)] / SAMP[stratum(r)] for r, d in rows])


def stats(mask, name):
    yy, pp, ww = y[mask], p[mask], w[mask]
    print("\n=== %s  (n=%d, violations=%d, %.0f%%) ===" % (name, mask.sum(), yy.sum(), 100 * yy.mean()))
    print("  %-7s %8s %8s %8s %8s %8s" % ("thr", "flag%", "prec", "recall", "F1", "agree"))
    for t in (0.35, 0.40, 0.50, 0.70):
        pred = (pp >= t).astype(int)
        tp = (ww * (pred & yy)).sum(); fp = (ww * (pred & (1 - yy))).sum()
        fn = (ww * ((1 - pred) & yy)).sum()
        pr = tp / (tp + fp) if tp + fp else 0
        rc = tp / (tp + fn) if tp + fn else 0
        f1 = 2 * pr * rc / (pr + rc) if pr + rc else 0
        ag = (pred == yy).mean()
        print("  %-7.2f %8.0f %8.3f %8.3f %8.3f %8.3f" % (t, 100 * pred.mean(), pr, rc, f1, ag))


allmask = np.ones(len(rows), dtype=bool)
fitted = np.array([d["i"] < FITTED for r, d in rows])
stats(allmask, "ALL judged rows")
stats(~fitted, "CLEAN rows (judged after the rubric was frozen)")
stats(fitted, "rows used to write the rubric (optimistic)")

print("\n=== trivial baselines on the clean rows (for scale) ===")
yy = y[~fitted]; ww = w[~fitted]
tot = ww.sum()
always_vio = (ww * yy).sum() / tot
print("  always say VIOLATION : precision %.3f, recall 1.000" % always_vio)
print("  always say OK        : agreement %.3f (the majority class share)" % (1 - yy.mean()))
print("  you flagged %.0f%% of rows overall" % (100 * y.mean()))

print("\n=== agreement by confidence (clean rows) ===")
for s in ("flag", "ok", "boundary"):
    sel = np.array([stratum(r) == s for r, d in rows]) & (~fitted)
    if sel.sum() == 0:
        continue
    pred = (p[sel] >= 0.5).astype(int)
    print("  model-confident %-9s n=%-3d agree %.0f%%" % (s, sel.sum(), 100 * (pred == y[sel]).mean()))

if SKIP:
    print("\n=== what got skipped (%d) ===" % len(SKIP))
    for s in SKIP[:12]:
        print("   p=%.2f  %s" % (s.get("model_p", -1), (s.get("message") or "")[:66].replace("\n", " ")))
