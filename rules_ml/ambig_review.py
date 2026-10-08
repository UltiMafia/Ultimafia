"""Cluster the ambiguous band so each cluster is one rubric decision.

Outputs:
  * a digest on stdout (cluster, size, top terms, examples)
  * ambiguous_review.md  - every boundary case, grouped, for human judgement
"""
import json
from collections import Counter
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
rows = [json.loads(l) for l in open(DIR + "/decisions_final.jsonl", encoding="utf-8")]
by_idx = {r["idx"]: r for r in rows}

# proven-unstable: the same input re-labelled differently
flip = set()
try:
    for l in open(DIR + "/decisions_relabel.jsonl", encoding="utf-8"):
        r = json.loads(l)
        if r.get("error") or r.get("noul") is None:
            continue
        o = by_idx.get(r["idx"])
        if not o:
            continue
        a = 1 if (o["noul"] >= 0.5 and o.get("choice") != "no_violation") else 0
        b = 1 if (r["noul"] >= 0.5 and r.get("choice") != "no_violation") else 0
        if a != b:
            flip.add(r["idx"])
except FileNotFoundError:
    pass
print("proven-unstable (flipped on re-label): %d" % len(flip), flush=True)

band = [r for r in rows if 0.35 <= r["noul"] <= 0.65]
print("ambiguous band 0.35-0.65: %d rows (%.1f%% of corpus)" % (len(band), 100 * len(band) / len(rows)), flush=True)
print("  by Jev category:", dict(Counter(r.get("choice") for r in band)), flush=True)
print("  flip rate inside band: %.1f%%" % (100 * sum(1 for r in band if r["idx"] in flip) / len(band)), flush=True)

texts = [r["target"] for r in band]
K = 14
v = TfidfVectorizer(ngram_range=(1, 2), min_df=2, stop_words="english")
X = v.fit_transform(texts)
km = KMeans(n_clusters=K, n_init=10, random_state=42).fit(X)
labels = km.labels_
terms = np.array(v.get_feature_names_out())

md = ["# Boundary cases (noul 0.35-0.65) - each cluster is one rubric decision", "",
      "`flip` = the identical input was re-labelled with the opposite call.", ""]
for c in range(K):
    idxs = np.where(labels == c)[0]
    if len(idxs) < 4:
        continue
    centroid = km.cluster_centers_[c]
    top = ", ".join(terms[np.argsort(centroid)[::-1][:8]])
    sub = [band[i] for i in idxs]
    nflip = sum(1 for r in sub if r["idx"] in flip)
    print("\n--- cluster %d  (n=%d, %d flipped) ---" % (c, len(sub), nflip), flush=True)
    print("  terms: %s" % top, flush=True)
    # most representative = closest to centroid
    sim = cosine_similarity(X[idxs], centroid.reshape(1, -1)).ravel()
    for j in np.argsort(sim)[::-1][:4]:
        r = sub[j]
        print("    %-52s noul=%.2f %-26s%s" % (r["target"][:52].replace("\n", " "),
              r["noul"], r.get("choice", ""), "  [FLIP]" if r["idx"] in flip else ""), flush=True)
    md.append("## cluster %d  (n=%d, %d flipped)" % (c, len(sub), nflip))
    md.append("")
    md.append("terms: `%s`" % top)
    md.append("")
    for r in sorted(sub, key=lambda r: abs(r["noul"] - 0.5)):
        md.append("- `noul=%.2f` **%s**%s -- %s" % (r["noul"], r.get("choice", ""),
                  " **[FLIP]**" if r["idx"] in flip else "", r["target"].replace("\n", " ")))
    md.append("")

open(DIR + "/ambiguous_review.md", "w", encoding="utf-8").write("\n".join(md))
print("\nwrote ambiguous_review.md (%d cases)" % len(band), flush=True)
