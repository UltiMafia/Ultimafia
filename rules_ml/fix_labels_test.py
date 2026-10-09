"""Is 'dumbtell' a student-model problem or a LABEL problem?

Variant A: baseline.
Variant B: correct the labels (simulate a Jev with a glossary: every message
           containing 'dumbtell' becomes no_violation), no synthetic data.
Variant C: corrected labels + the 60 synthetic hard negatives.
"""
import json, sys, os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import precision_recall_fscore_support, roc_auc_score
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import export_final2 as E

SYN = "/mnt/c/Users/tt/AppData/Local/hermes/cache/scratch/synthetic/jargon_negatives.jsonl"
syn = [json.loads(l)["text"] for l in open(SYN, encoding="utf-8") if l.strip()]

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
E.DEC = DIR + "/decisions_all.jsonl"
rows = E.load()
texts = [r["target"] for r in rows]
y = np.array([E.label(r) for r in rows])
groups = np.array([r["game_id"] for r in rows])
tr, te = next(GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42).split(texts, y, groups))

dumb_idx = [i for i, t in enumerate(texts) if "dumbtell" in t.lower()]
print("rows containing 'dumbtell': %d   currently labelled positive: %d"
      % (len(dumb_idx), int(y[dumb_idx].sum())))
print("  their categories:", {c: sum(1 for i in dumb_idx if rows[i]["choice"] == c)
                              for c in set(rows[i]["choice"] for i in dumb_idx)})

SANITY = [("you're great at the game", 0), ("you're really good at this", 0),
          ("that was a great play", 0), ("gg wp", 0), ("Z dumbtell", 0),
          ("that awkward pause feels like a dumbtell", 0), ("im suing", 1),
          ("you are a moron", 1), ("i can report you and u can get reported for ogi", 1),
          ("shut the fuck up", 1), ("yes link a game so i can report u >:3", 1),
          ("vote Bob he is mafia", 0)]


def run(label, fix_labels=False, use_syn=False, mult=1):
    yy = y.copy()
    if fix_labels:
        yy[dumb_idx] = 0
    tx = list(texts) + (syn * mult if use_syn else [])
    yy2 = np.array(list(yy) + [0] * (len(syn) * mult if use_syn else 0))
    tr_all = np.concatenate([tr, np.arange(len(texts), len(tx))]) if use_syn else tr
    v = TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True, lowercase=True,
                        strip_accents=None, token_pattern=r"(?u)\b\w\w+\b")
    v.fit([tx[i] for i in tr_all])
    X = v.transform(tx)
    clf = LogisticRegression(C=4.0, max_iter=3000, class_weight="balanced").fit(X[tr_all], yy2[tr_all])
    p = clf.predict_proba(X[te])[:, 1]
    pred = (p >= 0.5).astype(int)
    _, rc, f1, _ = precision_recall_fscore_support(yy2[te], pred, average="binary", zero_division=0)
    auc = roc_auc_score(yy2[te], p)
    sp = clf.predict_proba(v.transform([s for s, _ in SANITY]))[:, 1]
    miss = ["%s(%.2f)" % (s[:24], q) for (s, w), q in zip(SANITY, sp) if (q >= 0.5) != bool(w)]
    print("\n[%s]  F1=%.3f AUC=%.3f  sanity misses %d/%d: %s" % (label, f1, auc, len(miss), len(SANITY), miss))
    print("    Z dumbtell -> %.3f | dumbtell phrase -> %.3f | great at the game -> %.3f"
          % (sp[4], sp[5], sp[0]))
    return f1


run("A baseline (as shipped)")
run("B labels corrected (glossary), no synthetic", fix_labels=True)
run("C labels corrected + 60 synthetic", fix_labels=True, use_syn=True)
run("D labels corrected + 60 synthetic x5", fix_labels=True, use_syn=True, mult=5)
