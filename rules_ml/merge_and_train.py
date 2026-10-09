"""Merge the Clef labels and retrain, to compare against the AUC 0.862 baseline."""
import json, os, sys
from collections import Counter

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
sys.path.insert(0, DIR)
LATEST = {}


def load(fn, offset=0):
    p = os.path.join(DIR, fn)
    if not os.path.exists(p):
        print("  (missing, skipped):", fn, flush=True)
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
        if not r.get("game_id"):
            r["game_id"] = "%s-%d" % (fn, r["idx"])   # GroupShuffleSplit needs sortable groups
        r["_src"] = fn
        LATEST[r["idx"]] = r
        n += 1
    print("  %-32s %5d rows" % (fn, n), flush=True)


print("loading Clef labels (later overrides earlier):", flush=True)
load("decisions_clef.jsonl")
load("decisions_clef_supp.jsonl", 100000)
load("decisions_clef_praise.jsonl")
load("decisions_clef_game.jsonl")
load("decisions_clef_targeted.jsonl")   # targeted buckets: gt/dox/tgt/untg (idx 400000+)
load("decisions_clef_ogi.jsonl")        # OGI accusation forms (idx 500000+)
load("decisions_clef_play.jsonl")       # play-directed vs person-directed profanity (idx 600000+)

out = DIR + "/decisions_final_clef.jsonl"
with open(out, "w", encoding="utf-8") as f:
    for k in sorted(LATEST):
        f.write(json.dumps(LATEST[k]) + "\n")

pos = sum(1 for r in LATEST.values() if r["noul"] >= 0.5 and r.get("choice") != "no_violation")
print("\ntotal %d  positives %d (%.2f%%)" % (len(LATEST), pos, 100.0 * pos / len(LATEST)), flush=True)
print("categories:", dict(Counter(r.get("choice") for r in LATEST.values())), flush=True)

print("\n=== retrain ===", flush=True)
import export_v3
export_v3.DEC = out
export_v3.main()
