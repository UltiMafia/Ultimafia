"""Distil a small CPU-only rule-violation model from the Jev decisions.

Experiments over vectorizers x classifiers, reports held-out metrics,
saves the best model and a portable JSON export for Node.
"""
import json, os, sys, time, math
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.linear_model import LogisticRegression, SGDClassifier, RidgeClassifier
from sklearn.svm import LinearSVC
from sklearn.naive_bayes import ComplementNB, MultinomialNB
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (accuracy_score, precision_recall_fscore_support,
                             roc_auc_score, confusion_matrix)

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
DEC = os.path.join(DIR, "decisions.jsonl")
NON_VIOL = "no_violation"


def load():
    rows = []
    with open(DEC, "r", encoding="utf-8") as f:
        for line in f:
            try:
                r = json.loads(line)
            except Exception:
                continue
            if r.get("error"):
                continue
            if r.get("noul") is None:
                continue
            rows.append(r)
    return rows


def make_text(r, use_ctx, n_ctx=3):
    if not use_ctx:
        return r["target"]
    ctx = (r.get("context") or [])[-n_ctx:]
    return " \n ".join(ctx) + " \n " + r["target"]


def vec_word():
    return TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True,
                           strip_accents="unicode", lowercase=True)


def vec_char():
    return TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), min_df=3,
                           sublinear_tf=True, lowercase=True)


def vec_union():
    return FeatureUnion([("w", vec_word()), ("c", vec_char())])


def evaluate(name, model, Xtr, ytr, Xte, yte, ctexts=None):
    t0 = time.time()
    model.fit(Xtr, ytr)
    fit_t = time.time() - t0
    pred = model.predict(Xte)
    acc = accuracy_score(yte, pred)
    p, r, f1, _ = precision_recall_fscore_support(yte, pred, average="binary", zero_division=0)
    try:
        if hasattr(model, "predict_proba"):
            score = model.predict_proba(Xte)[:, 1]
        elif hasattr(model, "decision_function"):
            score = model.decision_function(Xte)
        else:
            score = pred
        auc = roc_auc_score(yte, score)
    except Exception:
        auc = float("nan")
    cm = confusion_matrix(yte, pred, labels=[0, 1])
    return {"name": name, "acc": acc, "prec": p, "rec": r, "f1": f1, "auc": auc,
            "fit_s": fit_t, "cm": cm.tolist()}


def main():
    rows = load()
    print("decisions loaded:", len(rows))
    if not rows:
        print("no decisions yet")
        return
    src = {}
    for r in rows:
        src[r.get("source")] = src.get(r.get("source"), 0) + 1
    print("by source:", src)

    y_bin = np.array([1 if r["noul"] >= 0.5 else 0 for r in rows])
    print("positives: %d/%d (%.2f%%)" % (y_bin.sum(), len(y_bin), 100.0 * y_bin.mean()))
    # representative (uniform) base rate
    rnd = [i for i, r in enumerate(rows) if r.get("source") == "random"]
    if rnd:
        print("uniform-sample base rate: %.2f%%" % (100.0 * y_bin[rnd].mean()))

    cat = [r.get("choice") or "?" for r in rows]
    from collections import Counter
    print("top categories:", Counter(cat).most_common(8))

    results = []
    configs = []
    for use_ctx in (False, True):
        for vname, vf in (("word", vec_word), ("char", vec_char)):
            configs.append((vname + ("+ctx" if use_ctx else ""), vf, use_ctx))
    configs.append(("union+ctx", vec_union, True))

    clfs = [
        ("logreg C=1", lambda: LogisticRegression(C=1.0, max_iter=2000, class_weight="balanced")),
        ("logreg C=4", lambda: LogisticRegression(C=4.0, max_iter=2000, class_weight="balanced")),
        ("logreg C=16", lambda: LogisticRegression(C=16.0, max_iter=2000, class_weight="balanced")),
        ("linsvc C=0.25", lambda: LinearSVC(C=0.25, class_weight="balanced")),
        ("linsvc C=1", lambda: LinearSVC(C=1.0, class_weight="balanced")),
        ("sgd log", lambda: SGDClassifier(loss="log_loss", alpha=1e-5, max_iter=3000, class_weight="balanced")),
        ("cnb", lambda: ComplementNB(alpha=0.3)),
        ("mnb", lambda: MultinomialNB(alpha=0.3)),
    ]

    idx = np.arange(len(rows))
    strat = np.array(["%d_%s" % (y_bin[i], rows[i].get("source")) for i in idx])
    tr, te = train_test_split(idx, test_size=0.25, random_state=42, stratify=strat)

    texts_by_cfg = {}
    for name, vf, use_ctx in configs:
        texts_by_cfg[name] = [make_text(r, use_ctx) for r in rows]

    for cname, vf, use_ctx in configs:
        texts = texts_by_cfg[cname]
        for lname, lf in clfs:
            try:
                model = Pipeline([("v", vf()), ("c", lf())])
                res = evaluate(cname + " | " + lname, model,
                               [texts[i] for i in tr], y_bin[tr],
                               [texts[i] for i in te], y_bin[te])
                results.append(res)
                print("  %-28s acc=%.4f prec=%.3f rec=%.3f f1=%.3f auc=%.3f (%.1fs)"
                      % (res["name"], res["acc"], res["prec"], res["rec"], res["f1"], res["auc"], res["fit_s"]),
                      flush=True)
            except Exception as e:
                print("  FAILED", cname, lname, str(e)[:120], flush=True)

    results.sort(key=lambda x: -x["f1"])
    print("\n=== TOP 10 by F1 ===")
    for r in results[:10]:
        print("  %-28s f1=%.3f prec=%.3f rec=%.3f acc=%.4f auc=%.3f cm=%s"
              % (r["name"], r["f1"], r["prec"], r["rec"], r["acc"], r["auc"], r["cm"]))

    with open(os.path.join(DIR, "experiments.json"), "w") as f:
        json.dump(results, f, indent=1)
    print("\nsaved experiments.json")


if __name__ == "__main__":
    main()
