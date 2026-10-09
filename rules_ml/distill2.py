"""Wider distillation sweep: feature blocks, model families, label variants,
and a decision-threshold sweep (precision matters for a 'reconsider' prompt)."""
import json, os, sys, time, math
import numpy as np
from scipy.sparse import hstack, csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.naive_bayes import ComplementNB
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, roc_auc_score, roc_curve

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
DEC = os.path.join(DIR, "decisions.jsonl")


def load():
    rows = []
    with open(DEC, "r", encoding="utf-8") as f:
        for line in f:
            try:
                r = json.loads(line)
            except Exception:
                continue
            if r.get("error") or r.get("noul") is None:
                continue
            rows.append(r)
    # de-duplicate by idx, keeping a successful row
    seen = {}
    for r in rows:
        seen[r["idx"]] = r
    return [seen[k] for k in sorted(seen)]


def texts_for(rows, mode):
    out = []
    for r in rows:
        t = r["target"]
        c = r.get("context") or []
        if mode == "target":
            out.append(t)
        elif mode == "ctx1":
            out.append(" \n ".join(c[-1:]) + " \n " + t)
        elif mode == "ctx3":
            out.append(" \n ".join(c[-3:]) + " \n " + t)
        elif mode == "ctx3tag":
            out.append(" \n ".join(c[-3:]) + " \n <TARGET> " + t)
    return out


def metrics(model, X, y, name, fit_s):
    p = model.predict_proba(X)[:, 1] if hasattr(model, "predict_proba") else model.decision_function(X)
    pred = (p >= 0.5).astype(int)
    acc = accuracy_score(y, pred)
    pr, rc, f1, _ = precision_recall_fscore_support(y, pred, average="binary", zero_division=0)
    auc = roc_auc_score(y, p) if len(set(y)) > 1 else float("nan")
    return dict(name=name, acc=acc, prec=pr, rec=rc, f1=f1, auc=auc, fit_s=fit_s, scores=p)


def main():
    rows = load()
    y_all = np.array([1 if r["noul"] >= 0.5 else 0 for r in rows])
    y_choice = np.array([0 if (r.get("choice") in (None, "no_violation")) else 1 for r in rows])
    print("rows=%d  pos(noul>=.5)=%d (%.2f%%)  pos(choice!=none)=%d (%.2f%%)"
          % (len(rows), y_all.sum(), 100 * y_all.mean(), y_choice.sum(), 100 * y_choice.mean()), flush=True)

    idx = np.arange(len(rows))
    strat = np.array(["%d_%s" % (y_all[i], rows[i].get("source")) for i in idx])
    tr, te = train_test_split(idx, test_size=0.25, random_state=42, stratify=strat)

    results = []
    for yname, y in (("noul", y_all), ("choice", y_choice)):
        for mode in ("target", "ctx1", "ctx3"):
            texts = texts_for(rows, mode)
            Xw = TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True).fit_transform(texts)
            Xc = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), min_df=2, sublinear_tf=True).fit_transform(texts)
            for fname, X in (("word", Xw), ("char", Xc), ("union", hstack([Xw, Xc]).tocsr())):
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
                        r = metrics(m, X[te], y[te], "%s|%s|%s|%s" % (yname, mode, fname, mname), time.time() - t0)
                        results.append(r)
                        print("  %-34s acc=%.4f P=%.3f R=%.3f F1=%.3f AUC=%.3f (%.1fs)"
                              % (r["name"], r["acc"], r["prec"], r["rec"], r["f1"], r["auc"], r["fit_s"]), flush=True)
                    except Exception as e:
                        print("  FAIL", yname, mode, fname, mname, str(e)[:80], flush=True)

    results.sort(key=lambda r: -r["f1"])
    print("\n=== best by F1 ===")
    for r in results[:8]:
        print("  %-34s F1=%.3f P=%.3f R=%.3f AUC=%.3f" % (r["name"], r["f1"], r["prec"], r["rec"], r["auc"]))

    # threshold sweep for the best model
    best = results[0]
    print("\n=== threshold sweep for best (%s) ===" % best["name"])
    p = best["scores"]; y = y_all[te]
    for th in (0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9):
        pred = (p >= th).astype(int)
        pr, rc, f1, _ = precision_recall_fscore_support(y, pred, average="binary", zero_division=0)
        tn, fp = int(((pred == 0) & (y == 0)).sum()), int(((pred == 1) & (y == 0)).sum())
        print("  th=%.1f  P=%.3f R=%.3f F1=%.3f  flagged=%d  fp=%d" % (th, pr, rc, f1, pred.sum(), fp))

    with open(os.path.join(DIR, "experiments2.json"), "w") as f:
        json.dump([{k: v for k, v in r.items() if k != "scores"} for r in results], f, indent=1)
    print("\nsaved experiments2.json")


if __name__ == "__main__":
    main()
