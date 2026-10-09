"""Dump one full game's chat, scored by the final 4-class model, for the game viewer.

Picks a game that actually contains labelled violations (so there is something to
look at), flattens the whole transcript in order, and scores every message.
Writes rules_ml/game_view.json for the viewer page.
"""
import json, sqlite3, sys
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

DB = "/home/tt/Documents/Ultimafia/mafia.db"
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
OUT = DIR + "/game_view.json"
CLS = DIR + "/finetune_cls3_out"
CLASSES = ["no_violation", "abuse", "outside_game_influence", "other"]
LABELS = {"no_violation": "no violation", "abuse": "abuse / harassment",
          "outside_game_influence": "outside game influence", "other": "other"}
MAXLEN = 96


def flatten(h):
    seq = ["-1"] + sorted([k for k in h if k not in ("-1", "-2")], key=lambda x: int(x)) + ["-2"]
    out = []
    for sk in seq:
        st = h.get(sk) or {}
        sname = st.get("name") or ""
        meets = st.get("meetings") or {}
        if not isinstance(meets, dict):
            continue
        for m in meets.values():
            for msg in (m.get("messages") or []):
                c = (msg.get("content") or "").strip()
                if c:
                    out.append({"phase": sname, "pid": msg.get("senderId"),
                                "content": c, "time": msg.get("time") or 0})
    out.sort(key=lambda x: x["time"])
    return out


def pick_game():
    from collections import Counter
    c = Counter()
    for l in open(DIR + "/decisions_final_clef.jsonl", encoding="utf-8"):
        r = json.loads(l)
        if r.get("choice") not in ("no_violation", None) and float(r.get("noul") or 0) >= 0.5:
            c[str(r.get("game_id"))] += 1
    return c.most_common(1)[0][0]


def main():
    gid = sys.argv[1] if len(sys.argv) > 1 else "N22pyw_0B"
    con = sqlite3.connect(DB)
    row = con.execute("SELECT content FROM games WHERE id = ?", (gid,)).fetchone()
    if not row:
        raise SystemExit("game %s not found in games.id (no fuzzy fallback - that "
                         "silently picked the wrong game once)" % gid)
    g = json.loads(row[0])
    h = g.get("history")
    if isinstance(h, str):
        h = json.loads(h)
    msgs = flatten(h or {})
    players = g.get("players") or []
    names = g.get("names") or []

    def nm(pid):
        try:
            i = players.index(pid)
            if 0 <= i < len(names):
                return names[i]
        except ValueError:
            pass
        return str(pid)[:8]

    texts = [m["content"] for m in msgs]
    tok = AutoTokenizer.from_pretrained(CLS)
    # Score with the int8 ONNX - the artifact that actually ships - not PyTorch fp32.
    # The two disagree by up to ~0.40 on individual messages, so scoring fp32 here
    # showed a model nobody deploys.
    import onnxruntime as ort
    so = ort.SessionOptions()
    so.log_severity_level = 3
    sess = ort.InferenceSession(CLS + "/model.int8.onnx", so)
    pv, cats = [], []
    for x in texts:                      # the quantised graph is fixed batch=1
        e = tok([x], padding="max_length", truncation=True, max_length=MAXLEN)
        lg = sess.run(None, {
            "input_ids": np.array(e["input_ids"], dtype=np.int64),
            "attention_mask": np.array(e["attention_mask"], dtype=np.int64),
        })[0][0]
        pr = np.exp(lg - lg.max())
        pr = pr / pr.sum()
        pv.append(float(1.0 - pr[0]))
        cats.append(CLASSES[int(np.argmax(pr))])

    setup = g.get("setup") or {}
    out = {
        "game_id": gid,
        "game_type": setup.get("gameType") or g.get("type") or "?",
        "ranked": bool(g.get("ranked") or setup.get("ranked")),
        "player_count": len(players),
        "message_count": len(msgs),
        "messages": [
            {"i": i, "sender": nm(m["pid"]), "phase": m["phase"], "text": m["content"],
             "p": round(float(pv[i]), 4), "category": LABELS.get(cats[i], cats[i])}
            for i, m in enumerate(msgs)
        ],
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f)
    n_hi = sum(1 for m in out["messages"] if m["p"] >= 0.5)
    print("game %s: %s, %d players, %d messages, %d above 0.5"
          % (gid, out["game_type"], len(players), len(msgs), n_hi), flush=True)
    print("wrote %s" % OUT, flush=True)


main()
