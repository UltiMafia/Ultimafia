"""Sleep to the next hour boundary (allowance reset), then finish the job.

A probe can only tell you whether ONE request fits, never how much headroom is
left, so we wait for the stated reset before starting.
"""
import json, sys, time, datetime
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
    print("\nPIPELINE DONE", flush=True)


if __name__ == "__main__":
    main()
