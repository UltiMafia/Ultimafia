"""Batched classifier run with the v2 prompt: N messages per request.

Resumable by batch index; output is decisions_v2.jsonl (one row per message).
"""
import json, os, sys, time, threading, argparse, random
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import jev_lib2 as L

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
SAMPLE = os.path.join(DIR, "sample.jsonl")
OUT = os.path.join(DIR, "decisions_v2.jsonl")


def gc_of(rec):
    return "Game type: %s. Ranked: %s. Competitive: %s. Phase: %s." % (
        rec.get("game_type", "Mafia"), "yes" if rec.get("ranked") else "no",
        "yes" if rec.get("competitive") else "no", rec.get("state", "?"))


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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--batch", type=int, default=4)
    ap.add_argument("--attempts", type=int, default=12)
    args = ap.parse_args()

    key = L.load_api_key()
    with open(SAMPLE, "r", encoding="utf-8") as f:
        sample = [json.loads(l) for l in f]
    qs = L.build_questions(args.batch)

    done = load_done()
    groups = []
    for s in range(0, len(sample), args.batch):
        chunk = list(range(s, min(s + args.batch, len(sample))))
        if any(i not in done for i in chunk):
            groups.append(chunk)
    print("total=%d done=%d batches=%d batch=%d workers=%d"
          % (len(sample), len(done), len(groups), args.batch, args.workers), flush=True)

    lock = threading.Lock()
    fout = open(OUT, "a", encoding="utf-8", buffering=1)
    t0 = time.time()
    n_ok = n_err = 0

    def work(chunk):
        items = [{"target_line": "%s: %s" % (sample[i]["sender"], sample[i]["target"]),
                  "context_lines": sample[i].get("context") or [],
                  "game_context": gc_of(sample[i])} for i in chunk]
        delay = 2.0
        for attempt in range(args.attempts):
            try:
                st = L.build_batch_state(items)
                resp = L.systemone(st, qs, key)
                return chunk, resp, None
            except Exception as e:
                msg = str(e)
                retryable = ("429" in msg or "50" in msg or "overloaded" in msg.lower()
                             or "timed out" in msg.lower())
                if attempt == args.attempts - 1:
                    return chunk, None, msg
                if retryable:
                    time.sleep(delay + random.random() * 2.0)
                    delay = min(delay * 1.5, 25.0)
                else:
                    time.sleep(0.5)
        return chunk, None, "exhausted"

    def row_for(i, ans, resp):
        r = sample[i]
        return {"idx": i, "source": r.get("source"), "game_id": r.get("game_id"),
                "sender": r.get("sender"), "target": r.get("target"),
                "context": r.get("context"), "state": r.get("state"),
                "game_type": r.get("game_type"), "ranked": r.get("ranked"),
                "competitive": r.get("competitive"),
                "noul": ans["noul"], "choice": ans["choice"], "choice_conf": ans["choice_conf"],
                "probs": ans["probs"], "severity": ans["severity"],
                "severity_conf": ans["severity_conf"], "usage": resp.get("usage"),
                "model": resp.get("model")}

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = [ex.submit(work, c) for c in groups]
        for n, fut in enumerate(as_completed(futs), 1):
            chunk, resp, err = fut.result()
            with lock:
                if err:
                    for i in chunk:
                        r = sample[i]
                        fout.write(json.dumps({**{k: r.get(k) for k in
                                                  ("game_id", "sender", "target", "context", "state",
                                                   "game_type", "ranked", "competitive", "source")},
                                               "idx": i, "error": err[:300]}) + "\n")
                    n_err += len(chunk)
                else:
                    answers = L.parse_answers(resp, len(chunk))
                    for i, ans in zip(chunk, answers):
                        fout.write(json.dumps(row_for(i, ans, resp)) + "\n")
                    n_ok += len(chunk)
                if n % 10 == 0:
                    el = time.time() - t0
                    print("  batches %d/%d ok=%d err=%d %.1f msg/s eta=%.0fs"
                          % (n, len(groups), n_ok, n_err, n_ok / max(el, 1e-9),
                             (len(groups) - n) * args.batch / max(n_ok / max(el, 1e-9), 1e-9)), flush=True)
    fout.close()
    print("DONE ok=%d err=%d in %.0fs" % (n_ok, n_err, time.time() - t0), flush=True)


if __name__ == "__main__":
    main()
