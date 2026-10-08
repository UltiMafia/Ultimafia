"""Build the corrected gap worklist.

Uses SUBSTRING matching (so 'dumbtelling' and 'gamethrowing' are caught too),
and selects every message that is still carrying an old-prompt label AND
contains jargon. Each record keeps its true idx so the runner tags it correctly.
"""
import json, os, re

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
JARGON = ("dumbtell", "gamethrow", "suing", "suicid", "hipfire", "hip-fire",
          " omgus", "wifom", "fos ", " hc ", "hc,", "meta", " carol", "policy")
OLD = {"decisions_v2.jsonl", "decisions_supp.jsonl"}

# current label provenance
final = {}
for l in open(DIR + "/decisions_final.jsonl", encoding="utf-8"):
    r = json.loads(l)
    final[r["idx"]] = r.get("_src")

samp = [json.loads(l) for l in open(DIR + "/sample.jsonl", encoding="utf-8")]
supp = [json.loads(l) for l in open(DIR + "/supplement.jsonl", encoding="utf-8")]

rows = []
for i, r in enumerate(samp):
    t = r["target"].lower()
    if final.get(i) in OLD and any(g in t for g in JARGON):
        rec = dict(r); rec["idx"] = i
        rows.append(rec)
n_sample = len(rows)
for i, r in enumerate(supp):
    idx = 100000 + i
    if final.get(idx) in OLD:
        rec = dict(r); rec["idx"] = idx
        rows.append(rec)

with open(DIR + "/gap.jsonl", "w", encoding="utf-8") as f:
    for r in rows:
        f.write(json.dumps(r) + "\n")
print("gap rows: %d  (sample jargon: %d, supplement: %d)"
      % (len(rows), n_sample, len(rows) - n_sample))
print("sample indices sample:", [r["idx"] for r in rows[:8]])
