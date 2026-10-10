"""Label the model-flagged messages of the viewer games with Clef, so the viewer can show
the teacher's column next to ours.

The developer's idea: only the messages our model flags need Clef's verdict, because that is
where the question "is this a distillation problem or a teacher problem?" is actually asked.
29-35 requests instead of 905 for every message in all six games.

Clef labels the target with the preceding three messages as context, matching the corpus.
"""
import json, sys, time, threading
from concurrent.futures import ThreadPoolExecutor, as_completed

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
sys.path.insert(0, DIR)
import jev_lib2 as L

THRESH, BATCH, WORKERS, ATTEMPTS, MODEL = 0.40, 4, 6, 6, "clef"
GV = DIR + "/game_views.json"
d = json.load(open(GV, encoding="utf-8"))
games = d["games"] if isinstance(d, dict) and "games" in d else d

todo = []
for g in games:
    ms = g["messages"]
    for k, m in enumerate(ms):
        if float(m.get("p", 0)) >= THRESH:
            ctx = ["%s: %s" % (x.get("sender") or "", x.get("text") or "") for x in ms[max(0, k - 3):k]]
            todo.append((g, m, ctx))
print("model-flagged messages needing a Clef verdict: %d  (~%d requests)"
      % (len(todo), (len(todo) + BATCH - 1) // BATCH), flush=True)

key = L.load_api_key()
qs = L.build_questions(BATCH)
groups = [todo[k:k + BATCH] for k in range(0, len(todo), BATCH)]
lock = threading.Lock()
ok = [0]; err = [0]; done = 0


def work(g):
    items = [{"target_line": "%s: %s" % (m.get("sender") or "", m.get("text") or ""),
              "context_lines": ctx,
              "game_context": "Game type: Mafia. Ranked: yes. Competitive: yes. Phase: %s."
                              % (m.get("phase") or "?")}
             for _gm, m, ctx in g]
    for attempt in range(ATTEMPTS):
        try:
            resp = L.systemone(L.build_batch_state(items), qs, key, model=MODEL, timeout=180)
            ans = L.parse_answers(resp, BATCH)
            with lock:
                for (_gm, m, _c), a in zip(g, ans):
                    m["clef"] = a.get("choice")
                    m["clef_p"] = a.get("noul")
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
    for f in as_completed(futs):
        f.result(); done += 1
        if done % 10 == 0:
            print("  %d/%d (%.0fs)" % (done, len(groups), time.time() - t0), flush=True)
print("  %d ok, %d failed in %.0fs" % (ok[0], err[0], time.time() - t0), flush=True)

json.dump(d, open(GV, "w", encoding="utf-8"), ensure_ascii=False)

# ---- where do we and Clef disagree on the flagged ones? ----
both = disc = 0
examples = []
for _gm, m, _c in todo:
    if m.get("clef") is None:
        continue
    ours = float(m.get("p", 0)) >= 0.5
    theirs = (m.get("clef") != "no_violation" and float(m.get("clef_p") or 0) >= 0.5)
    if ours and theirs:
        both += 1
    elif ours and not theirs:
        disc += 1
        examples.append((m.get("text") or "")[:70])
    elif theirs and not ours:
        disc += 1
        examples.append("[Clef only] " + (m.get("text") or "")[:62])
print("  we flag AND Clef flags: %d" % both)
print("  we disagree: %d" % disc)
for e in examples[:14]:
    print("     %s" % e)
