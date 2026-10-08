import json

DEC = "/home/tt/Documents/Ultimafia/rules_ml/decisions_v2.jsonl"
by = {}
for line in open(DEC, encoding="utf-8"):
    r = json.loads(line)
    if not r.get("error") and r.get("noul") is not None:
        by[r["idx"]] = r

print("=== your 7 reference cases under v2 ===")
ref = {1637: "FB (was GRA)", 1349: "FB (was OGI)", 577: "FB (was OGI)",
       4769: "FB (was cheating)", 4583: "FB (was OGI)",
       4566: "TP report threat", 4561: "TP user said good"}
for i in sorted(ref):
    r = by.get(i)
    if not r:
        print("  idx %s missing" % i); continue
    print("  idx %-5s %-20s noul=%.2f choice=%-28s %r"
          % (i, ref[i], r["noul"], r["choice"], r["target"][:70]))

print("\n=== label variants over all 5000 ===")
a = sum(1 for r in by.values() if r["noul"] >= 0.5)
b = sum(1 for r in by.values() if r["choice"] != "no_violation")
c = sum(1 for r in by.values() if r["noul"] >= 0.5 and r["choice"] != "no_violation")
d = sum(1 for r in by.values() if r["noul"] >= 0.5 or r["choice"] != "no_violation")
print("  (a) noul>=0.5                     : %d" % a)
print("  (b) choice!=no_violation          : %d" % b)
print("  (c) both (consensus)              : %d" % c)
print("  (d) either                        : %d" % d)
print("  noul>=0.5 but choice=no_violation : %d" % (a - c))
print("  choice!=none but noul<0.5         : %d" % (b - c))

print("\n=== representative subset (random) ===")
rnd = [r for r in by.values() if r.get("source") == "random"]
n = len(rnd)
print("  n=%d" % n)
for th in (0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9):
    k = sum(1 for r in rnd if r["noul"] >= th)
    print("   noul>=%.1f : %4d (%.2f%%)" % (th, k, 100.0 * k / n))
k = sum(1 for r in rnd if r["noul"] >= 0.5 and r["choice"] != "no_violation")
print("   consensus (noul>=.5 & choice!=none): %4d (%.2f%%)" % (k, 100.0 * k / n))
