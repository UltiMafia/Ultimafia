"""Clean comparison: your judgement vs Clef's label, vs the model's call, over ALL judged rows."""
import json
from collections import Counter

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
SET = [json.loads(l) for l in open(DIR + "/eval_set.jsonl", encoding="utf-8")]
DONE = json.load(open(DIR + "/eval_done.json"))
by_i = {i: r for i, r in enumerate(SET)}

rows = [(by_i[d["i"]], d) for d in DONE if d["i"] in by_i]
print("judged rows: %d" % len(rows), flush=True)

def clef_v(r):
    return 1 if r.get("clef") not in ("no_violation", None) else 0

n = len(rows)
h_ok = [x for x in rows if x[1]["human"] == "ok"]
h_flag = [x for x in rows if x[1]["human"] == "flag"]
m_flag = [x for x in rows if x[1]["model"] == "flag"]

print("\n=== over ALL judged rows (no subsetting) ===", flush=True)
print("  you said ok:   %d   flag: %d" % (len(h_ok), len(h_flag)), flush=True)
print("  model flagged: %d  (%.0f%% of rows)" % (len(m_flag), 100 * len(m_flag) / n), flush=True)
print("\n  of the rows YOU called ok, Clef said violation: %d/%d = %.0f%%" % (
    sum(1 for r, d in h_ok if clef_v(r)), len(h_ok),
    100 * sum(1 for r, d in h_ok if clef_v(r)) / max(len(h_ok), 1)), flush=True)
print("  of the rows YOU flagged,  Clef said violation: %d/%d = %.0f%%" % (
    sum(1 for r, d in h_flag if clef_v(r)), len(h_flag),
    100 * sum(1 for r, d in h_flag if clef_v(r)) / max(len(h_flag), 1)), flush=True)
print("  of the rows YOU flagged,  the MODEL flagged:   %d/%d = %.0f%%" % (
    sum(1 for r, d in h_flag if d["model"] == "flag"), len(h_flag),
    100 * sum(1 for r, d in h_flag if d["model"] == "flag") / max(len(h_flag), 1)), flush=True)

agree_clef = sum(1 for r, d in rows if (d["human"] == "flag") == (clef_v(r) == 1))
agree_model = sum(1 for r, d in rows if d["human"] == d["model"])
print("\n  overall agreement  you vs CLEF : %d/%d = %.0f%%" % (agree_clef, n, 100 * agree_clef / n), flush=True)
print("  overall agreement  you vs MODEL: %d/%d = %.0f%%" % (agree_model, n, 100 * agree_model / n), flush=True)

print("\n=== the two error sources on your 'ok' rows (the false positives) ===", flush=True)
fp = [(r, d) for r, d in rows if d["human"] == "ok" and d["model"] == "flag"]
print("  %d rows you called ok that the model flagged" % len(fp), flush=True)
lab = sum(1 for r, d in fp if clef_v(r))
print("    %d of them Clef ALSO called a violation  (teacher error)" % lab, flush=True)
print("    %d of them Clef called no_violation       (student error)" % (len(fp) - lab), flush=True)
print("\n  most common words among them:", flush=True)
w = Counter()
for r, d in fp:
    for t in r["message"].lower().replace("?", " ").replace(",", " ").split():
        if len(t) > 2:
            w[t] += 1
print("   ", dict(w.most_common(14)), flush=True)

print("\n=== over-flagging rate by phrase type (all judged rows) ===", flush=True)
for name, terms in (("insult words (noob/stupid/idiot/dumb)", ("noob", "stupid", "idiot", "dumb")),
                    ("identity words (gay/)", ("gay",)),
                    ("profanity (fuck/shit)", ("fuck", "fucking", "shit")),
                    ("game terms (vote/read/lynch)", ("vote", "read", "lynch", "town"))):
    sel = [(r, d) for r, d in rows if any(t in r["message"].lower() for t in terms)]
    if not sel:
        continue
    mf = sum(1 for r, d in sel if d["model"] == "flag")
    hf = sum(1 for r, d in sel if d["human"] == "flag")
    print("  %-38s n=%-3d model flags %-3d  you flag %d" % (name, len(sel), mf, hf), flush=True)
