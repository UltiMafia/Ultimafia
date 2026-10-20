// Which seat button the pregame chat footer shows: "join" (a spectator can take
// an open seat), "spectate" (a seated player can move to the spectators, if the
// lobby allows spectating), or null. Shared with the server-side test suite.

function settingIsTrueValue(value) {
  return value === true || value === "true";
}

function pregameSeatAction({ review, history, isSpectator, options } = {}) {
  if (review || !history || history.currentState != -1) return null;
  if (isSpectator) return "join";
  if (settingIsTrueValue(options && options.spectating)) return "spectate";
  return null;
}

module.exports = { pregameSeatAction };
