"""Label the OGI candidates mined by mine_ogi2.py.

Resumable: appends to the output as it goes, so a failure costs only the in-flight batch.
Same rubric and same item shape as every previous corpus round.
"""
import json, os, sys, time, threading
from concurrent.futures import ThreadPoolExecutor, as_completed

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
SRC = DIR + "/ogi_v2.jsonl"
OUT = DIR + "/ogi_v2_decisions.jsonl"
BATCH, WORKERS, ATTEMPTS, MODEL = 4, 6, 6, "clef"
sys.path.insert(0, DIR)
import jev_lib2 as L

rows = [json.loads(l) for l in open(SRC, encoding="utf-8")]
done = set()
if os.path.exists(OUT):
    for l in open(OUT, encoding="utf-8"):
        try:
            r = json.loads(l)
            if r.get("noul") is not None:
                done.add(r["idx"])
        except Exception:
            pass
todo = [r for r in rows if r["idx"] not in done]
groups = [todo[k:k + BATCH] for k in range(0, len(todo), BATCH)]
print("rows=%d already=%d todo=%d batches=%d" % (len(rows), len(done), len(todo), len(groups)), flush=True)

key = L.load_api_key()
qs = L.build_questions(BATCH)
lock = threading.Lock()
fout = open(OUT, "a", encoding="utf-8", buffering=1)
ok = [0]; err = [0]


def work(g):
    items = [{"target_line": "%s: %s" % (r.get("sender") or "", r["target"]),
              "context_lines": r.get("context") or [],
              "game_context": "Game type: %s. Ranked: %s. Competitive: %s. Phase: %s." % (
                  r.get("game_type") or "Mafia", "yes" if r.get("ranked") else "no",
                  "yes" if r.get("competitive") else "no", r.get("state") or "?")} for r in g]
    for attempt in range(ATTEMPTS):
        try:
            resp = L.systemone(L.build_batch_state(items), qs, key, model=MODEL, timeout=180)
            ans = L.parse_answers(resp, BATCH)
            with lock:
                for r, a in zip(g, ans):
                    r2 = dict(r)
                    r2["noul"] = a.get("noul")
                    r2["choice"] = a.get("choice")
                    r2["choice_conf"] = a.get("choice_conf")
                    r2["probs"] = a.get("probs")
                    r2["severity"] = a.get("severity")
                    r2["model"] = MODEL
                    fout.write(json.dumps(r2, ensure_ascii=False) + "\n")
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
        if n % 25 == 0:
            print("  %d/%d (%.0fs)" % (n, len(groups), time.time() - t0), flush=True)
print("  %d ok, %d failed in %.0fs" % (ok[0], err[0], time.time() - t0), flush=True)
fout.close()

# ---- yield ----
import collections
c = collections.Counter()
ogip = 0
for l in open(OUT, encoding="utf-8"):
    r = json.loads(l)
    vio = r.get("noul") is not None and float(r["noul"]) >= 0.5 and r.get("choice") != "no_violation"
    c[(r.get("_form"), bool(vio))] += 1
    if vio and r.get("choice") == "outside_game_influence":
        ogip += 1
print("\n=== yield by form ===", flush=True)
for form in ("acc", "rep", "leave", "vmisc"):
    v = c[(form, True)]; n = v + c[(form, False)]
    print("  %-6s %4d labelled  %3d violations (%.0f%%)" % (form, n, v, 100 * v / n if n else 0), flush=True)
print("\nNEW outside_game_influence examples: %d" % ogip, flush=True)
