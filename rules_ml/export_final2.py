"""Export the shipped distilled models and verify the portable implementation.

  model.json       - word (1,2) TF-IDF + logistic regression    (primary, smallest)
  model_char.json  - char_wb (2,5) TF-IDF + logistic regression (higher recall)

Both are target-only (surrounding context hurt on held-out data) and run in
plain JavaScript with no dependencies.
"""
import json, os, re, math, time
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import (accuracy_score, precision_recall_fscore_support,
                             roc_auc_score, confusion_matrix)

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
DEC = os.path.join(DIR, "decisions_v2.jsonl")
NON = "no_violation"
WORD_RE = re.compile(r"\w\w+")
WS_RE = re.compile(r"\s\s+")


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


def tok_word(t, lo=1, hi=2):
    """Word n-grams for n in [lo, hi], matching sklearn's word analyzer."""
    toks = WORD_RE.findall(t.lower())
    out = []
    for n in range(lo, hi + 1):
        if n == 1:
            out.extend(toks)
        else:
            for i in range(len(toks) - n + 1):
                out.append(" ".join(toks[i:i + n]))
    return out


def tok_char_wb(t, lo, hi):
    out = []
    for w in WS_RE.sub(" ", t.lower()).split():
        w = " " + w + " "
        L = len(w)
        for n in range(lo, hi + 1):
            off = 0
            out.append(w[off:off + n])
            while off + n < L:
                off += 1
                out.append(w[off:off + n])
            if off == 0:
                # sklearn counts a word shorter than n only once, then stops
                break
    return out


def portable_predict(texts, model):
    coef = model["coef"]; b = model["intercept"]; out = []
    for text in texts:
        vec = [0.0] * len(coef)
        for a in model["analyzers"]:
            toks = (tok_word(text, a["ngram_range"][0], a["ngram_range"][1]) if a["kind"] == "word"
                    else tok_char_wb(text, a["ngram_range"][0], a["ngram_range"][1]))
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


def make_vec(kind):
    if kind == "word":
        return TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True, lowercase=True,
                               strip_accents=None, token_pattern=r"(?u)\b\w\w+\b")
    return TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), min_df=2, sublinear_tf=True,
                           lowercase=True, strip_accents=None)


def fit(kind, texts, y, C, fit_idx=None):
    v = make_vec(kind)
    v.fit([texts[i] for i in fit_idx] if fit_idx is not None else texts)
    X = v.transform(texts)
    clf = LogisticRegression(C=C, max_iter=3000, class_weight="balanced")
    clf.fit(X[fit_idx] if fit_idx is not None else X,
            y[fit_idx] if fit_idx is not None else y)
    return v, X, clf


def summarise(tag, clf, X, y, te, te_rand):
    p = clf.predict_proba(X[te])[:, 1]
    pred = (p >= 0.5).astype(int)
    yte = y[te]
    acc = accuracy_score(yte, pred)
    pr, rc, f1, _ = precision_recall_fscore_support(yte, pred, average="binary", zero_division=0)
    auc = roc_auc_score(yte, p)
    cm = confusion_matrix(yte, pred, labels=[0, 1]).tolist()
    prr, rcr, f1r, _ = precision_recall_fscore_support(yte[te_rand], pred[te_rand], average="binary", zero_division=0)
    print("\n[%s]" % tag)
    print("   held-out: acc=%.4f P=%.3f R=%.3f F1=%.3f AUC=%.3f cm=%s" % (acc, pr, rc, f1, auc, cm))
    print("   representative: P=%.3f R=%.3f F1=%.3f (n=%d pos=%d)"
          % (prr, rcr, f1r, te_rand.sum(), int(yte[te_rand].sum())))
    for th in (0.3, 0.4, 0.5, 0.6, 0.7, 0.8):
        q = (p >= th).astype(int)
        a, b2, c, _ = precision_recall_fscore_support(yte, q, average="binary", zero_division=0)
        a2, b3, _c, _ = precision_recall_fscore_support(yte[te_rand], q[te_rand], average="binary", zero_division=0)
        print("     th=%.1f  all P=%.3f R=%.3f F1=%.3f | rep P=%.3f R=%.3f" % (th, a, b2, c, a2, b3))
    return {"acc": acc, "precision": pr, "recall": rc, "f1": f1, "auc": auc, "cm": cm,
            "rep_precision": prr, "rep_recall": rcr, "rep_f1": f1r, "n_test": int(len(te))}


def export(name, kind, C, fn, y, metrics, n_features, v, clf):
    m = {"format": "tfidf-logreg-v1", "name": name,
         "decision": "violation if sigmoid(z) >= threshold; default threshold 0.5",
         "recommended_threshold": 0.5, "use_context": False, "n_ctx": 0,
         "C": C, "class_weight": "balanced", "n_docs": int(len(y)), "positives": int(y.sum()),
         "metrics": metrics, "n_features": int(n_features),
         "analyzers": [{"kind": kind, "ngram_range": list(v.ngram_range), "min_df": v.min_df,
                        "sublinear_tf": True, "smooth_idf": True, "offset": 0,
                        "n_features": len(v.vocabulary_),
                        "idf": [round(float(x), 7) for x in v.idf_], "vocab": v.vocabulary_}],
         "coef": [round(float(c), 7) for c in clf.coef_[0]],
         "intercept": round(float(clf.intercept_[0]), 7)}
    with open(os.path.join(DIR, fn), "w", encoding="utf-8") as f:
        json.dump(m, f)
    return m


def main():
    rows = load()
    texts = [r["target"] for r in rows]
    y = np.array([label(r) for r in rows])
    print("rows=%d positives=%d (%.2f%%)" % (len(rows), y.sum(), 100.0 * y.mean()))
    idx = np.arange(len(rows))
    strat = np.array(["%d_%s" % (y[i], rows[i].get("source")) for i in idx])
    tr, te = train_test_split(idx, test_size=0.25, random_state=42, stratify=strat)
    isrand = np.array([r.get("source") == "random" for r in rows])
    te_rand = isrand[te]

    for name, kind, C, fn in (("word(1,2)+logreg C=4", "word", 4.0, "model.json"),
                              ("char_wb(2,5)+logreg C=1", "char", 1.0, "model_char.json")):
        t0 = time.time()
        ve, Xe, clf_e = fit(kind, texts, y, C, fit_idx=tr)
        met = summarise(name, clf_e, Xe, y, te, te_rand)
        v, X, clf = fit(kind, texts, y, C, fit_idx=None)
        m = export(name, kind, C, fn, y, met, X.shape[1], v, clf)
        sz = os.path.getsize(os.path.join(DIR, fn)) / 1024
        samp = list(te[:300])
        pp = portable_predict([texts[i] for i in samp], m)
        ps = clf.predict_proba(X[samp])[:, 1]
        diffs = [abs(a - b) for a, b in zip(pp, ps)]
        print("   -> %s: %.1f KB, %d features, portable-vs-sklearn max|diff|=%.3e (%.0fs)"
              % (fn, sz, X.shape[1], max(diffs), time.time() - t0))


if __name__ == "__main__":
    main()
