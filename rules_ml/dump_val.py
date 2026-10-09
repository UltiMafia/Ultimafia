"""Dump (target, context, probability) pairs computed by the portable Python
implementation, so the Node runtime can be checked against them."""
import json, sys, random
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import final2 as F

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
model = json.load(open(DIR + "/model.json"))
rows = F.load()
random.seed(7)
sample = random.sample(rows, 250)

texts = []
for r in sample:
    if model["use_context"]:
        t = " \n ".join((r.get("context") or [])[-(model.get("n_ctx") or 3):]) + " \n " + r["target"]
    else:
        t = r["target"]
    texts.append(t)
probs = F.portable_predict(texts, model)

out = [{"idx": r["idx"], "target": r["target"], "context": r.get("context") or [], "prob": p}
       for r, p in zip(sample, probs)]
json.dump(out, open(DIR + "/val_preds.json", "w"))
print("wrote val_preds.json with %d entries; prob range %.4f..%.4f"
      % (len(out), min(probs), max(probs)))
