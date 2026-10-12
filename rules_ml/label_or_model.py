"""Is the precision problem the LABELS or the MODEL?

For each case where you said 'ok' but the model flagged: what did Clef label it?
  clef=violation -> the training label is wrong (rubric/judge problem)
  clef=no_violation -> the label was right and the model failed to learn it
"""
import json

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
SET = [json.loads(l) for l in open(DIR + "/eval_set.jsonl", encoding="utf-8")]
DONE = json.load(open(DIR + "/eval_done.json"))
by_i = {i: r for i, r in enumerate(SET)}

fp = [(by_i[d["i"]], d) for d in DONE if d["model"] == "flag" and d["human"] == "ok"]
fn = [(by_i[d["i"]], d) for d in DONE if d["model"] == "ok" and d["human"] == "flag"]
ok_rows = [(by_i[d["i"]], d) for d in DONE if d["model"] == "ok" and d["human"] == "ok"]
flag_rows = [(by_i[d["i"]], d) for d in DONE if d["model"] == "flag" and d["human"] == "flag"]

print("model FLAGGED but you said ok: %d" % len(fp), flush=True)
lab_bad = sum(1 for r, d in fp if r.get("clef") not in ("no_violation", None))
print("   ...of which Clef had labelled as a VIOLATION: %d" % lab_bad, flush=True)
print("   ...of which Clef had labelled no_violation:   %d" % (len(fp) - lab_bad), flush=True)
from collections import Counter
print("   clef categories:", dict(Counter(r.get("clef") for r, d in fp)), flush=True)
print("\n   examples where the LABEL was wrong (clef=violation, you say ok):", flush=True)
for r, d in [(r, d) for r, d in fp if r.get("clef") not in ("no_violation", None)][:8]:
    print("     clef=%-24s p=%.2f | %s" % (str(r.get("clef"))[:24], r["model_p"],
          r["message"][:62].replace("\n", " ")), flush=True)
print("\n   examples where the MODEL was wrong (clef=no_violation, you say ok):", flush=True)
for r, d in [(r, d) for r, d in fp if r.get("clef") in ("no_violation", None)][:8]:
    print("     clef=%-24s p=%.2f | %s" % (str(r.get("clef"))[:24], r["model_p"],
          r["message"][:62].replace("\n", " ")), flush=True)

print("\n=== agreement with Clef's own labels, by your call ===", flush=True)
print("  you said OK   and clef said no_violation: %d / %d" % (
    sum(1 for r, d in ok_rows if r.get("clef") == "no_violation"), len(ok_rows)), flush=True)
print("  you said FLAG and clef said violation:    %d / %d" % (
    sum(1 for r, d in flag_rows if r.get("clef") not in ("no_violation", None)), len(flag_rows)), flush=True)
print("\n  your misses (model passed, you flagged):", flush=True)
for r, d in fn:
    print("     clef=%-24s p=%.2f | %s" % (str(r.get("clef"))[:24], r["model_p"],
          r["message"][:62].replace("\n", " ")), flush=True)
