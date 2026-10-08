"""Surface where the NEW rubric is still ambiguous, clustered for human ruling."""
import json
from collections import Counter
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
rows = {json.loads(l)["idx"]: json.loads(l)
        for l in open(DIR + "/decisions_final.jsonl", encoding="utf-8")}
new = {}
for l in open(DIR + "/decisions_rubric.jsonl", encoding="utf-8"):
    r = json.loads(l)
    if not r.get("error") and r.get("noul") is not None:
        new[r["idx"]] = r

band = [new[i] for i in new if 0.35 <= new[i]["noul"] <= 0.65]
newly = [r for r in band if not (0.35 <= rows[r["idx"]]["noul"] <= 0.65)]
print("ambiguous under NEW rubric: %d" % len(band), flush=True)
print("  of which NEWLY ambiguous (was a clear call before): %d" % len(newly), flush=True)
print("  categories in the ambiguous band:", dict(Counter(r.get("choice") for r in band)), flush=True)

target = newly if len(newly) >= 20 else band
texts = [r["target"] for r in target]
K = min(10, max(4, len(target) // 6))
v = TfidfVectorizer(ngram_range=(1, 2), min_df=1, stop_words="english")
X = v.fit_transform(texts)
km = KMeans(n_clusters=K, n_init=10, random_state=42).fit(X)
terms = np.array(v.get_feature_names_out())

md = ["# NEW rubric - cases it still rates ambiguously (noul 0.35-0.65)", ""]
for c in range(K):
    idxs = np.where(km.labels_ == c)[0]
    if len(idxs) < 3:
        continue
    top = ", ".join(terms[np.argsort(km.cluster_centers_[c])[::-1][:7]])
    sim = cosine_similarity(X[idxs], km.cluster_centers_[c].reshape(1, -1)).ravel()
    sub = [target[i] for i in idxs]
    print("\n--- cluster %d (n=%d) ---\n  terms: %s" % (c, len(sub), top), flush=True)
    for j in np.argsort(sim)[::-1][:4]:
        r = sub[j]
        o = rows[r["idx"]]
        print("    %-50s new=%.2f/%-24s (was=%.2f/%s)" % (
            r["target"][:50].replace("\n", " "), r["noul"], str(r.get("choice"))[:24],
            o["noul"], str(o.get("choice"))[:22]), flush=True)
    md += ["## cluster %d (n=%d)" % (c, len(sub)), "", "terms: `%s`" % top, ""]
    for r in sorted(sub, key=lambda r: abs(r["noul"] - 0.5)):
        o = rows[r["idx"]]
        md.append("- new `%.2f` **%s**  (was `%.2f` %s) -- %s" % (
            r["noul"], r.get("choice"), o["noul"], o.get("choice"),
            r["target"].replace("\n", " ")))
    md.append("")
open(DIR + "/rubric_review.md", "w", encoding="utf-8").write("\n".join(md))
print("\nwrote rubric_review.md (%d cases)" % len(target), flush=True)
