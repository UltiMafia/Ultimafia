"""Apply the developer's conceded corrections to the hand-check ground truth.

Only rows the developer explicitly said they got wrong are changed, and each correction is
annotated, so the file stays auditable rather than silently edited.
"""
import json

DIR = "/home/tt/Documents/Ultimafia/rules_ml"

# message fragment -> (new call, the developer's stated reason)
CORRECTIONS = {
    "you are gt alt": ("flag", "developer: 'you are gt alt is definitely OGI'"),
    "@everyone vote gamethrower": ("flag", "developer: name collision with Gamethrower11, 'but it should be seen as OGI'"),
    "trash and unfunny": ("flag", "developer: 'I guess that should be a vio actually'"),
    "noob crier": ("flag", "developer: 'my rating for noob crier is also wrong'"),
}

SET = [json.loads(l) for l in open(DIR + "/eval_set.jsonl", encoding="utf-8")]
DONE = json.load(open(DIR + "/eval_done.json"))

changed, notfound = [], set(CORRECTIONS)
for d in DONE:
    msg = SET[d["i"]]["message"]
    for frag, (new, why) in CORRECTIONS.items():
        if frag.lower() in msg.lower():
            notfound.discard(frag)
            if d["human"] != new:
                print("row %-4d %-30s %s -> %s" % (d["i"], msg[:30], d["human"], new))
                d["human"] = new
                d["corrected"] = why
                changed.append(d["i"])
            break

print("\nchanged %d rows: %s" % (len(changed), changed))
if notfound:
    print("NOT FOUND (fragment mismatch): %s" % sorted(notfound))

json.dump(DONE, open(DIR + "/eval_done.json", "w"), ensure_ascii=False)
print("wrote eval_done.json (%d judgements)" % len(DONE))

print("\n=== is 'carman' a name or a role? occurrences in the corpus ===")
import collections
hit = collections.Counter()
for l in open(DIR + "/decisions_final_clef.jsonl", encoding="utf-8"):
    r = json.loads(l)
    if "carman" in r["target"].lower():
        hit[r["target"][:90]] += 1
for m, n in hit.most_common(8):
    print("   %s" % m)
print("   (%d messages mention it)" % sum(hit.values()))

print("\n=== and 'gamethrower' as a *name* (the collision you hit) ===")
by = collections.Counter()
for l in open(DIR + "/decisions_final_clef.jsonl", encoding="utf-8"):
    r = json.loads(l)
    if "gamethrower1" in r["target"].lower():
        by[r.get("choice")] += 1
print("   labels on messages naming Gamethrower1x:", dict(by))
