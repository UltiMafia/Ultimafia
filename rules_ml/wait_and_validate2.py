"""Wait for the jev-latest allowance (resets on the UTC hour), validate prompt v2,
then run the full batched classification. Fully unattended; logs to wait2.log.

Retries every API phase on 429 rather than dying.
"""
import json, sys, time, re, datetime

sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import jev_lib2 as L


def real_probe(key):
    """A full-size call, so we don't start work on the dregs of a window."""
    st = L.build_state("alice: hi", ["bob: hi"], "Game type: Mafia. Ranked: yes. Competitive: no. Phase: Day 1.")
    try:
        L.systemone(st, L.build_questions(1), key)
        return True, ""
    except Exception as e:
        return False, str(e)[:200]


def wait_for_budget(key):
    for i in range(200):
        ok, msg = real_probe(key)
        if ok:
            print("budget available after %d checks" % i, flush=True)
            return True
        m = re.search(r"resets at (\d{2}):(\d{2}) UTC", msg)
        if m:
            now = datetime.datetime.utcnow()
            tgt = now.replace(hour=int(m.group(1)), minute=int(m.group(2)), second=35, microsecond=0)
            if tgt <= now:
                tgt += datetime.timedelta(hours=1)
            secs = (tgt - now).total_seconds()
            print("  %s -> sleeping %.0fs until %s UTC" % (msg[:60], secs, tgt), flush=True)
            time.sleep(min(secs, 1800))
        else:
            print("  wait: %s" % msg[:100], flush=True)
            time.sleep(60)
    return False


def with_retry(fn, key, label, attempts=15):
    delay = 3.0
    for a in range(attempts):
        try:
            return fn(key)
        except Exception as e:
            msg = str(e)
            print("   %s attempt %d failed: %s" % (label, a, msg[:110]), flush=True)
            if "429" in msg:
                wait_for_budget(key)
            else:
                time.sleep(delay); delay = min(delay * 1.6, 30)
    raise SystemExit("%s failed after %d attempts" % (label, attempts))


def main():
    key = L.load_api_key()
    if not wait_for_budget(key):
        print("NO BUDGET", flush=True); return

    import validate_v2
    print("\n=== VALIDATION (v2) ===", flush=True)
    ind = with_retry(validate_v2.run_individual, key, "individual")
    n_fb = 0
    for name, exp, ch, conf, noul, _t in ind:
        ok = (ch == exp)
        if name.startswith("FB") and ok:
            n_fb += 1
        print("  %s %-28s exp=%-26s got=%-26s conf=%.2f noul=%.2f"
              % ("OK " if ok else "MISS", name, exp, ch, conf or 0, noul or 0), flush=True)
    matches = sum(1 for n, e, c, _f, _nl, _t in ind if c == e)
    print("  matches %d/%d  FB fixed %d/5" % (matches, len(ind), n_fb), flush=True)

    bat = with_retry(validate_v2.run_batched, key, "batched")
    agree = sum(1 for a, b in zip(ind, bat) if a[2] == b[2])
    print("  batch agreement %d/%d" % (agree, len(ind)), flush=True)
    for (n1, _e, c1, *_r), (n2, _e2, c2, *_r2) in zip(ind, bat):
        if c1 != c2:
            print("    DIFF %-28s indiv=%s batch=%s" % (n1, c1, c2), flush=True)

    if n_fb < 5 or matches < len(ind) - 4 or agree < len(ind) - 2:
        print("\nVALIDATION FAILED -> not running full pass", flush=True)
        return
    print("\nVALIDATION PASSED -> full batched classification", flush=True)

    def _run(_k):
        sys.argv = ["run_batch.py", "--workers", "8", "--batch", "4", "--attempts", "12"]
        import run_batch
        run_batch.main()
    with_retry(_run, key, "full-run")
    print("PIPELINE DONE", flush=True)


if __name__ == "__main__":
    main()
