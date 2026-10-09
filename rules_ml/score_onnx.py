"""Score cases with the fine-tuned int8 ONNX model, using the same preprocessing as training."""
import json, sys
import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer

OUT = "/home/tt/Documents/Ultimafia/rules_ml/finetune_out"
MAXLEN = 96
NCTX = 3

tok = AutoTokenizer.from_pretrained(OUT)
sess = ort.InferenceSession(OUT + "/model.int8.onnx")

# let python know the session's expected inputs
IN = [i.name for i in sess.get_inputs()]
print("onnx inputs:", IN, flush=True)


def text_of(target, context=None):
    ctx = [c for c in (context or []) if c][-NCTX:]
    return " | ".join(ctx + [target]) if ctx else target


def score(target, context=None):
    t = text_of(target, context)
    e = tok(t, padding="max_length", truncation=True, max_length=MAXLEN, return_tensors="np")
    feed = {k: v for k, v in e.items() if k in IN}
    logits = sess.run(None, feed)[0][0]
    z = logits - logits.max()
    p = np.exp(z) / np.exp(z).sum()
    return float(p[1])


SANITY = [("Z dumbtell", 0), ("Z is dumbtelling", 0), ("that awkward pause feels like a dumbtell", 0),
          ("hc blue, no gun no carol no knife no rifle", 0), ("fos on bob for that vote", 0),
          ("gt is possible here but not locked", 0), ("meta says she pushes early as town", 0),
          ("could be wifom to leave that slot alive", 0), ("you're great at the game", 0),
          ("you're really good at this", 0), ("great game", 0), ("that was a great play", 0),
          ("gg wp", 0), ("good job", 0), ("well played", 0), ("nice one", 0),
          ("who would like retrained", 0), ("vote Bob he is mafia", 0),
          ("im suing", 1), ("suiciding", 1), ("you are a moron", 1),
          ("i can report you and u can get reported for ogi", 1), ("shut the fuck up", 1),
          ("u gt btw", 1), ("yes link a game so i can report u >:3", 1),
          ("you're gamethrowing", 1), ("you are gamethrowing", 1),
          ("you're throwing this game", 1), ("stop gamethrowing", 1)]

print("\n%-46s %-6s %-6s %s" % ("case", "expect", "p", "verdict"), flush=True)
ok = 0
for s, want in SANITY:
    p = score(s)
    got = 1 if p >= 0.5 else 0
    good = got == want
    ok += good
    print("%-46s %-6s %.3f  %s%s" % (s[:46], "FLAG" if want else "ok",
                                     p, "FLAG" if got else "ok", "" if good else "   <-- WRONG"), flush=True)
print("\nSANE: %d/%d" % (ok, len(SANITY)), flush=True)
