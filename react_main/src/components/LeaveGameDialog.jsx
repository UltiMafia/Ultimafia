import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import UiAction from "./ui/UiAction";
import { useDismissOnBack } from "../hooks/useDismissOnBack";

const DEFAULT_LOCK_SECONDS = 10;

export default function LeaveGameDialog({
  open,
  onClose,
  onConfirm,
  isParticipationRequired = false,
  lockSeconds = DEFAULT_LOCK_SECONDS,
  isPenaltyEnforced = true,
  warningMessage = null,
}) {
  const [lockSessionStarted, setLockSessionStarted] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(
    isParticipationRequired ? lockSeconds : 0
  );

  useEffect(() => {
    if (!open || !isParticipationRequired) {
      setLockSessionStarted(false);
      setLockRemaining(0);
      return;
    }
    setLockRemaining(lockSeconds);
    setLockSessionStarted(true);
    const interval = setInterval(() => {
      setLockRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open, isParticipationRequired, lockSeconds]);

  const isLocked = isParticipationRequired && (lockRemaining > 0 || (!lockSessionStarted && lockSeconds > 0));

  // The Android/browser Back button closes the dialog rather than leaving the
  // game route.
  useDismissOnBack(open, onClose);

  return (
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
        aria-labelledby="leave-game-title" aria-describedby="leave-game-description">
        <DialogTitle id="leave-game-title" sx={{ fontSize: "1.125rem", fontWeight: 600 }}>Leave game?</DialogTitle>
        <DialogContent id="leave-game-description">
          <Typography variant="body2" color="text.secondary">
            Leaving ends your participation. To browse the site without leaving,
            cancel and choose Browse site. Your seat and game
            connection stay active while browsing.
          </Typography>
          {(isParticipationRequired || warningMessage) && (
            <Typography
              variant="body2"
              sx={{ color: "error.main", fontWeight: 600, mt: 2 }}
            >
              {warningMessage || (isPenaltyEnforced
                ? "You will receive a penalty for leaving this game."
                : "Your participation is still required.")}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <UiAction onClick={onClose} autoFocus>
            Stay
          </UiAction>
          <UiAction variant="danger" disabled={isLocked || !open} onClick={() => { if (open && !isLocked) onConfirm?.(); }}>
            {isLocked ? `Leave game (${lockRemaining})` : "Leave game"}
          </UiAction>
        </DialogActions>
      </Dialog>

  );
}
