"""Mine the OGI form specifically: throwing/gamethrowing ACCUSATIONS.

The earlier 'gt' bucket matched the word, not the accusation, so it yielded few
positives. Here the accusation form is targeted directly (gt + who is addressed),
and the non-accusation form is kept as the boundary negative.
"""
import sqlite3, json, re, random, time

DB = "/home/tt/Documents/Ultimafia/mafia.db"
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
OUT = DIR + "/ogi_new.jsonl"
IDX_BASE = 500000
K = 6
random.seed(5150)

GTW = re.compile(r"(?i)\b(gt|gting|gamethrowing|gamethrower|gamethrowing|throw(ing|er|s)?)\b")
WHO = re.compile(r"(?i)\b(u|you|ur|youre|your|yall|he|she|they|hes|shes|theyre|him|her|them)\b|@\w+")
STOP = re.compile(r"(?i)\bstop\s+(gt|gting|gamethrowing|throwing)\b")
CAP_ACC, CAP_NEG = 500, 300
SQL = "SELECT id, content FROM games"


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
                    out.append({"state": sname, "pid": msg.get("senderId"), "content": c,
                                "time": msg.get("time") or 0})
    out.sort(key=lambda x: x["time"])
    return out


def main():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    n_games = cur.execute("SELECT COUNT(*) FROM games").fetchone()[0]
    pools = {"acc": [], "neg": []}
    seen = {"acc": 0, "neg": 0}
    uniq = {"acc": set(), "neg": set()}
    t0 = time.time()

    for gi, (gid, content) in enumerate(cur.execute(SQL)):
        if gi % 1000 == 0:
            print("  game %d/%d acc=%d neg=%d %.0fs" % (gi, n_games, len(pools["acc"]),
                  len(pools["neg"]), time.time() - t0), flush=True)
        try:
            g = json.loads(content)
            h = g.get("history")
            if isinstance(h, str):
                h = json.loads(h)
            if not h:
                continue
            msgs = flatten(h)
        except Exception:
            continue
        if not msgs:
            continue
        players = g.get("players") or []
        names = g.get("names") or []
        setup = g.get("setup") or {}
        gtype = setup.get("gameType") or g.get("type") or "Unknown"
        ranked = bool(g.get("ranked") or setup.get("ranked"))
        comp = bool(g.get("competitive") or setup.get("competitive"))

        def nm(pid):
            try:
                i = players.index(pid)
                if 0 <= i < len(names):
                    return names[i]
            except ValueError:
                pass
            return str(pid)[:8]

        for i, m in enumerate(msgs):
            c = m["content"]
            if not GTW.search(c):
                continue
            b = "acc" if (WHO.search(c) or STOP.search(c)) else "neg"
            cap = CAP_ACC if b == "acc" else CAP_NEG
            if c in uniq[b]:
                continue
            rec = {"game_id": gid, "game_type": gtype, "ranked": ranked, "competitive": comp,
                   "state": m["state"], "time": m["time"], "sender": nm(m["pid"]), "target": c,
                   "context": ["%s: %s" % (nm(x["pid"]), x["content"]) for x in msgs[max(0, i - K):i]],
                   "source": "ogi_" + b}
            seen[b] += 1
            if len(pools[b]) < cap:
                pools[b].append(rec); uniq[b].add(c)
            else:
                j = random.randrange(seen[b])
                if j < cap:
                    uniq[b].discard(pools[b][j]["target"]); pools[b][j] = rec; uniq[b].add(c)

    rows = pools["acc"] + pools["neg"]
    print("accusation=%d  non-accusation=%d" % (len(pools["acc"]), len(pools["neg"])), flush=True)
    random.shuffle(rows)
    for i, r in enumerate(rows):
        r["idx"] = IDX_BASE + i
    with open(OUT, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r) + "\n")
    print("wrote %d rows to %s" % (len(rows), OUT), flush=True)


main()
