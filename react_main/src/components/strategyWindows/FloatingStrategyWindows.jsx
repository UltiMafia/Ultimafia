import React, { useEffect, useRef, useState } from "react";
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";

import { StrategiesSection } from "../Strategies";
import {
  clampWindowPos,
  clampWindowSize,
  renderOrder,
  stackRank,
  viewportSize,
  windowTitle,
  STRATEGY_TITLE_BAR_HEIGHT,
} from "../../utils/strategyWindow";
import { useStrategyWindows } from "./StrategyWindowsContext";
import { useIsPhoneDevice } from "../../hooks/useIsPhoneDevice";

// Above the game's panels and the DM window (1250), below MUI dialogs/menus
// (1300) so a dialog still opens over a guide.
const Z_INDEX_BASE = 1260;

const HANDLE = 6; // resize strip thickness along an edge
const CORNER = 16;

function FloatingStrategyWindow({ win, zIndex }) {
  const sw = useStrategyWindows();
  const boxRef = useRef(null);
  const gesture = useRef(null);
  const liveRef = useRef(null);
  const [live, setLive] = useState(null);

  const collapsed = win.collapsed;
  const geom = live || {
    x: win.x,
    y: win.y,
    width: win.width,
    height: win.height,
  };

  function setLiveGeom(next) {
    liveRef.current = next;
    setLive(next);
  }

  function startGesture(e, mode, edge) {
    if (e.button !== undefined && e.button !== 0) return;
    if (mode === "move" && e.target.closest("button")) return;
    gesture.current = {
      mode,
      edge,
      pointerStartX: e.clientX,
      pointerStartY: e.clientY,
      start: { ...geom },
      dx: e.clientX - geom.x,
      dy: e.clientY - geom.y,
    };
    // The capture keeps the drag alive when the pointer leaves the window.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    e.preventDefault();
    e.stopPropagation();
  }

  function onPointerMove(e) {
    const g = gesture.current;
    if (!g) return;
    const viewport = viewportSize();

    if (g.mode === "move") {
      setLiveGeom({
        ...g.start,
        ...clampWindowPos(
          { x: e.clientX - g.dx, y: e.clientY - g.dy },
          { width: g.start.width, height: g.start.height },
          viewport
        ),
      });
      return;
    }

    const wantsWidth = g.edge.indexOf("e") !== -1;
    const wantsHeight = g.edge.indexOf("s") !== -1;
    const size = clampWindowSize(
      {
        width: wantsWidth
          ? g.start.width + (e.clientX - g.pointerStartX)
          : g.start.width,
        height: wantsHeight
          ? g.start.height + (e.clientY - g.pointerStartY)
          : g.start.height,
      },
      viewport
    );
    setLiveGeom({ ...g.start, ...size });
  }

  function onPointerUp() {
    if (!gesture.current) return;
    gesture.current = null;
    const committed = liveRef.current;
    liveRef.current = null;
    setLive(null);
    if (committed) sw.updateWindow(win.id, committed);
  }

  const titleBarHandlers = {
    onPointerDown: (e) => startGesture(e, "move"),
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  };

  return (
    <Paper
      ref={boxRef}
      elevation={12}
      data-testid="strategy-window"
      data-setup-id={win.setupId}
      data-collapsed={collapsed ? "true" : "false"}
      onPointerDownCapture={() => sw.focusWindow(win.id)}
      sx={{
        position: "fixed",
        left: geom.x,
        top: geom.y,
        width: geom.width,
        height: collapsed ? STRATEGY_TITLE_BAR_HEIGHT : geom.height,
        display: "flex",
        flexDirection: "column",
        zIndex,
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow:
          "rgba(101, 119, 134, 0.28) 0px 0px 18px, rgba(101, 119, 134, 0.18) 0px 0px 4px 1px",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        data-testid="strategy-window-titlebar"
        title="Drag to move"
        {...titleBarHandlers}
        onDoubleClick={(e) => {
          if (!e.target.closest("button")) sw.toggleCollapsed(win.id);
        }}
        sx={{
          flexShrink: 0,
          height: STRATEGY_TITLE_BAR_HEIGHT,
          pl: 1.25,
          pr: 0.5,
          cursor: "move",
          touchAction: "none",
          userSelect: "none",
          bgcolor: "action.hover",
          borderBottom: collapsed ? "none" : "1px solid",
          borderColor: "divider",
        }}
      >
        <i
          className="fas fa-book-open"
          style={{ fontSize: 13, opacity: 0.75 }}
        />
        <Typography
          variant="subtitle2"
          noWrap
          data-testid="strategy-window-title"
          sx={{ flexGrow: 1, minWidth: 0, fontWeight: 600 }}
        >
          {windowTitle(win)}
        </Typography>
        <Tooltip title={collapsed ? "Expand" : "Collapse"}>
          <IconButton
            size="small"
            data-testid="strategy-window-collapse"
            aria-label={collapsed ? "Expand guides" : "Collapse guides"}
            onClick={() => sw.toggleCollapsed(win.id)}
          >
            <i
              className={collapsed ? "fas fa-chevron-up" : "fas fa-chevron-down"}
              style={{ fontSize: 12 }}
            />
          </IconButton>
        </Tooltip>
        <Tooltip title="Close">
          <IconButton
            size="small"
            data-testid="strategy-window-close"
            aria-label="Close guides"
            onClick={() => sw.closeWindow(win.id)}
          >
            <i className="fas fa-times" style={{ fontSize: 13 }} />
          </IconButton>
        </Tooltip>
      </Stack>

      <Box
        data-testid="strategy-window-body"
        sx={{
          display: collapsed ? "none" : "flex",
          flex: 1,
          minHeight: 0,
          flexDirection: "column",
        }}
      >
        <StrategiesSection
          setupId={win.setupId}
          title={win.title}
          variant="fill"
          hideTitle
        />
      </Box>

      {!collapsed && (
        <>
          <Box
            data-testid="strategy-window-resize-e"
            aria-hidden
            onPointerDown={(e) => startGesture(e, "resize", "e")}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            sx={{
              position: "absolute",
              top: STRATEGY_TITLE_BAR_HEIGHT,
              right: 0,
              bottom: CORNER,
              width: HANDLE,
              cursor: "ew-resize",
              touchAction: "none",
            }}
          />
          <Box
            data-testid="strategy-window-resize-s"
            aria-hidden
            onPointerDown={(e) => startGesture(e, "resize", "s")}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            sx={{
              position: "absolute",
              left: 0,
              right: CORNER,
              bottom: 0,
              height: HANDLE,
              cursor: "ns-resize",
              touchAction: "none",
            }}
          />
          <Box
            data-testid="strategy-window-resize"
            aria-hidden
            onPointerDown={(e) => startGesture(e, "resize", "se")}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            sx={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: CORNER,
              height: CORNER,
              cursor: "nwse-resize",
              touchAction: "none",
              "&::after": {
                content: '""',
                position: "absolute",
                right: 4,
                bottom: 4,
                width: 7,
                height: 7,
                borderRight: "2px solid",
                borderBottom: "2px solid",
                borderColor: "text.disabled",
                borderBottomRightRadius: 2,
              },
            }}
          />
        </>
      )}
    </Paper>
  );
}

// One entry per open guide window, drawn bottom-to-top in stack order. Mounted
// once at the app shell, so the windows stay on screen while the user plays or
// moves between site pages.
export default function FloatingStrategyWindows() {
  const { windows } = useStrategyWindows();
  const isPhone = useIsPhoneDevice();

  // Phones get the guides in the game's Info tab instead (and a finger-sized
  // drag target is not worth the screen space).
  if (isPhone || !windows.length) return null;

  // Rendered in creation order so raising a window only changes its
  // z-index: reordering the DOM under a pointerdown would swallow the click
  // that raised it.
  return renderOrder(windows).map((win) => (
    <FloatingStrategyWindow
      key={win.id}
      win={win}
      zIndex={Z_INDEX_BASE + stackRank(windows, win.id)}
    />
  ));
}
