"""Retry-capable runner: same as run_jev.py but error rows are re-attempted.

Resumable: an index with a stored successful decision is skipped; an index
whose only row carries an "error" is retried.
"""
import json, os, sys, time, threading, argparse, random
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import jev_lib

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
SAMPLE = os.path.join(DIR, "sample.jsonl")
OUT = os.path.join(DIR, "decisions.jsonl")


def load_done():
    done = set()
    if os.path.exists(OUT):
        with open(OUT, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    r = json.loads(line)
                except Exception:
                    continue
                if not r.get("error") and r.get("noul") is not None:
                    done.add(r["idx"])
    return done


def classify(rec, key, qs):
    gc = "Game type: %s. Ranked: %s. Competitive: %s. Phase: %s." % (
        rec.get("game_type", "Mafia"),
        "yes" if rec.get("ranked") else "no",
        "yes" if rec.get("competitive") else "no",
        rec.get("state", "?"),
    )
    state = jev_lib.build_state("%s: %s" % (rec["sender"], rec["target"]), rec.get("context") or [], gc)
    resp = jev_lib.systemone(state, qs, key)
    a = resp.get("answers", {})
    vt = a.get("violation_type", {}) or {}
    sv = a.get("severity", {}) or {}
    return {
        "noul": (a.get("policy_violation", {}) or {}).get("noul"),
        "choice": vt.get("choice"),
        "choice_conf": vt.get("confidence"),
        "probs": vt.get("probabilities"),
        "severity": sv.get("score"),
        "severity_conf": sv.get("confidence"),
        "usage": resp.get("usage"),
        "model": resp.get("model"),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--attempts", type=int, default=10)
    args = ap.parse_args()

    key = jev_lib.load_api_key()
    qs = jev_lib.build_questions()

    with open(SAMPLE, "r", encoding="utf-8") as f:
        sample = [json.loads(l) for l in f]
    if args.limit:
        sample = sample[:args.limit]

    done = load_done()
    todo = [(i, r) for i, r in enumerate(sample) if i not in done]
    print("total=%d done=%d todo=%d workers=%d" % (len(sample), len(done), len(todo), args.workers), flush=True)

    lock = threading.Lock()
    fout = open(OUT, "a", encoding="utf-8")
    t0 = time.time()
    n_ok = n_err = 0

    def work(item):
        i, rec = item
        delay = 2.0
        for attempt in range(args.attempts):
            try:
                return i, rec, classify(rec, key, qs), None
            except Exception as e:
                msg = str(e)
                retryable = ("429" in msg or "502" in msg or "503" in msg or "500" in msg
                             or "overloaded" in msg.lower() or "timed out" in msg.lower())
                if attempt == args.attempts - 1:
                    return i, rec, None, msg
                if retryable:
                    time.sleep(delay + random.random() * 2.0)
                    delay = min(delay * 1.6, 30.0)
                else:
                    time.sleep(0.5)
        return i, rec, None, "exhausted"

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = [ex.submit(work, it) for it in todo]
        for n, fut in enumerate(as_completed(futs), 1):
            i, rec, res, err = fut.result()
            row = {"idx": i, "source": rec.get("source"), "game_id": rec.get("game_id"),
                   "sender": rec.get("sender"), "target": rec.get("target"),
                   "context": rec.get("context"), "state": rec.get("state"),
                   "game_type": rec.get("game_type"), "ranked": rec.get("ranked"),
                   "competitive": rec.get("competitive")}
            if err:
                row["error"] = err[:300]
                n_err += 1
            else:
                row.update(res)
                n_ok += 1
            with lock:
                fout.write(json.dumps(row) + "\n")
                if n % 50 == 0:
                    fout.flush()
                    el = time.time() - t0
                    print("  %d/%d ok=%d err=%d  %.1f/s  eta=%.0fs"
                          % (n, len(todo), n_ok, n_err, n / el, (len(todo) - n) / max(n / el, 1e-9)),
                          flush=True)
    fout.close()
    print("DONE ok=%d err=%d in %.0fs" % (n_ok, n_err, time.time() - t0), flush=True)


if __name__ == "__main__":
    main()
