"""Build a classification sample from mafia.db.

Uniform reservoir sample of messages + a suspicion-keyword-enriched sample,
each with the preceding chat as context and the game metadata.
"""
import sqlite3, json, re, random, sys, time

DB = "/home/tt/Documents/Ultimafia/mafia.db"
OUT = "/home/tt/Documents/Ultimafia/rules_ml/sample.jsonl"
K = 6                 # context messages kept
CAP_RANDOM = 2500
CAP_SUSPECT = 2500
random.seed(20261007)

SUSPECT = re.compile(r"""(?ix)
 \b(
  suicid\w*|suing|sue|kys|kill\s+your\s*self|kys|report(ed|ing)?|ban(ned|ning)?|
  gamethrow\w*|throw\w*|throwing|meta|pretend\w*\s+to\s+cheat|
  retard\w*|faggot\w*|fag\b|nigg\w*|trann\w*|kike|spic|chink|wetback|
  rape\w*|nazi|hitler|holocaust|genocide|
  doxx?\w*|address|leak\w*|multi\s*account\w*|alt\w*|cheat\w*|exploit\w*|
  stfu|shut\s+up|idiot\w*|moron\w*|dumb(ass)?|stupid|loser|useless|incompeten\w*|
  f+u+c+k+\s+(you|u)\b|hate\s+you|kys|worthless|pathetic|
  (jew|gay|autis\w*|downs?)\b
 )""")

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
                if not c:
                    continue
                out.append({"state": sname, "pid": msg.get("senderId"),
                            "content": c, "time": msg.get("time") or 0})
    out.sort(key=lambda x: x["time"])
    return out


def main():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    n_games = cur.execute("SELECT COUNT(*) FROM games").fetchone()[0]
    print("games:", n_games, flush=True)

    reservoir = []          # uniform sample
    suspect = []            # keyword sample
    seen = 0
    t0 = time.time()

    for gi, (gid, content) in enumerate(cur.execute(SQL)):
        if gi % 500 == 0:
            print("  game %d/%d  seen=%d  rand=%d susp=%d  %.0fs"
                  % (gi, n_games, seen, len(reservoir), len(suspect), time.time() - t0), flush=True)
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
            ctx = ["%s: %s" % (nm(x["pid"]), x["content"]) for x in msgs[max(0, i - K):i]]
            rec = {
                "game_id": gid, "game_type": gtype, "ranked": ranked,
                "competitive": comp, "state": m["state"], "time": m["time"],
                "sender": nm(m["pid"]), "target": m["content"], "context": ctx,
            }
            seen += 1
            # uniform reservoir over all messages
            if len(reservoir) < CAP_RANDOM:
                reservoir.append(rec)
            else:
                j = random.randrange(seen)
                if j < CAP_RANDOM:
                    reservoir[j] = rec
            if len(suspect) < CAP_SUSPECT * 4 and SUSPECT.search(m["content"]):
                suspect.append(rec)

    print("scanned messages:", seen, " uniform:", len(reservoir), " suspect pool:", len(suspect), flush=True)
    random.shuffle(suspect)
    suspect = suspect[:CAP_SUSPECT]

    with open(OUT, "w", encoding="utf-8") as f:
        for r in reservoir:
            r["source"] = "random"
            f.write(json.dumps(r) + "\n")
        for r in suspect:
            r["source"] = "suspect"
            f.write(json.dumps(r) + "\n")
    print("wrote", len(reservoir) + len(suspect), "records to", OUT, flush=True)
    print("sample size:", len(reservoir) + len(suspect), flush=True)
    con.close()


if __name__ == "__main__":
    main()
