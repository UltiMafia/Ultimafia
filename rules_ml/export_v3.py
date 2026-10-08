"""Step 2: feature-space fix + export.

Compares the shipped feature space against stopword / max_df / regularisation
variants, then exports the chosen one WITH the stopword list so the portable
JS runtime can reproduce sklearn exactly.
"""
import json, os, re, math, time, sys
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, roc_auc_score, confusion_matrix
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
DEC = DIR + "/decisions_final.jsonl"
NON = "no_violation"
WORD_RE = re.compile(r"\w\w+")
WS_RE = re.compile(r"\s\s+")
STOP = sorted(ENGLISH_STOP_WORDS)


def load():
    by = {}
    for line in open(DEC, encoding="utf-8"):
        try:
            r = json.loads(line)
        except Exception:
            continue
        if r.get("error") or r.get("noul") is None:
            continue
        by[r["idx"]] = r
    return [by[k] for k in sorted(by)]


def label(r):
    return 1 if (r["noul"] >= 0.5 and r.get("choice") != NON) else 0


# ---------------- portable (JS-equivalent) ----------------
def tok_word(t, lo, hi, stop=None):
    toks = WORD_RE.findall(t.lower())
    if stop:
        toks = [w for w in toks if w not in stop]
    if hi == 1:
        return toks
    out = []
    for n in range(lo, min(hi + 1, len(toks) + 1)):
        for i in range(len(toks) - n + 1):
            out.append(" ".join(toks[i:i + n]))
    return out


def portable_predict(texts, model):
    coef = model["coef"]; b = model["intercept"]
    stop = set(model.get("stop_words") or [])
    out = []
    for text in texts:
        vec = [0.0] * len(coef)
        for a in model["analyzers"]:
            toks = tok_word(text, a["ngram_range"][0], a["ngram_range"][1], stop or None)
            counts = {}
            for t in toks:
                counts[t] = counts.get(t, 0) + 1
            off = a["offset"]; idf = a["idf"]; vocab = a["vocab"]
            block = {}
            for t, c in counts.items():
                i = vocab.get(t)
                if i is None:
                    continue
                block[i] = (1.0 + math.log(c)) * idf[i]
            norm = math.sqrt(sum(v * v for v in block.values()))
            if norm > 0:
                for i, v in block.items():
                    vec[off + i] = v / norm
        z = b + sum(cv * fv for cv, fv in zip(coef, vec))
        out.append(1.0 / (1.0 + math.exp(-z)))
    return out


def make_vec(kw):
    return TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, lowercase=True,
                           strip_accents=None, token_pattern=r"(?u)\b\w\w+\b", **kw)


SANITY = [("Z dumbtell", 0), ("that awkward pause feels like a dumbtell", 0),
          ("hc blue, no gun no carol no knife no rifle", 0), ("fos on bob for that vote", 0),
          ("gt is possible here but not locked", 0), ("meta says she pushes early as town", 0),
          ("could be wifom to leave that slot alive", 0), ("you're great at the game", 0),
          ("you're really good at this", 0), ("that was a great play", 0), ("gg wp", 0),
          ("good job", 0), ("well played", 0), ("nice one", 0), ("who would like retrained", 0),
          ("vote Bob he is mafia", 0), ("im suing", 1), ("you are a moron", 1),
          ("i can report you and u can get reported for ogi", 1), ("shut the fuck up", 1),
          ("u gt btw", 1), ("yes link a game so i can report u >:3", 1)]


