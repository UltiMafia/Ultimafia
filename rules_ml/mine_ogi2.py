"""Second OGI mining round.

The first round (mine_ogi.py) targeted GT accusations and yielded 113 OGI positives from 499
labelled rows. OGI now has only 158 training examples against no_violation's 5,000, and its
F1 fell to 0.405 once the mislabelled 'sue me' rows were removed, so the class needs bulk.

This round mines four OGI forms at once, because they are what OGI actually covers:
  acc   - gamethrowing accusations (gt/throw + a person addressed)
  rep   - report threats / asking for moderator action
  leave - leave threats (sui / suicid / suing)
  vmisc - 'vote gamethrower', 'throw account', and similar label-as-accusation forms

Everything already labelled in the corpus is skipped, so this only adds new material.
"""
import sqlite3, json, re, random, sys, collections

DB = "/home/tt/Documents/Ultimafia/mafia.db"
DIR = "/home/tt/Documents/Ultimafia/rules_ml"
OUT = DIR + "/ogi_v2.jsonl"
CORPUS = DIR + "/decisions_final_clef.jsonl"
IDX_BASE = 700000
random.seed(90210)

GTW = re.compile(r"(?i)\b(gt|gting|gamethrowing|gamethrower|gamethrow|throw(ing|er|s|n)?|threw)\b")
WHO = re.compile(r"(?i)\b(u|you|ur|youre|your|yall|he|she|they|hes|shes|theyre|him|her|them)\b|@\w+")
REP = re.compile(r"(?i)\b(report(ing|ed)?|ban(ning|ned)?|mods?|moderator)\b")
LEAVE = re.compile(r"(?i)\b(sui|suicid\w*|suing)\b")
VMISC = re.compile(r"(?i)(vote\s+gamethrow\w*|throw\s+account|gt\s+alt|\bgt'?ers?\b|gt\s+toxicity)")
CAPS = {"acc": 700, "rep": 350, "leave": 300, "vmisc": 200}


def _as_int(k):
    try:
        return int(k)
    except Exception:
        return None


def flatten(h):
    keys = [k for k in h if k not in ("-1", "-2") and _as_int(k) is not None]
    seq = ["-1"] + sorted(keys, key=_as_int) + ["-2"]
    out = []
    for sk in seq:
        st = h.get(sk) or {}
        sname = st.get("name") or ""
        meets = st.get("meetings") or {}
        if not isinstance(meets, dict):
            continue
        for m in meets.values():
            for msg in (m.get("messages") or []):
                c = (msg.get("content") or "").strip()
                if c:
                    out.append({"state": sname, "pid": msg.get("senderId"), "content": c,
                                "time": msg.get("time") or 0})
    out.sort(key=lambda x: x["time"])
    return out


# ---- what is already labelled, so we never re-mine it ----
have = set()
for l in open(CORPUS, encoding="utf-8"):
    r = json.loads(l)
    have.add((str(r.get("game_id")), (r.get("target") or "").strip()))
print("corpus rows already labelled: %d" % len(have), flush=True)

con = sqlite3.connect(DB)
print("scanning games...", flush=True)
pools = {k: [] for k in CAPS}
ng = 0
for gid, content in con.execute("SELECT id, content FROM games"):
    ng += 1
    if ng % 1500 == 0:
        print("   %d games, pool sizes %s" % (ng, {k: len(v) for k, v in pools.items()}), flush=True)
    try:
        g = json.loads(content)
    except Exception:
        continue
    if not isinstance(g, dict):
        continue
    hs = g.get("history")
    if isinstance(hs, str):
        try:
            hs = json.loads(hs)
        except Exception:
            continue
    if not isinstance(hs, dict):
        continue
    msgs = flatten(hs)
    if len(msgs) < 40:
        continue
    gt = g.get("type") or "Mafia"
    rk = 1 if g.get("ranked") else 0
    cp = 1 if g.get("competitive") else 0
    for k in range(len(msgs)):
        c = msgs[k]["content"]
        if len(c) < 3 or len(c) > 300:
            continue
        who = bool(WHO.search(c))
        form = None
        if GTW.search(c) and who and not re.search(r"(?i)\bstop\s+(gt|gting|throwing)\b", c):
            form = "acc"
        elif REP.search(c) and re.search(r"(?i)\b(i|im|we|lets|can we|gonna|going to)\b", c):
            form = "rep"
        elif LEAVE.search(c):
            form = "leave"
        elif VMISC.search(c):
            form = "vmisc"
        if not form:
            continue
        key = (str(gid), c.strip())
        if key in have:
            continue
        ctx = ["%s: %s" % (msgs[j].get("pid") or "", msgs[j]["content"]) for j in range(max(0, k - 3), k)]
        pools[form].append({"game_id": str(gid), "sender": msgs[k].get("pid") or "",
                            "target": c.strip(), "context": ctx, "state": msgs[k]["state"],
                            "game_type": gt, "ranked": rk, "competitive": cp,
                            "source": "ogi2_" + form, "_form": form})

print("\nscanned %d games" % ng, flush=True)
rows, seen = [], set()
for form, cap in CAPS.items():
    random.shuffle(pools[form])
    take = pools[form][:cap]
    print("  %-6s candidates %5d  taking %4d" % (form, len(pools[form]), len(take)), flush=True)
    for r in take:
        k = (r["game_id"], r["target"])
        if k in seen:
            continue
        seen.add(k)
        rows.append(r)

for i, r in enumerate(rows):
    r["idx"] = IDX_BASE + i
with open(OUT, "w", encoding="utf-8") as f:
    for r in rows:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
print("\nwrote %s with %d candidates (~%d batched requests)"
      % (OUT, len(rows), (len(rows) + 3) // 4), flush=True)
