"""Re-score the held-out test split with the SHIPPED model - the int8 ONNX - and
compare against the fp32 numbers we have been reporting.

The quantisation gap reaches ~0.40 on individual messages, so the fp32 metrics may
not describe the artifact at all. Same grouped split (seed 42) as every other run.
"""
import json, random
import numpy as np
from transformers import AutoTokenizer
import onnxruntime as ort

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
CLS = DIR + "/finetune_cls3_out"
SEED = 42
MAXLEN = 96


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
test_g = set(games[:int(n * 0.20)])
val_g = set(games[int(n * 0.20):int(n * 0.35)])
va = [r for g in val_g for r in by_game[g]]
te = [r for g in test_g for r in by_game[g]]

tok = AutoTokenizer.from_pretrained(CLS)
so = ort.SessionOptions(); so.log_severity_level = 3
sess = ort.InferenceSession(CLS + "/model.int8.onnx", so)


def score(items):
    out = []
    for r in items:
        e = tok([r["target"]], padding="max_length", truncation=True, max_length=MAXLEN)
        lg = sess.run(None, {"input_ids": np.array(e["input_ids"], dtype=np.int64),
                             "attention_mask": np.array(e["attention_mask"], dtype=np.int64)})[0][0]
        pr = np.exp(lg - lg.max()); pr = pr / pr.sum()
        out.append(1.0 - pr[0])
    return np.array(out)


def metrics(y, p, thr):
    pred = (p >= thr).astype(int)
    tp = int(((pred == 1) & (y == 1)).sum()); fp = int(((pred == 1) & (y == 0)).sum())
    fn = int(((pred == 0) & (y == 1)).sum())
    pr = tp / (tp + fp) if tp + fp else 0.0
    rc = tp / (tp + fn) if tp + fn else 0.0
    return pr, rc, (2 * pr * rc / (pr + rc) if pr + rc else 0.0)


def auc(y, p):
    from sklearn.metrics import roc_auc_score
    return roc_auc_score(y, p)


yva = np.array([label(r) for r in va]); yte = np.array([label(r) for r in te])
pva = score(va); pte = score(te)
best = max(((t, metrics(yte, pte, t)[2]) for t in np.arange(0.05, 0.96, 0.05)),
           key=lambda x: x[1])
thr = max(((t, metrics(yva, pva, t)[2]) for t in np.arange(0.05, 0.96, 0.05)),
          key=lambda x: x[1])[0]
pr, rc, f1 = metrics(yte, pte, thr)
a = auc(yte, pte)

print("test rows=%d positives=%d" % (len(te), yte.sum()), flush=True)
print("\n=== SHIPPED int8 ONNX, same test split ===", flush=True)
print("  val-chosen thr=%.2f   TEST AUC=%.4f  P=%.3f R=%.3f F1=%.3f" % (thr, a, pr, rc, f1), flush=True)

print("\n=== side by side with what the PR currently reports (fp32) ===", flush=True)
print("  %-28s %8s %8s %8s %8s" % ("model", "AUC", "P", "R", "F1"), flush=True)
print("  %-28s %8.4f %8.3f %8.3f %8.3f" % ("fp32 PyTorch (reported)", 0.9502, 0.728, 0.739, 0.733),
      flush=True)
print("  %-28s %8.4f %8.3f %8.3f %8.3f" % ("int8 ONNX (shipped)", a, pr, rc, f1), flush=True)
print("\n  note: the fp32 row is at ITS val threshold (0.75); the int8 row at its own (%.2f)." % thr,
      flush=True)
