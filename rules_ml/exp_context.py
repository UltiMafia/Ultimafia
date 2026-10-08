"""How much of the label is reachable without context?

Jev labels each message WITH surrounding context + game state, but the distilled
model is trained on the message text alone. If the label depends on context, no
text-only model can reach it. Same split/model config, only the input differs.
"""
import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import roc_auc_score, precision_recall_fscore_support, accuracy_score

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
rows = [json.loads(l) for l in open(DIR + "/decisions_final.jsonl", encoding="utf-8")]
y = np.array([1 if (r["noul"] >= 0.5 and r.get("choice") != "no_violation") else 0 for r in rows])
groups = np.array([r.get("game_id") for r in rows])
print("rows=%d positives=%d (%.2f%%)" % (len(rows), y.sum(), 100 * y.mean()), flush=True)

# how much context do we even have?
n_ctx = sum(1 for r in rows if r.get("context"))
print("rows that carry any context: %d (%.1f%%)" % (n_ctx, 100 * n_ctx / len(rows)), flush=True)


def variants(r):
    tgt = r["target"]
    ctx = [c for c in (r.get("context") or []) if c]
    gc = " ".join(str(r.get(k) or "") for k in ("state", "game_type"))
    return {
        "message only": tgt,
        "message + context": " ".join(ctx[-3:] + [tgt]),
        "message + ctx + gamestate": " ".join(ctx[-3:] + [tgt, gc]),
    }


names = list(variants(rows[0]).keys())
texts = {n: [variants(r)[n] for r in rows] for n in names}

tr, te = next(GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42).split(rows, y, groups))
for n in names:
    v = TfidfVectorizer(ngram_range=(1, 2), min_df=2)
    X = v.fit_transform([texts[n][i] for i in tr])
    clf = LogisticRegression(C=4.0, max_iter=3000, class_weight="balanced").fit(X, y[tr])
    Xt = v.transform([texts[n][i] for i in te])
    p = clf.predict_proba(Xt)[:, 1]
    pred = (p >= 0.5).astype(int)
    pr, rc, f1, _ = precision_recall_fscore_support(y[te], pred, average="binary", zero_division=0)
    auc = roc_auc_score(y[te], p)
    print("%-30s feats=%-6d AUC=%.4f  F1=%.4f  P=%.3f R=%.3f  acc=%.4f"
          % (n, X.shape[1], auc, f1, pr, rc, accuracy_score(y[te], pred)), flush=True)
