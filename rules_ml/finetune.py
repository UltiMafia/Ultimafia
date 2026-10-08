"""Fine-tune MiniLM-L6 on the Jev labels, with surrounding context, then export.

Designed to run unattended. Writes everything to finetune.log and a JSON report.
Honest evaluation: the held-out split is grouped by game and comes from Jev's own
labels (never from hand-written cases I have tuned against).
"""
import json, os, sys, time, random
import numpy as np
import torch
from torch.utils.data import DataLoader, Dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
NAME = "sentence-transformers/all-MiniLM-L6-v2"
OUT = DIR + "/finetune_out"
SEED = 42
MAXLEN = 96
BS = 32
EPOCHS = 3
NCTX = 3

torch.set_num_threads(8)
torch.manual_seed(SEED); random.seed(SEED); np.random.seed(SEED)
SMOKE = os.environ.get("SMOKE") == "1"   # tiny end-to-end check, no export


def label(r):
    return 1 if (r["noul"] >= 0.5 and r.get("choice") != "no_violation") else 0


def text_of(r):
    ctx = [c for c in (r.get("context") or []) if c][-NCTX:]
    return " | ".join(ctx + [r["target"]]) if ctx else r["target"]


def metrics(y, p, thr):
    pred = (p >= thr).astype(int)
    tp = int(((pred == 1) & (y == 1)).sum()); fp = int(((pred == 1) & (y == 0)).sum())
    fn = int(((pred == 0) & (y == 1)).sum()); tn = int(((pred == 0) & (y == 0)).sum())
    pr = tp / (tp + fp) if tp + fp else 0.0
    rc = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * pr * rc / (pr + rc) if pr + rc else 0.0
    acc = (tp + tn) / max(len(y), 1)
    return dict(acc=acc, precision=pr, recall=rc, f1=f1, tp=tp, fp=fp, fn=fn, tn=tn)


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
    t_start = time.time()
    print("=== loading ===", flush=True)
    rows = [json.loads(l) for l in open(DIR + "/decisions_final.jsonl", encoding="utf-8")]
    print("rows=%d positives=%d" % (len(rows), sum(label(r) for r in rows)), flush=True)

    # group split by game so no game spans train/test
    by_game = {}
    for r in rows:
        by_game.setdefault(str(r.get("game_id")), []).append(r)
    games = sorted(by_game)
    rng = random.Random(SEED); rng.shuffle(games)
    n_test = max(1, int(len(games) * 0.25))
    test_g = set(games[:n_test])
    train = [r for g in games if g not in test_g for r in by_game[g]]
    test = [r for g in test_g for r in by_game[g]]
    epochs = 1 if SMOKE else EPOCHS
    if SMOKE:
        train, test = train[:64], test[:32]
        print("SMOKE MODE: %d train / %d test, %d epoch(s)" % (len(train), len(test), epochs), flush=True)
    print("games=%d  train=%d  test=%d" % (len(games), len(train), len(test)), flush=True)

    tok = AutoTokenizer.from_pretrained(NAME)
    model = AutoModelForSequenceClassification.from_pretrained(NAME, num_labels=2)
    model.train()

    tr_ds = DS([text_of(r) for r in train], [label(r) for r in train], tok)
    tr_dl = DataLoader(tr_ds, batch_size=BS, shuffle=True, num_workers=0)
    opt = torch.optim.AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)
    total_steps = len(tr_dl) * epochs
    print("steps/epoch=%d  total=%d" % (len(tr_dl), total_steps), flush=True)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=3e-5, total_steps=total_steps)

    step = 0
    for ep in range(epochs):
        for (enc, yb) in tr_dl:
            out = model(**enc, labels=yb)
            out.loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step(); sched.step(); opt.zero_grad()
            step += 1
            if step % 25 == 0:
                el = time.time() - t_start
                print("  ep%d step %d/%d loss=%.4f  %.0fs elapsed  eta=%.0fs"
                      % (ep, step, total_steps, out.loss.item(), el,
                         el / step * (total_steps - step)), flush=True)

    print("\n=== evaluating on the held-out games ===", flush=True)
    model.eval()
    te_ds = DS([text_of(r) for r in test], [label(r) for r in test], tok)
    te_dl = DataLoader(te_ds, batch_size=64, shuffle=False)
    probs = []
    with torch.no_grad():
        for (enc, yb) in te_dl:
            probs.append(torch.softmax(model(**enc).logits, dim=-1)[:, 1].numpy())
    p = np.concatenate(probs)
    y = np.array([label(r) for r in test])
    report = {"n_train": len(train), "n_test": len(test), "epochs": epochs,
              "maxlen": MAXLEN, "context_lines": NCTX}
    for thr in (0.3, 0.5, 0.7):
        m = metrics(y, p, thr)
        report["thr_%.1f" % thr] = m
        print("  thr=%.1f acc=%.4f P=%.3f R=%.3f F1=%.3f (tp=%d fp=%d fn=%d tn=%d)"
              % (thr, m["acc"], m["precision"], m["recall"], m["f1"], m["tp"], m["fp"], m["fn"], m["tn"]), flush=True)
    try:
        from sklearn.metrics import roc_auc_score
        report["auc"] = float(roc_auc_score(y, p))
        print("  AUC=%.4f" % report["auc"], flush=True)
    except Exception as e:
        print("  auc skipped:", e, flush=True)

    os.makedirs(OUT, exist_ok=True)
    if SMOKE:
        print("\nSMOKE OK (skipping save/export)", flush=True)
        return
    model.save_pretrained(OUT); tok.save_pretrained(OUT)

    print("\n=== exporting ONNX (int8) ===", flush=True)
    try:
        import onnxruntime as ort
        onnx_path = OUT + "/model.onnx"
        dummy = tok(["dummy text"], padding="max_length", truncation=True,
                    max_length=MAXLEN, return_tensors="pt")
        # The dynamo exporter writes external-weight files whose shape inference
        # breaks onnxruntime's dynamic quantiser. The legacy exporter emits a
        # single self-contained file that quantises cleanly to ~23 MB.
        kw = dict(input_names=["input_ids", "attention_mask"], output_names=["logits"],
                  opset_version=17, do_constant_folding=True)
        try:
            torch.onnx.export(model, (dummy["input_ids"], dummy["attention_mask"]),
                              onnx_path, dynamo=False, **kw)
            print("  exported with legacy exporter (single file)", flush=True)
        except Exception as e:
            print("  legacy exporter unavailable (%s); using dynamo" % str(e)[:80], flush=True)
            torch.onnx.export(model, (dummy["input_ids"], dummy["attention_mask"]),
                              onnx_path, external_data=False, **kw)
        print("  fp32 onnx: %.1f MB" % (os.path.getsize(onnx_path) / 1e6), flush=True)
        try:
            from onnxruntime.quantization import quantize_dynamic, QuantType
            q = OUT + "/model.int8.onnx"
            quantize_dynamic(onnx_path, q, weight_type=QuantType.QInt8)
            print("  int8 onnx: %.1f MB" % (os.path.getsize(q) / 1e6), flush=True)
            report["onnx_int8_mb"] = round(os.path.getsize(q) / 1e6, 1)
        except Exception as e:
            print("  int8 quantisation failed:", str(e)[:200], flush=True)
        report["onnx_fp32_mb"] = round(os.path.getsize(onnx_path) / 1e6, 1)
    except Exception as e:
        print("  ONNX export failed:", str(e)[:300], flush=True)

    report["elapsed_s"] = round(time.time() - t_start, 1)
    json.dump(report, open(DIR + "/finetune_report.json", "w"), indent=2)
    print("\nFINE-TUNE DONE in %.1f min" % (report["elapsed_s"] / 60), flush=True)


if __name__ == "__main__":
    main()
