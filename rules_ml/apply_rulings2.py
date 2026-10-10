"""Second round of developer rulings on the hand-check.

210 'you fucking rock'    -> stays FLAG. 'rock' is a NOUN: as dumb as a rock. The developer
                             wrote it. The judge reading it as a compliment is the miss.
293 'FUCK Y, MARRY...'    -> OK. All three are player names; misread under time pressure.
360 'STFU HOLY SHIT'      -> OK. Flagged for aggression; not a violation.
387 'lilith is with us...'-> OK. Targeted dismissal; misflag.
199 'antagonization...'   -> FLAG. Developer: borderline, flag to be safe.
131 'this idiot bomb'     -> stays FLAG. 'bomb' is a ROLE; the player holding it is the idiot.
137 '@Giga13 is orc nl gt'-> stays OK. It is a rule QUESTION, not an accusation. I was wrong
                             to group it as a teacher miss.
"""
import json

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
SET = [json.loads(l) for l in open(DIR + "/eval_set.jsonl", encoding="utf-8")]
DONE = json.load(open(DIR + "/eval_done.json"))

CORR = {
    "FUCK Y, MARRY LUCKY, KILL WP": ("ok", "developer: three player names, misread under time pressure"),
    "STFU HOLY SHIT": ("ok", "developer: flagged for aggression only; a mistake"),
    "lilith is with us. shut up": ("ok", "developer: targeted dismissal, misflag"),
    "but the antagonization will get you bans": ("flag", "developer: borderline, flag to be safe"),
}
changed = []
for d in DONE:
    m = SET[d["i"]]["message"]
    for frag, (new, why) in CORR.items():
        if frag.lower() in m.lower():
            if d["human"] != new:
                print("row %-4d %-42s %s -> %s" % (d["i"], m[:42], d["human"], new))
                d["human"] = new
                changed.append(d["i"])
            d["corrected"] = why
            break
json.dump(DONE, open(DIR + "/eval_done.json", "w"), ensure_ascii=False)
print("\n%d labels changed: %s" % (len(changed), changed))

# ---- what does the human ground truth look like now? ----
print("\n=== human labels on the clean rows ===")
cl = [i for i in sorted(d for d in [x["i"] for x in DONE]) if i >= 122]
fl = sum(1 for d in DONE if d["i"] >= 122 and d["human"] == "flag")
print("  %d clean rows, %d flagged (%.0f%%)" % (len(cl), fl, 100 * fl / len(cl)))

print("\n=== rows the developer has now retracted ===")
for d in DONE:
    if d.get("corrected"):
        print("  [%d] %-46s -> %s" % (d["i"], SET[d["i"]]["message"][:46], d["human"]))