def main():
    rows = load()
    texts = [r["target"] for r in rows]
    y = np.array([label(r) for r in rows])
    groups = np.array([r["game_id"] for r in rows])
    isrand = np.array([r.get("source") == "random" for r in rows])
    tr, te = next(GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42).split(texts, y, groups))
    te_rand = isrand[te]
    print("rows=%d positives=%d (%.2f%%)  test=%d" % (len(rows), y.sum(), 100.0 * y.mean(), len(te)))

    CONFIGS = [
        ("shipped: min_df=2 C=4", dict(min_df=2), 4.0, False),
        ("stop+max_df C=1", dict(min_df=2, max_df=0.4, stop_words="english"), 1.0, True),
        ("stop+max_df C=2", dict(min_df=2, max_df=0.4, stop_words="english"), 2.0, True),
        ("stop+max_df C=0.5", dict(min_df=2, max_df=0.4, stop_words="english"), 0.5, True),
        ("stop+max_df.3 C=1", dict(min_df=3, max_df=0.3, stop_words="english"), 1.0, True),
    ]
    best = None
    for name, kw, C, uses_stop in CONFIGS:
        v = make_vec(kw); v.fit([texts[i] for i in tr])
        X = v.transform(texts)
        clf = LogisticRegression(C=C, max_iter=3000, class_weight="balanced").fit(X[tr], y[tr])
        p = clf.predict_proba(X[te])[:, 1]
        pred = (p >= 0.5).astype(int)
        pr, rc, f1, _ = precision_recall_fscore_support(y[te], pred, average="binary", zero_division=0)
        auc = roc_auc_score(y[te], p)
        acc = accuracy_score(y[te], pred)
        prr, rcr, f1r, _ = precision_recall_fscore_support(y[te][te_rand], pred[te_rand], average="binary", zero_division=0)
        sp = clf.predict_proba(v.transform([s for s, _ in SANITY]))[:, 1]
        miss = [(s, q) for (s, w), q in zip(SANITY, sp) if (q >= 0.5) != bool(w)]
        print("\n[%s] feats=%d acc=%.4f P=%.3f R=%.3f F1=%.3f AUC=%.3f | rep P=%.3f R=%.3f | sanity %d/%d"
              % (name, X.shape[1], acc, pr, rc, f1, auc, prr, rcr, len(SANITY) - len(miss), len(SANITY)))
        for s, q in miss:
            print("      miss: %-42s p=%.3f" % (s[:42], q))
        score = (len(SANITY) - len(miss), rcr, auc)
        if best is None or score > best[0]:
            best = (score, name, kw, C)
    print("\nCHOSEN:", best[1])

    # export on all data
    name, kw, C = best[1], best[2], best[3]
    # HONEST held-out metrics: fit on the TRAIN split only (never on test rows)
    vh = make_vec(kw); vh.fit([texts[i] for i in tr])
    Xh = vh.transform(texts)
    clfh = LogisticRegression(C=C, max_iter=3000, class_weight="balanced").fit(Xh[tr], y[tr])
    p = clfh.predict_proba(Xh[te])[:, 1]
    pred = (p >= 0.5).astype(int)
    pr, rc, f1, _ = precision_recall_fscore_support(y[te], pred, average="binary", zero_division=0)
    auc = roc_auc_score(y[te], p)
    acc = accuracy_score(y[te], pred)
    cm = confusion_matrix(y[te], pred, labels=[0, 1]).tolist()
    prr, rcr, f1r, _ = precision_recall_fscore_support(y[te][te_rand], pred[te_rand], average="binary", zero_division=0)
    # the exported artifact is fit on everything, but its stored metrics come from above
    v = make_vec(kw); v.fit(texts)
    X = v.transform(texts)
    clf = LogisticRegression(C=C, max_iter=3000, class_weight="balanced").fit(X, y)

    model = {"format": "tfidf-logreg-v1",
             "name": "word(1,2)+logreg C=%s, %s (%s)" % (
                 C, "stopwords" if kw.get("stop_words") else "no stopwords", "glossary-corrected labels"),
             "decision": "violation if sigmoid(z) >= threshold; default 0.5",
             "recommended_threshold": 0.7, "use_context": False, "n_ctx": 0,
             "C": C, "class_weight": "balanced", "min_df": kw.get("min_df"), "max_df": kw.get("max_df"),
             "n_docs": int(len(y)), "positives": int(y.sum()),
             "stop_words": STOP if kw.get("stop_words") else [],
             "metrics": {"acc": acc, "precision": pr, "recall": rc, "f1": f1, "auc": auc, "cm": cm,
                         "rep_precision": prr, "rep_recall": rcr, "rep_f1": f1r, "n_test": int(len(te))},
             "analyzers": [{"kind": "word", "ngram_range": [1, 2], "min_df": v.min_df, "max_df": v.max_df,
                            "sublinear_tf": True, "smooth_idf": True, "offset": 0,
                            "n_features": len(v.vocabulary_),
                            "idf": [round(float(x), 7) for x in v.idf_], "vocab": v.vocabulary_}],
             "coef": [round(float(c), 7) for c in clf.coef_[0]],
             "intercept": round(float(clf.intercept_[0]), 7)}
    with open(DIR + "/model.json", "w", encoding="utf-8") as f:
        json.dump(model, f)
    sz = os.path.getsize(DIR + "/model.json") / 1024

    samp = list(te[:300])
    pp = portable_predict([texts[i] for i in samp], model)
    ps = clf.predict_proba(X[samp])[:, 1]
    diffs = [abs(a - b) for a, b in zip(pp, ps)]
    print("exported model.json: %.1f KB, %d features, %d stopwords" % (sz, X.shape[1], len(model["stop_words"])))
    print("portable vs sklearn max|diff| = %.3e" % max(diffs))
    print("held-out acc=%.4f P=%.3f R=%.3f F1=%.3f AUC=%.3f cm=%s" % (acc, pr, rc, f1, auc, cm))
    print("representative subset: P=%.3f R=%.3f" % (prr, rcr))


if __name__ == "__main__":
    main()
