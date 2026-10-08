"""Merge everything into decisions_final.jsonl.

Precedence: v3 targeted  >  v3 main  >  v2 (fallback, unchanged messages).
"""
import json, os
from collections import Counter

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
LATEST = {}   # idx -> row, later sources overwrite earlier ones

def load(fn, offset=0):
    p = os.path.join(DIR, fn)
    if not os.path.exists(p):
        print("  (missing, skipped):", fn)
        return
    n = 0
    for l in open(p, encoding="utf-8"):
        try:
            r = json.loads(l)
        except Exception:
            continue
        if r.get("error") or r.get("noul") is None:
            continue
        r["idx"] = r["idx"] + offset
        r["_src"] = fn
        LATEST[r["idx"]] = r
        n += 1
    print("  %-28s %5d rows" % (fn, n))

print("loading (later overrides earlier):")
load("decisions_v2.jsonl")            # older prompt, all 5,000
load("decisions_supp.jsonl", 100000)  # older prompt, supplement
load("decisions_v3.jsonl")            # new prompt, main sample
load("decisions_v3_supp.jsonl")       # new prompt, supplement (if it ran)
load("decisions_v3_targeted.jsonl", 0)  # new prompt, targeted jargon (idx already set)
load("decisions_v3_praise.jsonl", 0)    # new prompt, praise/banter hard negatives (idx 200000+)
load("decisions_v3_game.jsonl", 0)      # new prompt, 'game'-mentioning hard negatives (idx 300000+)

out = DIR + "/decisions_final.jsonl"
with open(out, "w", encoding="utf-8") as f:
    for k in sorted(LATEST):
        f.write(json.dumps(LATEST[k]) + "\n")

pos = sum(1 for r in LATEST.values() if r["noul"] >= 0.5 and r.get("choice") != "no_violation")
print("\ntotal: %d  positives: %d (%.2f%%)" % (len(LATEST), pos, 100.0 * pos / len(LATEST)))
print("label provenance:", dict(Counter(r["_src"] for r in LATEST.values())))
