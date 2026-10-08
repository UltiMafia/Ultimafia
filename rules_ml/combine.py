import json, sys

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
OUT = DIR + "/decisions_all.jsonl"
OFF = 100000

n = 0
seen = {}
for fn in ("decisions_v2.jsonl", "decisions_supp.jsonl"):
    for line in open(DIR + "/" + fn, encoding="utf-8"):
        try:
            r = json.loads(line)
        except Exception:
            continue
        if r.get("error") or r.get("noul") is None:
            continue
        if fn.startswith("decisions_supp"):
            r["idx"] = r["idx"] + OFF
        seen[r["idx"]] = r

with open(OUT, "w", encoding="utf-8") as f:
    for k in sorted(seen):
        f.write(json.dumps(seen[k]) + "\n")
print("combined", len(seen), "decisions ->", OUT)
from collections import Counter
print("by source:", Counter(r.get("source") for r in seen.values()))
