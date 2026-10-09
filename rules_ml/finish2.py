"""Wait for the Jev allowance (real-size probes), re-label the targeted set with
SINGLE-message requests, merge, retrain, export."""
import json, sys, time, re, datetime, os
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import jev_lib2 as L
import run_batch

DIR = "/home/tt/Documents/Ultimafia/rules_ml"


def probe(key):
    """A realistic single-message request (~2.5k reservation)."""
    st = L.build_state("alice: do you think bob is mafia because of his vote",
                       ["bob: i voted carol", "carol: why me"], "Game type: Mafia. Ranked: yes.")
    try:
        L.systemone(st, L.build_questions(1), key)
        return True, ""
    except Exception as e:
        return False, str(e)[:220]


def wait_for_budget(key):
    good = 0
    for i in range(120):
        ok, msg = probe(key)
        if ok:
            good += 1
            print("  probe %d OK (streak %d)" % (i, good), flush=True)
            if good >= 3:
                return True
            time.sleep(3)
            continue
        good = 0
        m = re.search(r"resets at (\d{2}):(\d{2})", msg)
        if m:
            now = datetime.datetime.utcnow()
            tgt = now.replace(hour=int(m.group(1)), minute=int(m.group(2)), second=30, microsecond=0)
            if tgt <= now:
                tgt += datetime.timedelta(hours=1)
            secs = (tgt - now).total_seconds()
            print("  allowance exhausted; sleeping %.0fs until %s UTC" % (secs, tgt), flush=True)
            time.sleep(min(secs, 1200))
        else:
            print("  probe failed: %s" % msg[:100], flush=True)
            time.sleep(45)
    return False


def main():
    key = L.load_api_key()
    print("waiting for budget...", flush=True)
    if not wait_for_budget(key):
        print("NO BUDGET - aborting", flush=True)
        return

    print("\n=== targeted re-label: single-message requests ===", flush=True)
    run_batch.SAMPLE = DIR + "/targeted.jsonl"
    run_batch.OUT = DIR + "/decisions_v3_targeted.jsonl"
    sys.argv = ["run_batch.py", "--workers", "8", "--batch", "1", "--attempts", "14"]
    run_batch.main()

    print("\n=== merge ===", flush=True)
    import build_final

    print("\n=== export word (stopwords + C sweep) ===", flush=True)
    import export_v3
    export_v3.DEC = DIR + "/decisions_final.jsonl"
    export_v3.main()

    print("\n=== export char ===", flush=True)
    import export_char_v3
    export_char_v3.DEC = DIR + "/decisions_final.jsonl"
    export_char_v3.main()
    print("\nPIPELINE DONE", flush=True)


if __name__ == "__main__":
    main()
