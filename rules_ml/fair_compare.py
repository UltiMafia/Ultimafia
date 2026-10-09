"""Fair linear baseline: fit on the SAME train split the transformer used, evaluate on the SAME test.

model.json cannot be used for this - it was fit on all 7,207 rows, so scoring it on
any held-out split leaks its own training data.
"""
import json, random, sys
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
sys.path.insert(0, DIR)
import export_v3 as E
SEED = 42


def lab(r):
    return 1 if (r["noul"] >= 0.5 and r.get("choice") != "no_violation") else 0


def metrics_at(y, p, thr):
    pred = (p >= thr).astype(int)
    tp = int(((pred == 1) & (y == 1)).sum()); fp = int(((pred == 1) & (y == 0)).sum())
    fn = int(((pred == 0) & (y == 1)).sum()); tn = int(((pred == 0) & (y == 0)).sum())
    pr = tp / (tp + fp) if tp + fp else 0.0
    rc = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * pr * rc / (pr + rc) if pr + rc else 0.0
    return pr, rc, f1


def best_thr(y, p):
    b = (0.5, -1)
    for t in np.arange(0.05, 0.96, 0.05):
        _, _, f1 = metrics_at(y, p, t)
        if f1 > b[1]:
            b = (float(t), f1)
    return b[0]


rows = [json.loads(l) for l in open(DIR + "/decisions_final_clef.jsonl", encoding="utf-8")]
by_game = {}
for r in rows:
    by_game.setdefault(str(r.get("game_id")), []).append(r)
games = sorted(by_game)
random.Random(SEED).shuffle(games)
n = len(games)
test_g = set(games[:int(n * 0.20)])
val_g = set(games[int(n * 0.20):int(n * 0.35)])
tr = [r for g in games if g not in test_g and g not in val_g for r in by_game[g]]
va = [r for g in val_g for r in by_game[g]]
te = [r for g in test_g for r in by_game[g]]
print("train=%d val=%d test=%d  (identical split to the transformer run)" % (len(tr), len(va), len(te)), flush=True)

CFG = [("shipped cfg min_df=1 C=4", dict(min_df=1), 4.0),
       ("min_df=2 C=4", dict(min_df=2), 4.0),
       ("min_df=1 C=1", dict(min_df=1), 1.0),
       ("min_df=1 C=0.3", dict(min_df=1), 0.3)]
ytr = np.array([lab(r) for r in tr]); yva = np.array([lab(r) for r in va]); yte = np.array([lab(r) for r in te])
best = None
for name, kw, C in CFG:
    v = TfidfVectorizer(ngram_range=(1, 2), **kw)
    X = v.fit_transform([r["target"] for r in tr])
    clf = LogisticRegression(C=C, max_iter=3000, class_weight="balanced").fit(X, ytr)
    pv = clf.predict_proba(v.transform([r["target"] for r in va]))[:, 1]
    t = best_thr(yva, pv)
    pt = clf.predict_proba(v.transform([r["target"] for r in te]))[:, 1]
    pr, rc, f1 = metrics_at(yte, pt, t)
    a = roc_auc_score(yte, pt)
    print("  %-26s feats=%-6d AUC=%.4f  P=%.3f R=%.3f F1=%.3f (thr=%.2f)"
          % (name, X.shape[1], a, pr, rc, f1, t), flush=True)
    if best is None or f1 > best[0]:
        best = (f1, name, v, clf, t)

print("\n=== FAIR COMPARISON (same split) ===", flush=True)
print("  transformer : AUC=0.9559  P=0.794 R=0.812 F1=0.803", flush=True)
print("  linear      : AUC=?  F1=%.3f  (%s)" % (best[0], best[1]), flush=True)
CASES = ["you're great at the game", "unvote me or you're gting", "you're gting", "gting",
         "that's dumb", "you're dumb", "shut up", "can XYZ shut the fuck up?",
         "STFU let gov hammer", "bob lives in ohio"]
v, clf, t = best[2], best[3], best[4]
pl = clf.predict_proba(v.transform(CASES))[:, 1]
print("\n=== flagged cases (linear, trained on train split only) ===", flush=True)
TX = {"you're great at the game": 0.063, "unvote me or you're gting": 0.646, "you're gting": 0.069,
      "gting": 0.072, "that's dumb": 0.067, "you're dumb": 0.942, "shut up": 0.968,
      "can XYZ shut the fuck up?": 0.963, "STFU let gov hammer": 0.942, "bob lives in ohio": 0.094}
for c, p in zip(CASES, pl):
    print("  %-30s linear=%.3f  transformer=%.3f" % (c, p, TX.get(c, float("nan"))), flush=True)
