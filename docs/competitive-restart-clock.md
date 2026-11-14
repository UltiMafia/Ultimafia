# Restart-clock draft: scope and operational boundary

Requested by Mike: restart the competition clock without erasing scores, hearts or history. No prescribed policy settings are introduced.

The Restart open clock control uses the saved open-days setting. It starts the next daily boundary 24 hours after the request, preserves historical startDate/currentDay and all completions, and neither grants nor removes hearts immediately. Pause state is unchanged. It does not reopen grace, review or completed rounds. A reached existing fortune limit can still immediately end the open phase. Save any desired setting separately before restarting.

The server stores every restart request ID with the round. The UI keeps an unresolved ID in sessionStorage, including across refresh; a retry cannot restart the clock again. A completed request clears that client ID so a later explicit restart is a new action.

## Coordination

Progression, accounting, game-completion fortune checks, early-end, pause and controls share per-season Mongo operation ownership. Source reads for each operation occur under ownership. The game completion helper rereads the round rather than using its incoming snapshot. Heart and accounting operations are not transactional in the existing implementation.

Ownership intentionally has no timeout. A suspended worker must not resume writes after an expiring lease has been reassigned. Success releases ownership; an error or process crash leaves its token, operation name and start time. The management response exposes name/time, not the token. Busy periodic work skips; administrative requests receive a conflict. This is fail-closed, NOT automatic crash recovery.

## Unresolved operational acceptance

This draft is not approved for deployment. Any interrupted owned operation can stop season progression until an operator reconciles it. There is no safe generic clear-token command: heart allocation/accounting may have partially executed. Before recovery, the operator must stop/verify termination of all old writers, retain the operation token/name/time, inspect the affected round/users/standings and server logs, establish which side effects completed, and repair that specific interruption before releasing ownership. Missing per-user allocation/accounting receipts mean this cannot always be automated from existing data. Do not blindly retry a grant or accounting operation.

Deployment would require quiescing old competition writers; mixed old/new processes bypass ownership. These deployment/recovery operations have NOT been performed or authorized here. Further engineering should add durable idempotent side-effect receipts/recovery or a confirmed compatible transaction design before accepting this availability tradeoff.

Verification: source review and diff inspection only. No tests, lint, build, application execution, push or PR. Existing multi-document audit/cache consistency is not claimed fixed.

Concrete source-backed recovery design and unexecuted non-GPT acceptance requirements: [recovery design](competitive-operation-recovery-design.md).
