"""Why the model flags compliments, and does restricting the feature space fix it?

Sweeps stopword/max_df/C settings and measures BOTH held-out quality and
false-positive rate on a hand-written sanity set.
"""
import json, sys
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import precision_recall_fscore_support, roc_auc_score
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import export_final2 as E

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
E.DEC = DIR + "/decisions_all.jsonl"
rows = E.load()
texts = [r["target"] for r in rows]
y = np.array([E.label(r) for r in rows])
groups = np.array([r["game_id"] for r in rows])
isrand = np.array([r.get("source") == "random" for r in rows])
tr, te = next(GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42).split(texts, y, groups))
te_rand = isrand[te]

GOOD = ["you're great at the game", "gg wp", "good job", "well played", "nice one",
        "you played well", "who would like retrained", "vote Bob he is mafia",
        "my meta on XYZ tells me they are mafia, vote them out",
        "Kai is only forgiven since he's a pillar of UM",
        "the strategy that z has downvoted on all his alts explains it",
        "Z is my alt though -_-", "I double checked after you said smth last night",
        "you're really good at this", "that was a great play"]
BAD = ["im suing", "you are a moron", "i can report you and u can get reported for ogi",
       "shut the fuck up", "yes link a game so i can report u >:3"]

CONFIGS = [
    ("baseline  min_df=2 C=4", dict(min_df=2), 4.0),
    ("max_df=.4  C=4", dict(min_df=2, max_df=0.4), 4.0),
    ("stop+max_df C=4", dict(min_df=2, max_df=0.4, stop_words="english"), 4.0),
    ("stop+max_df C=1", dict(min_df=2, max_df=0.4, stop_words="english"), 1.0),
    ("stop+max_df C=0.3", dict(min_df=2, max_df=0.4, stop_words="english"), 0.3),
    ("stop+max_df+.3 C=1", dict(min_df=3, max_df=0.3, stop_words="english"), 1.0),
]


def build(kw, C):
    v = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, lowercase=True,
                        strip_accents=None, token_pattern=r"(?u)\b\w\w+\b", **kw)
    v.fit([texts[i] for i in tr])
    X = v.transform(texts)
    clf = LogisticRegression(C=C, max_iter=3000, class_weight="balanced").fit(X[tr], y[tr])
    return v, X, clf


print("%-22s %-6s %-5s %-5s %-5s | %-6s %-6s | %-10s %-8s | %s"
      % ("config", "feats", "F1", "AUC", "repR", "sane-FP", "sane-TP", "great", "you moron", "suing"))
for name, kw, C in CONFIGS:
    v, X, clf = build(kw, C)
    p = clf.predict_proba(X[te])[:, 1]
    pred = (p >= 0.5).astype(int)
    _, rc, f1, _ = precision_recall_fscore_support(y[te], pred, average="binary", zero_division=0)
    auc = roc_auc_score(y[te], p)
    _, rcr, _, _ = precision_recall_fscore_support(y[te][te_rand], pred[te_rand], average="binary", zero_division=0)
    gp = clf.predict_proba(v.transform(GOOD))[:, 1]
    bp = clf.predict_proba(v.transform(BAD))[:, 1]
    fp = sum(1 for x in gp if x >= 0.5)
    tp = sum(1 for x in bp if x >= 0.5)
    print("%-22s %-6d %-5.3f %-5.3f %-5.3f | %-6s %-6s | %-10.3f %-8.3f | %.3f"
          % (name, X.shape[1], f1, auc, rcr, "%d/%d" % (fp, len(GOOD)), "%d/%d" % (tp, len(BAD)),
             gp[0], clf.predict_proba(v.transform(["you are a moron"]))[:, 1][0],
             clf.predict_proba(v.transform(["im suing"]))[:, 1][0]))

# show what drives the compliment under the best config
v, X, clf = build(dict(min_df=2, max_df=0.4, stop_words="english"), 1.0)
vec = v.transform(["you're great at the game"])
coef = clf.coef_[0]
inv = {i: t for t, i in v.vocabulary_.items()}
row = vec.tocoo()
contrib = sorted(([inv[int(i)], float(d) * coef[int(i)]] for i, d in zip(row.col, row.data)),
                 key=lambda x: -abs(x[1]))[:8]
print("\ncontributions for \"you're great at the game\" under stop+max_df C=1:")
for t, c in contrib:
    print("   %-14s %+.3f" % (t, c))
