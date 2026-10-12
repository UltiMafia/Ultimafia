import * as imported from "./timerSyncMath.js";

function unwrap(mod) {
  let current = mod;

  for (let i = 0; i < 3; i++) {
    if (current && typeof current.readyCheckLocalEnd === "function") {
      return current;
    }
    current = current && current.default;
  }

  return mod || {};
}

const timerSync = unwrap(imported);

export const readyCheckFields = timerSync.readyCheckFields;
export const readyCheckLocalEnd = timerSync.readyCheckLocalEnd;
export const canApplyTimerTime = timerSync.canApplyTimerTime;
export const timerTimeAction = timerSync.timerTimeAction;
export const timerRemainingMs = timerSync.timerRemainingMs;
export const formatTimerTime = timerSync.formatTimerTime;
export const formatSyncedTimer = timerSync.formatSyncedTimer;
