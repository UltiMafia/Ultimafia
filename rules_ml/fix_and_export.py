import json, sys
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
sys.path.insert(0, DIR)

# give each praise row its own group so GroupShuffleSplit can sort them
p = DIR + "/decisions_v3_praise.jsonl"
rows = [json.loads(l) for l in open(p, encoding="utf-8")]
for i, r in enumerate(rows):
    r["game_id"] = "praise-%d" % i
with open(p, "w", encoding="utf-8") as f:
    for r in rows:
        f.write(json.dumps(r) + "\n")
print("fixed game_id on %d praise rows" % len(rows), flush=True)

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
print("\nFIX PIPELINE DONE", flush=True)
