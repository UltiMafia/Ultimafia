"""Validate the glossary-updated prompt on jargon and control cases."""
import sys, time
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import jev_lib2 as L


def call(st, qs, key, tries=6):
    last = None
    for i in range(tries):
        try:
            return L.systemone(st, qs, key)
        except Exception as e:
            last = e
            time.sleep(min(3 * (i + 1), 20))
    raise last

GC = "Game type: Mafia. Ranked: yes. Competitive: yes. Phase: Day 1."
CASES = [
    ("Z dumbtell", "no_violation"),
    ("that awkward pause feels like a dumbtell", "no_violation"),
    ("hc blue, no gun no carol no knife no rifle", "no_violation"),
    ("fos on bob for that vote", "no_violation"),
    ("anyone hc cop yet", "no_violation"),
    ("gt is possible here but not locked", "no_violation"),
    ("meta says she pushes early as town", "no_violation"),
    ("could be wifom to leave that slot alive", "no_violation"),
    ("that vote looks omgus after the push", "no_violation"),
    ("that ate the jailor kill", "no_violation"),
    ("you're great at the game", "no_violation"),
    ("he might be doing the dumbtell bit again", "no_violation"),
    # should still be caught
    ("im suing", "game_related_abandonment"),
    ("you are a moron", "personal_attacks_harassment"),
    ("i can report you and u can get reported for ogi", "outside_game_influence"),
    ("u gt btw", "outside_game_influence"),
    ("yes link a game so i can report u >:3", "outside_game_influence"),
]

key = L.load_api_key()
qs = L.build_questions(1)
ok = 0
for text, want in CASES:
    st = L.build_state(text, [], GC)
    a = L.parse_answers(call(st, qs, key), 1)[0]
    flagged = a["noul"] >= 0.5
    good = (want == "no_violation") != flagged
    ok += good
    print("  %s %-46s noul=%.2f cat=%-26s want=%s"
          % ("OK " if good else "MISS", text[:46], a["noul"], a["choice"], want))
print("\n%d/%d correct" % (ok, len(CASES)))
