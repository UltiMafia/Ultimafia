"""Clean A/B (does context help?) plus a judge-variance test.

Both fresh runs use the CURRENT rubric, so context is the only variable in the A/B.
The variance repeat uses byte-identical items, so any difference is the judge itself.

  A  = all 277 clean rows, WITH context      (fresh, current rubric)
  B  = all 277 clean rows, NO context        (already run, reused from disk)
  Br = first 40 rows, NO context, run again  (identical input to B -> variance)
"""
import json, sys, time, threading
from concurrent.futures import ThreadPoolExecutor, as_completed

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
SC = "/mnt/c/Users/tt/AppData/Local/hermes/cache/scratch"
sys.path.insert(0, DIR)
import jev_lib2 as L

BATCH, WORKERS, ATTEMPTS, MODEL = 4, 6, 6, "clef"

corp = {}
for l in open(DIR + "/decisions_final_clef.jsonl", encoding="utf-8"):
    r = json.loads(l)
    corp[(str(r.get("game_id")), r.get("target"))] = r

SET = [json.loads(l) for l in open(DIR + "/eval_set.jsonl", encoding="utf-8") if l.strip()]
DONE = {d["i"]: d for d in json.load(open(DIR + "/eval_done.json"))}
rows = [(i, SET[i], DONE[i]) for i in sorted(DONE) if i >= 122]
key = L.load_api_key()


def item_for(r, with_context):
    c = corp.get((str(r["game_id"]), r["message"])) or {}
    gc = "Game type: %s. Ranked: %s. Competitive: %s. Phase: %s." % (
        c.get("game_type", "Mafia"), "yes" if c.get("ranked") else "no",
        "yes" if c.get("competitive") else "no", c.get("state", "?"))
    return {"target_line": "%s: %s" % (r["sender"], r["message"]),
            "context_lines": (r.get("context") or []) if with_context else [],
            "game_context": gc}


def run(subset, with_context, tag):
    qs = L.build_questions(BATCH)
    out, lock = [], threading.Lock()
    groups = [subset[k:k + BATCH] for k in range(0, len(subset), BATCH)]
    ok = [0]; err = [0]

    def work(g):
        items = [item_for(r, with_context) for _i, r, _d in g]
        for attempt in range(ATTEMPTS):
            try:
                st = L.build_batch_state(items)
                resp = L.systemone(st, qs, key, model=MODEL, timeout=180)
                ans = L.parse_answers(resp, BATCH)
                with lock:
                    for (i, r, d), a in zip(g, ans):
                        out.append({"i": i, "noul": a.get("noul"), "choice": a.get("choice")})
                    ok[0] += 1
                return
            except Exception as e:
                if attempt == ATTEMPTS - 1:
                    with lock:
                        err[0] += 1
                        print("  ERR %s: %s" % (tag, str(e)[:80]), flush=True)
                else:
                    time.sleep(2.0 * (attempt + 1))
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = [ex.submit(work, g) for g in groups]
        n = 0
        for f in as_completed(futs):
            f.result(); n += 1
            if n % 20 == 0:
                print("  %s %d/%d (%.0fs)" % (tag, n, len(groups), time.time() - t0), flush=True)
    print("  %s: %d ok, %d failed in %.0fs" % (tag, ok[0], err[0], time.time() - t0), flush=True)
    return out, {p["i"]: p for p in out}


def vio(p):
    return bool(p and p.get("noul") is not None and float(p["noul"]) >= 0.5
                and p.get("choice") != "no_violation")


def stats(pred, name, subset):
    yy = [1 if DONE[i]["human"] == "flag" else 0 for i, _r, _d in subset]
    P = [vio(pred.get(i)) for i, _r, _d in subset]
    ag = sum(1 for a, b in zip(P, yy) if a == b) / len(P)
    tp = sum(1 for a, b in zip(P, yy) if a and b); fp = sum(1 for a, b in zip(P, yy) if a and not b)
    fn = sum(1 for a, b in zip(P, yy) if not a and b)
    pr = tp / (tp + fp) if tp + fp else 0
    rc = tp / (tp + fn) if tp + fn else 0
    print("  %-34s n=%-3d agree %5.1f%%   P %.3f  R %.3f  (flagged %d)" % (name, len(P), 100 * ag, pr, rc, sum(P)))
    return P


print("\n=== CLEAN A/B: 277 rows, current rubric, context the only variable ===", flush=True)
A, Am = run(rows, True, "A-with-ctx")
json.dump(A, open(SC + "/ctx_withcontext.json", "w"), ensure_ascii=False)
B = json.load(open(SC + "/ctx_nocontext.json"))
Bm = {p["i"]: p for p in B}
pa = stats(Am, "A: WITH context (fresh)", rows)
pb = stats(Bm, "B: NO context", rows)
flip = sum(1 for i, _r, _d in rows if vio(Am.get(i)) != vio(Bm.get(i)))
print("  context changes the verdict on %d/%d rows (%.0f%%)" % (flip, len(rows), 100 * flip / len(rows)))

print("\n=== JUDGE VARIANCE: identical items run twice ===", flush=True)
sub = rows[:40]
_br, Brm = run(sub, False, "Br-repeat")
pf = stats(Brm, "Br: NO context, repeat (40)", sub)
stats(Bm, "B:  NO context, original (40)", sub)
same = sum(1 for i, _r, _d in sub if vio(Brm.get(i)) == vio(Bm.get(i)))
print("  IDENTICAL input, two runs: verdict matches on %d/%d rows (%.0f%%)" % (same, len(sub), 100 * same / len(sub)))
json.dump(_br, open(SC + "/ctx_nocontext_repeat.json", "w"), ensure_ascii=False)
