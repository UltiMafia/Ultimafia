import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Box, Button, IconButton, Paper, Stack, Typography } from "@mui/material";

import { useSocketListeners } from "pages/Game/Game";
import { UserContext } from "../Contexts";

const POS_KEY = "tutorialBoxPos";

// Guided steps for the new-user tutorial. The game server sends "tutorial"
// events (Games/core/tutorial/TutorialController.js) with the current
// instruction and, at each decision, multiple-choice buttons; a button sends
// "tutorialChoose" and the server casts the vote or says the line for the
// player. "tutorialPhase" says whether Continue is enabled: phases only end
// when the player clicks it. Tutorial messages wait for Next (hasNext). The box can be dragged anywhere by its header
// and collapsed.
export default function TutorialOverlay({ socket }) {
  const user = useContext(UserContext);
  const [step, setStep] = useState(null);
  const [canContinue, setCanContinue] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [sent, setSent] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [pos, setPos] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem(POS_KEY)) || null;
    } catch (e) {
      return null;
    }
  });
  const boxRef = useRef(null);
  const drag = useRef(null);

  useSocketListeners((socket) => {
    socket.on("tutorial", (data) => {
      if (!data) return;
      setStep(data);
      if (typeof data.canContinue == "boolean") setCanContinue(data.canContinue);
      setSent(false);
    });
    socket.on("tutorialPhase", (data) => {
      setCanContinue(Boolean(data && data.canContinue));
    });
  }, socket);

  // Keep the box on screen after a resize.
  useEffect(() => {
    function clamp() {
      setPos((p) => (p ? clampPos(p, boxRef.current) : p));
    }
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, []);

  if (!step) return null;

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest("button")) return;
    const rect = boxRef.current.getBoundingClientRect();
    drag.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!drag.current) return;
    setPos(clampPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy }, boxRef.current));
  }

  function onPointerUp() {
    if (!drag.current) return;
    drag.current = null;
    setPos((p) => {
      if (p) window.localStorage.setItem(POS_KEY, JSON.stringify(p));
      return p;
    });
  }

  function choose(choice) {
    socket.send("tutorialChoose", { id: choice.id });
    setSent(true);
  }

  function nextStep() {
    socket.send("tutorialNext");
    setStep((st) => (st ? { ...st, hasNext: false } : st));
  }

  function next() {
    socket.send("tutorialContinue");
    setCanContinue(false);
  }

  // Leave for real: the server closes the tutorial game when its player
  // leaves, and the in-game flag is cleared before navigating away.
  function leaveTo(path, rehost) {
    if (leaving) return;
    setLeaving(true);
    if (socket.send) socket.send("leave");
    if (user.setInGame) user.setInGame(null);
    setTimeout(async () => {
      try {
        await axios.post("/api/game/leave");
      } catch (e) {}
      if (rehost) {
        try {
          const res = await axios.post("/api/game/tutorial/host", { storyline: rehost });
          window.location.href = `/game/${res.data}`;
          return;
        } catch (e) {}
      }
      window.location.href = path;
    }, 400);
  }

  const placed = pos
    ? { left: pos.x, top: pos.y }
    : {
        left: "50%",
        transform: "translateX(-50%)",
        bottom: { xs: "calc(72px + env(safe-area-inset-bottom))", md: 24 },
      };

  return (
    <Paper
      ref={boxRef}
      elevation={8}
      data-testid="tutorial-overlay"
      sx={{
        position: "fixed",
        ...placed,
        width: { xs: "calc(100% - 16px)", sm: 520 },
        maxWidth: "calc(100vw - 16px)",
        zIndex: 1300,
        p: collapsed ? 1 : { xs: 1.5, sm: 2 },
        boxSizing: "border-box",
        maxHeight: "min(70vh, calc(100dvh - 16px))",
        overflowY: "auto",
        overflowX: "hidden",
        overscrollBehavior: "contain",
        border: "2px solid #7fb6ff",
        borderRadius: 2,
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        spacing={1}
        data-testid="tutorial-drag-handle"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        sx={{ cursor: "move", touchAction: "none", userSelect: "none" }}
      >
        <Typography sx={{ fontSize: 20, lineHeight: 1.2 }}>📘</Typography>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap sx={{ color: "#7fb6ff" }}>
            Tutorial <span style={{ opacity: 0.6, fontWeight: 400 }}>· drag to move</span>
          </Typography>
          {!collapsed && (
            <Typography
              variant="body2"
              sx={{ mt: 0.5, cursor: "auto", userSelect: "text", overflowWrap: "anywhere", wordBreak: "break-word" }}
            >
              {step.text}
            </Typography>
          )}
        </Box>
        <IconButton
          size="small"
          sx={{ minWidth: 40, minHeight: 40, mt: -0.75, mr: -0.75, flexShrink: 0 }}
          data-testid="tutorial-collapse"
          aria-label={collapsed ? "Expand tutorial" : "Collapse tutorial"}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "▴" : "▾"}
        </IconButton>
      </Stack>
      {!collapsed && step.choices && !step.done && (
        <Stack spacing={1} sx={{ mt: 1.5 }}>
          {step.choices.map((choice) => (
            <Button
              key={choice.id}
              variant="outlined"
              size="small"
              disabled={sent}
              data-testid={`tutorial-choice-${choice.id}`}
              onClick={() => choose(choice)}
              sx={{
                justifyContent: "flex-start",
                textAlign: "left",
                textTransform: "none",
                whiteSpace: "normal",
                overflowWrap: "anywhere",
                minHeight: 40,
                lineHeight: 1.3,
              }}
            >
              {choice.label}
            </Button>
          ))}
        </Stack>
      )}
      {!collapsed && !step.done && (
        <Stack
          direction={{ xs: "column-reverse", sm: "row" }}
          justifyContent="flex-end"
          useFlexGap
          gap={1}
          sx={{ mt: 1.5, "& > button": { minHeight: 40, width: { xs: "100%", sm: "auto" } } }}
        >
          <Button
            variant={step.hasNext ? "contained" : "outlined"}
            size="small"
            data-testid="tutorial-next"
            disabled={!step.hasNext}
            onClick={nextStep}
          >
            Next
          </Button>
          <Button
            variant={canContinue ? "contained" : "outlined"}
            size="small"
            data-testid="tutorial-continue"
            disabled={!canContinue}
            onClick={next}
            title={canContinue ? "" : "Finish this phase's steps first"}
          >
            Continue / Next phase ▸
          </Button>
        </Stack>
      )}
      {!collapsed && step.done && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          useFlexGap
          gap={1}
          flexWrap="wrap"
          sx={{ mt: 1.5, "& > button": { minHeight: 40, width: { xs: "100%", sm: "auto" } } }}
        >
          {step.failed && (
            <Button variant="contained" size="small" disabled={leaving} onClick={() => leaveTo("/play/tutorial", step.storyline)}>
              Try again
            </Button>
          )}
          <Button variant={step.failed ? "outlined" : "contained"} size="small" disabled={leaving} onClick={() => leaveTo("/play/tutorial")}>
            Play another tutorial
          </Button>
          <Button size="small" disabled={leaving} onClick={() => leaveTo("/play")}>
            Back to Play
          </Button>
        </Stack>
      )}
    </Paper>
  );
}

function clampPos(p, el) {
  const w = el ? el.offsetWidth : 320;
  const h = el ? el.offsetHeight : 120;
  return {
    x: Math.max(4, Math.min(p.x, window.innerWidth - w - 4)),
    y: Math.max(4, Math.min(p.y, window.innerHeight - Math.min(h, 60))),
  };
}
