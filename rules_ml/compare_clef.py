"""Head-to-head: Jev vs Clef on the SAME rows under the SAME (final) rubric.

Uses decisions_v4.jsonl (Jev, final rubric). Re-labels the same rows with Clef
and measures agreement, so the comparison isolates the labeler, not the rubric.
"""
import json, sys
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
sys.path.insert(0, DIR)
import jev_lib2 as L
import run_batch

rows = []
for l in open(DIR + "/decisions_v4.jsonl", encoding="utf-8"):
    r = json.loads(l)
    if not r.get("error") and r.get("noul") is not None:
        rows.append(r)
print("rows with Jev labels under the final rubric: %d" % len(rows), flush=True)

with open(DIR + "/clef_same.jsonl", "w", encoding="utf-8") as f:
    for r in rows:
        f.write(json.dumps(r) + "\n")

key = L.load_api_key()


def clef_label(rec):
    v = L.build_questions(1)
    st = L.build_state("%s: %s" % (rec.get("sender") or "", rec["target"]),
                       rec.get("context") or [], _gc(rec))
    return L.parse_answers(L.systemone(st, v, key, model="clef"), 1)[0]


def _gc(r):
    return "Game type: %s. Ranked: %s. Competitive: %s. Phase: %s." % (
        r.get("game_type", "Mafia"), "yes" if r.get("ranked") else "no",
        "yes" if r.get("competitive") else "no", r.get("state", "?"))


from concurrent.futures import ThreadPoolExecutor, as_completed
out = []
with ThreadPoolExecutor(max_workers=6) as ex:
    futs = {ex.submit(clef_label, r): r for r in rows}
    for n, fu in enumerate(as_completed(futs), 1):
        r = futs[fu]
        try:
            a = fu.result()
            rec = dict(r); rec["clef_noul"] = a["noul"]; rec["clef_choice"] = a["choice"]
            out.append(rec)
        except Exception as e:
            print("  err:", str(e)[:120], flush=True)
        if n % 100 == 0:
            print("  %d/%d" % (n, len(rows)), flush=True)

json.dump(out, open(DIR + "/clef_same.json", "w"), indent=1)

lab = lambda r, k: 1 if (r[k + "noul"] >= 0.5 and r.get(k + "choice") != "no_violation") else 0
n = len(out)
same_bin = sum(1 for r in out if lab(r, "") == lab(r, "clef_"))
same_cat = sum(1 for r in out if r.get("choice") == r.get("clef_choice"))
d = [abs(r["noul"] - r["clef_noul"]) for r in out]
print("\n=== Jev vs Clef, %d rows, same rubric ===" % n, flush=True)
print("  agree on violation/non-violation: %d/%d = %.1f%%" % (same_bin, n, 100 * same_bin / n), flush=True)
print("  agree on category:                %d/%d = %.1f%%" % (same_cat, n, 100 * same_cat / n), flush=True)
print("  mean |delta noul|: %.3f" % (sum(d) / max(len(d), 1)), flush=True)
print("  Jev positives=%d  Clef positives=%d" % (sum(lab(r, "") for r in out), sum(lab(r, "clef_") for r in out)), flush=True)
print("\n  disagreements:", flush=True)
for r in out:
    if lab(r, "") != lab(r, "clef_"):
        print("    jev=%.2f/%-22s clef=%.2f/%-22s | %r" % (
            r["noul"], str(r.get("choice"))[:22], r["clef_noul"],
            str(r.get("clef_choice"))[:22], r["target"][:44]), flush=True)
