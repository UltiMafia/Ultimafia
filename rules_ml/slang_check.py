import json, sys
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import export_final2 as E

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
E.DEC = DIR + "/decisions_all.jsonl"
m = json.load(open(DIR + "/model.json"))
rows = E.load()
p = E.portable_predict([r["target"] for r in rows], m)

sup = [r for r in rows if r.get("source") == "supplement"]
print("supplement rows: %d" % len(sup))
for r, pr in zip(rows, p):
    if r.get("source") != "supplement":
        continue
    t = r["target"].lower()
    if "suing" in t or "suicid" in t:
        print("  jev=%.2f dist=%.2f %-24s %r" % (r["noul"], pr, r["choice"], r["target"][:56]))
