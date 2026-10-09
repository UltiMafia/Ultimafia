"""Label the targeted buckets with Clef, then merge + retrain."""
import sys
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
sys.path.insert(0, DIR)
import jev_lib2 as L
import run_batch

L.load_api_key()
run_batch.SAMPLE = DIR + "/targeted_new.jsonl"
run_batch.OUT = DIR + "/decisions_clef_targeted.jsonl"
sys.argv = ["run_batch.py", "--workers", "6", "--batch", "1", "--attempts", "5",
            "--model", "clef"]
run_batch.main()

print("\n=== merge + retrain ===", flush=True)
import merge_and_train   # performs the merge and the retrain
