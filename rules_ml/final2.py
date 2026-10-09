"""Train the shipped distilled model on the v2 decisions and export portable JSON.

Label = (noul >= 0.5) AND (choice != 'no_violation').
Reports held-out metrics overall and on the representative (uniform) subset,
sweeps the decision threshold, then exports model.json and verifies that a
dependency-free re-implementation reproduces scikit-learn exactly.
"""
import json, os, math, time, re
import numpy as np
from scipy.sparse import hstack
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.svm import LinearSVC
from sklearn.naive_bayes import ComplementNB
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, roc_auc_score, confusion_matrix

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
DEC = os.path.join(DIR, "decisions_v2.jsonl")
MODEL_JSON = os.path.join(DIR, "model.json")
NON = "no_violation"
N_CTX = 3

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


def texts_for(rows, mode):
    out = []
    for r in rows:
        if mode == "target":
            out.append(r["target"])
        else:
            out.append(" \n ".join((r.get("context") or [])[-N_CTX:]) + " \n " + r["target"])
    return out


# ---------------- portable (JS-equivalent) inference ----------------
def tok_word(t):
    return WORD_RE.findall(t.lower())


def tok_char_wb(t, lo, hi):
    out = []
    for w in WS_RE.sub(" ", t).split():
        w = " " + w + " "
        L = len(w)
        for n in range(lo, hi + 1):
            off = 0
            out.append(w[off:off + n])
            while off + n < L:
                off += 1
                out.append(w[off:off + n])
    return out


def portable_predict(texts, model):
    coef = model["coef"]; b = model["intercept"]; out = []
    for text in texts:
        vec = [0.0] * len(coef)
        for a in model["analyzers"]:
            toks = tok_word(text) if a["kind"] == "word" else tok_char_wb(text, a["ngram_range"][0], a["ngram_range"][1])
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


def metrics(y, p, name, fit_s=None):
    pred = (p >= 0.5).astype(int)
    acc = accuracy_score(y, pred)
    pr, rc, f1, _ = precision_recall_fscore_support(y, pred, average="binary", zero_division=0)
    auc = roc_auc_score(y, p) if len(set(y.tolist())) > 1 else float("nan")
    return dict(name=name, acc=acc, prec=pr, rec=rc, f1=f1, auc=auc, fit_s=fit_s, cm=confusion_matrix(y, pred, labels=[0, 1]).tolist())


