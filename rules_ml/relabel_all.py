"""Re-label the whole corpus under the final rubric. Resumable across quota windows."""
import json, os, sys, time, datetime
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
sys.path.insert(0, DIR)
import jev_lib2 as L
import run_batch

# (worklist, output, offset) - mirroring build_final's index spaces
JOBS = [
    ("sample.jsonl", "decisions_clef.jsonl", 0),
    ("supplement.jsonl", "decisions_clef_supp.jsonl", 100000),
    ("praise.jsonl", "decisions_clef_praise.jsonl", 0),
    ("game.jsonl", "decisions_clef_game.jsonl", 0),
]


MODEL = "clef"   # Cloudflare Clef: separate allowance from jev-latest, more decisive


def done_count(path):
    n = 0
    if os.path.exists(path):
        for l in open(path, encoding="utf-8"):
            try:
                r = json.loads(l)
            except Exception:
                continue
            if not r.get("error") and r.get("noul") is not None:
                n += 1
    return n


def total_needed(path, offset):
    p = os.path.join(DIR, path)
    return sum(1 for _ in open(p, encoding="utf-8"))


def sleep_to_reset(why):
    now = datetime.datetime.utcnow()
    tgt = now.replace(minute=0, second=45, microsecond=0) + datetime.timedelta(hours=1)
    secs = (tgt - now).total_seconds()
    print("  %s -> sleeping %.0fs to %s UTC" % (why, secs, tgt), flush=True)
    time.sleep(secs)


def probe(key):
    """Does the allowance allow work? Distinguish a spent allowance (sleep) from
    transient capacity/timeout errors (let run_batch retry)."""
    for i in range(4):
        try:
            st = L.build_state("probe: gg wp", [], "Game type: Mafia. Ranked: yes.")
            L.systemone(st, L.build_questions(1), key, model=MODEL, timeout=60)
            return True
        except Exception as e:
            msg = str(e).lower()
            if "allowance" in msg or "exceeded" in msg:
                print("  probe: allowance spent", flush=True)
                return False
            time.sleep(4)
    print("  probe: transient failures only; proceeding", flush=True)
    return True


key = L.load_api_key()
for wl, out, off in JOBS:
    want = total_needed(wl, off)
    outp = DIR + "/" + out
    if done_count(outp) >= want:
        print("skip %s (already %d)" % (out, want), flush=True)
        continue
    print("\n=== %s -> %s (%d rows) ===" % (wl, out, want), flush=True)
    run_batch.SAMPLE = DIR + "/" + wl
    run_batch.OUT = outp
    for attempt in range(200):
        n0 = done_count(outp)
        print("  have %d/%d" % (n0, want), flush=True)
        if n0 >= want:
            break
        if not probe(key):
            sleep_to_reset("allowance spent")
            continue
        sys.argv = ["run_batch.py", "--workers", "6", "--batch", "1", "--attempts", "5",
                    "--model", MODEL]
        try:
            run_batch.main()
        except SystemExit:
            pass
        if done_count(outp) <= n0:
            sleep_to_reset("no progress")
print("\nRELABEL ALL DONE", flush=True)
