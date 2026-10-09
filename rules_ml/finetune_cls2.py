"""Multi-class head with GRA merged into OGI (5 classes).

Rationale: a chat message can only ever THREATEN or announce a leave - actually leaving
is an action, not a message - so a text classifier cannot separate GRA from OGI. Keeping
both just made the teacher split the same behaviour two ways. Merged, the class goes from
162 examples (weight-capped) to ~430.

 0 no_violation
 1 personal_attacks_harassment
 2 outside_game_influence   (includes leaving / threatening to leave)
 3 intolerance
 4 other                    (hazing, doxxing, antagonization, exploits)
"""
import json, os, random, sys, time
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
NAME = "sentence-transformers/all-MiniLM-L6-v2"
OUT = DIR + "/finetune_cls2_out"
MAXLEN = 96
BS = 32
SEED = 42
EPOCHS = 3
SMOKE = os.environ.get("SMOKE") == "1"

torch.set_num_threads(8)
torch.manual_seed(SEED); random.seed(SEED); np.random.seed(SEED)

CLASSES = ["no_violation", "personal_attacks", "outside_game_influence",
           "intolerance", "other"]
CMAP = {"no_violation": 0, "personal_attacks_harassment": 1, "outside_game_influence": 2,
        "game_related_abandonment": 2, "intolerance": 3}


def label(r):
    if not (r.get("noul") is not None and float(r["noul"]) >= 0.5
            and r.get("choice") != "no_violation"):
        return 0
    return CMAP.get(r.get("choice"), 4)


class DS(Dataset):
    def __init__(self, texts, labels, tok):
        self.t = texts; self.y = labels; self.tok = tok

    def __len__(self):
        return len(self.t)

    def __getitem__(self, i):
        e = self.tok(self.t[i], padding="max_length", truncation=True,
                     max_length=MAXLEN, return_tensors="pt")
        return {k: v.squeeze(0) for k, v in e.items()}, torch.tensor(self.y[i])


def main():
    t0 = time.time()
    rows = [json.loads(l) for l in open(DIR + "/decisions_final_clef.jsonl", encoding="utf-8")]
    if SMOKE:
        rows = rows[:400]
    by_game = {}
    for r in rows:
        by_game.setdefault(str(r.get("game_id")), []).append(r)
    games = sorted(by_game)
    random.Random(SEED).shuffle(games)
    n = len(games)
    test_g = set(games[:int(n * 0.20)])
    val_g = set(games[int(n * 0.20):int(n * 0.35)])
    tr = [r for g in games if g not in test_g and g not in val_g for r in by_game[g]]
    va = [r for g in val_g for r in by_game[g]]
    te = [r for g in test_g for r in by_game[g]]

    ytr = np.array([label(r) for r in tr])
    yte = np.array([label(r) for r in te])
    from collections import Counter
    print("rows=%d games=%d  train=%d val=%d test=%d" % (len(rows), n, len(tr), len(va), len(te)),
          flush=True)
    print("train:", {CLASSES[k]: v for k, v in sorted(Counter(ytr).items())}, flush=True)
    print("test: ", {CLASSES[k]: v for k, v in sorted(Counter(yte).items())}, flush=True)

    tok = AutoTokenizer.from_pretrained(NAME)
    model = AutoModelForSequenceClassification.from_pretrained(NAME, num_labels=len(CLASSES))
    model.train()

    cnt = np.bincount(ytr, minlength=len(CLASSES)).astype(float)
    cnt[cnt == 0] = 1.0
    wts = (1.0 / cnt) ** 0.5
    wts = wts / wts[0]
    wts = torch.tensor(np.clip(wts, 0.5, 8.0), dtype=torch.float)
    print("weights:", ["%s=%.2f" % (CLASSES[i], wts[i]) for i in range(len(CLASSES))], flush=True)
    lossf = nn.CrossEntropyLoss(weight=wts)

    epo = 1 if SMOKE else EPOCHS
    tr_dl = DataLoader(DS([r["target"] for r in tr], list(ytr), tok),
                       batch_size=BS, shuffle=True, num_workers=0)
    te_dl = DataLoader(DS([r["target"] for r in te], list(yte), tok), batch_size=64)
    opt = torch.optim.AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=3e-5, total_steps=len(tr_dl) * epo)

    for ep in range(epo):
        model.train()
        run = 0.0
        for i, (enc, yb) in enumerate(tr_dl):
            opt.zero_grad()
            out = model(**enc).logits
            loss = lossf(out, yb)
            loss.backward()
            opt.step(); sched.step()
            run += float(loss.detach())
            if (i + 1) % 100 == 0:
                print("  ep%d step %d/%d loss=%.4f %.0fs" % (ep, i + 1, len(tr_dl),
                      run / (i + 1), time.time() - t0), flush=True)

    model.eval()
    preds = []
    with torch.no_grad():
        for enc, _ in te_dl:
            preds.append(model(**enc).logits.argmax(-1).numpy())
    pred = np.concatenate(preds)

    print("\n=== per-class (held-out test) ===", flush=True)
    print("%-26s %6s %6s %8s %8s %8s" % ("class", "n", "pred", "prec", "recall", "F1"), flush=True)
    f1s = []
    for k in range(len(CLASSES)):
        tp = int(((pred == k) & (yte == k)).sum())
        fp = int(((pred == k) & (yte != k)).sum())
        fn = int(((pred != k) & (yte == k)).sum())
        pr = tp / (tp + fp) if tp + fp else 0.0
        rc = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * pr * rc / (pr + rc) if pr + rc else 0.0
        n_k = int((yte == k).sum())
        if n_k:
            f1s.append(f1)
        print("%-26s %6d %6d %8.3f %8.3f %8.3f" % (CLASSES[k], n_k, int((pred == k).sum()),
                                                   pr, rc, f1), flush=True)
    print("\n  accuracy  = %.3f" % (pred == yte).mean(), flush=True)
    print("  macro F1  = %.3f  (over %d non-empty classes)" % (np.mean(f1s), len(f1s)), flush=True)

    print("\n=== violations called no_violation (the misses that matter) ===", flush=True)
    tot_v = int((yte != 0).sum())
    missed = int(((pred == 0) & (yte != 0)).sum())
    print("  %d of %d (%.0f%%)" % (missed, tot_v, 100 * missed / max(tot_v, 1)), flush=True)
    conf = Counter()
    for a, b in zip(yte[yte != 0], pred[yte != 0]):
        if a != b:
            conf["%s -> %s" % (CLASSES[a], CLASSES[b])] += 1
    for k, v in conf.most_common(8):
        print("    %-54s %d" % (k, v), flush=True)

    os.makedirs(OUT, exist_ok=True)
    model.save_pretrained(OUT)
    tok.save_pretrained(OUT)
    print("\nsaved to %s (%.0fs)" % (OUT, time.time() - t0), flush=True)


main()
