"""Step 1 re-label: classify sample + supplement with the glossary-updated prompt."""
import sys, time
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import run_batch

DIR = "/home/tt/Documents/Ultimafia/rules_ml"

for sample, out in (("sample.jsonl", "decisions_v3.jsonl"),
                    ("supplement.jsonl", "decisions_v3_supp.jsonl")):
    run_batch.SAMPLE = DIR + "/" + sample
    run_batch.OUT = DIR + "/" + out
    sys.argv = ["run_batch.py", "--workers", "8", "--batch", "4", "--attempts", "12"]
    print("=== running %s -> %s ===" % (sample, out), flush=True)
    run_batch.main()

print("STEP1 DONE", flush=True)
