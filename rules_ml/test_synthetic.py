"""Verify the subagent's synthetic file, then test whether it actually fixes
the 'dumbtell' false positive without hurting held-out quality."""
import json, os, sys
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import precision_recall_fscore_support, roc_auc_score
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import export_final2 as E

SYN = "/mnt/c/Users/tt/AppData/Local/hermes/cache/scratch/synthetic/jargon_negatives.jsonl"

print("=== 1. verify the file the subagent claims it wrote ===")
print("exists:", os.path.exists(SYN), " size:", os.path.getsize(SYN) if os.path.exists(SYN) else "-")
raw = open(SYN, encoding="utf-8").read().splitlines()
raw = [l for l in raw if l.strip()]
bad = 0
terms = {}
rows_syn = []
for i, l in enumerate(raw):
    try:
        o = json.loads(l)
        assert set(o.keys()) == {"term", "text", "expected"}, o.keys()
        assert o["expected"] == "no_violation"
        terms[o["term"]] = terms.get(o["term"], 0) + 1
        rows_syn.append(o)
    except Exception as e:
        bad += 1
        if bad <= 3:
            print("  MALFORMED line %d: %s | %s" % (i, str(e)[:60], l[:80]))
print("lines: %d   malformed: %d   distinct terms: %d" % (len(raw), bad, len(terms)))
print("coverage:", dict(sorted(terms.items(), key=lambda x: -x[1])))
print("\nall generated lines:")
for o in rows_syn:
    print("   [%-9s] %s" % (o["term"], o["text"]))

# ---- does adding them help? ----
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
E.DEC = DIR + "/decisions_all.jsonl"
rows = E.load()
texts = [r["target"] for r in rows]
y = np.array([E.label(r) for r in rows])
groups = np.array([r["game_id"] for r in rows])
tr, te = next(GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42).split(texts, y, groups))

SANITY = [("you're great at the game", 0), ("you're really good at this", 0), ("that was a great play", 0),
          ("gg wp", 0), ("good job", 0), ("well played", 0), ("Z dumbtell", 0),
          ("that awkward pause feels like a dumbtell", 0), ("im suing", 1), ("you are a moron", 1),
          ("i can report you and u can get reported for ogi", 1), ("shut the fuck up", 1),
          ("yes link a game so i can report u >:3", 1), ("vote Bob he is mafia", 0)]


def run(label, syn_rows, mult=1):
    syn = [o["text"] for o in syn_rows] * mult
    tx = list(texts) + syn
    yy = np.array(list(y) + [0] * len(syn))
    n_orig = len(texts)
    tr_all = np.concatenate([tr, np.arange(n_orig, len(tx))]) if syn else tr
    v = TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True, lowercase=True,
                        strip_accents=None, token_pattern=r"(?u)\b\w\w+\b")
    v.fit([tx[i] for i in tr_all])
    X = v.transform(tx)
    clf = LogisticRegression(C=4.0, max_iter=3000, class_weight="balanced").fit(X[tr_all], yy[tr_all])
    p = clf.predict_proba(X[te])[:, 1]
    pred = (p >= 0.5).astype(int)
    _, rc, f1, _ = precision_recall_fscore_support(yy[te], pred, average="binary", zero_division=0)
    auc = roc_auc_score(yy[te], p)
    sp = clf.predict_proba(v.transform([s for s, _ in SANITY]))[:, 1]
    miss = ["%s(%.2f)" % (s[:26], q) for (s, w), q in zip(SANITY, sp) if (q >= 0.5) != bool(w)]
    print("\n[%s] F1=%.3f AUC=%.3f  sanity misses (%d/%d): %s" % (label, f1, auc, len(miss), len(SANITY), miss))
    for (s, w), q in zip(SANITY, sp):
        if "dumbtell" in s or "great" in s or "good at" in s:
            print("      %-42s p=%.3f want=%s" % (s[:42], q, "violation" if w else "fine"))
    return f1


run("baseline (no synthetic)", [])
run("+60 synthetic x1", rows_syn, 1)
run("+60 synthetic x5 (upweighted)", rows_syn, 5)
run("+60 synthetic x20 (upweighted)", rows_syn, 20)
