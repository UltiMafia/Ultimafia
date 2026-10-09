"""Transformer retrain with class weighting fixed, compared apples-to-apples.

Fixes from the failed first attempt:
  * weighted loss (class imbalance) - previously used NONE while the linear model
    used class_weight='balanced'; the model collapsed to the majority class
  * a real VALIDATION split for early stopping and threshold choice
  * the decision threshold is chosen on validation, not the test set
Both the transformer and the shipped linear model are scored on the SAME test
split, so the comparison isolates the model rather than the ground truth.
"""
import json, os, random, sys, time
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
NAME = "sentence-transformers/all-MiniLM-L6-v2"
OUT = DIR + "/finetune2_out"
MAXLEN = 96
BS = 32
SEED = 42

torch.set_num_threads(8)
torch.manual_seed(SEED); random.seed(SEED); np.random.seed(SEED)


def label(r):
    return 1 if (r["noul"] >= 0.5 and r.get("choice") != "no_violation") else 0


class DS(Dataset):
    def __init__(self, texts, labels, tok):
        self.t = texts; self.y = labels; self.tok = tok

    def __len__(self):
        return len(self.t)

    def __getitem__(self, i):
        e = self.tok(self.t[i], padding="max_length", truncation=True,
                     max_length=MAXLEN, return_tensors="pt")
        return {k: v.squeeze(0) for k, v in e.items()}, torch.tensor(self.y[i])


def metrics_at(y, p, thr):
    pred = (p >= thr).astype(int)
    tp = int(((pred == 1) & (y == 1)).sum()); fp = int(((pred == 1) & (y == 0)).sum())
    fn = int(((pred == 0) & (y == 1)).sum()); tn = int(((pred == 0) & (y == 0)).sum())
    pr = tp / (tp + fp) if tp + fp else 0.0
    rc = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * pr * rc / (pr + rc) if pr + rc else 0.0
    return pr, rc, f1


def best_threshold(y, p):
    best = (0.5, -1)
    for thr in np.arange(0.05, 0.96, 0.05):
        _, _, f1 = metrics_at(y, p, thr)
        if f1 > best[1]:
            best = (float(thr), f1)
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
    texts = [r["target"] for r in rows]
    y = np.array([label(r) for r in rows])
    print("rows=%d positives=%d (%.2f%%)" % (len(rows), y.sum(), 100 * y.mean()), flush=True)

    # group by game: train / val / test, no game in two splits
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
    print("games=%d  train=%d  val=%d  test=%d" % (n, len(tr), len(va), len(te)), flush=True)

    tok = AutoTokenizer.from_pretrained(NAME)
    model = AutoModelForSequenceClassification.from_pretrained(NAME, num_labels=2)
    model.train()

    ytr = np.array([label(r) for r in tr])
    npos, nneg = int(ytr.sum()), int(len(ytr) - ytr.sum())
    w = torch.tensor([1.0, max(1.0, nneg / max(npos, 1))], dtype=torch.float)
    print("class weights:", w.tolist(), " (neg/pos = %.2f)" % (nneg / max(npos, 1)), flush=True)
    lossf = nn.CrossEntropyLoss(weight=w)

    tr_dl = DataLoader(DS([r["target"] for r in tr], list(ytr), tok),
                       batch_size=BS, shuffle=True, num_workers=0)
    va_dl = DataLoader(DS([r["target"] for r in va], [label(r) for r in va], tok), batch_size=64)
    EPOCHS = 3
    opt = torch.optim.AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)
    total = len(tr_dl) * EPOCHS
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=3e-5, total_steps=total)


    def predict(dl):
        model.eval(); out = []
        with torch.no_grad():
            for enc, _ in dl:
                out.append(torch.softmax(model(**enc).logits, dim=-1)[:, 1].numpy())
        model.train()
        return np.concatenate(out)

    best_f1, best_state, step = -1, None, 0
    yva = np.array([label(r) for r in va])
    yte = np.array([label(r) for r in te])
    for ep in range(EPOCHS):
        for enc, yb in tr_dl:
            out = model(**enc)
            loss = lossf(out.logits, yb)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step(); sched.step(); opt.zero_grad()
            step += 1
            if step % 50 == 0:
                print("  ep%d step %d/%d loss=%.4f %.0fs" % (ep, step, total, loss.item(), time.time() - t0), flush=True)
        pv = predict(va_dl)
        thr = best_threshold(yva, pv)
        pr, rc, f1 = metrics_at(yva, pv, thr)
        print("  [val] epoch %d: AUC=%.4f  best_thr=%.2f  P=%.3f R=%.3f F1=%.3f" % (ep, auc(yva, pv), thr, pr, rc, f1), flush=True)
        if f1 > best_f1:
            best_f1 = f1
            best_state = {k: v.clone() for k, v in model.state_dict().items()}

    if best_state:
        model.load_state_dict(best_state)
    model.eval()

    pv = predict(va_dl)
    thr_t = best_threshold(yva, pv)
    pt = predict(DataLoader(DS([r["target"] for r in te], list(yte), tok), batch_size=64))
    pr, rc, f1 = metrics_at(yte, pt, thr_t)
    print("\n=== TRANSFORMER on held-out test (thr=%.2f from val) ===" % thr_t, flush=True)
    print("  AUC=%.4f  P=%.3f R=%.3f F1=%.3f" % (auc(yte, pt), pr, rc, f1), flush=True)

    # the shipped linear model, SAME test split
    print("\n=== LINEAR (model.json) on the SAME test split ===", flush=True)
    try:
        sys.path.insert(0, DIR)
        import export_v3 as E
        lm = json.load(open(DIR + "/model.json"))
        pv_l = np.array(E.portable_predict([r["target"] for r in va], lm))
        thr_l = best_threshold(yva, pv_l)
        pt_l = np.array(E.portable_predict([r["target"] for r in te], lm))
        pr, rc, f1 = metrics_at(yte, pt_l, thr_l)
        print("  AUC=%.4f  P=%.3f R=%.3f F1=%.3f  (thr=%.2f from val)" % (auc(yte, pt_l), pr, rc, f1, thr_l), flush=True)
    except Exception as e:
        print("  failed:", str(e)[:200], flush=True)

    # the cases the owner flagged
    print("\n=== the flagged cases ===", flush=True)
    model.eval()   # predict() restores TRAIN mode; without this the case scores
                   # are computed with dropout ACTIVE, i.e. noise
    CASES = ["you're great at the game", "unvote me or you're gting", "you're gting",
             "gting", "that's dumb", "you're dumb", "shut up",
             "can XYZ shut the fuck up?", "STFU let gov hammer", "bob lives in ohio"]
    encs = tok(CASES, padding="max_length", truncation=True, max_length=MAXLEN, return_tensors="pt")
    with torch.no_grad():
        pp = torch.softmax(model(**encs).logits, dim=-1)[:, 1].numpy()
    if "pt_l" in dir():
        pl = np.array(E.portable_predict(CASES, lm))
    for c, a, b in zip(CASES, pp, pl if "pl" in dir() else [float("nan")] * len(CASES)):
        print("  %-30s transformer=%.3f  linear=%.3f" % (c, a, b), flush=True)

    os.makedirs(OUT, exist_ok=True)
    model.save_pretrained(OUT); tok.save_pretrained(OUT)
    print("\nDONE in %.1f min" % ((time.time() - t0) / 60), flush=True)


main()
