"""Build a hand-checked evaluation set from HELD-OUT games.

Sampled from the test split only (the model has never seen these games), and
stratified by the model's own confidence so the set contains enough violations
and enough boundary cases to be informative.
"""
import json, random
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
OUTDIR = DIR + "/finetune2_out"
SEED = 42
N_FLAG, N_OK, N_MID = 150, 150, 100

rows = [json.loads(l) for l in open(DIR + "/decisions_final_clef.jsonl", encoding="utf-8")]
by_game = {}
for r in rows:
    by_game.setdefault(str(r.get("game_id")), []).append(r)
games = sorted(by_game)
random.Random(SEED).shuffle(games)
test_g = set(games[:int(len(games) * 0.20)])
pool = [r for g in test_g for r in by_game[g]]
print("held-out pool: %d messages from %d games" % (len(pool), len(test_g)), flush=True)

tok = AutoTokenizer.from_pretrained(OUTDIR)
model = AutoModelForSequenceClassification.from_pretrained(OUTDIR)
model.eval()
probs = []
B = 64
for i in range(0, len(pool), B):
    batch = [r["target"] for r in pool[i:i + B]]
    e = tok(batch, padding="max_length", truncation=True, max_length=96, return_tensors="pt")
    with torch.no_grad():
        probs.append(torch.softmax(model(**e).logits, dim=-1)[:, 1].numpy())
p = np.concatenate(probs)

flag = [i for i in range(len(pool)) if p[i] >= 0.70]
ok = [i for i in range(len(pool)) if p[i] <= 0.30]
mid = [i for i in range(len(pool)) if 0.30 < p[i] < 0.70]
print("model says: flag=%d  ok=%d  boundary=%d" % (len(flag), len(ok), len(mid)), flush=True)

rng = random.Random(7)
def take(idxs, n):
    rng.shuffle(idxs)
    return idxs[:n]

sel = take(flag, N_FLAG) + take(ok, N_OK) + take(mid, N_MID)
rng.shuffle(sel)

out = []
for i in sel:
    r = pool[i]
    out.append({
        "game_id": r.get("game_id"), "sender": r.get("sender"),
        "message": r["target"], "context": (r.get("context") or [])[-3:],
        "model_p": round(float(p[i]), 4),
        "clef": r.get("choice"), "clef_p": round(float(r["noul"]), 3),
    })

with open(DIR + "/eval_set.jsonl", "w", encoding="utf-8") as f:
    for r in out:
        f.write(json.dumps(r) + "\n")
print("wrote eval_set.jsonl: %d messages for hand-checking" % len(out), flush=True)
