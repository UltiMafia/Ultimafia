"""Build a targeted supplement of rare GRA slang (suing / suiciding / sue me)
so the distilled model can learn it, using the same schema as sample.jsonl."""
import sqlite3, json, re, sys
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import build_sample as B

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
OUT = DIR + "/supplement.jsonl"
PAT = re.compile(r"(?i)(suicid|suing|\bsue\s+me\b|\bsues\b|\bsuicide\b)")
CAP = 600
K = 6

con = sqlite3.connect(B.DB)
cur = con.cursor()
seen_text = set()
for r in open(DIR + "/sample.jsonl", encoding="utf-8"):
    seen_text.add(json.loads(r)["target"].lower())

out = []
for gid, content in cur.execute("SELECT id, content FROM games"):
    try:
        g = json.loads(content)
        h = g.get("history")
        if isinstance(h, str):
            h = json.loads(h)
        if not h:
            continue
        msgs = B.flatten(h)
    except Exception:
        continue
    if not msgs:
        continue
    players = g.get("players") or []
    names = g.get("names") or []
    setup = g.get("setup") or {}

    def nm(pid):
        try:
            i = players.index(pid)
            if 0 <= i < len(names):
                return names[i]
        except ValueError:
            pass
        return str(pid)[:8]

    for i, m in enumerate(msgs):
        t = m["content"]
        if not PAT.search(t) or t.lower() in seen_text:
            continue
        out.append({
            "game_id": gid, "game_type": setup.get("gameType") or g.get("type") or "Mafia",
            "ranked": bool(g.get("ranked") or setup.get("ranked")),
            "competitive": bool(g.get("competitive") or setup.get("competitive")),
            "state": m["state"], "time": m["time"], "sender": nm(m["pid"]),
            "target": t, "context": ["%s: %s" % (nm(x["pid"]), x["content"]) for x in msgs[max(0, i - K):i]],
            "source": "supplement",
        })
        if len(out) >= CAP:
            break
    if len(out) >= CAP:
        break

with open(OUT, "w", encoding="utf-8") as f:
    for r in out:
        f.write(json.dumps(r) + "\n")
print("supplement size:", len(out))
print("examples:", [r["target"][:40] for r in out[:12]])
con.close()
