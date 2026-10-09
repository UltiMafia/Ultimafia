"""Label a mixed sample with the NEW rubric, so we can see where it is still ambiguous."""
import json, random, sys
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
sys.path.insert(0, DIR)
import jev_lib2 as L
import run_batch


def main():
    rows = [json.loads(l) for l in open(DIR + "/decisions_final.jsonl", encoding="utf-8")]
    by_idx = {r["idx"]: r for r in rows}
    old_amb = [r for r in rows if 0.35 <= r["noul"] <= 0.65]
    old_pos = [r for r in rows if r["noul"] >= 0.5 and r.get("choice") != "no_violation"
               and not (0.35 <= r["noul"] <= 0.65)]
    amb_idx = {r["idx"] for r in old_amb}
    pos_idx = {r["idx"] for r in old_pos}
    rest = [r for r in rows if r["idx"] not in amb_idx and r["idx"] not in pos_idx]
    random.seed(7)
    pick = (random.sample(old_amb, 200) + random.sample(old_pos, 150)
            + random.sample(rest, 150))
    pick = [dict(r) for r in pick]
    with open(DIR + "/rubric_sample.jsonl", "w", encoding="utf-8") as f:
        for r in pick:
            f.write(json.dumps(r) + "\n")
    print("sample: %d rows (%d old-ambiguous, %d old-positive, %d other)"
          % (len(pick), 200, 150, 150), flush=True)

    L.load_api_key()
    run_batch.SAMPLE = DIR + "/rubric_sample.jsonl"
    run_batch.OUT = DIR + "/decisions_rubric.jsonl"
    sys.argv = ["run_batch.py", "--workers", "8", "--batch", "1", "--attempts", "10"]
    run_batch.main()

    # quick summary: new label distribution vs old
    new = {}
    for l in open(DIR + "/decisions_rubric.jsonl", encoding="utf-8"):
        r = json.loads(l)
        if not r.get("error") and r.get("noul") is not None:
            new[r["idx"]] = r

    def lab(r):
        return 1 if (r["noul"] >= 0.5 and r.get("choice") != "no_violation") else 0

    both = [i for i in new if i in by_idx]
    oldp = sum(lab(by_idx[i]) for i in both)
    newp = sum(lab(new[i]) for i in both)
    band = [i for i in both if 0.35 <= new[i]["noul"] <= 0.65]
    print("\n=== n=%d re-labelled under the new rubric ===" % len(both), flush=True)
    print("  positives: old=%d -> new=%d" % (oldp, newp), flush=True)
    print("  still ambiguous (0.35-0.65): %d" % len(band), flush=True)
    from collections import Counter
    print("  new categories:", dict(Counter(new[i].get("choice") for i in both)), flush=True)
    print("  newly-ambiguous that used to be a clear CALL: %d"
          % sum(1 for i in band if not (0.35 <= by_idx[i]["noul"] <= 0.65)), flush=True)


main()
