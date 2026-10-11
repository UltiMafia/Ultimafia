"""Mine TARGETED buckets that the existing corpus is missing.

Buckets (the holes found in the retrain):
  gt   - gamethrowing accusations (OGI): only 1 example in the corpus
  dox  - doxxing candidates: 7 positives in the corpus
  tgt  - insults WITH an @mention      (targeted -> violation)
  untg - insults with NO mention and NO second person (untargeted -> allowed)
The last two are a contrast pair for the targeted-vs-untargeted distinction.
"""
import sqlite3, json, re, random, time

DB = "/home/tt/Documents/Ultimafia/mafia.db"
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
OUT = DIR + "/targeted_new.jsonl"
IDX_BASE = 400000
K = 6
random.seed(4242)

GT = re.compile(r"(?i)(\bgt\b|gamethrow|\bthrow(ing|n|s)?\b)")
DOX = re.compile(r"(?i)\b(lives?|living|address|real name|birthday|is 1[0-9]\b|"
                 r"from (ohio|texas|california|ny|la|london|canada|florida)\b)")
INSULT = re.compile(r"(?i)\b(shut ?up|stfu|idiot\w*|moron\w*|dumb(ass)?|stupid|loser|trash|useless|noob)\b")
MENTION = re.compile(r"@\w+")
SECOND = re.compile(r"(?i)\b(you|your|ur|u|yall|y'all)\b")

CAPS = {"gt": 350, "dox": 250, "tgt": 400, "untg": 400}
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
    if INSULT.search(c) and MENTION.search(c):
        return "tgt"
    if INSULT.search(c) and not MENTION.search(c) and not SECOND.search(c):
        return "untg"
    if GT.search(c):
        return "gt"
    if DOX.search(c):
        return "dox"
    return None


def main():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    n_games = cur.execute("SELECT COUNT(*) FROM games").fetchone()[0]
    pools = {k: [] for k in CAPS}
    seen = {k: 0 for k in CAPS}
    scanned = 0
    t0 = time.time()
    uniq = {k: set() for k in CAPS}

    for gi, (gid, content) in enumerate(cur.execute(SQL)):
        if gi % 1000 == 0:
            print("  game %d/%d scanned=%d %s %.0fs" % (gi, n_games, scanned,
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
            scanned += 1
            c = m["content"]
            b = bucket_of(c)
            if not b:
                continue
            if c in uniq[b]:
                continue
            rec = {"game_id": gid, "game_type": gtype, "ranked": ranked, "competitive": comp,
                   "state": m["state"], "time": m["time"], "sender": nm(m["pid"]),
                   "target": c,
                   "context": ["%s: %s" % (nm(x["pid"]), x["content"]) for x in msgs[max(0, i - K):i]],
                   "source": "targeted_" + b}
            seen[b] += 1
            if len(pools[b]) < CAPS[b]:
                pools[b].append(rec)
                uniq[b].add(c)
            else:
                j = random.randrange(seen[b])
                if j < CAPS[b]:
                    uniq[b].discard(pools[b][j]["target"])
                    pools[b][j] = rec
                    uniq[b].add(c)

    rows = []
    for b in CAPS:
        rows.extend(pools[b])
        print("bucket %-5s %d" % (b, len(pools[b])), flush=True)
    random.shuffle(rows)
    for i, r in enumerate(rows):
        r["idx"] = IDX_BASE + i
    with open(OUT, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r) + "\n")
    print("\nwrote %d targeted rows to %s (idx %d+)" % (len(rows), OUT, IDX_BASE), flush=True)


main()
