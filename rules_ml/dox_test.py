import sys
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import jev_lib2 as L

CASES = [
    "XYZ lives in LA",
    "bob lives in ohio",
    "@bob i know where you live",
    "bobs real name is michael",
    "bob is 14",
    "i know bob's address lol",
    "bob you live in texas right",
]
key = L.load_api_key()
qs = L.build_questions(1)
for t in CASES:
    st = L.build_state("player: " + t, [], "Game type: Mafia. Ranked: yes. Competitive: yes. Phase: day.")
    a = L.parse_answers(L.systemone(st, qs, key), 1)[0]
    print("%-36s p=%.2f  %s" % (t, a["noul"], a["choice"]), flush=True)
