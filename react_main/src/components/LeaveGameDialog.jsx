import React, { useState, useEffect } from "react";


import UiAction from "./ui/UiAction";
import { UiText as Typography, UiDialog } from "components/ui";

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

  return (
    <UiDialog
      open={open}
      onClose={onClose}
      size="xs"
      title="Leave game?"
      actions={<>
        <UiAction onClick={onClose} autoFocus>
          Stay
        </UiAction>
        <UiAction variant="danger" disabled={isLocked || !open} onClick={() => { if (open && !isLocked) onConfirm?.(); }}>
          {isLocked ? `Leave game (${lockRemaining})` : "Leave game"}
        </UiAction>
      </>}
    >
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
    </UiDialog>
  );
}
