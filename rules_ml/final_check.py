"""Final consolidated check of the distilled model."""
import json, sys, random
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import export_final2 as E

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
model = json.load(open(DIR + "/model.json"))
rows = E.load()
by_idx = {r["idx"]: r for r in rows}
texts = [r["target"] for r in rows]
probs = E.portable_predict(texts, model)
TH = 0.5

print("model: %s  features=%d  size=%.0f KB" % (model["name"], model["n_features"],
      __import__("os").path.getsize(DIR + "/model.json") / 1024))
print("trained on %d decisions (%d positives)" % (model["n_docs"], model["positives"]))

print("\n=== the user's reference cases through the DISTILLED model ===")
ref = [(1637, "should NOT flag", "rules-talk/defensive"),
       (1349, "should NOT flag", "past-phase reference"),
       (577,  "should NOT flag", "respect from past games"),
       (4769, "should NOT flag", "alt statement"),
       (4583, "should NOT flag", "strategy reference"),
       (4566, "SHOULD flag", "report threat"),
       (4561, "SHOULD flag", "user-confirmed good")]
for i, want, desc in ref:
    r = by_idx.get(i)
    if not r:
        print("  idx %s missing" % i); continue
    p = probs[rows.index(r)]
    ok = (p >= TH) == want.startswith("SHOULD")
    print("  %s %-26s distilled=%.3f (jev noul=%.2f)  %r"
          % ("OK " if ok else "MISS", desc, p, r["noul"], r["target"][:52]))

print("\n=== rare GRA slang (from the supplement) ===")
n = 0
for r, p in zip(rows, probs):
    if r.get("source") != "supplement":
        continue
    t = r["target"].lower()
    if "suing" in t or "suicid" in t:
        n += 1
        if n <= 14:
            print("  jev=%.2f dist=%.2f %-24s %r" % (r["noul"], p, r["choice"], r["target"][:58]))
print("  (%d such supplement messages)" % n)

print("\n=== held-out metrics (from export) ===")
print(" ", json.dumps(model["metrics"], indent=None)[:400])

rnd = [i for i, r in enumerate(rows) if r.get("source") == "random"]
tp = sum(1 for i in rnd if E.label(rows[i]) == 1 and probs[i] >= TH)
fp = sum(1 for i in rnd if E.label(rows[i]) == 0 and probs[i] >= TH)
fn = sum(1 for i in rnd if E.label(rows[i]) == 1 and probs[i] < TH)
print("\nrepresentative-subset flags at th=0.5: %d flagged among %d (tp=%d fp=%d)" % (tp + fp, len(rnd), tp, fp))

print("\n=== example flags (representative subset, highest) ===")
for i in sorted(rnd, key=lambda i: -probs[i])[:12]:
    r = rows[i]
    mark = "TP" if E.label(r) == 1 else "FP"
    print("  %s %.3f %-24s %r" % (mark, probs[i], r["choice"], r["target"][:70]))
