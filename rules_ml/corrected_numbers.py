"""Corrected numbers with FRESH teacher labels: teacher vs student vs human, and the
error attribution that the stale labels got wrong.
"""
import json
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
clean = [i for i in sorted(DONE) if i >= FITTED]
human = np.array([1 if DONE[i]["human"] == "flag" else 0 for i in clean])
teach = np.array([1 if (SET[i].get("clef") != "no_violation" and float(SET[i].get("clef_p", 0) or 0) >= 0.5) else 0
                  for i in clean])
stud = np.array([pviol(SET[i]["message"]) for i in clean])


def m(P, Y, name):
    tp = int((P & (Y == 1)).sum()); fp = int((P & (Y == 0)).sum()); fn = int((~P.astype(bool) & (Y == 1)).sum())
    pr = tp / (tp + fp) if tp + fp else 0
    rc = tp / (tp + fn) if tp + fn else 0
    print("  %-34s agree %5.1f%%   P %.3f  R %.3f" % (name, 100 * (P == Y).mean(), pr, rc))


print("=== CLEAN rows (n=%d, human flagged %d) - all three, fresh labels ===" % (len(clean), human.sum()))
m(teach.astype(bool), human, "teacher (Clef, current rubric)")
m((stud >= 0.50).astype(bool), human, "student (int8, p>=0.50)")
m((stud >= 0.40).astype(bool), human, "student (int8, p>=0.40)")
print("  %-34s agree %5.1f%%" % ("always say OK", 100 * (human == 0).mean()))
print("\n  teacher is %.1f points above the student (with context, p>=0.50)"
      % (100 * ((teach == human).mean() - ((stud >= 0.5) == human).mean())))

sp = stud >= 0.5
print("\n=== whose fault are the student's errors now, with FRESH teacher labels? ===")
for label, sel in (("false positive (human ok, student flags)", (human == 0) & sp),
                   ("false negative (human flags, student passes)", (human == 1) & ~sp)):
    n = int(sel.sum())
    if not n:
        continue
    tbad = int((teach[sel] != human[sel]).sum())
    print("  %-46s n=%-3d  teacher wrong too: %2d (%.0f%%)   student's own: %2d (%.0f%%)"
          % (label, n, tbad, 100 * tbad / n, n - tbad, 100 * (n - tbad) / n))
print("\n  irreducible (teacher disagrees with human): %d/%d = %.0f%%  -> ceiling %.1f%%"
      % (int((teach != human).sum()), len(clean), 100 * (teach != human).mean(),
         100 * (teach == human).mean()))
