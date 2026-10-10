"""Post-OGI-mining measurement: the hand-check, plus the specific rows the mining was meant
to fix. The 11 rows are the GT-accusation cases the human flagged and the teacher missed -
if feeding OGI worked, the student's probability on those should have risen.
"""
import json
import numpy as np
from transformers import AutoTokenizer
import onnxruntime as ort

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
CLS = DIR + "/finetune_cls3_out"
FITTED = 122
GT_ROWS = [152, 167, 195, 280, 289, 290, 334, 357, 370, 373, 386]

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
teach = np.array([1 if (SET[i].get("clef") != "no_violation"
                        and float(SET[i].get("clef_p") or 0) >= 0.5) else 0 for i in clean])
stud = np.array([pviol(SET[i]["message"]) for i in clean])

print("=== hand-check, clean %d rows ===" % len(clean))
print("  %-34s agree %5.1f%%   P %.3f  R %.3f" % (
    "teacher (Clef)", 100 * (teach == human).mean(),
    (teach & (human == 1)).sum() / max((teach).sum(), 1),
    (teach & (human == 1)).sum() / max(human.sum(), 1)))
for t in (0.40, 0.50, 0.70):
    sp = (stud >= t).astype(bool)
    tp = (sp & (human == 1)).sum(); fp = (sp & (human == 0)).sum(); fn = (~sp & (human == 1)).sum()
    P = tp / (tp + fp) if tp + fp else 0
    R = tp / (tp + fn) if tp + fn else 0
    print("  %-34s agree %5.1f%%   P %.3f  R %.3f" % ("student (int8, p>=%.2f)" % t,
                                                     100 * (sp == human).mean(), P, R))

print("\n=== the 11 GT-accusation rows you flagged that the teacher missed ===")
print("  %-46s %8s %8s %s" % ("message", "prev p", "new p", "flagged now?"))
prev = {152: 0.48, 167: 0.11, 195: 0.38, 280: 0.42, 289: 0.35, 290: 0.08,
        334: 0.46, 357: 0.33, 370: 0.28, 373: 0.27, 386: 0.17}   # from the pre-mining run
hit = 0
for i in GT_ROWS:
    p = pviol(SET[i]["message"])
    ok = p >= 0.50
    hit += ok
    print("  %-46s %8.2f %8.2f %s" % (SET[i]["message"][:46], prev.get(i, -1), p, "YES" if ok else "no"))
print("\n  %d of %d now flag (were misses before)" % (hit, len(GT_ROWS)))
