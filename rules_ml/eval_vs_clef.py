"""Clef (the teacher) measured against the human hand-check judgements.

Why this matters: the student was trained on Clef's labels, so its ceiling is Clef's own
accuracy against the human. If the student already matches the teacher on human judgements,
more model capacity buys nothing and label quality is the binding constraint.

Definitions follow the repo's label convention: a Clef row is a violation when
clef_p >= 0.5 AND clef != "no_violation".
"""
import json
import numpy as np
from transformers import AutoTokenizer
import onnxruntime as ort

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
CLS = DIR + "/finetune_cls3_out"
MAXLEN = 96
FITTED = 122

SET = [json.loads(l) for l in open(DIR + "/eval_set.jsonl", encoding="utf-8")]
DONE = json.load(open(DIR + "/eval_done.json"))
by_i = {i: r for i, r in enumerate(SET)}
rows = sorted([(by_i[d["i"]], d) for d in DONE if d["i"] in by_i], key=lambda x: x[1]["i"])

tok = AutoTokenizer.from_pretrained(CLS)
so = ort.SessionOptions(); so.log_severity_level = 3
sess = ort.InferenceSession(CLS + "/model.int8.onnx", so)


def pviol(t):
    e = tok([t], padding="max_length", truncation=True, max_length=MAXLEN)
    lg = sess.run(None, {"input_ids": np.array(e["input_ids"], dtype=np.int64),
                         "attention_mask": np.array(e["attention_mask"], dtype=np.int64)})[0][0]
    pr = np.exp(lg - lg.max()); pr = pr / pr.sum()
    return float(1.0 - pr[0])


human = np.array([1 if d["human"] == "flag" else 0 for r, d in rows])
clef = np.array([1 if (r.get("clef") != "no_violation" and float(r.get("clef_p", 0)) >= 0.5) else 0
                 for r, d in rows])
model = np.array([pviol(r["message"]) for r, d in rows])
is_fitted = np.array([d["i"] < FITTED for r, d in rows])


def m(pred, yy):
    tp = int((pred & (yy == 1)).sum()); fp = int((pred & (yy == 0)).sum())
    fn = int((~pred.astype(bool) & (yy == 1)).sum())
    P = tp / (tp + fp) if tp + fp else 0.0
    R = tp / (tp + fn) if tp + fn else 0.0
    F = 2 * P * R / (P + R) if P + R else 0.0
    return P, R, F, (pred == yy).mean(), tp, fp, fn


def section(mask, name):
    print("\n" + "=" * 74)
    print("%s   (n=%d, human flagged %d = %.0f%%)" % (name, mask.sum(), human[mask].sum(),
                                                      100 * human[mask].mean()))
    print("=" * 74)
    h, c = human[mask], clef[mask]
    print("  %-26s %6s %6s %6s %6s" % ("", "prec", "rec", "F1", "agree"))
    for t in (0.40, 0.50):
        P, R, F, A, tp, fp, fn = m((model[mask] >= t), h)
        print("  %-26s %6.3f %6.3f %6.3f %5.1f%%" % ("student  (int8, p>=%.2f)" % t, P, R, F, 100 * A))
    P, R, F, A, tp, fp, fn = m(c.astype(bool), h)
    print("  %-26s %6.3f %6.3f %6.3f %5.1f%%   <- TEACHER CEILING" % ("teacher  (Clef)", P, R, F, 100 * A))
    print("  %-26s %6s %6s %6s %5.1f%%" % ("always say OK", "-", "-", "-", 100 * (h == 0).mean()))

    print("\n  teacher vs student on the same rows: %.1f%% agreement" % (100 * (c == (model[mask] >= 0.5)).mean()))
    print("\n  where the STUDENT disagrees with the human, whose fault is it?")
    for label, sel, t in (("false positive (human ok, student flags)", (h == 0) & (model[mask] >= 0.5), 0.5),
                          ("false negative (human flags, student passes)", (h == 1) & (model[mask] < t), 0.5)):
        n = int(sel.sum())
        if not n:
            continue
        teacher_also = int((c[sel] != h[sel]).sum())
        print("    %-46s n=%-3d  teacher disagrees with human on %d (%.0f%%) -> label noise"
              % (label, n, teacher_also, 100 * teacher_also / n))
        print("    %-46s          teacher agrees with human on  %d (%.0f%%) -> student's own error"
              % ("", n - teacher_also, 100 * (n - teacher_also) / n))

    print("\n  IRREDUCIBLE: teacher and human disagree on %d of %d rows (%.0f%%)"
          % (int((c != h).sum()), mask.sum(), 100 * (c != h).mean()))
    print("  A perfect clone of the teacher could therefore reach at most %.1f%% agreement."
          % (100 * (c == h).mean()))


section(~is_fitted, "CLEAN rows (judged after the rubric was frozen)")
section(is_fitted, "rows used to write the rubric")
section(np.ones(len(rows), bool), "ALL judged rows")

print("\n=== what the teacher calls the rows the human flagged (clean) ===")
sel = (~is_fitted) & (human == 1)
import collections
print("  ", collections.Counter(r["clef"] for (r, d), s in zip(rows, sel) if s).most_common())
print("\n=== ...and the rows the human passed ===")
sel = (~is_fitted) & (human == 0)
print("  ", collections.Counter(r["clef"] for (r, d), s in zip(rows, sel) if s).most_common(6))
