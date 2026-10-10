"""Post-correction metrics, plus a no-API estimate of how many corpus rows a P&A
relaxation would flip. Counting locally first, before spending any budget.
"""
import json
import re
import numpy as np
from transformers import AutoTokenizer
import onnxruntime as ort

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
CLS = DIR + "/finetune_cls3_out"
FITTED = 122
tok = AutoTokenizer.from_pretrained(CLS)
so = ort.SessionOptions(); so.log_severity_level = 3
sess = ort.InferenceSession(CLS + "/model.int8.onnx", so)


def pviol(t):
    e = tok([t], padding="max_length", truncation=True, max_length=96)
    lg = sess.run(None, {"input_ids": np.array(e["input_ids"], dtype=np.int64),
                         "attention_mask": np.array(e["attention_mask"], dtype=np.int64)})[0][0]
    pr = np.exp(lg - lg.max()); pr = pr / pr.sum()
    return float(1.0 - pr[0])


SET = [json.loads(l) for l in open(DIR + "/eval_set.jsonl", encoding="utf-8")]
DONE = {d["i"]: d for d in json.load(open(DIR + "/eval_done.json"))}
rows = [(SET[i], DONE[i]) for i in sorted(DONE)]
human = np.array([1 if d["human"] == "flag" else 0 for r, d in rows])
clef = np.array([1 if (r.get("clef") != "no_violation" and float(r.get("clef_p", 0)) >= 0.5) else 0
                 for r, d in rows])
clean = np.array([d["i"] >= FITTED for r, d in rows])
print("corrected rows now %d flag / %d ok" % (human.sum(), len(human) - human.sum()))


def m(pred, yy):
    tp = int((pred & (yy == 1)).sum()); fp = int((pred & (yy == 0)).sum())
    fn = int((~pred.astype(bool) & (yy == 1)).sum())
    P = tp / (tp + fp) if tp + fp else 0
    R = tp / (tp + fn) if tp + fn else 0
    return P, R, 2 * P * R / (P + R) if P + R else 0, (pred == yy).mean()


print("\n=== after your corrections (clean 277 rows) ===")
print("  %-24s %6s %6s %6s %6s" % ("", "prec", "rec", "F1", "agree"))
P, R, F, A = m(np.array([pviol(r["message"]) for r, d in rows])[clean] >= 0.5, human[clean])
print("  %-24s %6.3f %6.3f %6.3f %5.1f%%" % ("student p>=0.50", P, R, F, 100 * A))
P, R, F, A = m(clef[clean].astype(bool), human[clean])
print("  %-24s %6.3f %6.3f %6.3f %5.1f%%" % ("teacher (Clef)", P, R, F, 100 * A))
print("  irreducible: %d of %d (%.0f%%)" % (int((clef[clean] != human[clean]).sum()), clean.sum(),
                                            100 * (clef[clean] != human[clean]).mean()))

# ---- how many corpus rows would a P&A relaxation touch? (no API) ----
STFU = re.compile(r"\b(stfu|shut\s*up|shutup|shut\s+the\s+fuck\s+up)\b", re.I)
NOOB = re.compile(r"\bnoob\b", re.I)
PA = {"personal_attacks_harassment", "intolerance"}
rows_all = [json.loads(l) for l in open(DIR + "/decisions_final_clef.jsonl", encoding="utf-8")]
pa = [r for r in rows_all if r.get("choice") in PA]
stfu_pa = [r for r in pa if STFU.search(r["target"])]
noob_pa = [r for r in pa if NOOB.search(r["target"])]
print("\n=== corpus rows a P&A relaxation would touch (local count, no API spent) ===")
print("  P&A-labelled rows total          : %d" % len(pa))
print("  ...containing stfu/shut up       : %d   <- a bare-dismissal carve-out would flip these" % len(stfu_pa))
print("  ...containing noob               : %d" % len(noob_pa))
print("\n  examples of the stfu rows that would flip:")
for r in stfu_pa[:10]:
    print("     p=%.2f  %s" % (float(r.get("noul", 0)), r["target"][:70]))
