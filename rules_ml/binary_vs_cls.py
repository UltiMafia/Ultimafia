"""Does the 4-class head cost anything on plain detection?

Trains the DEDICATED binary head on the CURRENT corpus (post targeting-fix, post
GRA/intolerance merges) and scores it on exactly the same grouped test split as the
4-class head, then scores the existing 4-class model's binary view
(1 - P(no_violation)) on that same test set.

Both thresholds are chosen on the same validation split, so the comparison is
apples-to-apples. This closes the caveat in the PR: the earlier "4-class beats binary"
figure compared slightly different label sets.
"""
import json, os, random, time
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
NAME = "sentence-transformers/all-MiniLM-L6-v2"
OUT = DIR + "/finetune_bin2_out"
CLS = DIR + "/finetune_cls3_out"
MAXLEN = 96
BS = 32
SEED = 42
EPOCHS = 3

torch.set_num_threads(8)
torch.manual_seed(SEED); random.seed(SEED); np.random.seed(SEED)


def label(r):
    return 1 if (r.get("noul") is not None and float(r["noul"]) >= 0.5
                 and r.get("choice") != "no_violation") else 0


class DS(Dataset):
    def __init__(self, texts, labels, tok):
        self.t = texts; self.y = labels; self.tok = tok

    def __len__(self):
        return len(self.t)

    def __getitem__(self, i):
        e = self.tok(self.t[i], padding="max_length", truncation=True,
                     max_length=MAXLEN, return_tensors="pt")
        return {k: v.squeeze(0) for k, v in e.items()}, torch.tensor(self.y[i])


def metrics(y, p, thr):
    pred = (p >= thr).astype(int)
    tp = int(((pred == 1) & (y == 1)).sum()); fp = int(((pred == 1) & (y == 0)).sum())
    fn = int(((pred == 0) & (y == 1)).sum())
    pr = tp / (tp + fp) if tp + fp else 0.0
    rc = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * pr * rc / (pr + rc) if pr + rc else 0.0
    return pr, rc, f1


def best_thr(y, p):
    best = (0.5, -1.0)
    for t in np.arange(0.05, 0.96, 0.05):
        _, _, f1 = metrics(y, p, t)
        if f1 > best[1]:
            best = (float(t), f1)
    return best[0]


def auc(y, p):
    from sklearn.metrics import roc_auc_score
    try:
        return roc_auc_score(y, p)
    except Exception:
        return float("nan")


def main():
    t0 = time.time()
    rows = [json.loads(l) for l in open(DIR + "/decisions_final_clef.jsonl", encoding="utf-8")]
    print("corpus rows: %d  violations: %d" % (len(rows), sum(label(r) for r in rows)), flush=True)

    # identical grouped split to finetune_cls3.py (same seed, same ordering)
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
    print("games=%d train=%d val=%d test=%d" % (n, len(tr), len(va), len(te)), flush=True)

    ytr = np.array([label(r) for r in tr])
    yva = np.array([label(r) for r in va])
    yte = np.array([label(r) for r in te])
    print("positives: train=%d val=%d test=%d" % (ytr.sum(), yva.sum(), yte.sum()), flush=True)

    tok = AutoTokenizer.from_pretrained(NAME)
    model = AutoModelForSequenceClassification.from_pretrained(NAME, num_labels=2)
    model.train()

    npos, nneg = int(ytr.sum()), int(len(ytr) - ytr.sum())
    w = torch.tensor([1.0, max(1.0, nneg / max(npos, 1))], dtype=torch.float)
    print("class weights:", w.tolist(), flush=True)
    lossf = nn.CrossEntropyLoss(weight=w)

    tr_dl = DataLoader(DS([r["target"] for r in tr], list(ytr), tok),
                       batch_size=BS, shuffle=True, num_workers=0)
    va_dl = DataLoader(DS([r["target"] for r in va], list(yva), tok), batch_size=64)
    te_dl = DataLoader(DS([r["target"] for r in te], list(yte), tok), batch_size=64)
    opt = torch.optim.AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=3e-5,
                                                total_steps=len(tr_dl) * EPOCHS)

    for ep in range(EPOCHS):
        model.train(); run = 0.0
        for i, (enc, yb) in enumerate(tr_dl):
            opt.zero_grad()
            loss = lossf(model(**enc).logits, yb)
            loss.backward(); opt.step(); sched.step()
            run += float(loss.detach())
            if (i + 1) % 100 == 0:
                print("  ep%d step %d/%d loss=%.4f %.0fs" % (ep, i + 1, len(tr_dl),
                      run / (i + 1), time.time() - t0), flush=True)

    def score(dl):
        model.eval(); out = []
        with torch.no_grad():
            for enc, _ in dl:
                out.append(torch.softmax(model(**enc).logits, dim=-1)[:, 1].numpy())
        return np.concatenate(out)

    pva = score(va_dl); pte = score(te_dl)
    thr = best_thr(yva, pva)
    pr, rc, f1 = metrics(yte, pte, thr)
    a = auc(yte, pte)
    print("\n=== BINARY head (trained on the current corpus) ===", flush=True)
    print("  val-chosen thr=%.2f   TEST  AUC=%.4f  P=%.3f R=%.3f F1=%.3f"
          % (thr, a, pr, rc, f1), flush=True)

    os.makedirs(OUT, exist_ok=True)
    model.save_pretrained(OUT); tok.save_pretrained(OUT)

    # ---- the 4-class head's binary view, same split ----
    print("\n=== 4-CLASS head, binary view (1 - P(no_violation)) ===", flush=True)
    if not os.path.isdir(CLS):
        print("  %s missing - comparison skipped" % CLS, flush=True)
        return
    tok2 = AutoTokenizer.from_pretrained(CLS)
    m2 = AutoModelForSequenceClassification.from_pretrained(CLS)
    m2.eval()

    def score_cls(texts):
        out = []
        with torch.no_grad():
            for i in range(0, len(texts), 64):
                e = tok2(texts[i:i + 64], padding="max_length", truncation=True,
                         max_length=MAXLEN, return_tensors="pt")
                out.append((1.0 - torch.softmax(m2(**e).logits, dim=-1)[:, 0].numpy()))
        return np.concatenate(out)

    cva = score_cls([r["target"] for r in va])
    cte = score_cls([r["target"] for r in te])
    cthr = best_thr(yva, cva)
    cpr, crc, cf1 = metrics(yte, cte, cthr)
    ca = auc(yte, cte)
    print("  val-chosen thr=%.2f   TEST  AUC=%.4f  P=%.3f R=%.3f F1=%.3f"
          % (cthr, ca, cpr, crc, cf1), flush=True)

    print("\n=== HEAD TO HEAD on the identical test split (%d rows, %d positives) ==="
          % (len(yte), yte.sum()), flush=True)
    print("  %-34s %8s %8s %8s %8s" % ("model", "AUC", "P", "R", "F1"), flush=True)
    print("  %-34s %8.4f %8.3f %8.3f %8.3f" % ("binary (dedicated)", a, pr, rc, f1), flush=True)
    print("  %-34s %8.4f %8.3f %8.3f %8.3f" % ("4-class, binary view", ca, cpr, crc, cf1), flush=True)
    print("\n  delta F1 (4-class - binary) = %+.4f" % (cf1 - f1), flush=True)
    print("\ndone in %.0fs" % (time.time() - t0), flush=True)


main()
