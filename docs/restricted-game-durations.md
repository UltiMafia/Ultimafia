# Restricted-game hosting durations

## Server policy

`routes/game.js`, `POST /api/game/host`, is the user-facing configuration boundary. Every request recomputes `restrictedDurations` from the final submitted `ranked || competitive` flags. This happens **after** `modules/rehost.js` restores a claimed rehost's original settings, so old custom timers cannot carry into a restricted rehost.

- Every gameplay phase enumerated in `data/constants.js` → `configurableStates[gameType]` uses that phase's existing `default` in ranked or competitive games. Request values are ignored, following the pre-existing competitive normalization convention; no new timing values are introduced.
- For Mafia, `extendLength` uses `competitiveDefaults.Mafia.extendLength` in both modes. Existing validation still runs before normalization.
- Mafia `pregameWaitLength` remains configurable in **both** modes. The former competitive-only one-hour override is removed. The existing one-to-six-hour validation is retained.
- Neither flag enabled: existing phase min/max/default fallback, extension validation/customization and pregame customization remain unchanged.
- Unknown `stateLengths` keys are never copied into the resulting settings.

For Mafia the standard host-configurable gameplay phases are Day, Night, Team Approval and Mission. Values come from constants, not the UI. Setup-defined timing rules, role mechanics, timer decay, fixed-day/night setup settings and the `/extend` action itself are unchanged; this policy restricts **host duration customization**, not game mechanics.

## Configuration and mutation paths audited

- Hosting dialog changes and mode toggles are local form state until the final `/host` submission. The server checks the final flags regardless of stale values, client-side field visibility, or a handcrafted HTTP request.
- Rehosting (`modules/rehost.js` and the `/host` rehost branch) restores original ranked/competitive settings, then passes through the same duration validation.
- `Games/games.js` `createGame` requires `socket.isServer`, established with `LOAD_BALANCER_KEY`, and consumes the validated host settings via the load balancer. It is not a public host-configuration bypass.
- `Games/core/Player.js` `changeSetup` delegates to `Game.changeSetup`; `Game.canChangeSetup` rejects both ranked and competitive games. There is no user-facing post-creation duration or mode-enabling endpoint. Existing `makeUnranked` / `makeUncompetitive` only turn modes off.
- `Games/core/Game.js` `setStateLength` is called by `Games/core/Role.js` for role-defined state modifications. It is not a host configuration endpoint and is deliberately untouched.

## UI handoff

Hide non-pregame phase controls and the extension-length control whenever ranked **or** competitive is selected. Keep pregame editable, including competitive. Switching modes in an already-customized form must not send effective custom gameplay durations: the server ignores them, but reset displayed values if needed to avoid misleading hosts. Do not disable game mechanics such as extending the day by the standard extension.

## Tests and limitations

`NODE_ENV=test npm exec --yes --package=node@22.17.0 -- node ../../node_modules/mocha/bin/mocha.js test/restrictedDurations.test.js`

The `../../node_modules` path assumes this isolated worktree is under the main checkout's `.worktrees`; otherwise use the installed Mocha entry point. Add `--parallel` for the parallel runner.

The policy tests execute the actual host-route duration normalization and game-type settings validation blocks in a VM with real constants. They cover each configurable game type under both flags, unrestricted controls, stale custom values submitted with a newly enabled mode, pregame bounds, and extension normalization. Not every game-type/mode pairing is allowed by the application's separate lobby/setup gates.

The combined verification additionally runs `test/restrictedDurations.routes.test.js` through real loopback Express HTTP requests, the entire host/rehost handlers with controlled services, and real setup-change mutation methods/callbacks. The client browser harness covers real-form visibility, payloads, pregame editing and mode transitions at desktop/mobile widths. See [restricted-game-durations-verification.md](restricted-game-durations-verification.md) for exact coverage, rerun commands, baseline failures and live-worker limitations.
