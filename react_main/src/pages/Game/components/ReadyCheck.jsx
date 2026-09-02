import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

export default function ReadyCheckDialog({ open, endTime, onReady, onLeave }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!open) return;

    // Blur any focused input to dismiss mobile keyboard
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, [open, endTime]);

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

  return (
    <Dialog open={open} maxWidth="xs" fullWidth disableEscapeKeyDown>
      <DialogTitle sx={{ textAlign: "center" }}>Are you ready?</DialogTitle>
      <DialogContent>
        <Stack alignItems="center" spacing={2}>
          <Typography variant="body1">
            The game is starting! Please confirm you are here.
          </Typography>
          <Typography variant="h4" color={timeLeft < 10000 ? "error" : "primary"}>
            {(timeLeft / 1000).toFixed(0)}s
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Failure to ready up will result in being kicked.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          onClick={onLeave}
          color="error"
          variant="outlined"
          data-ready-check-leave
        >
          Leave Game
        </Button>
        <Button
          onClick={onReady}
          color="success"
          variant="contained"
          size="large"
          autoFocus
        >
          I am Ready
        </Button>
      </DialogActions>
    </Dialog>
  );
}
