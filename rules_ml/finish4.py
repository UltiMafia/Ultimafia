"""Sleep to the allowance reset, finish the targeted re-label, merge, retrain,
export, and hot-reload the running test harness."""
import json, sys, time, datetime, urllib.request
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import jev_lib2 as L
import run_batch

DIR = "/home/tt/Documents/Ultimafia/rules_ml"


def sleep_to_reset():
    now = datetime.datetime.utcnow()
    tgt = now.replace(minute=0, second=45, microsecond=0) + datetime.timedelta(hours=1)
    secs = (tgt - now).total_seconds()
    print("sleeping %.0fs until %s UTC (allowance reset)" % (secs, tgt), flush=True)
    time.sleep(secs)


def reload_harness():
    try:
        req = urllib.request.Request("http://127.0.0.1:8899/api/reload", data=b"{}", method="POST")
        with urllib.request.urlopen(req, timeout=10) as r:
            print("harness reload:", r.read().decode()[:120], flush=True)
    except Exception as e:
        print("harness reload failed (start it manually):", str(e)[:120], flush=True)


def main():
    L.load_api_key()
    sleep_to_reset()

    print("\n=== targeted re-label (single-message, resumable) ===", flush=True)
    run_batch.SAMPLE = DIR + "/targeted.jsonl"
    run_batch.OUT = DIR + "/decisions_v3_targeted.jsonl"
    sys.argv = ["run_batch.py", "--workers", "8", "--batch", "1", "--attempts", "10"]
    run_batch.main()

    print("\n=== merge ===", flush=True)
    import build_final

    print("\n=== export word ===", flush=True)
    import export_v3
    export_v3.DEC = DIR + "/decisions_final.jsonl"
    export_v3.main()

    print("\n=== export char ===", flush=True)
    import export_char_v3
    export_char_v3.DEC = DIR + "/decisions_final.jsonl"
    export_char_v3.main()

    reload_harness()
    print("\nPIPELINE DONE", flush=True)


if __name__ == "__main__":
    main()
