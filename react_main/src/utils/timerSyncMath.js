// CommonJS so the game server and mocha can require it. The React client
// imports the named bindings through utils/timerSync.js.

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function readyCheckFields(endTime, now, readyPlayers) {
  return {
    endTime,
    timeLeft: endTime - now,
    readyPlayers,
  };
}

// Capture the deadline when the message arrives. A relative timeLeft ignores
// client clock skew; endTime is only a fallback for older servers.
function readyCheckLocalEnd(now, sync) {
  if (sync != null && isFiniteNumber(sync.timeLeft)) {
    return now + sync.timeLeft;
  }

  if (sync != null && isFiniteNumber(sync.endTime)) {
    return sync.endTime;
  }

  return now;
}

function canApplyTimerTime(timer) {
  return timer != null && isFiniteNumber(timer.delay);
}

// "time" packets before timerInfo have no delay. Applying them renders NaN,
// which the clock formats as 00:00. Ask for timerInfo instead.
function timerTimeAction(timer, time) {
  if (!canApplyTimerTime(timer) || !isFiniteNumber(time)) {
    return { apply: false, requestInfo: true };
  }

  return { apply: true, requestInfo: false, time };
}

function timerRemainingMs(timer) {
  if (!canApplyTimerTime(timer) || !isFiniteNumber(timer.time)) return null;

  const remaining = timer.delay - timer.time;
  if (!isFiniteNumber(remaining)) return null;
  return remaining;
}

function formatTimerTime(time) {
  if (time > 0) time = Math.round(time / 1000);
  else time = 0;

  const minutes = String(Math.floor(time / 60)).padStart(2, "0");
  const seconds = String(time % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
}

// null means "unknown" (show a placeholder). A real expiry is "00:00".
function formatSyncedTimer(timer) {
  const remaining = timerRemainingMs(timer);
  if (remaining == null) return null;
  return formatTimerTime(remaining);
}

module.exports = {
  readyCheckFields,
  readyCheckLocalEnd,
  canApplyTimerTime,
  timerTimeAction,
  timerRemainingMs,
  formatTimerTime,
  formatSyncedTimer,
};
