"""Review the v2 decisions (decision = noul >= 0.5)."""
import json, sys
from collections import Counter, defaultdict

DEC = "/home/tt/Documents/Ultimafia/rules_ml/decisions_v2.jsonl"
TH = 0.5


def load():
    by = {}
    for line in open(DEC, encoding="utf-8"):
        try:
            r = json.loads(line)
        except Exception:
            continue
        if r.get("error") or r.get("noul") is None:
            continue
        by[r["idx"]] = r
    return [by[k] for k in sorted(by)]


rows = load()
print("decisions: %d" % len(rows))
for nm, sub in (("ALL", rows),
                ("RANDOM (representative)", [r for r in rows if r.get("source") == "random"]),
                ("SUSPECT (enriched)", [r for r in rows if r.get("source") == "suspect"])):
    if not sub:
        continue
    pos = sum(1 for r in sub if r["noul"] >= TH)
    print("  %-24s n=%5d flagged=%4d (%.2f%%)  mean noul=%.3f"
          % (nm, len(sub), pos, 100.0 * pos / len(sub), sum(r["noul"] for r in sub) / len(sub)))

print("\n=== noul histogram (ALL) ===")
bins = [0] * 10
for r in rows:
    bins[min(9, int(r["noul"] * 10))] += 1
for i, c in enumerate(bins):
    print("  %.1f-%.1f %5d %s" % (i / 10, (i + 1) / 10, c, "#" * int(50 * c / max(bins))))

print("\n=== categories ===")
for nm, sub in (("ALL", rows), ("RANDOM", [r for r in rows if r.get("source") == "random"])):
    c = Counter(r.get("choice") for r in sub)
    print(" %s (n=%d):" % (nm, len(sub)))
    for k, v in c.most_common():
        print("    %-32s %5d %5.2f%%" % (k, v, 100.0 * v / len(sub)))

flagged = [r for r in rows if r["noul"] >= TH]
print("\n=== category distribution among FLAGGED only (n=%d) ===" % len(flagged))
for k, v in Counter(r.get("choice") for r in flagged).most_common():
    print("    %-32s %5d %5.2f%%" % (k, v, 100.0 * v / len(flagged)))

incons = [r for r in rows if (r["noul"] >= TH) and r.get("choice") == "no_violation"]
print("\nconsistency: flagged but choice=no_violation: %d" % len(incons))
for r in incons[:6]:
    print("   noul=%.2f %r" % (r["noul"], r["target"][:90]))

print("\n=== examples per category (highest noul) ===")
byc = defaultdict(list)
for r in flagged:
    byc[r.get("choice")].append(r)
for cat in sorted(byc, key=lambda k: -len(byc[k])):
    lst = sorted(byc[cat], key=lambda r: -r["noul"])
    print("\n-- %s (%d)" % (cat, len(byc[cat])))
    for r in lst[:3]:
        print("   [noul=%.2f conf=%.2f] %r" % (r["noul"], r.get("choice_conf") or 0, r["target"][:100]))
        print("        ctx: %s" % (" | ".join(r.get("context") or [])[-110:]))

print("\n=== threshold sweep on the RANDOM (representative) subset ===")
rnd = sorted([r for r in rows if r.get("source") == "random"], key=lambda r: -r["noul"])
tot = len(rnd)
for th in (0.3, 0.4, 0.5, 0.6, 0.7, 0.8):
    n = sum(1 for r in rnd if r["noul"] >= th)
    print("   th=%.1f  flagged=%4d (%.2f%% of representative sample)" % (th, n, 100.0 * n / tot))
