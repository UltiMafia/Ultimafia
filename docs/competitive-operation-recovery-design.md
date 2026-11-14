# Recoverable competitive operations: source-backed design, not implemented

Status: design checkpoint only. No runtime, database migration, topology check, or acceptance performed. Do not deploy the non-expiring-lock draft as though this document implements recovery.

## Verified basis

- docker-compose-core.yml runs mongo:8.0.11 without replica-set initialization; docker-compose-prod.yml adds no topology configuration. db/db.js constructs a Mongo connection URI from environment values. This establishes the checked-in setup, not actual production topology; environment values were not inspected.
- modules/competitive.js allocates hearts with updateMany({}, {$inc: ...}), clears them with updateMany($set: 0), then separately changes round state. Partial batch completion is not recorded per user.
- confirmStandings increments season standings and account championship points separately; account-point errors are caught, so accounting can advance despite a missed account update.
- Trophy creation uses read-before-insert; notification creation is a separate effect. Concurrent retries can duplicate records without a unique operation key.
- Games/core/Game.js has heart debit/refund/integrity paths outside the new season ownership helper. A season lock does not make all user-balance writes globally exclusive.
- MongoDB documents single-document atomicity, not whole-updateMany atomicity. Transactions require a replica set or sharded cluster: https://www.mongodb.com/docs/manual/core/write-operations-atomicity/ and https://www.mongodb.com/docs/manual/data-modeling/enforce-consistency/transactions/ .

## Recommended standalone-compatible design

1. Prepare an immutable operation record before effects. Key it by season, round, logical boundary and operation kind; persist the selected settings, anchor, expected round version, stable request ID, target population and outcome/standings snapshot. Require a unique operation/boundary index, verified before enabling effects, so concurrent preparation cannot create two IDs for the same logical allocation. Do not regenerate amounts or rankings on retry.
2. Co-locate an applied-operation receipt with each affected value. A conditional single-document mutation must both apply the amount and record its operation key. A receipt in a separate collection cannot prove the increment and receipt committed together. Daily grants need this on User; round prestige needs it on both CompetitiveSeasonStanding and User.
3. Freeze the user population or a persisted creation cutoff before batch allocation. A retry must not newly select users who appeared after the original operation, nor omit previously selected users after a filter changes. Chunked target manifests must be complete before effects begin.
4. Record deterministic next round state and apply it with expected-version compare-and-set after all required user receipts exist. Acknowledgment loss must be distinguishable from missing effects by reading receipts. Do not mark accounted/completed while caught errors remain unresolved.
5. Use unique effect keys for trophies, notifications and audit/outbox entries. Establish required indexes and assess existing duplicates before migration. Redis invalidation belongs to retryable after-commit work, not proof the Mongo mutations happened.
6. A recovery worker resumes the SAME immutable operation, never creates another allocation ID for the same boundary. Do not start a later operation until the earlier operation is durably complete. Quiesce unmodified legacy writers and verify every relevant writer has migrated before enabling replay; legacy code bypasses both receipts and fences. Only older protocol-compliant workers may safely resume under target-document receipts/version fences. A time-based lease alone is insufficient.
7. Absolute heart resets require special handling. First model/inspect all debit/refund/reset paths, including active games. Blindly replaying a reset can erase intervening legitimate credits/refunds. Either fence every relevant writer with a balance generation or replace resets with an explicit generation-aware entitlement model. Preserve existing intended gameplay behavior; this is not permission to redesign policy or silently discard refunds.
8. Keep receipts until older operations cannot be replayed. Do not prune by elapsed time alone. Introduce a durable replay floor/fence before any bounded retention policy; otherwise old requests can double-credit after receipt removal.
9. Migrate only future operations. A historical partial allocation without receipts is an evidence/reconciliation case; never fabricate receipts or infer exactly-once completion from current totals.

This is idempotent recoverability, NOT cross-document atomic visibility. During replay, some targets can reflect the operation before others. If the product requires all-target atomic visibility, independently verify production transaction topology and design Mongo sessions accordingly; Redis/audit delivery still needs explicit treatment.

## First implementation slice and owners

Root competition worker owns code. Implement and independently review the immutable operation schema and a receipt-coupled daily-grant path first, with its frozen target selection and deterministic boundary ID. Keep recovery opt-in/unavailable until all dependent round writes use the same identity. Do not automatically clear the existing lock or enable general recovery after that slice alone.

Then cover round-state advancement, accounting and awards, followed by generation-aware reset/debit/refund coordination. The repository owner/operator must provide authoritative production topology evidence only if choosing transactions; no settings or credentials may be changed just to make the draft work. Existing owners retain deployment and review authority.

## Non-GPT acceptance requirements (not executed or written as test software)

A human or authorized non-GPT validator must inspect balances, receipts, round state and history around:
- interruption before any grant, halfway through targets, after all grants but before round advancement, and after advancement before reply;
- lost acknowledgment, duplicate request, two recovery workers, old worker resuming late, and retry after a later operation;
- concurrent join/spend/refund, population changes, pause/play/restart and fortune finish;
- missed account prestige, already-created trophy, failed notification/audit, and Redis outage;
- restart during open phase and refusal in grace/review/completed phase;
- confirmed historical date/day/score/heart preservation and unchanged defaults.

Acceptance evidence must name exact commit, environment/topology, validator, observed outcomes and unresolved failures. This document supplies scenarios only; no GPT software tests, builds, lint or runtime exercises were performed.
