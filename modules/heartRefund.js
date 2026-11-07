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

module.exports = { refundTargets };
