import sqlite3, json, re

DB = "/home/tt/Documents/Ultimafia/mafia.db"
con = sqlite3.connect(DB)
cur = con.cursor()

terms = ["suing", "suiciding", "suicide", "sue me", "sues", "i'm suing", "im suing"]
for t in terms:
    try:
        n = cur.execute("SELECT COUNT(*) FROM messages_search WHERE messages_search MATCH ?", (t,)).fetchone()[0]
    except Exception as e:
        n = "ERR %s" % e
    print("%-12s %s" % (t, n))

print("\n-- via LIKE (whole table) --")
for t in ["%suing%", "%suiciding%", "%suicide%"]:
    n = cur.execute("SELECT COUNT(*) FROM messages WHERE message_content LIKE ?", (t,)).fetchone()[0]
    print("%-14s %d" % (t, n))

# how many are already in our sample?
samp = [json.loads(l) for l in open("/home/tt/Documents/Ultimafia/rules_ml/sample.jsonl")]
stexts = set(r["target"].lower() for r in samp)
print("\nsample size:", len(samp))
for t in ["suing", "suicid", "suicide"]:
    print("  sample messages containing %-9s: %d" % (t, sum(1 for s in stexts if t in s)))
con.close()
