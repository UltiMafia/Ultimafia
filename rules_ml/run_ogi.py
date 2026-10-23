"""Label the OGI accusation batch, merge it in, then retrain the transformer."""
import sys
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
sys.path.insert(0, DIR)
import jev_lib2 as L
import run_batch

L.load_api_key()
run_batch.SAMPLE = DIR + "/ogi_new.jsonl"
run_batch.OUT = DIR + "/decisions_clef_ogi.jsonl"
sys.argv = ["run_batch.py", "--workers", "6", "--batch", "1", "--attempts", "5",
            "--model", "clef"]
run_batch.main()

print("\n=== merge (+ linear retrain) ===", flush=True)
import merge_and_train
print("\n=== transformer retrain ===", flush=True)
exec(open(DIR + "/finetune2.py").read())
