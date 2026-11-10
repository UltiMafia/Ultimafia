# Actual master / redesign — existing local database

This evidence is separate from the controlled-record route fixture. Both clients
render their **complete actual Main, providers and route tree**. The master
source is the untouched fetched `origin/master` worktree. The redesign source is
the working branch. No accounts were signed into or fabricated.

The local backend remains connected to the existing `ultimafia_mongodb` and
`ultimafia_redis` volumes. The capture server permits GET/HEAD only and forwards
no cookies, authorization or CSRF headers. Public responses are cached **in
memory for the duration of the run** and reused by both clients, giving them the
same data even if the local online list changes between screenshots. Response
bodies are never written to disk; the report stores status, byte count and hash.
The Firebase configuration in the browser entry is a fake public test project;
it cannot establish or claim provider sign-in.

## Reproduce

From `react_main/`, build the two distinct immutable output directories:

```sh
UI_AUDIT_BRANCH=master npx rsbuild build --no-env --config rsbuild.live-audit-test.config.ts
UI_AUDIT_BRANCH=redesign npx rsbuild build --no-env --config rsbuild.live-audit-test.config.ts
node test/run-live-ui-audit.cjs
```

Use `UI_AUDIT_MASTER` for the upstream worktree and `PLAYWRIGHT_MODULE` for an
isolated Playwright installation. Both default to the audit's documented local
paths. The existing backend must already be running on local port 3000; this
command does not start, seed, replace or reset a database.

Each run gets a fresh directory. `latest-run.json` identifies the latest result.
Failed diagnostics remain separate and are not accepted captures. The initial
root-level report is a failed selector-adaptation attempt, not final evidence.

## Observed result

The corrected run captured **48/48 cases**, 0 failures: master/redesign × lobby,
Players, Forums, Learn games × 1440/390/320 × dark/light. It contains 96 separate
top/bottom viewport images, with 56 underlying local GET responses all HTTP 200.
These are **24 paired public route cells**, not exhaustive route/state coverage.
Only selected images have been inspected so far. Images were captured before
the first audit code commit and are not labeled final-HEAD evidence.

No authenticated hosting, trades, purchases, private moderation or physical-phone
behavior is established by this run. `visualAcceptance` remains false.
