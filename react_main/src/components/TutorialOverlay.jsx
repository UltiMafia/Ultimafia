import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Box, Button, IconButton, Paper, Stack, Typography } from "@mui/material";

import { useSocketListeners } from "pages/Game/Game";
import { UserContext } from "../Contexts";
import { HIGHLIGHT_CLASS, HIGHLIGHT_CSS, resolveHighlights } from "../lib/tutorialHighlight";

const POS_KEY = "tutorialBoxPos";

// Guided steps for the new-user tutorial. The game server sends "tutorial"
// events (Games/core/tutorial/TutorialController.js) with the current
// instruction. The box has no action buttons: decisions are made in the real
// meetings and chat, which the step highlights (lib/tutorialHighlight.js);
// the server judges the actual vote or chat line. "tutorialPhase" says whether Continue is enabled: phases only end
// when the player clicks it. Tutorial messages wait for Next (hasNext). The box can be dragged anywhere by its header
// and collapsed.
export default function TutorialOverlay({ socket }) {
  const user = useContext(UserContext);
  const [step, setStep] = useState(null);
  const [canContinue, setCanContinue] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
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
    });
    socket.on("tutorialPhase", (data) => {
      setCanContinue(Boolean(data && data.canContinue));
    });
  }, socket);

  // Ask the server for the current step on mount and whenever the socket
  // changes (rejoining the game or refreshing the page).
  useEffect(() => {
    if (socket && socket.send) socket.send("tutorialSync");
  }, [socket]);

  // Keep the box on screen after a resize.
  // Pulse the real UI the current step points at. Re-resolved on a short
  // interval so it follows tab switches and dropdowns opening.
  const highlight = step && !step.done && !collapsed ? step.highlight : null;
  useEffect(() => {
    if (!highlight || !highlight.length) return undefined;
    let style = document.getElementById("tutorial-highlight-css");
    if (!style) {
      style = document.createElement("style");
      style.id = "tutorial-highlight-css";
      style.textContent = HIGHLIGHT_CSS;
      document.head.appendChild(style);
    }
    let lit = [];
    const apply = () => {
      const els = resolveHighlights(highlight, document);
      lit.forEach((el) => !els.includes(el) && el.classList.remove(HIGHLIGHT_CLASS));
      els.forEach((el) => el.classList.add(HIGHLIGHT_CLASS));
      lit = els;
    };
    apply();
    const id = setInterval(apply, 400);
    return () => {
      clearInterval(id);
      lit.forEach((el) => el.classList.remove(HIGHLIGHT_CLASS));
    };
  }, [highlight]);

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
      {!collapsed && step.examples && step.examples.length > 0 && !step.done && (
        <Box sx={{ mt: 1.5 }} data-testid="tutorial-examples">
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            For example, type in chat:
          </Typography>
          {step.examples.map((line) => (
            <Typography
              key={line}
              variant="body2"
              sx={{ fontStyle: "italic", overflowWrap: "anywhere" }}
            >
              "{line}"
            </Typography>
          ))}
        </Box>
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
