import React, { useState } from "react";
import { Box, Button, IconButton, Paper, Stack, Typography } from "@mui/material";

import { useSocketListeners } from "pages/Game/Game";

// Guided steps for the new-user tutorial. The game server sends "tutorial"
// events (Games/core/tutorial/TutorialController.js) with the current
// instruction plus, when the step needs an action, buttons that cast the
// scripted vote or send the suggested chat line. Only scripted actions are
// accepted server-side; the instructions also appear in chat as system
// messages.
export default function TutorialOverlay({ socket }) {
  const [step, setStep] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [sent, setSent] = useState(false);

  useSocketListeners((socket) => {
    socket.on("tutorial", (data) => {
      if (!data) return;
      setStep((prev) =>
        // Keep the last action buttons when a follow-up hint arrives without new ones.
        data.choices || data.example || data.done || !prev
          ? data
          : { ...prev, text: data.text }
      );
      setSent(false);
      setMinimized(false);
    });
  }, socket);

  if (!step) return null;

  function vote(choice) {
    if (!choice.meetingId) return;
    socket.send("vote", { meetingId: choice.meetingId, selection: choice.selection });
    setSent(true);
  }

  function say() {
    if (!step.meetingId || !step.example) return;
    socket.send("speak", { meetingId: step.meetingId, content: step.example });
    setSent(true);
  }

  return (
    <Paper
      elevation={8}
      data-testid="tutorial-overlay"
      sx={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: { xs: "calc(72px + env(safe-area-inset-bottom))", md: 24 },
        width: { xs: "calc(100% - 16px)", sm: 520 },
        zIndex: 1300,
        p: minimized ? 1 : 2,
        border: "2px solid #7fb6ff",
        borderRadius: 2,
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1}>
        <Typography sx={{ fontSize: 20, lineHeight: 1.2 }}>📘</Typography>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ color: "#7fb6ff" }}>
            Tutorial
          </Typography>
          {!minimized && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {step.text}
            </Typography>
          )}
        </Box>
        <IconButton
          size="small"
          aria-label={minimized ? "Expand tutorial" : "Minimize tutorial"}
          onClick={() => setMinimized(!minimized)}
        >
          {minimized ? "▴" : "▾"}
        </IconButton>
      </Stack>
      {!minimized && step.choices && !step.done && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap">
          {step.choices.map((choice) => (
            <Button
              key={choice.id}
              variant="contained"
              size="small"
              disabled={sent || !choice.meetingId}
              onClick={() => vote(choice)}
            >
              {choice.label}
            </Button>
          ))}
        </Stack>
      )}
      {!minimized && step.example && !step.done && (
        <Stack spacing={1} sx={{ mt: 1.5 }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Type it in the chat box in your own words, or click to send:
          </Typography>
          <Button variant="outlined" size="small" disabled={sent} onClick={say}>
            “{step.example}”
          </Button>
        </Stack>
      )}
      {!minimized && step.done && (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button variant="contained" size="small" href="/play/tutorial">
            Play another tutorial
          </Button>
          <Button size="small" href="/play">
            Back to Play
          </Button>
        </Stack>
      )}
    </Paper>
  );
}
