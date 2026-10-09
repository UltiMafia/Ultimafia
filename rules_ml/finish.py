"""Wait for the Jev allowance, re-label the targeted set, merge, retrain, export."""
import json, sys, time, re, datetime, os
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import jev_lib2 as L
import run_batch

DIR = "/home/tt/Documents/Ultimafia/rules_ml"


def real_probe(key):
    st = L.build_state("alice: hi", ["bob: hi"], "Game type: Mafia. Ranked: yes. Competitive: no. Phase: Day 1.")
    try:
        L.systemone(st, L.build_questions(1), key)
        return True, ""
    except Exception as e:
        return False, str(e)[:200]


def wait_for_budget(key):
    for i in range(90):
        ok, msg = real_probe(key)
        if ok:
            print("budget available after %d checks" % i, flush=True)
            return True
        m = re.search(r"resets at (\d{2}):(\d{2})", msg)
        if m:
            now = datetime.datetime.utcnow()
            tgt = now.replace(hour=int(m.group(1)), minute=int(m.group(2)), second=30, microsecond=0)
            if tgt <= now:
                tgt += datetime.timedelta(hours=1)
            secs = (tgt - now).total_seconds()
            print("  waiting %.0fs until %s UTC" % (secs, tgt), flush=True)
            time.sleep(min(secs, 900))
        else:
            print("  probe: %s" % msg[:90], flush=True)
            time.sleep(60)
    return False


def main():
    key = L.load_api_key()
    if not wait_for_budget(key):
        print("NO BUDGET - aborting", flush=True)
        return

    print("\n=== targeted re-label (new prompt) ===", flush=True)
    run_batch.SAMPLE = DIR + "/targeted.jsonl"
    run_batch.OUT = DIR + "/decisions_v3_targeted.jsonl"
    sys.argv = ["run_batch.py", "--workers", "6", "--batch", "4", "--attempts", "14"]
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
