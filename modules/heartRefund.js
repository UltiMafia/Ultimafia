// Who gets a heart back when a competitive game loses its integrity.
//
// The players owed a refund are the ones charged at start (`heartsCharged`),
// not whoever happens to still be seated. A player who died and left before the
// break paid in full and is gone from the seat list, and the seat-based loop
// skipped them — leaving them a heart short with nothing logged.
//
// The player responsible for the break is still excluded, by account rather than
// by seat, so a leaver or vegger keeps paying.
function refundTargets({ charged, excludedUserId, refunded }) {
  const userIds = (charged && charged.userIds) || [];
  const paid = refunded instanceof Set ? refunded : new Set(refunded || []);

  return userIds.filter(
    (userId) => userId && userId !== excludedUserId && !paid.has(userId)
  );
}

module.exports = { refundTargets, accountIdOf };

// The account behind a seat.
//
// Anonymous games replace the seat's user object and keep the real account id in
// `originalProfile` (Player.makeAnonymous), leaving `user.id` deleted and
// `player.userId` unset. Resolving the responsible player without that fallback
// yields undefined for the first anonymous vegger or leaver, so the ledger loop
// would hand them the refund they are supposed to lose.
function accountIdOf(player) {
  if (!player) return undefined;

  return (
    player.userId ||
    (player.user && player.user.id) ||
    (player.originalProfile && player.originalProfile.userId) ||
    undefined
  );
}