def main():
    rows = load()
    y = np.array([label(r) for r in rows])
    print("rows=%d pos=%d (%.2f%%)" % (len(rows), y.sum(), 100.0 * y.mean()), flush=True)
    isrand = np.array([r.get("source") == "random" for r in rows])
    print("representative positives: %d/%d (%.2f%%)" % (y[isrand].sum(), isrand.sum(), 100.0 * y[isrand].mean()), flush=True)

    idx = np.arange(len(rows))
    strat = np.array(["%d_%s" % (y[i], rows[i].get("source")) for i in idx])
    tr, te = train_test_split(idx, test_size=0.25, random_state=42, stratify=strat)
    te_rand = isrand[te]
    print("test n=%d (representative in test=%d)" % (len(te), te_rand.sum()), flush=True)

    results = []
    for mode in ("target", "ctx3"):
        texts = texts_for(rows, mode)
        Xw = TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True).fit_transform(texts)
        Xc = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), min_df=2, sublinear_tf=True).fit_transform(texts)
        sets = (("word", Xw), ("char", Xc), ("union", hstack([Xw, Xc]).tocsr()))
        for fname, X in sets:
            for mname, mk in (
                ("lr C=1", lambda: LogisticRegression(C=1, max_iter=2000, class_weight="balanced")),
                ("lr C=4", lambda: LogisticRegression(C=4, max_iter=2000, class_weight="balanced")),
                ("lr C=16", lambda: LogisticRegression(C=16, max_iter=2000, class_weight="balanced")),
                ("linsvc .25", lambda: LinearSVC(C=0.25, class_weight="balanced")),
                ("linsvc 1", lambda: LinearSVC(C=1, class_weight="balanced")),
                ("sgd", lambda: SGDClassifier(loss="log_loss", alpha=1e-5, max_iter=4000, class_weight="balanced")),
                ("cnb .3", lambda: ComplementNB(alpha=0.3)),
                ("mlp 64", lambda: MLPClassifier(hidden_layer_sizes=(64,), max_iter=60, random_state=0)),
            ):
                t0 = time.time()
                try:
                    m = mk(); m.fit(X[tr], y[tr])
                    p = m.predict_proba(X[te])[:, 1] if hasattr(m, "predict_proba") else m.decision_function(X[te])
                    r = metrics(y[te], p, "%s|%s|%s" % (mode, fname, mname), time.time() - t0)
                    pr_rand, rc_rand, f1_rand, _ = precision_recall_fscore_support(
                        y[te][te_rand], (p >= 0.5).astype(int)[te_rand], average="binary", zero_division=0)
                    r["rand_prec"], r["rand_rec"], r["rand_f1"] = pr_rand, rc_rand, f1_rand
                    r["_p"] = p
                    results.append(r)
                    print("  %-26s F1=%.3f P=%.3f R=%.3f AUC=%.3f | rep P=%.3f R=%.3f (%.1fs)"
                          % (r["name"], r["f1"], r["prec"], r["rec"], r["auc"], pr_rand, rc_rand, r["fit_s"]), flush=True)
                except Exception as e:
                    print("  FAIL %s %s %s" % (mode, fname, mname), str(e)[:70], flush=True)

    results.sort(key=lambda r: -r["f1"])
    print("\n=== top 8 by F1 ===", flush=True)
    for r in results[:8]:
        print("  %-26s F1=%.3f P=%.3f R=%.3f AUC=%.3f cm=%s" % (r["name"], r["f1"], r["prec"], r["rec"], r["auc"], r["cm"]), flush=True)

    best = results[0]
    print("\n=== threshold sweep, best model (%s) ===" % best["name"], flush=True)
    p = best["_p"]
    for th in (0.3, 0.4, 0.5, 0.6, 0.7, 0.8):
        pred = (p >= th).astype(int)
        pr, rc, f1, _ = precision_recall_fscore_support(y[te], pred, average="binary", zero_division=0)
        prr, rcr, f1r, _ = precision_recall_fscore_support(y[te][te_rand], pred[te_rand], average="binary", zero_division=0)
        print("   th=%.1f  all: P=%.3f R=%.3f F1=%.3f | rep: P=%.3f R=%.3f F1=%.3f flagged=%d"
              % (th, pr, rc, f1, prr, rcr, f1r, pred.sum()), flush=True)

    with open(os.path.join(DIR, "experiments_v2.json"), "w") as f:
        json.dump([{k: v for k, v in r.items() if not k.startswith("_")} for r in results], f, indent=1)

    # ---- export ----
    use_ctx = "ctx3" in best["name"]
    use_char = ("char" in best["name"] or "union" in best["name"])
    use_word = ("word" in best["name"] or "union" in best["name"])
    C = 4.0
    for c in (1, 4, 16):
        if "C=%d" % c in best["name"]:
            C = float(c)
    texts = texts_for(rows, "ctx3" if use_ctx else "target")
    print("\nexporting: ctx=%s word=%s char=%s C=%s" % (use_ctx, use_word, use_char, C), flush=True)

    vecs = []; mats = []
    if use_word:
        v = TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True, lowercase=True,
                            strip_accents=None, token_pattern=r"(?u)\b\w\w+\b")
        mats.append(v.fit_transform(texts)); vecs.append(("word", v))
    if use_char:
        v = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), min_df=2, sublinear_tf=True,
                            lowercase=True, strip_accents=None)
        mats.append(v.fit_transform(texts)); vecs.append(("char_wb", v))
    X = hstack(mats).tocsr() if len(mats) > 1 else mats[0]
    clf = LogisticRegression(C=C, max_iter=3000, class_weight="balanced").fit(X, y)

    model = {"format": "tfidf-logreg-v1", "decision": "violation = noul>=0.5 AND choice!=no_violation",
             "use_context": use_ctx, "n_ctx": N_CTX, "C": C, "class_weight": "balanced",
             "metrics": {k: best[k] for k in ("acc", "prec", "rec", "f1", "auc", "cm", "rand_prec", "rand_rec", "rand_f1")},
             "n_docs": int(len(y)), "positives": int(y.sum()),
             "analyzers": [], "coef": [round(float(c), 7) for c in clf.coef_[0]],
             "intercept": round(float(clf.intercept_[0]), 7)}
    off = 0
    for kind, v in vecs:
        model["analyzers"].append({"kind": kind, "ngram_range": list(v.ngram_range), "min_df": v.min_df,
                                   "sublinear_tf": True, "smooth_idf": True, "offset": off,
                                   "n_features": len(v.vocabulary_),
                                   "idf": [round(float(x), 7) for x in v.idf_], "vocab": v.vocabulary_})
        off += len(v.vocabulary_)
    assert off == X.shape[1], (off, X.shape[1])

    samp = list(te[:300])
    pp = portable_predict([texts[i] for i in samp], model)
    ps = clf.predict_proba(X[samp])[:, 1]
    diffs = [abs(a - b) for a, b in zip(pp, ps)]
    print("portable vs sklearn: max|diff|=%.3e mean=%.3e" % (max(diffs), sum(diffs) / len(diffs)), flush=True)

    with open(MODEL_JSON, "w", encoding="utf-8") as f:
        json.dump(model, f)
    print("wrote %s (%.1f KB)  features=%d  vocab=%s"
          % (MODEL_JSON, os.path.getsize(MODEL_JSON) / 1024, X.shape[1],
             [(a["kind"], a["n_features"]) for a in model["analyzers"]]), flush=True)


if __name__ == "__main__":
    main()
