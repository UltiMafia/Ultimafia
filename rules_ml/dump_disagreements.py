"""Dump every teacher/human disagreement, with the message, its context, and what the
student thought - so the discrepancy can be read rather than counted.
"""
import json

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
OUT = "/mnt/c/Users/tt/AppData/Local/hermes/cache/scratch/disagreements.txt"
FITTED = 122

SET = [json.loads(l) for l in open(DIR + "/eval_set.jsonl", encoding="utf-8")]
DONE = json.load(open(DIR + "/eval_done.json"))
by_i = {i: r for i, r in enumerate(SET)}
rows = sorted([(by_i[d["i"]], d) for d in DONE if d["i"] in by_i], key=lambda x: x[1]["i"])


def clef_vio(r):
    return r.get("clef") != "no_violation" and float(r.get("clef_p", 0)) >= 0.5


def block(title, sel):
    out = ["", "=" * 78, title, "=" * 78]
    for (r, d), s in zip(rows, sel):
        if not s:
            continue
        ctx = r.get("context") or []
        out.append("")
        out.append("[%s]  %s" % ("clean" if d["i"] >= FITTED else "fitted", r["sender"]))
        if ctx:
            out.append("     ... %s" % " / ".join(str(c) for c in ctx[-2:]))
        out.append("  >> %s" % r["message"].replace("\n", " "))
        out.append("     teacher: %-26s p=%.2f   student p=%.2f   you: %s"
                   % (r.get("clef"), float(r.get("clef_p", 0)), float(r["model_p"]),
                      d["human"].upper()))
    return out


clean_rows = [(r, d) for r, d in rows if d["i"] >= FITTED]
# masks must align with `rows` (block() zips against it), so build them over `rows`
miss = [(d["i"] >= FITTED) and (not clef_vio(r)) and d["human"] == "flag" for r, d in rows]
fals = [(d["i"] >= FITTED) and clef_vio(r) and d["human"] == "ok" for r, d in rows]
assert sum(miss) + sum(fals) == 41, (sum(miss), sum(fals))

L = []
L += block("A. TEACHER SAID FINE, YOU FLAGGED  (%d rows) - teacher MISSES" % sum(miss), miss)
L += block("B. TEACHER FLAGGED, YOU SAID FINE  (%d rows) - teacher FALSE FLAGS" % sum(fals), fals)
open(OUT, "w", encoding="utf-8").write("\n".join(L))
print("wrote %s  (%d misses, %d false flags, %d total disagreements)"
      % (OUT, sum(miss), sum(fals), sum(miss) + sum(fals)))
