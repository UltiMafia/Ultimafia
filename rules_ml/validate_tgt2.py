"""Does the sharpened targeting rule fix the owner's false positives without losing the true ones?"""
import sys
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
sys.path.insert(0, DIR)
import jev_lib2 as L

KEY = L.load_api_key()
BATCH = 4
GC = "Game type: Mafia. Ranked: yes. Competitive: yes. Phase: Day 1."

CASES = [
    # ---- owner's FALSE POSITIVES: should all be no_violation ----
    ("u got a fucking cc", 0),
    ("they installed the new shit", 0),
    ("never ask for ot line don't be a noob", 0),
    ("hooker read me as blacksmith so they're not noob", 0),
    ("He's not gay lol", 0),
    ("i have done many stupid things today", 0),
    ("@raya we are not stupid enough to BOTH fake townslip", 0),
    ("gamethrower why you driving a bus over me lmao", 0),
    ("i want to get home and play this but the fucking train isnt moving in this tunnel for 10 minutes and I have a 7% battey", 0),
    ("that vote is fucking terrible bruh", 0),
    ("that's dumb", 0),
    ("shut up", 0),
    ("im in LA now", 0),
    ("KevinDeng are u gay or a gamer", 0),
    ("poops is ccing GameThrower11", 0),
    ("Z dumbtell", 0),
    ("i didn't call you an idiot", 0),
    ("ur reads are so trash", 0),
    # ---- owner's TRUE POSITIVES: must stay violations ----
    ("you are fucking terrible", 1),
    ("you're fucking stupid", 1),
    ("FUCK U", 1),
    ("you are a moron", 1),
    ("can XYZ shut the fuck up?", 1),
    ("you're gting", 1),
    ("stop gamethrowing", 1),
    ("I might report you.....", 1),
    ("bob lives in ohio", 1),
    ("im suing", 1),
    ("someone flip to me real quick so i can gt", 1),
    # ---- regression guards ----
    ("what's your report?", 0),
    ("Clark is also Z's alt", 0),
    ("XYZ lives in LA", 1),
    ("bobs real name is michael", 1),
    ("you're great at the game", 0),
    ("great game", 0),
]

qs = L.build_questions(BATCH)
out = {}
for s in range(0, len(CASES), BATCH):
    chunk = list(range(s, min(s + BATCH, len(CASES))))
    items = [{"target_line": CASES[i][0], "context_lines": [], "game_context": GC} for i in chunk]
    try:
        st = L.build_batch_state(items)
        resp = L.systemone(st, qs, KEY, model="clef")
        for i, ans in zip(chunk, L.parse_answers(resp, len(chunk))):
            out[i] = ans
    except Exception as e:
        print("  batch error: %s" % str(e)[:120], flush=True)

wrong = []
for i, (t, e) in enumerate(CASES):
    ans = out.get(i)
    if ans is None:
        print("  MISSING  %-56s" % t[:56], flush=True)
        wrong.append(t)
        continue
    noul = float(ans.get("noul") or 0)
    ch = ans.get("choice")
    got = 1 if (noul >= 0.5 and ch != "no_violation") else 0
    ok = got == e
    if not ok:
        wrong.append(t)
    print("  %-5s exp=%-4s got=%-4s noul=%.2f %-24s | %s" % (
        "ok" if ok else "WRONG", "VIO" if e else "ok", "VIO" if got else "ok",
        noul, str(ch)[:24], t[:54]), flush=True)

print("\n%d/%d" % (len(CASES) - len(wrong), len(CASES)), flush=True)
for w in wrong:
    print("   FAILED: %s" % w[:74], flush=True)
