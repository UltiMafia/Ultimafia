import json, sqlite3, sys
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import jev_lib

key = jev_lib.load_api_key()
print("key loaded, prefix ok:", key[:4] + "..." if key else "EMPTY")

con = sqlite3.connect("/home/tt/Documents/Ultimafia/mafia.db")
cur = con.cursor()

# find some interesting messages
picks = []
for pat in ["suing", "suicide", "suicid", "report you", "throwing", "i'm leaving", "im leaving"]:
    rows = cur.execute(
        "SELECT message_id, game_id, player_id, message_content FROM messages "
        "WHERE message_content LIKE ? LIMIT 2", ("%" + pat + "%",)).fetchall()
    picks.extend(rows)
seen = set()
uniq = []
for r in picks:
    if r[0] not in seen:
        seen.add(r[0]); uniq.append(r)
print("candidate messages found:", len(uniq))
for r in uniq[:12]:
    print("  id=%s | %r" % (r[0], r[3][:80]))

qs = jev_lib.build_questions()
print("\nquestion types:", {k: v["type"] for k, v in qs.items()})

for r in uniq[:6]:
    mid, gid, pid, content = r
    state = jev_lib.build_state(
        target_line="Player: " + content,
        context_lines=["Alice: gu ys can we get votes on bob", "Bob: nvm", "Player: (previous message)"],
        game_context="Game type: Mafia. Ranked: yes. Competitive: no. Phase: Day 1.",
    )
    try:
        resp = jev_lib.systemone(state, qs, key)
    except Exception as e:
        print("\nMSG %s ERROR: %s" % (mid, e))
        continue
    a = resp.get("answers", {})
    print("\n--- message %s: %r" % (mid, content[:90]))
    print("   policy_violation noul =", a.get("policy_violation", {}).get("noul"))
    vt = a.get("violation_type", {})
    print("   violation_type =", vt.get("choice"), "conf", vt.get("confidence"))
    print("   top probs =", sorted(vt.get("probabilities", {}).items(), key=lambda x: -x[1])[:3])
    sv = a.get("severity", {})
    print("   severity =", sv.get("score"), "conf", sv.get("confidence"))
    print("   usage =", resp.get("usage"), "model =", resp.get("model"))
con.close()
