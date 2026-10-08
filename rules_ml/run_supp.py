import sys
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import run_batch

run_batch.SAMPLE = "/home/tt/Documents/Ultimafia/rules_ml/supplement.jsonl"
run_batch.OUT = "/home/tt/Documents/Ultimafia/rules_ml/decisions_supp.jsonl"
sys.argv = ["run_batch.py", "--workers", "6", "--batch", "4", "--attempts", "12"]
run_batch.main()
