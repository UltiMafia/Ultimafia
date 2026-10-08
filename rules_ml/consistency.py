"""Test-retest: re-label already-labelled messages with the IDENTICAL input.

If Jev is self-consistent, its stored label is a function of the input and the
missing AUC must come from ambiguity/sparsity. If it disagrees with itself,
label noise sets the ceiling.
"""
import json, random, sys
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
sys.path.insert(0, DIR)
import jev_lib2 as L
import run_batch


def main():
    rows = [json.loads(l) for l in open(DIR + "/decisions_final.jsonl", encoding="utf-8")]
    pos = [r for r in rows if r["noul"] >= 0.5 and r.get("choice") != "no_violation"]
    neg = [r for r in rows if not (r["noul"] >= 0.5 and r.get("choice") != "no_violation")]
    random.seed(99)
    pick = random.sample(pos, min(125, len(pos))) + random.sample(neg, min(125, len(neg)))
    pick = [dict(r) for r in pick]          # keep idx + context exactly as labelled
    with open(DIR + "/relabel.jsonl", "w", encoding="utf-8") as f:
        for r in pick:
            f.write(json.dumps(r) + "\n")
    print("re-labelling %d messages (%d pos, %d neg) with identical input"
          % (len(pick), min(125, len(pos)), min(125, len(neg))), flush=True)

    L.load_api_key()
    run_batch.SAMPLE = DIR + "/relabel.jsonl"
    run_batch.OUT = DIR + "/decisions_relabel.jsonl"
    sys.argv = ["run_batch.py", "--workers", "8", "--batch", "1", "--attempts", "10"]
    run_batch.main()

    # compare
    old = {r["idx"]: r for r in pick}
    new = {}
    for l in open(DIR + "/decisions_relabel.jsonl", encoding="utf-8"):
        r = json.loads(l)
        if not r.get("error") and r.get("noul") is not None:
            new[r["idx"]] = r
    both = [i for i in new if i in old]
    print("\n=== test-retest agreement (n=%d) ===" % len(both), flush=True)

    def lab(r):
        return 1 if (r["noul"] >= 0.5 and r.get("choice") != "no_violation") else 0

    same_bin = sum(1 for i in both if lab(old[i]) == lab(new[i]))
    same_cat = sum(1 for i in both if old[i].get("choice") == new[i].get("choice"))
    dif = [abs(old[i]["noul"] - new[i]["noul"]) for i in both]
    mean_abs = sum(dif) / len(dif)
    print("  same violation/non-violation call: %d/%d = %.1f%%" % (same_bin, len(both), 100 * same_bin / len(both)), flush=True)
    print("  same category:                    %d/%d = %.1f%%" % (same_cat, len(both), 100 * same_cat / len(both)), flush=True)
    print("  mean |delta noul|: %.3f" % mean_abs, flush=True)

    flips = [i for i in both if lab(old[i]) != lab(new[i])]
    print("\n  examples that flipped:", flush=True)
    for i in flips[:12]:
        print("    old=%.2f/%s -> new=%.2f/%s | %r"
              % (old[i]["noul"], old[i].get("choice"), new[i]["noul"], new[i].get("choice"),
                 old[i]["target"][:58]), flush=True)


main()
