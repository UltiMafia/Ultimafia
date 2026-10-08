"""Dump Python-computed probabilities for the v3 model so the Node runtime can be checked."""
import json, sys, random
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import export_v3 as E

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
model = json.load(open(DIR + "/model.json"))
rows = E.load()
random.seed(7)
sample = random.sample(rows, 300)
texts = [r["target"] for r in sample]
probs = E.portable_predict(texts, model)
json.dump([{"idx": r["idx"], "target": r["target"], "context": r.get("context") or [], "prob": p}
           for r, p in zip(sample, probs)], open(DIR + "/val_preds.json", "w"))
print("wrote val_preds.json n=%d  stopwords=%d  features=%d"
      % (len(sample), len(model.get("stop_words") or []), model["analyzers"][0]["n_features"]))
