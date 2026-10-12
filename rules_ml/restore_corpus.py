"""Restore the corrected corpus and append the new OGI labels, then record the correction
overlay so a re-merge can re-apply it instead of silently reverting it.

Why this exists: merge_and_train.py rebuilds decisions_final_clef.jsonl from the raw
per-batch files, discarding every correction applied afterwards (the targeting fix, the
GRA and intolerance merges, the v3 relabel). Re-running it reverted all of them, which is
how 'intolerance' and 'game_related_abandonment' reappeared as live categories.

The overlay is derived by diffing the raw merge against the corrected file, so it records
exactly what the corrections did.
"""
import json, os

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
CORRECTED = DIR + "/decisions_final_clef.pre_ogi2.jsonl"   # the good 9,207
NEW = DIR + "/ogi_v2_decisions.jsonl"                      # 1,534 OGI round-2 labels
RAW = DIR + "/decisions_final_clef.jsonl"                  # what the merge just wrote


def load(p):
    return [json.loads(l) for l in open(p, encoding="utf-8") if l.strip()]


def keymap(rows):
    return {(str(r.get("game_id")), (r.get("target") or "").strip()): r for r in rows}


def lab(r):
    return bool(r.get("noul") is not None and float(r["noul"]) >= 0.5
                and r.get("choice") != "no_violation")


corr = load(CORRECTED)
new = load(NEW)
raw = load(RAW)

# ---- the overlay: every row the merge got different from the corrected corpus ----
cm, rm = keymap(corr), keymap(raw)
overlay = []
for k, c in cm.items():
    r = rm.get(k)
    if r is None:
        overlay.append({"key": list(k), "choice": c.get("choice"), "noul": c.get("noul"),
                        "choice_prev": None, "note": "row absent from the raw merge"})
    elif (r.get("choice"), r.get("noul")) != (c.get("choice"), c.get("noul")):
        overlay.append({"key": list(k), "choice": c.get("choice"), "noul": c.get("noul"),
                        "choice_prev": r.get("choice"), "noul_prev": r.get("noul")})
with open(DIR + "/corpus_corrections.json", "w", encoding="utf-8") as f:
    json.dump(overlay, f, ensure_ascii=False)

flips = sum(1 for o in overlay if o.get("noul_prev") is not None)
print("correction overlay: %d rows recorded (%d were real label/score changes)" % (len(overlay), flips))

# ---- rebuild: corrected corpus + the new OGI rows that are genuinely new ----
have = set(cm)
add = [r for r in new if (str(r.get("game_id")), (r.get("target") or "").strip()) not in have]
out = corr + add
with open(DIR + "/decisions_final_clef.jsonl", "w", encoding="utf-8") as f:
    for r in out:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")

pos = sum(1 for r in out if lab(r))
byc = {}
for r in out:
    if lab(r):
        byc[r.get("choice")] = byc.get(r.get("choice"), 0) + 1
print("corpus rebuilt: %d rows (corrected %d + new %d), %d violations (%.1f%%)"
      % (len(out), len(corr), len(add), pos, 100.0 * pos / len(out)))
print("violations by category:", dict(sorted(byc.items(), key=lambda x: -x[1])))
