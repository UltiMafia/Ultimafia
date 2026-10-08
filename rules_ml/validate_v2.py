"""Validate the v2 prompt against the user's corrected examples plus controls,
and check that 4-messages-per-request batching matches per-message judging.
"""
import json, sys, time
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import jev_lib2 as L

# (name, target, context, game_context, expected)
CASES = [
    ("FB1 rules-talk/defensive", "hc blue, no gun no carol no knife no rifle no bread no crystal, if you guilt me i fos you, you can't report me for GT if i stop trying because of town being bad, tr me for auto",
     ["Cyrus: Tf", "Gauss: j = ClarkGiswold typist", "Altanis: %Cyrus", "hewwopwincess: clair can I shoot for illiu", "hewwopwincess: and u don't bw me after", "Clair: go for it"],
     "Game type: Mafia. Ranked: yes. Competitive: yes. Phase: Day 2.", "no_violation"),
    ("FB2 past-phase reference", "I double checked after you said smth last night",
     ["shayneismyname: keep trying", "Giga13: @Smith Do you have enough hearts", "BLUDIMIR: %Smith here to gt for me", "Smith: ya i do", "Giga13: kk", "Smith: i have 2 more remaining"],
     "Game type: Mafia. Ranked: yes. Competitive: yes. Phase: Pregame.", "no_violation"),
    ("FB3 respect from past games", "Kai is only forgiven since he's a pillar of UM",
     ["Dylan: Right but mine is genuine", "turtle: both of y'all overreacted too", "Kai: did you guys plan those reactions", "Dylan: I don't fear kill", "era: kai is a good player btw but the isp is just annoying", "Giga13: His only issue is concentration"],
     "Game type: Mafia. Ranked: yes. Competitive: no. Phase: Day 4.", "no_violation"),
    ("FB4 alt statement", "Z is my alt though -_-",
     ["iGONYi: but when he plays everyone else becomes a noob too", "iGONYi: that's why he is the main villain of UltiMafia", "DaPrinceOmar: :O", "DaPrinceOmar: so when people play with me its the opposite then", "DaPrinceOmar: makes sense", "iGONYi: Yes"],
     "Game type: Mafia. Ranked: yes. Competitive: yes. Phase: Pregame.", "no_violation"),
    ("FB5 strategy reference", "the strategy that z has downvoted on all his alts explains it",
     ["Clair: sheriff shouldnt shoot day 1", "Clair: its supposed to be \"cop out day 1, condemn, sheriff only shoot if vest is hit\"", "StaminaBeast: i am so gonna do that when i am sheriff", "sure: yes", "StaminaBeast: cop has to come out day 1?", "sure: yes"],
     "Game type: Mafia. Ranked: yes. Competitive: yes. Phase: Pregame.", "no_violation"),
    ("TP1 explicit report threat", "yes link a game so i can report u >:3",
     ["Z: :omegalul:", "Z: Poor ate", "Momo: who was bs last game", "raya: anyway Z is mafia", "Fusilli: you guys aren't talking about anything related to right now", "Z: %raya hc maf"],
     "Game type: Mafia. Ranked: yes. Competitive: yes. Phase: Day 1.", "outside_game_influence"),
    ("TP2 user says good", "Gamethrower Unvote and talk to me",
     ["rorii: cashmere has to be mafia", "Boony: FUCK", "Boony: NOT AGAIN", "iceinmyveins: oh alright", "Boony: I HAVE SO MUCH", "Galaga: yeah silencer hates boony or is boony"],
     "Game type: Mafia. Ranked: yes. Competitive: yes. Phase: Day 3.", "outside_game_influence"),
    ("C1 suing", "im suing", ["alice: vote bob", "bob: nvm"],
     "Game type: Mafia. Ranked: yes. Competitive: no. Phase: Day 1.", "game_related_abandonment"),
    ("C2 OGI report", "i can report you and u can get reported for ogi", ["alice: hi"],
     "Game type: Mafia. Ranked: yes. Competitive: no. Phase: Day 1.", "outside_game_influence"),
    ("C3 insult", "@Kennedyz you are a moron", ["DarkB: no", "DarkB: follow the list"],
     "Game type: Mafia. Ranked: yes. Competitive: no. Phase: Day 1.", "personal_attacks_harassment"),
    ("C4 benign", "vote Bob he is mafia", ["alice: who we voting", "bob: not me"],
     "Game type: Mafia. Ranked: yes. Competitive: no. Phase: Day 1.", "no_violation"),
    ("C5 throwing by vote", "you are throwing because you voted Bob", ["alice: i voted bob"],
     "Game type: Mafia. Ranked: yes. Competitive: yes. Phase: Day 1.", "outside_game_influence"),
    ("C6 benign banter", "gg wp", ["alice: gg"],
     "Game type: Mafia. Ranked: yes. Competitive: no. Phase: Postgame.", "no_violation"),
    ("C7 act on meta", "my meta on XYZ tells me they are mafia, vote them out", ["alice: who next", "bob: not me"],
     "Game type: Mafia. Ranked: yes. Competitive: yes. Phase: Day 2.", "no_violation"),
    ("C8 push on meta", "XYZ plays exactly like this as scum, im condemning them for it", ["alice: who we voting"],
     "Game type: Mafia. Ranked: yes. Competitive: yes. Phase: Day 2.", "no_violation"),
    ("C9 link past game", "here is the game where XYZ did this: ultimafia.com/game/abc123, that proves it", ["alice: prove it"],
     "Game type: Mafia. Ranked: yes. Competitive: yes. Phase: Day 2.", "outside_game_influence"),
]


