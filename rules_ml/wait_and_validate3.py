"""Pipeline v3: validate prompt v2 using the NOUL threshold as the decision
(choice only supplies the category), then run the full batched classification.

Pass criteria:
  * every FB (false-positive) case has noul < 0.5
  * every expected-violation case has noul >= 0.5
  * batched and individual agree on the binary decision for >= 15/16
"""
import json, sys, time, re, datetime

sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import jev_lib2 as L
TH = 0.5


def real_probe(key):
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
        m = re.search(r"resets at (\d{2}):(\d{2})", msg)
        if m:
            now = datetime.datetime.utcnow()
            tgt = now.replace(hour=int(m.group(1)), minute=int(m.group(2)), second=40, microsecond=0)
            if tgt <= now:
                tgt += datetime.timedelta(hours=1)
            secs = (tgt - now).total_seconds()
            print("  sleeping %.0fs until %s UTC" % (secs, tgt), flush=True)
            time.sleep(min(secs, 1800))
        else:
            print("  wait: %s" % msg[:90], flush=True)
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
    print("\n=== VALIDATION v3 (decision = noul >= %.1f) ===" % TH, flush=True)
    ind = with_retry(validate_v2.run_individual, key, "individual")
    fb_ok = tp_ok = 0
    fb_tot = tp_tot = 0
    for name, exp, ch, conf, noul, _t in ind:
        flagged = (noul or 0) >= TH
        want = (exp != "no_violation")
        if want:
            tp_tot += 1; tp_ok += flagged
        else:
            fb_tot += 1; fb_ok += (not flagged)
        print("  %s %-28s exp=%-24s flagged=%-5s cat=%-26s noul=%.2f"
              % ("OK " if flagged == want else "MISS", name, exp, str(flagged), ch, noul or 0), flush=True)
    print("  no-violation correct: %d/%d   violation correct: %d/%d" % (fb_ok, fb_tot, tp_ok, tp_tot), flush=True)

    bat = with_retry(validate_v2.run_batched, key, "batched")
    agree = sum(1 for a, b in zip(ind, bat) if ((a[4] or 0) >= TH) == ((b[4] or 0) >= TH))
    print("  batch binary agreement %d/%d" % (agree, len(ind)), flush=True)
    for (n1, _e, c1, _f1, nl1, _t1), (n2, _e2, c2, _f2, nl2, _t2) in zip(ind, bat):
        if ((nl1 or 0) >= TH) != ((nl2 or 0) >= TH):
            print("    DIFF %-28s indiv noul=%.2f batch noul=%.2f" % (n1, nl1 or 0, nl2 or 0), flush=True)

    if fb_ok < fb_tot or tp_ok < tp_tot or agree < len(ind) - 1:
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
