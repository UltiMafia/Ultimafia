"""Re-evaluate both models with a GROUPED split (by game_id) to remove leakage."""
import json, sys
import numpy as np
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, roc_auc_score
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import export_final2 as E

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
E.DEC = DIR + "/decisions_all.jsonl"
rows = E.load()
texts = [r["target"] for r in rows]
y = np.array([E.label(r) for r in rows])
groups = np.array([r["game_id"] for r in rows])
isrand = np.array([r.get("source") == "random" for r in rows])
print("rows=%d positives=%d games=%d" % (len(rows), y.sum(), len(set(groups))))

gss = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
tr, te = next(gss.split(texts, y, groups))
print("grouped split: train=%d test=%d  game overlap=%d"
      % (len(tr), len(te), len(set(groups[tr]) & set(groups[te]))))

for name, kind, C in (("word(1,2) C=4", "word", 4.0), ("char_wb(2,5) C=1", "char", 1.0)):
    v, X, clf = E.fit(kind, texts, y, C, fit_idx=tr)
    p = clf.predict_proba(X[te])[:, 1]
    pred = (p >= 0.5).astype(int)
    pr, rc, f1, _ = precision_recall_fscore_support(y[te], pred, average="binary", zero_division=0)
    auc = roc_auc_score(y[te], p)
    acc = accuracy_score(y[te], pred)
    m = isrand[te]
    prr, rcr, f1r, _ = precision_recall_fscore_support(y[te][m], pred[m], average="binary", zero_division=0)
    print("\n[%s] GROUPED (honest)" % name)
    print("   acc=%.4f  P=%.3f  R=%.3f  F1=%.3f  AUC=%.3f   (message-level split reported F1=%.3f AUC=%.3f)"
          % (acc, pr, rc, f1, auc, 0.585 if kind == "word" else 0.622, 0.864 if kind == "word" else 0.897))
    print("   representative subset: P=%.3f R=%.3f  (n=%d pos=%d)" % (prr, rcr, m.sum(), int(y[te][m].sum())))
