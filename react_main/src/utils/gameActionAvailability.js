function hasGameActionResponse(meeting, self) {
  // The server knows whether a response exists even when votes are anonymous.
  if (typeof meeting?.playerHasVoted === "boolean") {
    return meeting.playerHasVoted;
  }

  if (
    self == null ||
    !Object.prototype.hasOwnProperty.call(meeting?.votes || {}, self)
  ) {
    return false;
  }

  const response = meeting.votes[self];
  // null represents a hidden response. An empty multi-selection is unvoted,
  // while false, zero and an empty text response are still responses.
  return Array.isArray(response)
    ? response.length > 0
    : response !== undefined;
}

export function getGameActionAvailability({
  meeting,
  history,
  stateViewing,
  self,
  review = false,
} = {}) {
  const isCurrentState =
    stateViewing != null &&
    history?.currentState != null &&
    stateViewing === history.currentState;
  const hasVoted = hasGameActionResponse(meeting, self);

  let reason = null;
  if (review) reason = "Game review is read-only.";
  else if (!meeting) reason = "This action is unavailable.";
  else if (history?.currentState == null)
    reason = "The current phase is unavailable.";
  else if (stateViewing == null) reason = "No phase is selected.";
  else if (!isCurrentState) reason = "View the current phase to act.";
  else if (meeting.finished) reason = "This action has finished.";
  else if (!meeting.amMember)
    reason = "You are not a member of this meeting.";
  else if (!meeting.canVote) reason = "You cannot vote in this meeting.";
  else if (
    hasVoted &&
    ((meeting.instant && !meeting.instantButChangeable) || meeting.noUnvote)
  ) {
    reason = "Your response cannot be changed.";
  }

  // A current postgame meeting (-2) follows the same server permissions.
  return { canAct: reason === null, reason, isCurrentState, hasVoted };
}

// A hidden or absent response must never become an unvote just because a
// proposed selection is also null/undefined. Compare raw values, not labels.
export function isGameActionSelection({ meeting, self, selection } = {}) {
  if (
    selection == null ||
    !hasGameActionResponse(meeting, self) ||
    self == null ||
    !Object.prototype.hasOwnProperty.call(meeting?.votes || {}, self)
  ) {
    return false;
  }

  const response = meeting.votes[self];
  return Array.isArray(response)
    ? response.includes(selection)
    : response === selection;
}
