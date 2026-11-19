const DAY = 86400000;

// Restart changes the clock origin, never historical startDate/day identifiers.
function competitiveDayDeadline(round, extraDays = 0) {
  const origin = round.clockBaseAt ?? new Date(round.startDate).getTime();
  return new Date(origin + (round.currentDay + extraDays) * DAY);
}
module.exports = { DAY, competitiveDayDeadline };
