"""Refresh ALL 399 teacher labels under the corrected rubric (suing restored, sue-me removed,
bomb added, ambiguous-construction rule added), and apply the ninth label correction.

Done for every judged row rather than just the clean 277, because a partly-refreshed
eval_set is exactly the trap that produced the phantom 4.7-point distillation gap.
"""
import json, sys, time, threading, shutil
from concurrent.futures import ThreadPoolExecutor, as_completed

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
SC = "/mnt/c/Users/tt/AppData/Local/hermes/cache/scratch"
sys.path.insert(0, DIR)
import jev_lib2 as L

BATCH, WORKERS, ATTEMPTS, MODEL = 4, 6, 6, "clef"

# ---- ninth ruling: 'this guy shits' criticises what he DID, so it is not an insult ----
SET = [json.loads(l) for l in open(DIR + "/eval_set.jsonl", encoding="utf-8")]
DONE = json.load(open(DIR + "/eval_done.json"))
for d in DONE:
    if "tune out for one fucking minute" in SET[d["i"]]["message"].lower():
        if d["human"] != "ok":
            print("ruling: row %d -> ok (play-criticism, object is what he did)" % d["i"])
            d["human"] = "ok"
        d["corrected"] = "developer: discusses what he did, not an insult at him"
json.dump(DONE, open(DIR + "/eval_done.json", "w"), ensure_ascii=False)

corp = {}
for l in open(DIR + "/decisions_final_clef.jsonl", encoding="utf-8"):
    r = json.loads(l)
    corp[(str(r.get("game_id")), r.get("target"))] = r
DJ = {d["i"]: d for d in DONE}
rows = [(i, SET[i], DJ[i]) for i in sorted(DJ)]
key = L.load_api_key()


def item_for(r):
    c = corp.get((str(r["game_id"]), r["message"])) or {}
    gc = "Game type: %s. Ranked: %s. Competitive: %s. Phase: %s." % (
        c.get("game_type", "Mafia"), "yes" if c.get("ranked") else "no",
        "yes" if c.get("competitive") else "no", c.get("state", "?"))
    return {"target_line": "%s: %s" % (r["sender"], r["message"]),
            "context_lines": r.get("context") or [], "game_context": gc}


qs = L.build_questions(BATCH)
out, lock = [], threading.Lock()
groups = [rows[k:k + BATCH] for k in range(0, len(rows), BATCH)]
ok = [0]; err = [0]
print("re-judging %d rows (~%d requests)" % (len(rows), len(groups)), flush=True)


def work(g):
    items = [item_for(r) for _i, r, _d in g]
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
        if n % 20 == 0:
            print("  %d/%d (%.0fs)" % (n, len(groups), time.time() - t0), flush=True)
print("  %d ok, %d failed in %.0fs" % (ok[0], err[0], time.time() - t0), flush=True)

fresh = {p["i"]: p for p in out}
shutil.copy(DIR + "/eval_set.jsonl", DIR + "/eval_set.pre_refresh2.jsonl")
chg = 0
for i, r in enumerate(SET):
    if i in fresh:
        old = (r.get("clef") != "no_violation" and float(r.get("clef_p") or 0) >= 0.5)
        r["clef_prev"] = r.get("clef")
        r["clef_p_prev"] = r.get("clef_p")
        r["clef"] = fresh[i].get("choice")
        r["clef_p"] = fresh[i].get("noul")
        r["clef_rubric"] = "post-second-revision"
        new = (r["clef"] != "no_violation" and float(r.get("clef_p") or 0) >= 0.5)
        chg += (old != new)
with open(DIR + "/eval_set.jsonl", "w", encoding="utf-8") as f:
    for r in SET:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
print("updated %d rows; %d verdicts changed vs the previous rubric" % (len(fresh), chg), flush=True)
json.dump(out, open(SC + "/refresh_all.json", "w"), ensure_ascii=False)
