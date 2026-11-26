# Restricted-duration verification

## Combined artifact

Branch `fix/restricted-duration-qa`, worktree `/home/tt/Documents/Ultimafia/.worktrees/restricted-duration-qa` combines server commit `ccddb7475d66e1dbd40d674a1891f608cd28e713` and UI change `46afab85834e2355ca0b48565dba88e07450ed2d` (cherry-picked as `66edead5`). The QA commit adds only regression coverage and documentation; it makes no further production changes.

## Automated evidence

- **82 backend tests passed serially and in Mocha parallel mode**, using Node 22.17.0: 57 policy cases plus 25 HTTP/mutation-boundary cases.
- **8 real-form Chromium cases passed**, across 1200px and 390px viewports, ranked and competitive separately, initially restricted and switching from a customized unrestricted form. They assert pregame visibility/editability, absence of gameplay controls and Configure Duration, exclusion of hidden gameplay request values, and preserved unrestricted values after switching back.
- **Full client build passed** from the combined worktree. Source dependencies are linked to the UI worker's worktree-only dependency overlay; that overlay supplies already-declared `@tanstack/react-virtual` missing in the shared installation. No shared dependencies were changed.
- Focused client ESLint, JavaScript syntax checks and `git diff --check` passed. Existing browser-compatibility-data age notices remain.
- Replaying the 25 new tests with only the router replaced by the original `9bba9629:routes/game.js` gave **7 passing / 18 failing**. Ranked failures include one-minute Day reaching creation as 60,000ms rather than the standard 600,000ms, all other configurable Mafia phases, extensions, and both rehost sources. Competitive failures demonstrate that pregame customization was previously overwritten to one hour. The existing competitive gameplay protection and live setup-change gate are expected to pass on the baseline.

## Coverage boundaries

`test/restrictedDurations.routes.test.js` loads the **entire real Express game router**, the **entire real rehost module**, real constants, lobby-name helpers and error responders. Actual loopback HTTP JSON requests traverse Express and `/host`, then read back `/api/game/:id/info`. Explicit controlled adapters supply identity/permissions, Mongo queries, Redis state/claims and the load-balancer `createGame` boundary. The adapter records exactly the validated settings handed to creation; it is not a real game worker or persistent database.

For each restricted mode the HTTP suite covers:

- One-minute direct-request overrides for **Day, Night, Team Approval and Mission**, checking all resulting defaults, extension length, pregame and final mode.
- Custom unrestricted creation followed by a host form switched into the restricted mode.
- Subsequent host submissions with changed pregame/gameplay values: pregame remains configurable and gameplay remains standard.
- Requests omitting hidden gameplay fields, matching the restricted UI payload shape.
- Legacy customized rehosts, from both live postgame data and saved records. Original mode flags are restored even when the finished game is now unrestricted, request flags cannot downgrade that restored mode, stale gameplay durations are normalized, pregame remains customized, schedule is dropped, and the claim completes.
- Unrestricted creation and rehost controls preserve existing custom values.

The policy suite additionally covers all `constants.configurableStates` game types, pregame range validation and invalid/unknown duration fallbacks. This does not imply every game-type/restricted-mode combination passes the application's separate setup/lobby eligibility gates.

### What “later updates” means here

There is **no public live duration-edit or mode-enabling endpoint** in this repository. `/host` creates a new game; it does not edit an existing game, even on later submissions. UI mode changes occur before submission. Do not describe the two-creation test as a live-game update.

The available setup-change path can indirectly change fixed timing. The new mutation tests execute the complete real `Game.canChangeSetup` and `Game.changeSetup` methods plus the actual `Player` `changeSetup` socket listener, with controlled dependencies. In both ranked and competitive modes, pregame and started requests leave setup/timings unchanged and never reach the setup database or persistence write. An unrestricted pregame control retains eligibility. Importing the core Game class directly is intentionally avoided because it registers a worker with Redis.

Role/setup-defined timing mechanics and normal extension actions are outside host-duration customization and are not changed or claimed blocked by these tests. Existing games are not retroactively migrated.

## Rerun

From the combined worktree (the Mocha path below assumes `.worktrees/<name>` beneath the installed main checkout):

```sh
NODE_ENV=test npm exec --yes --package=node@22.17.0 -- node ../../node_modules/mocha/bin/mocha.js test/restrictedDurations.test.js test/restrictedDurations.routes.test.js
NODE_ENV=test npm exec --yes --package=node@22.17.0 -- node ../../node_modules/mocha/bin/mocha.js test/restrictedDurations.test.js test/restrictedDurations.routes.test.js --parallel
# Expected failing baseline, without modifying checked-out production source:
NODE_ENV=test DURATION_ROUTE_BASELINE=9bba9629 npm exec --yes --package=node@22.17.0 -- node ../../node_modules/mocha/bin/mocha.js test/restrictedDurations.routes.test.js
cd react_main
PLAYWRIGHT_MODULE=/home/tt/pw-tools/node_modules/playwright npm run test:duration:browser
npm run build
npx eslint --ext .js,.jsx src/components/gameTypeHostForms/HostMafia.js test/duration.browser.jsx test/run-duration.cjs
```

## Live smoke test still recommended

Automated UI infrastructure was available, so there is no untested UI-visibility requirement. The browser fixture and HTTP fixture are separate, not a real authenticated full-stack session. Before release, use a local/staging account with ranked/competitive hosting permission and an approved/current-round setup:

1. In each mode, customize pregame to a non-default value, host, and inspect the new game's settings and actual phase timer. Pregame must match; gameplay must use standard defaults.
2. Submit a direct host request with Day/Night set to one minute, both extra Mafia phase values changed and extension set to zero. Inspect the actual worker's created settings; all non-pregame values must be standard.
3. Rehost a legacy customized restricted game and confirm defaults and custom pregame survive the real worker/Redis/Mongo roundtrip.
4. Attempt setup changes before and after start; the restricted game must reject them without changing timing. In an unrestricted game confirm custom durations still apply.

These live worker/database/browser-session checks were **not performed** by QA. No production requests, deployment, full repository suite, or production observations are claimed. Repo-wide tests are known flaky and were not used in place of the focused checks.
