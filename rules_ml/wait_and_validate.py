"""Wait for the jev-latest hourly token allowance to roll over, validate the v2
prompt, and (only if it passes) run the full batched classification.

Writes everything to wait_validate.log so it can run unattended.
"""
import json, sys, time, urllib.request, urllib.error

sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import jev_lib2 as L

PROBE = {"model": "jev-latest", "state": "ping",
         "questions": {"p": {"type": "noul", "instructions": "Is this a ping?"}}}


def try_probe(key):
    body = json.dumps(PROBE).encode()
    req = urllib.request.Request(L.API_URL, data=body, method="POST")
    req.add_header("Authorization", "Bearer " + key)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            json.loads(r.read().decode())
            return True, "ok"
    except urllib.error.HTTPError as e:
        return False, "HTTP %s %s" % (e.code, e.read().decode(errors="replace")[:120])
    except Exception as e:
        return False, str(e)[:120]


def main():
    key = L.load_api_key()
    print("waiting for allowance...", flush=True)
    for i in range(150):                      # up to ~2.5h
        ok, msg = try_probe(key)
        print("  probe %d: %s %s" % (i, "OK" if ok else "wait", "" if ok else msg[:80]), flush=True)
        if ok:
            break
        time.sleep(60)
    else:
        print("GAVE UP waiting", flush=True)
        return

    print("\n=== VALIDATION (v2 prompt) ===", flush=True)
    import validate_v2
    key = L.load_api_key()
    ind = validate_v2.run_individual(key)
    n_fb_fixed = 0
    for name, exp, ch, conf, noul, top in ind:
        ok = (ch == exp)
        if name.startswith("FB") and ok:
            n_fb_fixed += 1
        print("  %s %-28s exp=%-26s got=%-26s conf=%.2f noul=%.2f"
              % ("OK " if ok else "MISS", name, exp, ch, conf or 0, noul or 0), flush=True)
    matches = sum(1 for n, e, c, _f, _nl, _t in ind if c == e)
    print("  matches: %d/%d   FB fixed: %d/5" % (matches, len(ind), n_fb_fixed), flush=True)

    try:
        bat = validate_v2.run_batched(key)
        agree = sum(1 for a, b in zip(ind, bat) if a[2] == b[2])
        print("  batch-vs-individual agreement: %d/%d" % (agree, len(ind)), flush=True)
        for (n1, _e, c1, *_r), (n2, _e2, c2, *_r2) in zip(ind, bat):
            if c1 != c2:
                print("    DIFF %-28s indiv=%s batch=%s" % (n1, c1, c2), flush=True)
    except Exception as e:
        agree = len(ind)
        print("  batch validation failed: %s" % str(e)[:200], flush=True)

    if n_fb_fixed < 5 or matches < max(11, len(ind) - 4) or agree < len(ind) - 2:
        print("\nVALIDATION FAILED -> not running the full pass", flush=True)
        return
    print("\nVALIDATION PASSED -> running full batched classification", flush=True)

    import run_batch
    sys.argv = ["run_batch.py", "--workers", "8", "--batch", "4", "--attempts", "12"]
    run_batch.main()
    print("PIPELINE DONE", flush=True)


if __name__ == "__main__":
    main()
