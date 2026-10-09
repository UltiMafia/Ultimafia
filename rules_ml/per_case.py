import json, sys
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupShuffleSplit
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import export_final2 as E

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
E.DEC = DIR + "/decisions_all.jsonl"
rows = E.load()
texts = [r["target"] for r in rows]
y = np.array([E.label(r) for r in rows])
groups = np.array([r["game_id"] for r in rows])
tr, te = next(GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42).split(texts, y, groups))

GOOD = [("you're great at the game", 0), ("gg wp", 0), ("good job", 0), ("well played", 0),
        ("nice one", 0), ("you played well", 0), ("who would like retrained", 0),
        ("vote Bob he is mafia", 0), ("my meta on XYZ tells me they are mafia, vote them out", 0),
        ("Kai is only forgiven since he's a pillar of UM", 0),
        ("the strategy that z has downvoted on all his alts explains it", 0),
        ("Z is my alt though -_-", 0), ("I double checked after you said smth last night", 0),
        ("you're really good at this", 0), ("that was a great play", 0),
        ("im suing", 1), ("you are a moron", 1),
        ("i can report you and u can get reported for ogi", 1), ("shut the fuck up", 1),
        ("yes link a game so i can report u >:3", 1), ("Z dumbtell", 0)]

cfgs = [
    ("current (baseline)", dict(min_df=2), 4.0),
    ("stop+max_df C=1", dict(min_df=2, max_df=0.4, stop_words="english"), 1.0),
]
for name, kw, C in cfgs:
    v = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, lowercase=True, strip_accents=None,
                        token_pattern=r"(?u)\b\w\w+\b", **kw)
    v.fit([texts[i] for i in tr])
    X = v.transform(texts)
    clf = LogisticRegression(C=C, max_iter=3000, class_weight="balanced").fit(X[tr], y[tr])
    p = clf.predict_proba(v.transform([g for g, _ in GOOD]))[:, 1]
    print("\n=== %s (feats=%d) ===" % (name, X.shape[1]))
    for (t, want), pr in zip(GOOD, p):
        flag = pr >= 0.5
        ok = "OK " if flag == bool(want) else "MISS"
        print("  %s want=%-8s p=%.3f  %r" % (ok, "violation" if want else "fine", pr, t[:58]))
