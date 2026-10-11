"""Mine messages containing 'game' as a second hard-negative batch.

'the game' carries a large positive weight because it marks meta /
outside-the-game violations in the corpus. Benign messages that mention the
game give the counter-examples. idx space 300000+.
"""
import sqlite3, re, json, random

DB = "file:/home/tt/Documents/Ultimafia/mafia.db?mode=ro"
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
pat = re.compile(r"(?i)\bgame\b")

c = sqlite3.connect(DB, uri=True)
seen = set()
for (t,) in c.execute("SELECT message_content FROM messages WHERE length(message_content) BETWEEN 3 AND 90"):
    if t and pat.search(t):
        seen.add(t.strip())
msgs = sorted(seen)
random.seed(23)
pick = random.sample(msgs, min(300, len(msgs)))
rows = [{"idx": 300000 + i, "source": "game", "sender": "", "target": m,
         "context": [], "state": "?", "game_type": "Mafia", "game_id": "game-%d" % i,
         "ranked": False, "competitive": False} for i, m in enumerate(pick)]
with open(DIR + "/game.jsonl", "w", encoding="utf-8") as f:
    for r in rows:
        f.write(json.dumps(r) + "\n")
print("game worklist: %d distinct messages (from %d candidates)" % (len(rows), len(msgs)))
