"""Merge GRA into OGI: re-label the GRA-labelled rows under the merged rubric and splice.

The rubric no longer has a game_related_abandonment category - a chat message can only
ever THREATEN or announce a leave, and that is OGI. So every GRA-labelled row needs
re-labeling; the OGI rows are untouched (their rule text only grew more explicit).
"""
import json, os, shutil, sys
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
sys.path.insert(0, DIR)
import jev_lib2 as L
import run_batch

FINAL = DIR + "/decisions_final_clef.jsonl"
SUB = DIR + "/gra_subset.jsonl"
OUT = DIR + "/decisions_clef_gra.jsonl"

rows = [json.loads(l) for l in open(FINAL, encoding="utf-8")]
gra = [r for r in rows if r.get("choice") == "game_related_abandonment"]
seen, uniq = set(), []
for r in gra:
    k = (r.get("idx"), r.get("target"))
    if k in seen:
        continue
    seen.add(k); uniq.append(r)
with open(SUB, "w", encoding="utf-8") as f:
    for r in uniq:
        f.write(json.dumps(r) + "\n")
print("GRA rows: %d (%d unique) -> %s" % (len(gra), len(uniq), SUB), flush=True)

if os.path.exists(OUT):
    os.remove(OUT)
L.load_api_key()
run_batch.SAMPLE = SUB
run_batch.OUT = OUT
sys.argv = ["run_batch.py", "--workers", "6", "--batch", "4", "--attempts", "6", "--model", "clef"]
run_batch.main()

new = {}
for line in open(OUT, encoding="utf-8"):
    try:
        r = json.loads(line)
    except Exception:
        continue
    if not r.get("error") and r.get("noul") is not None:
        new[(r.get("idx"), r.get("target"))] = r

shutil.copyfile(FINAL, DIR + "/decisions_final_clef_pre_gra.jsonl")
from collections import Counter
flips = Counter()
n = 0
for r in rows:
    k = (r.get("idx"), r.get("target"))
    if k in new:
        old = r.get("choice")
        nr = new[k]
        r["noul"], r["choice"], r["choice_conf"] = nr["noul"], nr["choice"], nr.get("choice_conf")
        flips["%s -> %s" % (old, r["choice"])] += 1
        n += 1
with open(FINAL, "w", encoding="utf-8") as f:
    for r in rows:
        f.write(json.dumps(r) + "\n")

print("\nre-labelled %d rows" % n, flush=True)
for k, v in flips.most_common(10):
    print("   %-56s %d" % (k, v), flush=True)
cats = Counter(r.get("choice") for r in rows)
print("\ncorpus categories now:", dict(cats), flush=True)
