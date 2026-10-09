import json, re, sys
from collections import Counter, defaultdict
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import export_final2 as E

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
E.DEC = DIR + "/decisions_all.jsonl"
rows = E.load()
y = [E.label(r) for r in rows]
print("labelled rows:", len(rows), " positives:", sum(y))

TEXT = [r["target"] for r in rows]
LOW = [t.lower() for t in TEXT]

print("\n=== 1. site jargon: how often, and how does Jev label it? ===")
terms = ["dumbtell", "dumb tell", "gt", "gamethrow", "suing", "suicid", "hipfire", "hip-fire",
         "hip fire", "fos", "hc", "carol", "omgus", "wifom", "ate", "tmi", "nka", "vfr", "bw",
         "meta", "lurker", "policy"]
for t in terms:
    pat = re.compile(r"(?i)\b" + re.escape(t) + r"\b")
    hits = [i for i, s in enumerate(LOW) if pat.search(s)]
    if not hits:
        print("  %-12s archive-set hits: 0" % t)
        continue
    cats = Counter(rows[i]["choice"] for i in hits)
    pos = sum(y[i] for i in hits)
    flg = sum(1 for i in hits if rows[i]["noul"] >= 0.5)
    print("  %-12s hits=%-4d flagged=%-3d labelled_pos=%-3d  %s"
          % (t, len(hits), flg, pos, cats.most_common(3)))

print("\n=== 2. is the model OVER-flagging in the uniform sample? ===")
rnd = [i for i, r in enumerate(rows) if r.get("source") == "random"]
rnd_flag = [i for i in rnd if rows[i]["noul"] >= 0.5]
print("  uniform: %d messages, %d flagged by Jev (%.2f%%)" % (len(rnd), len(rnd_flag), 100.0 * len(rnd_flag) / len(rnd)))
print("  categories among flagged-uniform:", Counter(rows[i]["choice"] for i in rnd_flag).most_common())

print("\n=== 3. the most common tokens inside uniform-subset PA flags ===")
PA = "personal_attacks_harassment"
pa_msg = [LOW[i] for i in rnd_flag if rows[i]["choice"] == PA]
tok = Counter()
for m in pa_msg:
    for w in re.findall(r"\w\w+", m):
        tok[w] += 1
print("  n=%d  top 25 tokens:" % len(pa_msg))
print("   ", [w for w, _ in tok.most_common(25)])

print("\n=== 4. the highest-scoring uniform PA flags (eyeball for false positives) ===")
for i in sorted([i for i in rnd_flag if rows[i]["choice"] == PA], key=lambda i: -rows[i]["noul"])[:18]:
    print("   jev=%.2f %r" % (rows[i]["noul"], rows[i]["target"][:78]))

print("\n=== 5. split leakage: do train and test share games? ===")
import numpy as np
from sklearn.model_selection import train_test_split
yv = np.array(y)
idx = np.arange(len(rows))
strat = np.array(["%d_%s" % (yv[i], rows[i].get("source")) for i in idx])
tr, te = train_test_split(idx, test_size=0.25, random_state=42, stratify=strat)
gtr = set(rows[i]["game_id"] for i in tr)
gte = set(rows[i]["game_id"] for i in te)
print("  games in train: %d   in test: %d   OVERLAP: %d" % (len(gtr), len(gte), len(gtr & gte)))
print("  test messages whose game also appears in train: %d / %d (%.0f%%)"
      % (sum(1 for i in te if rows[i]["game_id"] in gtr), len(te),
         100.0 * sum(1 for i in te if rows[i]["game_id"] in gtr) / len(te)))
