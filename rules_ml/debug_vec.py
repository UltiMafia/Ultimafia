import sys, json, math
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import numpy as np
import export_final2 as E

rows = E.load()
texts = [r["target"] for r in rows]
y = np.array([E.label(r) for r in rows])

v, X, clf = E.fit("word", texts, y, 4.0, fit_idx=None)
vocab = v.vocabulary_
inv = {i: t for t, i in vocab.items()}

# pick a text with several known tokens
for probe in range(len(texts)):
    row = X[probe].tocoo()
    if len(row.data) >= 3:
        break
text = texts[probe]
print("text:", repr(text[:120]))
print("row nonzeros:", len(row.data))

my = {}
for t in E.tok_word(text):
    i = vocab.get(t)
    if i is None:
        continue
    my[i] = my.get(i, 0) + 1
# apply tf-idf
mn = {}
for i, c in my.items():
    mn[i] = (1.0 + math.log(c)) * v.idf_[i]
norm = math.sqrt(sum(x * x for x in mn.values()))
mn = {i: x / norm for i, x in mn.items()} if norm else mn

sk = {}
for i, d in zip(row.col, row.data):
    sk[int(i)] = float(d)

print("\nsklearn nonzeros=%d  mine=%d" % (len(sk), len(mn)))
allk = sorted(set(sk) | set(mn))
big = sorted(allk, key=lambda i: -abs(sk.get(i, 0) - mn.get(i, 0)))[:8]
for i in big:
    print("  feat %5d %-20r sk=%.6f mine=%.6f diff=%.6f"
          % (i, inv.get(i), sk.get(i, 0), mn.get(i, 0), abs(sk.get(i, 0) - mn.get(i, 0))))

print("\nraw tokens (first 20):", E.tok_word(text)[:20])
print("sklearn tokens (first 20):", v.build_analyzer()(text)[:20])
