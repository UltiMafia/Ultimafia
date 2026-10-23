# Ultimafia Mafia Engine Fuzzer

An isolated, reproducible fuzzer for the Ultimafia game engine. It generates randomized Mafia game setups (roles, modifiers, player counts) and simulates player actions and phase deadlines to discover game-breaking exceptions, uncaught rejections, and state corruption without requiring live MongoDB or Redis instances.

---

## Quick Start

Run the default fuzz suite (100 cases starting at seed 1):
```bash
npm run fuzz:mafia
```

Run a specific seed or range:
```bash
npm run fuzz:mafia -- --seed 42 --cases 10
```

Replay a failed case directly from a saved JSON report:
```bash
npm run fuzz:mafia -- --replay mafia-fuzz-failures/seed-70-1788671803891.json
```

---

## Architecture

The fuzzer is structured into four core components:

1. **Setup & Action Generation (`scripts/mafia-fuzz/generator.js`)**
   - **PRNG**: A fast, seed-deterministic 32-bit PRNG (`random`) ensures identical setup and action sequences across replays.
   - **Setup Generation (`generate`)**: Generates legal setups with 5–10 players, drawing from Mafia roles and modifier combinations validated by `modules/setupRoleValidation.js`.
   - **Action Selection (`selections`)**: Inspects active meeting information (`canVote`, `canUpdateVote`, `inputType`, `targets`, `multiMin`, `multiMax`) to generate realistic votes, multi-target selections, boolean decisions, and text inputs.

2. **Isolated Worker Process (`scripts/mafia-fuzz/worker.js`)**
   - Runs as a disposable Node child process.
   - Stubs external boundaries (`db/db.js`, `modules/redis.js`, `modules/pushNotifications.js`, `Games/games.js`) and configures Mongoose with `bufferCommands: false` to immediately flag any accidental database leaks.
   - Uses `TestSocket` from `lib/sockets` to deliver client votes through the standard socket interface.
   - Advances game deadlines explicitly (`timers.main.end()`) to test day/night phase transitions.
   - Traps `uncaughtException`, `unhandledRejection`, and logger errors (`logger.error`), streaming incremental progress checkpoints back to the parent process.

3. **Orchestrator Runner (`scripts/mafia-fuzz/run.js`)**
   - Spawns workers per case and enforces timeouts (`SIGKILL` after timeout threshold).
   - Collects results (`finished`, `bounded`, or `failure`).
   - On failure, saves a detailed JSON report with the setup, action trace, state sequence, and error stack.

4. **Shared Validation (`modules/setupRoleValidation.js`)**
   - Extracted shared logic for verifying base roles, modifier compatibility, duplicate allowances, and role alignments.
   - Shared between `routes/setup.js` (API endpoints) and the generator.

---

## CLI Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--seed` | Integer | `1` | Initial random seed. |
| `--cases` | Integer | `100` | Number of sequential cases to execute (`seed`, `seed+1`, ...). |
| `--steps` | Integer | `40` | Max phase state cycles per game before marking as `bounded`. |
| `--timeout` | Integer (ms) | `15000` | Per-worker execution timeout in milliseconds. |
| `--modifiers` | Integer | `3` | Maximum number of modifiers stacked onto any single role. |
| `--output` | String | `mafia-fuzz-failures` | Directory where failure JSON artifacts are written. |
| `--replay` | File path | `null` | Path to a failure JSON file to replay with identical inputs. |

---

## Failure Reports & Replay

When a worker crashes, the runner writes a diagnostic JSON file to `--output`:

```json
{
  "version": 1,
  "seed": 70,
  "setup": { "total": 9, "roles": [...] },
  "maxSteps": 40,
  "status": "failure",
  "trace": [
    { "state": 0, "player": "fuzz1", "role": "Gambler", "meeting": "Give Challenge", "selection": "fuzz17" },
    ...
  ],
  "states": ["Night 1", "Day 1", "Night 2", ...],
  "error": "TypeError: Cannot read properties of undefined (reading 'getImmunity')\n    at ...",
  "output": ""
}
```

To replay the exact game that failed:
```bash
node scripts/mafia-fuzz/run.js --replay mafia-fuzz-failures/seed-70-1788671803891.json
```

Because player IDs, socket IDs, and random choices are seeded, replaying the case triggers the exact sequence of events leading to the failure.

---

## Automated Test Suite

The fuzzer is accompanied by unit and integration tests under `test/mafiaFuzz.test.js`:
```bash
npx mocha --exit test/mafiaFuzz.test.js
```
The test suite validates:
- Role & modifier compatibility, alignment rules, and duplicate limits.
- Deterministic setup generator bounds and constraints.
- Action selection for voting flags, multi-target bounds, and input types.
- Error interception and crash capture via `runCase`.
- Timeout killing runaway workers.
- Reproducible state sequence replay.

---

## Limitations & Scope

1. **Single-Node In-Memory Simulation**:
   - MongoDB and Redis operations are stubbed out; persistence schema validations, live Redis pub/sub routing, and socket clustering are not tested by this harness.
2. **Excluded Modifiers/Archetypes**:
   - `Banished` modifiers and `Event` alignments require custom player-count configurations and are excluded from the default randomized generator pool.
3. **Mafia-Specific Engine**:
   - The harness targets `Games/types/Mafia/Game.js`. Other game engines in the repository (such as `Cheat`, `TexasHoldEm`, `LiarsDice`, `DiceWars`) have differing game loops and state machines not covered by this runner.
4. **Action Heuristics**:
   - The fuzzer selects random legal targets and inputs; it does not model adversarial or optimal human strategies, but focuses on broad state-space coverage and boundary edge-cases.
