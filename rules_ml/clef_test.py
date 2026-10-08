"""Does Clef work through the same /v1/systemone interface, and does it agree with Jev?"""
import sys
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import jev_lib2 as L

CASES = [
    ("That's dumb", 0), ("shut up", 0), ("you're fucking stupid", 1),
    ("you are a moron", 1), ("can XYZ shut the fuck up?", 1),
    ("im in LA now", 0), ("you're gamethrowing", 1), ("im suing", 1),
    ("u gt btw", 1), ("Z dumbtell", 0), ("you're great at the game", 0),
    ("what's your report?", 0), ("i can report you and u can get reported for ogi", 1),
    ("Clark is also Z's alt", 0), ("bob lives in ohio", 1),
    ("screenshotted & sent to Golbolco", 1), ("vote Bob he is mafia", 0),
]
key = L.load_api_key()
qs = L.build_questions(1)
state = None

for model in ("clef", "clef-flash"):
    print("\n=== %s ===" % model, flush=True)
    ok = n = 0
    try:
        for text, want in CASES:
            st = L.build_state("player: " + text, [],
                               "Game type: Mafia. Ranked: yes. Competitive: yes. Phase: day.")
            r = L.systemone(st, qs, key, model=model)
            a = L.parse_answers(r, 1)[0]
            got = 1 if a["noul"] >= 0.5 else 0
            n += 1
            ok += (got == want)
            print("  %-46s exp=%-4s p=%.2f %-24s %s" % (
                text[:46], "FLAG" if want else "ok", a["noul"], str(a["choice"])[:24],
                "" if got == want else "<-- WRONG"), flush=True)
        print("  %s: %d/%d" % (model, ok, n), flush=True)
    except Exception as e:
        print("  FAILED: %s" % str(e)[:300], flush=True)
