// This is command help, not a prediction of whether the server accepts a vote.
export function dayExtensionHint(game, isCurrentState) {
  const state = game.history?.states?.[game.history.currentState];
  if (
    game.gameType !== "Mafia" ||
    !isCurrentState ||
    game.review ||
    game.finished ||
    game.isSpectator ||
    state?.name?.replace(/[0-9]*/g, "").trim() !== "Day"
  ) {
    return null;
  }

  const minutes = game.options?.gameTypeOptions?.extendLength ?? 3;
  if (minutes === 0 || minutes === "0") return "Day extensions are disabled.";
  return `Vote to extend Day: type /extend and press Enter (${minutes} ${minutes === 1 || minutes === "1" ? "minute" : "minutes"}).`;
}