def run_individual(key):
    out = []
    for name, tgt, ctx, gc, exp in CASES:
        st = L.build_state(tgt, ctx, gc)
        r = L.systemone(st, L.build_questions(1), key)
        a = L.parse_answers(r, 1)[0]
        out.append((name, exp, a["choice"], a["choice_conf"], a["noul"],
                    sorted((a["probs"] or {}).items(), key=lambda x: -x[1])[:3]))
    return out


def run_batched(key, batch=4):
    out = []
    for s in range(0, len(CASES), batch):
        chunk = CASES[s:s + batch]
        items = [{"target_line": t, "context_lines": c, "game_context": g} for _n, t, c, g, _e in chunk]
        st = L.build_batch_state(items)
        r = L.systemone(st, L.build_questions(len(chunk)), key)
        for j, ans in enumerate(L.parse_answers(r, len(chunk))):
            out.append((chunk[j][0], chunk[j][4], ans["choice"], ans["choice_conf"], ans["noul"], None))
    return out


def main():
    key = L.load_api_key()
    print("== INDIVIDUAL ==", flush=True)
    ind = run_individual(key)
    for name, exp, ch, conf, noul, top in ind:
        mark = "OK " if ch == exp else "MISS"
        print(" %s %-28s exp=%-26s got=%-26s conf=%.2f noul=%.2f" % (mark, name, exp, ch, conf or 0, noul or 0), flush=True)
    print("\n== BATCHED (4/req) ==", flush=True)
    bat = run_batched(key)
    agree = 0
    for (n1, e1, c1, _f1, _n1, _t1), (n2, e2, c2, _f2, _n2, _t2) in zip(ind, bat):
        same = (c1 == c2)
        agree += same
        print(" %s %-28s indiv=%-26s batch=%-26s" % ("==" if same else "!!", n1, c1, c2), flush=True)
    print("\nbatch agreement with individual: %d/%d" % (agree, len(ind)), flush=True)
    ok = sum(1 for n, e, c, _f, _nl, _t in ind if c == e)
    print("individual matches expectation: %d/%d" % (ok, len(ind)), flush=True)


if __name__ == "__main__":
    main()
