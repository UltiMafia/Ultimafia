"""The 49 teacher/human disagreements on the clean rows, with both positions, for a single
decision pass. Teacher labels are the refreshed (current-rubric) ones.
"""
import json

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
OUT = "/mnt/c/Users/tt/AppData/Local/hermes/cache/scratch/decisions.txt"
FITTED = 122

SET = [json.loads(l) for l in open(DIR + "/eval_set.jsonl", encoding="utf-8")]
DONE = {d["i"]: d for d in json.load(open(DIR + "/eval_done.json"))}


def tv(r):
    return r.get("clef") != "no_violation" and float(r.get("clef_p") or 0) >= 0.5


over, miss = [], []          # teacher flags / teacher passes
for i in sorted(DONE):
    if i < FITTED:
        continue
    r, h = SET[i], "flag" if DONE[i]["human"] == "flag" else "ok"
    if tv(r) and h == "ok":
        over.append((i, r, h))
    elif (not tv(r)) and h == "flag":
        miss.append((i, r, h))


def blk(title, items, note):
    L = ["", "=" * 78, title, note, "=" * 78]
    for i, r, h in items:
        ctx = r.get("context") or []
        L.append("")
        L.append("[%d]  %s" % (i, r.get("sender") or ""))
        if ctx:
            L.append("      ctx: %s" % " / ".join(str(c) for c in ctx[-1:])[:96])
        L.append("   >> %s" % r["message"].replace("\n", " "))
        L.append("      teacher: %-28s p=%.2f     you: %s" % (r.get("clef"), float(r.get("clef_p") or 0), h.upper()))
    return L


L = []
L += blk("A. TEACHER FLAGS, YOU PASSED  (%d rows)" % len(over),
         over, "\nA 'relax P&A' change targets these. Each is a candidate for: rule too strict,\n"
               "judge misapplying an existing carve-out, or you being lenient.")
L += blk("B. TEACHER PASSES, YOU FLAGGED  (%d rows)" % len(miss),
         miss, "\nA 'sharpen the rubric' change targets these: the rule does not cover something\n"
               "you consider a violation.")
open(OUT, "w", encoding="utf-8").write("\n".join(L))
print("wrote %s  (%d over-flags, %d missed)" % (OUT, len(over), len(miss)))
print("\n--- A: teacher flags, you passed ---")
for i, r, h in over:
    print("  [%d] %-58s teacher=%s" % (i, r["message"][:58], r.get("clef")))
print("\n--- B: teacher passes, you flagged ---")
for i, r, h in miss:
    print("  [%d] %-58s teacher=%s p=%.2f" % (i, r["message"][:58], r.get("clef"), float(r.get("clef_p") or 0)))
