import React, { useState, useEffect } from "react";
import { Stack } from "@mui/material";
import { readyCheckLocalEnd } from "utils/timerSync";
import { UiAction, UiDialog, UiText as Typography } from "components/ui";

export default function ReadyCheckDialog({
  open,
  endTime,
  timeLeft,
  onReady,
  onLeave,
}) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!open) return;

    // Blur any focused input to dismiss mobile keyboard
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const localEnd = readyCheckLocalEnd(Date.now(), { timeLeft, endTime });
    let interval;

    const tick = () => {
      const left = Math.max(0, localEnd - Date.now());
      setRemaining(left);
      if (left <= 0) clearInterval(interval);
    };

    tick();
    interval = setInterval(tick, 100);

    return () => clearInterval(interval);
  }, [open, endTime, timeLeft]);

  // Enter confirms Ready. Capture so Game.jsx's global "focus the chat
  // input" listener does not steal the key. Leave Game still works if
  // that button is focused (Tab + Enter).
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key !== "Enter" && e.key !== "NumpadEnter") return;
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
      if (e.target instanceof HTMLElement && e.target.closest("[data-ready-check-leave]")) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      onReady();
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, onReady]);

  if (!open) return null;

  // The shared dialog owns the title/content/action insets. This dialog is not
  // dismissible: the ready check must be answered, not escaped.
  return (
    <UiDialog
      open={open}
      size="xs"
      title="Are you ready?"
      dismissible={false}
      actions={<>
        <UiAction onClick={onLeave} data-ready-check-leave>Leave Game</UiAction>
        <UiAction tone="brand" onClick={onReady} autoFocus>I am Ready</UiAction>
      </>}
    >
      <Stack alignItems="center" spacing={2}>
        <Typography variant="body1">
          The game is starting! Please confirm you are here.
        </Typography>
        <Typography variant="h4" color={remaining < 10000 ? "error" : "primary"}>
          {(remaining / 1000).toFixed(0)}s
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Failure to ready up will move you to spectators.
        </Typography>
      </Stack>
    </UiDialog>
  );
}
