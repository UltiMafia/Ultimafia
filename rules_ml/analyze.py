"""Review the Jev decisions: distributions, base rates, examples per category,
and internal consistency checks."""
import json, os, sys
from collections import Counter, defaultdict

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
DEC = os.path.join(DIR, "decisions.jsonl")
NON = "no_violation"


def load():
    rows = []
    with open(DEC, "r", encoding="utf-8") as f:
        for line in f:
            try:
                r = json.loads(line)
            except Exception:
                continue
            rows.append(r)
    return rows


def main():
    rows = load()
    ok = [r for r in rows if not r.get("error") and r.get("noul") is not None]
    err = [r for r in rows if r.get("error")]
    print("rows=%d  ok=%d  errors=%d" % (len(rows), len(ok), len(err)))
    if err:
        print("sample error:", err[0].get("error", "")[:200])

    by_src = Counter(r.get("source") for r in ok)
    print("by source:", dict(by_src))

    for subset_name, subset in (("ALL", ok),
                                ("RANDOM (representative)", [r for r in ok if r.get("source") == "random"]),
                                ("SUSPECT (enriched)", [r for r in ok if r.get("source") == "suspect"])):
        if not subset:
            continue
        pos = sum(1 for r in subset if r["noul"] >= 0.5)
        print("\n== %s  n=%d  flagged(noul>=0.5)=%d (%.2f%%)  mean noul=%.3f"
              % (subset_name, len(subset), pos, 100.0 * pos / len(subset),
                 sum(r["noul"] for r in subset) / len(subset)))

    # noul histogram
    print("\n=== noul histogram (ALL) ===")
    bins = [0] * 10
    for r in ok:
        b = min(9, int(r["noul"] * 10))
        bins[b] += 1
    for i, c in enumerate(bins):
        print("  %.1f-%.1f : %5d %s" % (i / 10, (i + 1) / 10, c, "#" * int(60 * c / max(bins))))

    print("\n=== category distribution ===")
    for subset_name, subset in (("ALL", ok),
                                ("RANDOM", [r for r in ok if r.get("source") == "random"])):
        c = Counter(r.get("choice") for r in subset)
        tot = len(subset)
        print(" %s (n=%d):" % (subset_name, tot))
        for k, v in c.most_common():
            print("    %-32s %5d  %5.2f%%" % (k, v, 100.0 * v / tot))

    # consistency
    a = sum(1 for r in ok if r["noul"] >= 0.5 and r.get("choice") == NON)
    b = sum(1 for r in ok if r["noul"] < 0.5 and r.get("choice") not in (NON, None))
    print("\nconsistency: noul>=0.5 but choice=no_violation: %d" % a)
    print("             noul<0.5  but choice!=no_violation: %d" % b)

    # severity
    sev = [r["severity"] for r in ok if r.get("severity") is not None]
    if sev:
        print("severity mean=%.2f" % (sum(sev) / len(sev)))

    # examples per category
    print("\n=== examples per category (highest confidence) ===")
    bycat = defaultdict(list)
    for r in ok:
        if r.get("choice") and r["choice"] != NON:
            bycat[r["choice"]].append(r)
    for cat in sorted(bycat, key=lambda k: -len(bycat[k])):
        lst = sorted(bycat[cat], key=lambda r: -(r.get("choice_conf") or 0))
        print("\n-- %s (%d)" % (cat, len(bycat[cat])))
        for r in lst[:4]:
            ctx = " | ".join(r.get("context") or [])[-140:]
            print("   [%.2f/%.2f] %r" % (r.get("choice_conf") or 0, r.get("noul") or 0, r["target"][:110]))
            print("        ctx: %s" % ctx)
            print("        src=%s game=%s phase=%s ranked=%s" % (r.get("source"), r.get("game_id"), r.get("state"), r.get("ranked")))

    print("\n=== random-sample false-positive check (noul>=0.5 in RANDOM, lowest conf) ===")
    rnd = [r for r in ok if r.get("source") == "random" and r["noul"] >= 0.5]
    for r in sorted(rnd, key=lambda r: (r.get("choice_conf") or 0))[:10]:
        print("   [%.2f/%.2f] %s :: %r" % (r.get("choice_conf") or 0, r["noul"], r.get("choice"), r["target"][:100]))


if __name__ == "__main__":
    main()
