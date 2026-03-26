function isAprilFirstUtc(date = new Date()) {
  return date.getUTCMonth() === 3 && date.getUTCDate() === 1;
}

function isRoleDisabled(gameType, roleName, roleDef, date = new Date()) {
  if (
    gameType === "Mafia" &&
    roleName === "War Demon" &&
    isAprilFirstUtc(date)
  ) {
    return false;
  }

  return Boolean(roleDef?.disabled);
}

module.exports = {
  isRoleDisabled,
};
