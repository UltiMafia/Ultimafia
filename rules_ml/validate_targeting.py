"""Does the sharpened targeting rule fix the owner's false positives without losing the true ones?"""
import sys
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
sys.path.insert(0, DIR)
import jev_lib2 as L

L.load_api_key()

# (message, expect_violation, note)
CASES = [
    # ---- the owner's FALSE POSITIVES: all should now be no_violation ----
    ("u got a fucking cc", 0, "cc=counterclaim"),
    ("they installed the new shit", 0, "situation"),
    ("never ask for ot line don't be a noob", 0, "game talk"),
    ("hooker read me as blacksmith so they're not noob", 0, "play criticism"),
    ("He's not gay lol", 0, "banter"),
    ("i have done many stupid things today", 0, "self-directed"),
    ("@raya we are not stupid enough to BOTH fake townslip", 0, "not an insult"),
    ("gamethrower why you driving a bus over me lmao", 0, "banter/name"),
    ("i want to get home and play this but the fucking train isnt moving in this tunnel for 10 minutes and I have a 7% battey", 0, "situation"),
    ("that vote is fucking terrible bruh", 0, "play criticism"),
    ("that's dumb", 0, "play criticism"),
    ("shut up", 0, "untargeted"),
    ("im in LA now", 0, "own location"),
    ("KevinDeng are u gay or a gamer", 0, "banter"),
    ("poops is ccing GameThrower11", 0, "game talk"),
    ("Z dumbtell", 0, "glossary"),
    ("i didn't call you an idiot", 0, "negated insult"),
    ("ur reads are so trash", 0, "play criticism"),
    ("this is stupid", 0, "situation"),
    # ---- the owner's TRUE POSITIVES: all must stay violations ----
    ("you are fucking terrible", 1, "person targeted"),
    ("you're fucking stupid", 1, "person targeted"),
    ("FUCK U", 1, "person targeted"),
    ("you are a moron", 1, "person targeted"),
    ("can XYZ shut the fuck up?", 1, "targeted shut up"),
    ("you're gting", 1, "OGI accusation"),
    ("stop gamethrowing", 1, "OGI accusation"),
    ("I might report you.....", 1, "report threat"),
    ("bob lives in ohio", 1, "doxxing"),
    ("im suing", 1, "GRA"),
    ("someone flip to me real quick so i can gt", 1, "gt"),
    # ---- old regression guards ----
    ("what's your report?", 0, "cop result jargon"),
    ("Clark is also Z's alt", 0, "alt jest"),
    ("XYZ lives in LA", 1, "doxxing third party"),
    ("bobs real name is michael", 1, "doxxing"),
    ("you're great at the game", 0, "compliment"),
    ("great game", 0, "compliment"),
]

rows = [{"idx": i, "target": t, "context": [], "game_id": "vt-%d" % i,
         "state": "Day 1", "sender": "a", "time": 0}
        for i, (t, _e, _n) in enumerate(CASES)]

res = L.judge_batch(rows, model="clef", max_tokens=256)
by_i = {r["idx"]: r for r in res}

wrong = []
for i, (t, e, note) in enumerate(CASES):
    r = by_i.get(i)
    if r is None:
        print("  MISSING  %-58s" % t[:58], flush=True)
        wrong.append(t)
        continue
    noul = float(r.get("noul") or 0)
    ch = r.get("choice")
    got = 1 if (noul >= 0.5 and ch != "no_violation") else 0
    ok = got == e
    if not ok:
        wrong.append(t)
    print("  %-5s exp=%-4s got=%-4s noul=%.2f %-26s | %s" % (
        "ok" if ok else "WRONG", "VIO" if e else "ok", "VIO" if got else "ok",
        noul, str(ch)[:26], t[:56]), flush=True)

print("\n%d/%d" % (len(CASES) - len(wrong), len(CASES)), flush=True)
if wrong:
    print("failed:", flush=True)
    for w in wrong:
        print("   ", w[:70], flush=True)
