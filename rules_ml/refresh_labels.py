"""Refresh eval_set's clef labels under the CURRENT rubric, keeping the stale ones for audit.

The 277 clean rows come free from the A run just completed. The first 122 need a fresh pass
(~31 requests). Then recompute every number that was contaminated by the stale labels.

Why this matters: any analysis that joins eval_set's clef field to the human judgements is
comparing a pre-targeting-fix judge to a post-fix one, which is exactly the trap that made
me report a 4.7-point distillation gap that is really 0.7.
"""
import json, sys, time, threading, shutil
from concurrent.futures import ThreadPoolExecutor, as_completed

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
SC = "/mnt/c/Users/tt/AppData/Local/hermes/cache/scratch"
sys.path.insert(0, DIR)
import jev_lib2 as L

BATCH, WORKERS, ATTEMPTS, MODEL, FITTED = 4, 6, 6, "clef", 122

corp = {}
for l in open(DIR + "/decisions_final_clef.jsonl", encoding="utf-8"):
    r = json.loads(l)
    corp[(str(r.get("game_id")), r.get("target"))] = r

SET = [json.loads(l) for l in open(DIR + "/eval_set.jsonl", encoding="utf-8") if l.strip()]
DONE = {d["i"]: d for d in json.load(open(DIR + "/eval_done.json"))}
key = L.load_api_key()


def gc_for(r):
    c = corp.get((str(r["game_id"]), r["message"])) or {}
    return "Game type: %s. Ranked: %s. Competitive: %s. Phase: %s." % (
        c.get("game_type", "Mafia"), "yes" if c.get("ranked") else "no",
        "yes" if c.get("competitive") else "no", c.get("state", "?"))


# ---- the 277 already done in the A run ----
A = {p["i"]: p for p in json.load(open(SC + "/ctx_withcontext.json"))}
print("from the A run (clean rows): %d" % len(A), flush=True)

# ---- the first 122 need a fresh pass ----
todo = [(i, SET[i], DONE[i]) for i in sorted(DONE) if i < FITTED]
print("re-judging the first %d rows (~%d requests)" % (len(todo), (len(todo) + BATCH - 1) // BATCH), flush=True)

qs = L.build_questions(BATCH)
out, lock = [], threading.Lock()
groups = [todo[k:k + BATCH] for k in range(0, len(todo), BATCH)]
ok = [0]; err = [0]


def work(g):
    items = [{"target_line": "%s: %s" % (r["sender"], r["message"]),
              "context_lines": r.get("context") or [], "game_context": gc_for(r)}
             for _i, r, _d in g]
    for attempt in range(ATTEMPTS):
        try:
            resp = L.systemone(L.build_batch_state(items), qs, key, model=MODEL, timeout=180)
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
                    print("  ERR: %s" % str(e)[:80], flush=True)
            else:
                time.sleep(2.0 * (attempt + 1))


t0 = time.time()
with ThreadPoolExecutor(max_workers=WORKERS) as ex:
    futs = [ex.submit(work, g) for g in groups]
    n = 0
    for f in as_completed(futs):
        f.result(); n += 1
        if n % 10 == 0:
            print("  %d/%d (%.0fs)" % (n, len(groups), time.time() - t0), flush=True)
print("  %d ok, %d failed in %.0fs" % (ok[0], err[0], time.time() - t0), flush=True)

fresh = {p["i"]: p for p in out}
fresh.update(A)

# ---- backup the stale labels, then rewrite ----
shutil.copy(DIR + "/eval_set.jsonl", DIR + "/eval_set.pre_refresh.jsonl")
backup = [{"i": i, "clef": r.get("clef"), "clef_p": r.get("clef_p")} for i, r in enumerate(SET)]
json.dump(backup, open(DIR + "/eval_set.clef_stale.json", "w"), ensure_ascii=False)

n_upd = n_chg = 0
for i, r in enumerate(SET):
    if i in fresh:
        old = (r.get("clef"), r.get("clef_p"))
        r["clef_prev"] = r.get("clef")
        r["clef_p_prev"] = r.get("clef_p")
        r["clef"] = fresh[i].get("choice")
        r["clef_p"] = fresh[i].get("noul")
        r["clef_rubric"] = "post-targeting-fix"
        n_upd += 1
        if (r["clef"], r["clef_p"]) != old:
            n_chg += 1
with open(DIR + "/eval_set.jsonl", "w", encoding="utf-8") as f:
    for r in SET:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
print("updated %d rows; %d changed verdict/score" % (n_upd, n_chg), flush=True)
json.dump(out, open(SC + "/refresh_122.json", "w"), ensure_ascii=False)


# ---- recompute everything the stale labels contaminated ----
def cv(r):
    return 1 if (r.get("clef") != "no_violation" and r.get("clef_p") is not None
                 and float(r["clef_p"]) >= 0.5) else 0


def cv_stale(r):
    return 1 if (r.get("clef_prev") not in (None, "no_violation") and r.get("clef_p_prev") is not None
                 and float(r["clef_p_prev"]) >= 0.5) else 0


clean = [i for i in sorted(DONE) if i >= FITTED]
y = {i: (1 if DONE[i]["human"] == "flag" else 0) for i in clean}
tc = [cv(SET[i]) for i in clean]
ts = [cv_stale(SET[i]) for i in clean]
yy = [y[i] for i in clean]


def m(P, Y, name):
    tp = sum(1 for a, b in zip(P, Y) if a and b); fp = sum(1 for a, b in zip(P, Y) if a and not b)
    fn = sum(1 for a, b in zip(P, Y) if not a and b)
    pr = tp / (tp + fp) if tp + fp else 0
    rc = tp / (tp + fn) if tp + fn else 0
    print("  %-40s agree %5.1f%%   P %.3f  R %.3f" % (name, 100 * sum(1 for a, b in zip(P, Y) if a == b) / len(Y), pr, rc))


print("\n=== teacher vs human, CLEAN rows (n=%d), fresh vs stale labels ===" % len(clean), flush=True)
m(ts, yy, "teacher, STALE labels (pre-targeting-fix)")
m(tc, yy, "teacher, FRESH labels (current rubric)")
print("  labels changed verdict on %d/%d rows" % (sum(1 for a, b in zip(tc, ts) if a != b), len(clean)))
