"""What survives if we drop categories that can't be judged from a single message?

Per the site owner:
  * insulting another user is ALLOWED (appeal to emotion); only a cross-game
    PATTERN of harassment is a violation -> not decidable from one message.
  * the word "report" usually means a power role's night result, not a threat
    to report someone -> most 'report' positives are judge misreadings.
  * alt accusations are almost always in jest -> not violations.
"""
import json, re
from collections import Counter

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
rows = [json.loads(l) for l in open(DIR + "/decisions_final.jsonl", encoding="utf-8")]


def lab(r):
    return 1 if (r["noul"] >= 0.5 and r.get("choice") != "no_violation") else 0


pos = [r for r in rows if lab(r)]
print("corpus %d  positives %d (%.2f%%)" % (len(rows), len(pos), 100 * len(pos) / len(rows)), flush=True)

print("\n=== positives by category ===", flush=True)
for c, n in Counter(r.get("choice") for r in pos).most_common():
    print("  %-30s %4d  (%.1f%% of positives)" % (c, n, 100 * n / len(pos)), flush=True)

REPORT = re.compile(r"(?i)\breport", re.I)
ALT = re.compile(r"(?i)\balt\b|\balts\b|\balt\b|second account|smurf")
SUE = re.compile(r"(?i)\b(sue|suing|suicid|gt\b|gamethrow)")
HATE = re.compile(r"(?i)\b(nigg|fag|retard|kys|kill your)\w*")

pa = [r for r in pos if r.get("choice") == "personal_attacks_harassment"]
rep = [r for r in pos if REPORT.search(r["target"] or "")]
alt = [r for r in pos if ALT.search(r["target"] or "")]
print("\n=== overlaps inside the positives ===", flush=True)
print("  personal_attacks_harassment : %4d  (%.1f%%)" % (len(pa), 100 * len(pa) / len(pos)), flush=True)
print("  message contains 'report'   : %4d  (%.1f%%)" % (len(rep), 100 * len(rep) / len(pos)), flush=True)
print("  message mentions alts       : %4d  (%.1f%%)" % (len(alt), 100 * len(alt) / len(pos)), flush=True)

drop = {r["idx"] for r in pa} | {r["idx"] for r in rep} | {r["idx"] for r in alt}
keep = [r for r in pos if r["idx"] not in drop]
print("\n=== if PA + report-mentions + alt-mentions are dropped ===", flush=True)
print("  positives removed: %d  -> remaining positives: %d" % (len(drop), len(keep)), flush=True)
print("  remaining positive rate: %.2f%% of corpus" % (100 * len(keep) / len(rows)), flush=True)

print("\n  remaining positives by category:", flush=True)
for c, n in Counter(r.get("choice") for r in keep).most_common():
    print("    %-30s %4d" % (c, n), flush=True)

print("\n  sample of what REMAINS (should be genuine one-message violations):", flush=True)
seen = set()
shown = 0
for r in keep:
    c = r.get("choice")
    if c in seen:
        continue
    seen.add(c)
    print("    [%-26s] %s" % (c, (r["target"] or "")[:64].replace("\n", " ")), flush=True)
    shown += 1
    if shown >= 12:
        break

print("\n  sample of dropped PA rows (per owner: these are ALLOWED):", flush=True)
for r in pa[:6]:
    print("    noul=%.2f %s" % (r["noul"], (r["target"] or "")[:64].replace("\n", " ")), flush=True)
