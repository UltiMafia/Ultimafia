"""Re-label the cases the softened wording pushed into ambiguity, after the fix."""
import json, sys
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
sys.path.insert(0, DIR)
import jev_lib2 as L
import run_batch

rows = {}
for l in open(DIR + "/decisions_final.jsonl", encoding="utf-8"):
    r = json.loads(l); rows[r["idx"]] = r
mid = {}
for l in open(DIR + "/decisions_rubric.jsonl", encoding="utf-8"):
    r = json.loads(l)
    if not r.get("error") and r.get("noul") is not None:
        mid[r["idx"]] = r

# the 67: ambiguous under the interim rubric but a CLEAR call under the original
target = [mid[i] for i in mid
          if 0.35 <= mid[i]["noul"] <= 0.65 and not (0.35 <= rows[i]["noul"] <= 0.65)]
print("re-checking %d cases" % len(target), flush=True)
with open(DIR + "/recheck.jsonl", "w", encoding="utf-8") as f:
    for r in target:
        f.write(json.dumps(r) + "\n")

L.load_api_key()
run_batch.SAMPLE = DIR + "/recheck.jsonl"
run_batch.OUT = DIR + "/decisions_recheck.jsonl"
sys.argv = ["run_batch.py", "--workers", "8", "--batch", "1", "--attempts", "10"]
run_batch.main()

new = {}
for l in open(DIR + "/decisions_recheck.jsonl", encoding="utf-8"):
    r = json.loads(l)
    if not r.get("error") and r.get("noul") is not None:
        new[r["idx"]] = r

def lab(r):
    return 1 if (r["noul"] >= 0.5 and r.get("choice") != "no_violation") else 0

print("\n%-46s %-7s %-7s %-7s" % ("case", "orig", "interim", "now"), flush=True)
back = 0
for r in target:
    i = r["idx"]
    o, m, n = rows[i], mid[i], new.get(i)
    if not n:
        continue
    if lab(n):
        back += 1
    print("%-46s %.2f    %.2f    %.2f %s" % (
        o["target"][:46].replace("\n", " "), o["noul"], m["noul"], n["noul"],
        "" if lab(n) else "  still not flagged"), flush=True)
print("\nnow flagged again: %d/%d" % (back, len(target)), flush=True)
