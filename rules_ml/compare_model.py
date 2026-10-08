"""Compare the distilled model against the Jev labels on real archive messages."""
import json, sys, random
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import export_final2 as E

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
model = json.load(open(DIR + "/model.json"))
rows = E.load()
texts = [r["target"] for r in rows]
probs = E.publish if False else E.portable_predict(texts, model)
red = E.label

print("=== top 15 by Jev noul (should be high in distilled model) ===")
order = sorted(range(len(rows)), key=lambda i: -rows[i]["noul"])
for i in order[:15]:
    r = rows[i]
    flag = "OK " if probs[i] >= 0.5 else "LOW"
    print("  %s jev=%.2f dist=%.2f %-26s %r" % (flag, r["noul"], probs[i], r["choice"], r["target"][:72]))

print("\n=== 15 random with Jev noul < 0.1 (should be low) ===")
random.seed(3)
low = [i for i in range(len(rows)) if rows[i]["noul"] < 0.1]
for i in random.sample(low, 15):
    r = rows[i]
    flag = "OK " if probs[i] < 0.5 else "HIGH"
    print("  %s jev=%.2f dist=%.2f %r" % (flag, r["noul"], probs[i], r["target"][:78]))

print("\n=== messages containing suing/suicide ===")
for i, r in enumerate(rows):
    tl = r["target"].lower()
    if "suing" in tl or "suicid" in tl or "sue" in tl:
        print("  jev=%.2f dist=%.2f label=%d %-24s %r" % (r["noul"], probs[i], red(r), r["choice"], r["target"][:70]))

# agreement
th = 0.5
tp = sum(1 for i in range(len(rows)) if red(rows[i]) == 1 and probs[i] >= th)
fp = sum(1 for i in range(len(rows)) if red(rows[i]) == 0 and probs[i] >= th)
fn = sum(1 for i in range(len(rows)) if red(rows[i]) == 1 and probs[i] < th)
tn = sum(1 for i in range(len(rows)) if red(rows[i]) == 0 and probs[i] < th)
print("\nin-sample confusion (th=0.5): tp=%d fp=%d fn=%d tn=%d  acc=%.4f" % (tp, fp, fn, tn, (tp + tn) / len(rows)))
