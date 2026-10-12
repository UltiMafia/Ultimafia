"""Re-label the affected subset under the sharpened rubric, splice it back in, retrain.

Only rows currently labelled a violation AND containing profanity/insult/game vocabulary
are re-labelled. The rubric change can only REMOVE violations, so every other row keeps
its label by construction.
"""
import json, os, shutil, sys, time
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
sys.path.insert(0, DIR)
import jev_lib2 as L
import run_batch

FINAL = DIR + "/decisions_final_clef.jsonl"
RELAB = DIR + "/decisions_clef_relabel.jsonl"

# ---- 1. re-label the subset ----
print("=== re-labelling the affected subset ===", flush=True)
if os.path.exists(RELAB):
    os.remove(RELAB)
L.load_api_key()
run_batch.SAMPLE = DIR + "/relabel_subset.jsonl"
run_batch.OUT = RELAB
sys.argv = ["run_batch.py", "--workers", "6", "--batch", "4", "--attempts", "6",
            "--model", "clef"]
run_batch.main()

# ---- 2. splice the corrected labels back in ----
print("\n=== splicing ===", flush=True)
new = {}
with open(RELAB, encoding="utf-8") as f:
    for line in f:
        try:
            r = json.loads(line)
        except Exception:
            continue
        if r.get("error") or r.get("noul") is None:
            continue
        new[(r.get("idx"), r.get("target"))] = r

rows = [json.loads(l) for l in open(FINAL, encoding="utf-8")]
shutil.copyfile(FINAL, DIR + "/decisions_final_clef_pre_targeting.jsonl")

changed = 0
from collections import Counter
flips = Counter()
for r in rows:
    k = (r.get("idx"), r.get("target"))
    if k in new:
        nr = new[k]
        old_choice, old_noul = r.get("choice"), r.get("noul")
        r["noul"], r["choice"] = nr["noul"], nr["choice"]
        r["choice_conf"] = nr.get("choice_conf")
        if old_choice != r["choice"]:
            changed += 1
            flips["%s -> %s" % (old_choice, r["choice"])] += 1

with open(FINAL, "w", encoding="utf-8") as f:
    for r in rows:
        f.write(json.dumps(r) + "\n")

def is_vio(r):
    return r.get("choice") not in ("no_violation", None) and float(r.get("noul") or 0) >= 0.5

n_vio = sum(1 for r in rows if is_vio(r))
print("rows: %d   violations now: %d (was %d)  label category changes: %d"
      % (len(rows), n_vio, n_vio + changed, changed), flush=True)
for k, v in flips.most_common(8):
    print("   %-58s %d" % (k, v), flush=True)

# ---- 3. retrain ----
print("\n=== retraining transformer ===", flush=True)
exec(open(DIR + "/finetune2.py").read())
