"""Re-export the char model on the glossary-corrected labels, so both models
in the test page agree on labels."""
import json, os, re, math, sys
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, roc_auc_score, confusion_matrix
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
DEC = DIR + "/decisions_final.jsonl"
NON = "no_violation"
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
                break
    return out


def portable_predict(texts, model):
    coef = model["coef"]; b = model["intercept"]; out = []
    for text in texts:
        vec = [0.0] * len(coef)
        for a in model["analyzers"]:
            toks = tok_char_wb(text, a["ngram_range"][0], a["ngram_range"][1])
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


def main():
    rows = load()
    texts = [r["target"] for r in rows]
    y = np.array([label(r) for r in rows])
    groups = np.array([r["game_id"] for r in rows])
    isrand = np.array([r.get("source") == "random" for r in rows])
    tr, te = next(GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42).split(texts, y, groups))
    te_rand = isrand[te]

    v = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), min_df=2, sublinear_tf=True,
                        lowercase=True, strip_accents=None)
    v.fit([texts[i] for i in tr])
    X = v.transform(texts)
    clf = LogisticRegression(C=1.0, max_iter=3000, class_weight="balanced").fit(X[tr], y[tr])
    p = clf.predict_proba(X[te])[:, 1]
    pred = (p >= 0.5).astype(int)
    pr, rc, f1, _ = precision_recall_fscore_support(y[te], pred, average="binary", zero_division=0)
    auc = roc_auc_score(y[te], p)
    acc = accuracy_score(y[te], pred)
    cm = confusion_matrix(y[te], pred, labels=[0, 1]).tolist()
    prr, rcr, f1r, _ = precision_recall_fscore_support(y[te][te_rand], pred[te_rand], average="binary", zero_division=0)

    vf = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), min_df=2, sublinear_tf=True,
                         lowercase=True, strip_accents=None)
    vf.fit(texts)
    Xf = vf.transform(texts)
    clff = LogisticRegression(C=1.0, max_iter=3000, class_weight="balanced").fit(Xf, y)

    model = {"format": "tfidf-logreg-v1", "name": "char_wb(2,5)+logreg C=1 (glossary labels)",
             "decision": "violation if sigmoid(z) >= threshold; default 0.5",
             "recommended_threshold": 0.7, "use_context": False, "n_ctx": 0,
             "C": 1.0, "class_weight": "balanced", "min_df": 2,
             "n_docs": int(len(y)), "positives": int(y.sum()), "stop_words": [],
             "metrics": {"acc": acc, "precision": pr, "recall": rc, "f1": f1, "auc": auc, "cm": cm,
                         "rep_precision": prr, "rep_recall": rcr, "rep_f1": f1r, "n_test": int(len(te))},
             "analyzers": [{"kind": "char_wb", "ngram_range": [2, 5], "min_df": 2,
                            "sublinear_tf": True, "smooth_idf": True, "offset": 0,
                            "n_features": len(vf.vocabulary_),
                            "idf": [round(float(x), 7) for x in vf.idf_], "vocab": vf.vocabulary_}],
             "coef": [round(float(c), 7) for c in clff.coef_[0]],
             "intercept": round(float(clff.intercept_[0]), 7)}
    with open(DIR + "/model_char.json", "w", encoding="utf-8") as f:
        json.dump(model, f)
    samp = list(te[:300])
    pp = portable_predict([texts[i] for i in samp], model)
    ps = clff.predict_proba(Xf[samp])[:, 1]
    print("model_char.json: %.1f KB, %d features" % (os.path.getsize(DIR + "/model_char.json") / 1024, Xf.shape[1]))
    print("portable vs sklearn max|diff| = %.3e" % max(abs(a - b) for a, b in zip(pp, ps)))
    print("held-out acc=%.4f P=%.3f R=%.3f F1=%.3f AUC=%.3f" % (acc, pr, rc, f1, auc))
    print("representative: P=%.3f R=%.3f" % (prr, rcr))


if __name__ == "__main__":
    main()
