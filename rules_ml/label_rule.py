"""Which label rule fits the owner's two counter-examples?

  'FUCK U'              score 0.48, category personal_attacks_harassment  -> SHOULD be a violation
  'blocking gamethrower' score 0.54, category no_violation               -> should NOT be

So: category != no_violation  fits both.  noul>=0.5 fits neither (inverted).
Compare the candidate rules on the whole corpus.
"""
import json
from collections import Counter

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
rows = [json.loads(l) for l in open(DIR + "/decisions_final.jsonl", encoding="utf-8")]


def cat(r):
    return r.get("choice")


def noul(r):
    return r["noul"] or 0.0


rules = {
    "current: noul>=0.5 AND cat!=no_violation": lambda r: noul(r) >= 0.5 and cat(r) != "no_violation",
    "B: cat != no_violation (category only)": lambda r: cat(r) != "no_violation",
    "C: noul >= 0.5 (score only)": lambda r: noul(r) >= 0.5,
    "D: either signal (OR)": lambda r: cat(r) != "no_violation" or noul(r) >= 0.5,
}
print("corpus %d" % len(rows), flush=True)
for name, f in rules.items():
    n = sum(1 for r in rows if f(r))
    print("  %-44s positives=%4d (%.2f%%)" % (name, n, 100 * n / len(rows)), flush=True)

print("\nwhere the two signals DISAGREE:", flush=True)
dis = [r for r in rows if (cat(r) != "no_violation") != (noul(r) >= 0.5)]
print("  %d rows (%.1f%%)" % (len(dis), 100 * len(dis) / len(rows)), flush=True)
a = [r for r in dis if cat(r) != "no_violation"]
b = [r for r in dis if cat(r) == "no_violation"]
print("  category=violation but score<0.5 : %d   <- rule B keeps, current drops" % len(a), flush=True)
print("     e.g. " + " | ".join(repr(r["target"][:34]) for r in a[:4]), flush=True)
print("  category=no_violation but score>=0.5: %d   <- current keeps, B drops" % len(b), flush=True)
print("     e.g. " + " | ".join(repr(r["target"][:34]) for r in b[:4]), flush=True)
print("\n  category distribution among the %d category-labelled-but-low-score rows:" % len(a), flush=True)
print("   ", dict(Counter(cat(r) for r in a)), flush=True)
