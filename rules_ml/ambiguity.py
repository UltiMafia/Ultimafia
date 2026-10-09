"""Is the disagreement concentrated where the case is genuinely ambiguous?

The set was stratified by how confident the model was. If agreement is high in the
confident strata and low only in the boundary stratum, then the remaining error is
largely inherent ambiguity in the task, not model failure.
"""
import json

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
SET = [json.loads(l) for l in open(DIR + "/eval_set.jsonl", encoding="utf-8")]
DONE = json.load(open(DIR + "/eval_done.json"))
by_i = {i: r for i, r in enumerate(SET)}
rows = [(by_i[d["i"]], d) for d in DONE if d["i"] in by_i]
print("judged: %d / %d" % (len(rows), len(SET)), flush=True)


def stratum(r):
    if r["model_p"] >= 0.70:
        return "model confident FLAG"
    if r["model_p"] <= 0.30:
        return "model confident OK"
    return "model UNCERTAIN (0.30-0.70)"


print("\n%-30s %6s %8s %10s" % ("stratum", "n", "agree", "rate"), flush=True)
for s in ("model confident FLAG", "model confident OK", "model UNCERTAIN (0.30-0.70)"):
    sel = [(r, d) for r, d in rows if stratum(r) == s]
    if not sel:
        continue
    ag = sum(1 for r, d in sel if d["human"] == d["model"])
    print("%-30s %6d %8d %9.0f%%" % (s, len(sel), ag, 100 * ag / len(sel)), flush=True)

# how many times did the owner call a violation that the model was unsure about
print("\n=== your calls by stratum ===", flush=True)
for s in ("model confident FLAG", "model confident OK", "model UNCERTAIN (0.30-0.70)"):
    sel = [(r, d) for r, d in rows if stratum(r) == s]
    if not sel:
        continue
    f = sum(1 for r, d in sel if d["human"] == "flag")
    print("  %-30s you flagged %d/%d (%.0f%%)" % (s, f, len(sel), 100 * f / len(sel)), flush=True)

# the owner's own internal consistency: same message, different calls
seen = {}
dup = 0
for r, d in rows:
    k = r["message"]
    if k in seen and seen[k] != d["human"]:
        dup += 1
    seen[k] = d["human"]
print("\nduplicate messages judged inconsistently: %d" % dup, flush=True)

# how extreme are the model's scores on what the owner found hard (the boundary)?
b = [r["model_p"] for r, d in rows if stratum(r) == "model UNCERTAIN (0.30-0.70)"]
if b:
    import statistics
    print("model_p in the uncertain stratum: min=%.2f median=%.2f max=%.2f"
          % (min(b), statistics.median(b), max(b)), flush=True)
