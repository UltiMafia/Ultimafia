"""Build the targeted re-label worklist: jargon messages from the main sample
that lack a v3 label, plus the whole supplement."""
import json, re, os

DIR = "/home/tt/Documents/Ultimafia/rules_ml"
GLOSS = re.compile(r"(?i)\b(dumbtell|gt|gamethrow|hc|fos|bw|carol|ate|meta|wifom|omgus|policy|hip-?fire)\b")

ok = set()
for fn in ("decisions_v3.jsonl", "decisions_v3_supp.jsonl"):
    p = os.path.join(DIR, fn)
    if not os.path.exists(p):
        continue
    for l in open(p, encoding="utf-8"):
        try:
            r = json.loads(l)
        except Exception:
            continue
        if not r.get("error") and r.get("noul") is not None:
            ok.add(r["idx"])

samp = [json.loads(l) for l in open(DIR + "/sample.jsonl", encoding="utf-8")]
supp = [json.loads(l) for l in open(DIR + "/supplement.jsonl", encoding="utf-8")]

rows = []
for i, r in enumerate(samp):
    if i not in ok and GLOSS.search(r["target"]):
        r = dict(r); r["idx"] = i
        rows.append(r)
n_jargon = len(rows)
for i, r in enumerate(supp):
    r = dict(r); r["idx"] = 100000 + i          # must match the supplement index space
    rows.append(r)

with open(DIR + "/targeted.jsonl", "w", encoding="utf-8") as f:
    for r in rows:
        f.write(json.dumps(r) + "\n")
print("targeted rows: %d  (%d jargon + %d supplement)  batches=%d"
      % (len(rows), n_jargon, len(supp), (len(rows) + 3) // 4))
