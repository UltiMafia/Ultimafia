"""Validate the rewritten rubric against the site owner's explicit calls."""
import sys
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import jev_lib2 as L

CASES = [
    ("That's dumb", 0, "owner: insulting a play is allowed"),
    ("that was so dumb", 0, "owner: insulting a play is allowed"),
    ("ur reads are so trash", 0, "owner: about the play, not the person"),
    ("SHUT UP", 0, "owner: untargeted, asking town to quiet down"),
    ("shut up", 0, "owner: untargeted"),
    ("you're fucking stupid", 1, "owner: direct personal insult"),
    ("you are a moron", 1, "owner: direct personal insult"),
    ("can XYZ shut the fuck up?", 1, "owner: targeted"),
    ("im in LA now", 0, "owner: own location is fine"),
    ("XYZ lives in LA", 1, "owner: saying where someone ELSE lives is a vio"),
    ("screenshotted & sent to Golbolco", 1, "owner: reads like a joke but would flag"),
    ("what's your report?", 0, "owner: 'report' = cop's night result"),
    ("per report", 0, "owner: 'report' = night result"),
    ("report them", 0, "owner: game jargon, not a threat"),
    ("Clark is also Z's alt", 0, "owner: alt accusations are jest"),
    ("i am bp i confirm alt", 0, "owner: alt talk"),
    ("im suing", 1, "keep: abandoning for in-game reasons"),
    ("you're gamethrowing", 1, "keep: OGI accusation"),
    ("u gt btw", 1, "keep: OGI accusation"),
    ("Z dumbtell", 0, "keep: glossary"),
    ("you're great at the game", 0, "keep: compliment"),
    ("i can report you and u can get reported for ogi", 1, "keep: REAL report threat"),
    ("Hc blue, no gun no carol no knife no rifle", 0, "keep: jargon"),
    ("vote Bob he is mafia", 0, "keep: ordinary game talk"),
    ("gay", 0, "intolerance is kept but bare word is ambiguous"),
]

key = L.load_api_key()
qs = L.build_questions(1)
ok = 0
for text, want, note in CASES:
    st = L.build_state("player: " + text, [], "Game type: Mafia. Ranked: yes. Competitive: yes. Phase: day.")
    r = L.systemone(st, qs, key)
    a = L.parse_answers(r, 1)[0]
    got = 1 if a["noul"] >= 0.5 else 0
    good = got == want
    ok += good
    print("%-46s exp=%-4s p=%.2f %-26s %s" % (text[:46], "FLAG" if want else "ok",
          a["noul"], str(a["choice"])[:26], "OK" if good else "<-- WRONG  (%s)" % note), flush=True)
print("\nRUBRIC %d/%d" % (ok, len(CASES)), flush=True)
