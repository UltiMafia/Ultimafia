import sys
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
sys.path.insert(0, DIR)
import jev_lib2 as L
import run_batch

L.load_api_key()
run_batch.SAMPLE = DIR + "/praise.jsonl"
run_batch.OUT = DIR + "/decisions_v3_praise.jsonl"
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
print("\nPRAISE PIPELINE DONE", flush=True)
