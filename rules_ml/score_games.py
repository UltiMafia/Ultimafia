"""Build the game viewer's data: several whole games, scored by the shipped int8 model.

With no arguments it picks a spread on purpose - the most toxic games that are still a
sane size, plus clean games for contrast - so the viewer can show what the thresholds do
at both ends. Pass game ids to score specific ones instead.

Writes rules_ml/game_views.json (generated, gitignored).

  python score_games.py                 # the default spread
  python score_games.py N22pyw_0B dQ1JH6AT4
"""
import json, sqlite3, sys
import numpy as np
from transformers import AutoTokenizer
import onnxruntime as ort

DB = "/home/tt/Documents/Ultimafia/mafia.db"
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
OUT = DIR + "/game_views.json"
CORPUS = DIR + "/decisions_final_clef.jsonl"
CLS = DIR + "/finetune_cls3_out"
CLASSES = ["no_violation", "abuse", "outside_game_influence", "other"]
LABELS = {"no_violation": "no violation", "abuse": "abuse / harassment",
          "outside_game_influence": "outside game influence", "other": "other"}
MAXLEN = 96
MAX_BYTES = 1_200_000        # skip the mega-games; a 3500-message game is unreadable as a demo


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


def violations_by_game(con):
    """How many messages in the labelled corpus this game has as violations."""
    from collections import Counter
    c = Counter()
    for l in open(CORPUS, encoding="utf-8"):
        r = json.loads(l)
        if r.get("choice") not in ("no_violation", None) and float(r.get("noul") or 0) >= 0.5:
            c[str(r.get("game_id"))] += 1
    return c


def pick_spread(con, vio):
    """4 games with violations (smallest of the worst, so they stay readable) + 2 clean."""
    good = []
    for gid, k in vio.most_common(60):
        row = con.execute("SELECT length(content) FROM games WHERE id = ?", (gid,)).fetchone()
        if not row or row[0] > MAX_BYTES or row[0] < 100_000:
            continue
        good.append(gid)
        if len(good) >= 4:
            break
    # Clean games, chosen from a readable size band directly. (Sampling the smallest
    # games first returns ones far below the band, so it silently found none.)
    clean = []
    for gid, in con.execute("SELECT id FROM games WHERE length(content) BETWEEN 150000 AND 700000 "
                            "LIMIT 5000"):
        if vio.get(gid):
            continue
        clean.append(gid)
        if len(clean) >= 2:
            break
    return good + clean


def main():
    ids = sys.argv[1:]
    con = sqlite3.connect(DB)
    vio = violations_by_game(con)
    if not ids:
        ids = pick_spread(con, vio)
        print("auto-selected: %s" % ", ".join(ids), flush=True)

    tok = AutoTokenizer.from_pretrained(CLS)
    so = ort.SessionOptions(); so.log_severity_level = 3
    sess = ort.InferenceSession(CLS + "/model.int8.onnx", so)

    games = []
    for gid in ids:
        row = con.execute("SELECT content FROM games WHERE id = ?", (gid,)).fetchone()
        if not row:
            print("  %s: NOT FOUND in games.id - skipped" % gid, flush=True)
            continue
        g = json.loads(row[0])
        h = g.get("history")
        if isinstance(h, str):
            h = json.loads(h)
        msgs = flatten(h or {})
        players = g.get("players") or []
        names = g.get("names") or []

        def nm(pid, players=players, names=names):
            try:
                i = players.index(pid)
                if 0 <= i < len(names):
                    return names[i]
            except ValueError:
                pass
            return str(pid)[:8]

        pv, cats = [], []
        for m in msgs:
            e = tok([m["content"]], padding="max_length", truncation=True, max_length=MAXLEN)
            lg = sess.run(None, {"input_ids": np.array(e["input_ids"], dtype=np.int64),
                                 "attention_mask": np.array(e["attention_mask"], dtype=np.int64)})[0][0]
            pr = np.exp(lg - lg.max()); pr = pr / pr.sum()
            pv.append(float(1.0 - pr[0]))
            cats.append(CLASSES[int(np.argmax(pr))])

        setup = g.get("setup") or {}
        n_flag = sum(1 for p in pv if p >= 0.5)
        games.append({
            "game_id": gid,
            "game_type": setup.get("gameType") or g.get("type") or "?",
            "ranked": bool(g.get("ranked") or setup.get("ranked")),
            "player_count": len(players),
            "message_count": len(msgs),
            "labelled_violations": vio.get(gid, 0),
            "messages": [
                {"i": i, "sender": nm(m["pid"]), "phase": m["phase"], "text": m["content"],
                 "p": round(pv[i], 4), "category": LABELS.get(cats[i], cats[i])}
                for i, m in enumerate(msgs)
            ],
        })
        print("  %s: %s, %d players, %d msgs, %d flagged@0.5, %d labelled violations"
              % (gid, games[-1]["game_type"], len(players), len(msgs), n_flag,
                 games[-1]["labelled_violations"]), flush=True)

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"games": games}, f)
    print("wrote %s (%d games)" % (OUT, len(games)), flush=True)


main()
