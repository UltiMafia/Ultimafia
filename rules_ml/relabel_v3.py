"""Relabel the corpus rows the second rubric revision can affect.

The revision changed: 'suing' IS leave-language, 'sue me' is NOT, 'bomb' is a role, and
ambiguous constructions flag. Only rows containing those terms can move, so this touches
59 rows instead of 2,300 -- and 42 of them are 'sue me' messages currently mislabelled OGI.
"""
import json, re, sys, time, threading, shutil
from concurrent.futures import ThreadPoolExecutor, as_completed

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
sys.path.insert(0, DIR)
import jev_lib2 as L

BATCH, WORKERS, ATTEMPTS, MODEL = 4, 6, 6, "clef"
PATS = re.compile(r"\bsue\b|\bsuing\b|\bbomb\b|\brock\b", re.I)
READ = re.compile(r"\b(read|reads|reading)\b", re.I)
SRC = DIR + "/decisions_final_clef.jsonl"

rows = [json.loads(l) for l in open(SRC, encoding="utf-8")]


def _lab(r):
    return bool(r.get("noul") is not None and float(r["noul"]) >= 0.5
                and r.get("choice") != "no_violation")


# reading rows only matter where the label could FLIP, i.e. where it is a P&A violation today
idx = [i for i, r in enumerate(rows)
       if PATS.search(r.get("target") or "")
       or (READ.search(r.get("target") or "") and _lab(r)
           and r.get("choice") == "personal_attacks_harassment")]
print("affected rows: %d  (~%d requests)" % (len(idx), (len(idx) + BATCH - 1) // BATCH), flush=True)


def lab(r):
    return bool(r.get("noul") is not None and float(r["noul"]) >= 0.5
                and r.get("choice") != "no_violation")


def gc_of(rec):
    return "Game type: %s. Ranked: %s. Competitive: %s. Phase: %s." % (
        rec.get("game_type", "Mafia"), "yes" if rec.get("ranked") else "no",
        "yes" if rec.get("competitive") else "no", rec.get("state", "?"))


key = L.load_api_key()
qs = L.build_questions(BATCH)
groups = [idx[k:k + BATCH] for k in range(0, len(idx), BATCH)]
out, lock = [], threading.Lock()
ok = [0]; err = [0]


def work(g):
    items = [{"target_line": "%s: %s" % (rows[i].get("sender"), rows[i]["target"]),
              "context_lines": rows[i].get("context") or [],
              "game_context": gc_of(rows[i])} for i in g]
    for attempt in range(ATTEMPTS):
        try:
            resp = L.systemone(L.build_batch_state(items), qs, key, model=MODEL, timeout=180)
            ans = L.parse_answers(resp, BATCH)
            with lock:
                for i, a in zip(g, ans):
                    out.append({"i": i, "noul": a.get("noul"), "choice": a.get("choice")})
                ok[0] += 1
            return
        except Exception as e:
            if attempt == ATTEMPTS - 1:
                with lock:
                    err[0] += 1
                    print("  ERR: %s" % str(e)[:80], flush=True)
            else:
                time.sleep(2.0 * (attempt + 1))


t0 = time.time()
with ThreadPoolExecutor(max_workers=WORKERS) as ex:
    futs = [ex.submit(work, g) for g in groups]
    n = 0
    for f in as_completed(futs):
        f.result(); n += 1
        if n % 5 == 0:
            print("  %d/%d (%.0fs)" % (n, len(groups), time.time() - t0), flush=True)
print("  %d ok, %d failed in %.0fs" % (ok[0], err[0], time.time() - t0), flush=True)

fresh = {p["i"]: p for p in out}
shutil.copy(SRC, SRC + ".pre_v3")
flips = []
for i, p in fresh.items():
    r = rows[i]
    was = lab(r)
    r["noul_prev"] = r.get("noul"); r["choice_prev"] = r.get("choice")
    r["noul"] = p["noul"]; r["choice"] = p["choice"]
    r["relabel"] = "v3"
    if was != lab(r):
        flips.append((i, was, lab(r), r["target"][:56]))
with open(SRC, "w", encoding="utf-8") as f:
    for r in rows:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")

n_v = sum(1 for r in rows if lab(r))
print("\nrelabelled %d rows" % len(fresh))
print("verdicts flipped: %d   (corpus violations now %d / %d)" % (len(flips), n_v, len(rows)))
print("\nflips:")
for i, was, now, t in flips[:24]:
    print("   %s -> %s  %s" % ("VIO" if was else "ok ", "VIO" if now else "ok ", t))
