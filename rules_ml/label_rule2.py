"""Find the label rule that satisfies BOTH owner counter-examples:
   'FUCK U'              -> violation  (noul 0.48, category personal_attacks_harassment)
   'blocking gamethrower'-> not        (noul 0.54, category no_violation)
Pure category-only adds 318 mostly-benign rows; find the score floor that avoids that.
"""
import json
from collections import Counter

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
rows = [json.loads(l) for l in open(DIR + "/decisions_final.jsonl", encoding="utf-8")]
noul = lambda r: r["noul"] or 0.0
cat = lambda r: r.get("choice")

print("does each candidate rule satisfy the two counter-examples?", flush=True)
FUCK = [r for r in rows if r["target"].strip() == "FUCK U"]
BLK = [r for r in rows if r["target"].strip() == "blocking gamethrower"]
for r in FUCK:
    print("  'FUCK U'              noul=%.2f cat=%s" % (noul(r), cat(r)), flush=True)
for r in BLK:
    print("  'blocking gamethrower' noul=%.2f cat=%s" % (noul(r), cat(r)), flush=True)

print("\n%-46s %8s %8s" % ("rule", "pos", "rate"), flush=True)
cands = [("current: noul>=0.5 AND cat", lambda r: noul(r) >= 0.5 and cat(r) != "no_violation")]
for T in (0.25, 0.3, 0.35, 0.4, 0.45):
    cands.append(("cat!=no_violation AND noul>=%.2f" % T,
                  (lambda T: lambda r: cat(r) != "no_violation" and noul(r) >= T)(T)))
for name, f in cands:
    n = sum(1 for r in rows if f(r))
    fk = "VIOLATION" if (FUCK and f(FUCK[0])) else "not"
    bk = "violation" if (BLK and f(BLK[0])) else "NOT"
    print("%-46s %8d %7.2f%%   FUCK-U=%-9s blocking=%s" % (name, n, 100 * n / len(rows), fk, bk), flush=True)

print("\nlow-score-but-category-labelled rows (the 318) - noul distribution:", flush=True)
low = [r for r in rows if cat(r) != "no_violation" and noul(r) < 0.5]
for lo in (0.0, 0.2, 0.3, 0.35, 0.4):
    print("   noul < %.2f : %d" % (lo, sum(1 for r in low if noul(r) < lo)), flush=True)
print("\n  examples at noul 0.35-0.50 (would be KEPT by a 0.35 floor):", flush=True)
for r in [r for r in low if noul(r) >= 0.35][:8]:
    print("    %.2f %-26s %r" % (noul(r), str(cat(r))[:26], r["target"][:46]), flush=True)
