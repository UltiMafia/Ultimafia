"""How many rows actually need re-labelling under the sharpened rubric?

The change only REMOVES violations, so only rows currently labelled a violation can
change. Further, only ones containing profanity/insult vocabulary or a game-term the
old rubric mishandled are at risk. Everything else provably keeps its label.
"""
import json, re

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
rows = [json.loads(l) for l in open(DIR + "/decisions_final_clef.jsonl", encoding="utf-8")]
print("total rows: %d" % len(rows), flush=True)


def is_vio(r):
    return r.get("choice") not in ("no_violation", None) and float(r.get("noul") or 0) >= 0.5


VOCAB = re.compile(r"(?i)\b(fuck|fucking|fucked|shit|shitty|shite|crap|ass|arse|damn|"
                   r"bitch|bastard|dick|cunt|piss|screw|suck|stfu|"
                   r"stupid|dumb|idiot|idiotic|moron|moronic|imbecile|noob|trash|garbage|"
                   r"loser|pathetic|useless|terrible|horrible|awful|lame|sucks|"
                   r"gay|fag|retard|autistic|"
                   r"gamethrow\w*|gting|\bgt\b|throwing|throw|suing|suicid\w*|cc\b|dumbtell)\b")

vio = [r for r in rows if is_vio(r)]
print("rows labelled a violation: %d" % len(vio), flush=True)

affected = [r for r in vio if VOCAB.search(r.get("target") or "")]
print("  ...of which contain profanity/insult/game vocab: %d" % len(affected), flush=True)
print("  (only these can change; the other %d keep their label)" % (len(vio) - len(affected)), flush=True)

from collections import Counter
print("\n  by current category:", dict(Counter(r.get("choice") for r in affected)), flush=True)

# the owner's own judgements, which are stronger than the judge's
try:
    DONE = json.load(open(DIR + "/eval_done.json"))
    ok_ids = set()
    for d in DONE:
        if d["human"] == "ok":
            ok_ids.add(d["message"])
    hit = [r for r in rows if (r.get("target") or "") in ok_ids and is_vio(r)]
    print("\nowner said 'ok' but still labelled a violation: %d rows" % len(hit), flush=True)
    for r in hit[:10]:
        print("    %-24s %s" % (str(r.get("choice"))[:24], r["target"][:60]), flush=True)
except Exception as e:
    print("eval_done not readable: %s" % e, flush=True)

with open(DIR + "/relabel_subset.jsonl", "w", encoding="utf-8") as f:
    seen = set()
    n = 0
    for r in affected:
        k = r.get("target")
        if k in seen:
            continue
        seen.add(k)
        f.write(json.dumps(r) + "\n")
        n += 1
print("\nwrote relabel_subset.jsonl: %d unique rows to re-label" % n, flush=True)
