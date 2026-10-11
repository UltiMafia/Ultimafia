"""Mine the play-directed vs person-directed distinction under profanity.

The blindspot: 'that vote is fucking terrible bruh' is flagged because the corpus
contains almost no examples of profanity aimed at a PLAY rather than a PERSON.
Three buckets, all sharing profanity vocabulary:
  play    - profanity + a play-noun, no second person   ('that vote was fucking terrible')
  person  - profanity + second person / @mention        ('you are fucking terrible')
  generic - profanity with neither                      (venting)
"""
import sqlite3, json, re, random, time

DB = "/home/tt/Documents/Ultimafia/mafia.db"
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
OUT = DIR + "/play_new.jsonl"
IDX_BASE = 600000
K = 6
random.seed(6006)

PROF = re.compile(r"(?i)\b(fucking|fuck|shit|shitty|terrible|horrible|garbage|awful|trash|"
                  r"useless|pathetic|dumb|stupid|lame|bad|sloppy|scuffed)\b")
PLAY = re.compile(r"(?i)\b(votes?|voted|voting|plays?|played|reads?|calls?|picks?|claims?|pushes?|"
                  r"hammer|lynch|day|logic|plan|move|strategy|reasoning|push|case|wagon)\b")
YOU = re.compile(r"(?i)\b(you|ur|your|u|youre|y'all|yall)\b|@\w+")

CAPS = {"play": 500, "person": 400, "generic": 300}
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


def bucket_of(c):
    if not PROF.search(c):
        return None
    if YOU.search(c):
        return "person"
    if PLAY.search(c):
        return "play"
    return "generic"


def main():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    n_games = cur.execute("SELECT COUNT(*) FROM games").fetchone()[0]
    pools = {k: [] for k in CAPS}
    seen = {k: 0 for k in CAPS}
    uniq = {k: set() for k in CAPS}
    t0 = time.time()

    for gi, (gid, content) in enumerate(cur.execute(SQL)):
        if gi % 1000 == 0:
            print("  game %d/%d %s %.0fs" % (gi, n_games,
                  {k: len(v) for k, v in pools.items()}, time.time() - t0), flush=True)
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
            if len(c) > 120:
                continue
            b = bucket_of(c)
            if not b or c in uniq[b]:
                continue
            cap = CAPS[b]
            rec = {"game_id": gid, "game_type": gtype, "ranked": ranked, "competitive": comp,
                   "state": m["state"], "time": m["time"], "sender": nm(m["pid"]), "target": c,
                   "context": ["%s: %s" % (nm(x["pid"]), x["content"]) for x in msgs[max(0, i - K):i]],
                   "source": "play_" + b}
            seen[b] += 1
            if len(pools[b]) < cap:
                pools[b].append(rec); uniq[b].add(c)
            else:
                j = random.randrange(seen[b])
                if j < cap:
                    uniq[b].discard(pools[b][j]["target"]); pools[b][j] = rec; uniq[b].add(c)

    rows = []
    for b in CAPS:
        rows.extend(pools[b])
        print("bucket %-8s %d" % (b, len(pools[b])), flush=True)
    random.shuffle(rows)
    for i, r in enumerate(rows):
        r["idx"] = IDX_BASE + i
    with open(OUT, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r) + "\n")
    print("wrote %d rows to %s" % (len(rows), OUT), flush=True)


main()
