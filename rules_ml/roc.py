"""ROC + precision/recall-vs-threshold for the SHIPPED int8 model on the held-out test split.

Two panels because they answer different questions:
  left  - ROC: ranking quality overall (threshold-free)
  right - precision/recall/F1 against the actual threshold, which is what you tune

Thresholds of interest are marked on both: 0.35 / 0.50 / 0.70 / 0.90.
"""
import json, random
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import roc_curve, roc_auc_score
from transformers import AutoTokenizer
import onnxruntime as ort

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
CLS = DIR + "/finetune_cls3_out"
OUT = "/mnt/c/Users/tt/AppData/Local/hermes/cache/scratch/roc.png"
SEED, MAXLEN = 42, 96


def label(r):
    return 1 if (r.get("noul") is not None and float(r["noul"]) >= 0.5
                 and r.get("choice") != "no_violation") else 0


rows = [json.loads(l) for l in open(DIR + "/decisions_final_clef.jsonl", encoding="utf-8")]
by_game = {}
for r in rows:
    by_game.setdefault(str(r.get("game_id")), []).append(r)
games = sorted(by_game)
random.Random(SEED).shuffle(games)
n = len(games)
te = [r for g in set(games[:int(n * 0.20)]) for r in by_game[g]]

tok = AutoTokenizer.from_pretrained(CLS)
so = ort.SessionOptions(); so.log_severity_level = 3
sess = ort.InferenceSession(CLS + "/model.int8.onnx", so)

p = []
for r in te:
    e = tok([r["target"]], padding="max_length", truncation=True, max_length=MAXLEN)
    lg = sess.run(None, {"input_ids": np.array(e["input_ids"], dtype=np.int64),
                         "attention_mask": np.array(e["attention_mask"], dtype=np.int64)})[0][0]
    pr = np.exp(lg - lg.max()); pr = pr / pr.sum()
    p.append(1.0 - pr[0])
p = np.array(p)
y = np.array([label(r) for r in te])

fpr, tpr, thr = roc_curve(y, p)
auc = roc_auc_score(y, p)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.6))
fig.suptitle("Ultimafia rule classifier - shipped int8 model, held-out test split "
             "(%d messages, %d violations)" % (len(te), y.sum()), fontsize=11)

# ---- ROC ----
ax1.plot(fpr, tpr, lw=2, color="#1f77b4", label="int8 ONNX  AUC = %.4f" % auc)
ax1.plot([0, 1], [0, 1], ls="--", lw=1, color="#999999", label="chance (AUC = 0.5)")
ax1.set_xlabel("false positive rate")
ax1.set_ylabel("true positive rate (recall)")
ax1.set_title("ROC", fontsize=11)
ax1.legend(loc="lower right", fontsize=9)
ax1.grid(alpha=0.25)

pts = []
for t in (0.35, 0.50, 0.70, 0.90):
    pred = p >= t
    tp = int((pred & (y == 1)).sum()); fp = int((pred & (y == 0)).sum())
    fn = int((~pred & (y == 1)).sum())
    P = tp / (tp + fp) if tp + fp else 0.0
    R = tp / (tp + fn) if tp + fn else 0.0
    F = 2 * P * R / (P + R) if P + R else 0.0
    neg = int((y == 0).sum())
    fpr_t = fp / neg if neg else 0.0
    pts.append((t, P, R, F, R, fpr_t))
    ax1.plot(fpr_t, R, "o", ms=7, color="#d62728")
    ax1.annotate("p>=%.2f" % t, (fpr_t, R), textcoords="offset points",
                 xytext=(8, -10), fontsize=8.5, color="#d62728")

# ---- precision / recall / F1 vs threshold ----
grid = np.arange(0.05, 0.96, 0.01)
Pv, Rv, Fv = [], [], []
for t in grid:
    pred = p >= t
    tp = int((pred & (y == 1)).sum()); fp = int((pred & (y == 0)).sum())
    fn = int((~pred & (y == 1)).sum())
    P = tp / (tp + fp) if tp + fp else 0.0
    R = tp / (tp + fn) if tp + fn else 0.0
    Pv.append(P); Rv.append(R); Fv.append(2 * P * R / (P + R) if P + R else 0.0)

ax2.plot(grid, Pv, lw=2, label="precision", color="#2ca02c")
ax2.plot(grid, Rv, lw=2, label="recall", color="#d62728")
ax2.plot(grid, Fv, lw=2, label="F1", color="#1f77b4", ls=":")
for t in (0.35, 0.50, 0.70, 0.90):
    ax2.axvline(t, ls="--", lw=1, color="#bbbbbb")
    ax2.text(t, 1.02, "%.2f" % t, ha="center", fontsize=8.5, color="#444444")
best = int(np.argmax(Fv))
ax2.plot(grid[best], Fv[best], "*", ms=13, color="#ff7f0e",
         label="best F1 = %.3f at p>=%.2f" % (Fv[best], grid[best]))
ax2.set_xlabel("threshold")
ax2.set_ylabel("score")
ax2.set_title("precision / recall / F1 vs threshold", fontsize=11)
ax2.set_ylim(0, 1.08)
ax2.legend(loc="lower left", fontsize=9)
ax2.grid(alpha=0.25)

plt.tight_layout(rect=[0, 0, 1, 0.94])
plt.savefig(OUT, dpi=140)
print("wrote %s" % OUT)
print("\nAUC = %.4f   (%d test messages, %d violations)" % (auc, len(te), y.sum()))
print("\n%-8s %8s %8s %8s" % ("thr", "prec", "recall", "F1"))
for t, P, R, F, tpr_, fpr_ in pts:
    print("%-8.2f %8.3f %8.3f %8.3f" % (t, P, R, F))
print("\nF1-optimal: p>=%.2f  F1=%.3f" % (grid[best], Fv[best]))
