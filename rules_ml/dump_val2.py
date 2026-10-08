"""Dump Python-computed probabilities from the exported model so the Node
runtime can be checked against them."""
import json, sys, random
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import export_final2 as E

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
model = json.load(open(DIR + "/model.json"))
rows = E.load()
random.seed(7)
sample = random.sample(rows, 250)
texts = [r["target"] for r in sample]
probs = E.portable_predict(texts, model)
out = [{"idx": r["idx"], "target": r["target"], "context": r.get("context") or [], "prob": p}
       for r, p in zip(sample, probs)]
json.dump(out, open(DIR + "/val_preds.json", "w"))
print("wrote val_preds.json n=%d range %.4f..%.4f" % (len(out), min(probs), max(probs)))
