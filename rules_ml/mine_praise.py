"""Mine praise/banter messages from the archive as hard negatives.

The distilled model treats 'great'/'you'/'game' as attack markers because the
enriched training sample is attack-heavy. Real praise messages, labelled by the
same judge, give it the counter-examples. idx space 200000+ keeps them separate.
"""
import sqlite3, re, json, random

DB = "file:/home/tt/Documents/Ultimafia/mafia.db?mode=ro"
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
pat = re.compile(r"(?i)\b(great|nice one|well played|good job|wp|gg|thanks|thank you|ty|gj|amazing|"
                 r"legend|love you|pog|cracked|goat|mvp|nice|good luck|gl)\b")

c = sqlite3.connect(DB, uri=True)
seen = set()
for (t,) in c.execute("SELECT message_content FROM messages WHERE length(message_content) BETWEEN 2 AND 90"):
    if t and pat.search(t):
        seen.add(t.strip())
msgs = sorted(seen)
random.seed(11)
pick = random.sample(msgs, min(300, len(msgs)))
rows = [{"idx": 200000 + i, "source": "praise", "sender": "", "target": m,
         "context": [], "state": "?", "game_type": "Mafia", "game_id": "praise-%d" % i,
         "ranked": False, "competitive": False} for i, m in enumerate(pick)]
with open(DIR + "/praise.jsonl", "w", encoding="utf-8") as f:
    for r in rows:
        f.write(json.dumps(r) + "\n")
print("praise worklist: %d distinct messages (from %d candidates)" % (len(rows), len(msgs)))
