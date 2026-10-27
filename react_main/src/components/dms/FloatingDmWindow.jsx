import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Box, IconButton, Paper, Stack, Typography } from "@mui/material";

import Chat from "../../pages/Chat/Chat";
import { formatUnreadBadge } from "../../utils/unreadBadge";

import "css/countBadge.css";
import { useDmWindow } from "./DmWindowContext";
import {
  clampDmPos,
  DM_WINDOW_HEIGHT,
  DM_WINDOW_WIDTH,
} from "../../utils/dmWindow";
import { useIsPhoneDevice } from "../../hooks/useIsPhoneDevice";
import { UserContext } from "../../Contexts";

// Floating DM window. Same drag-by-header / collapse pattern as the tutorial
// box (components/TutorialOverlay.jsx); the body is the homepage chatbox
// limited to DMs. Mounted once at the app shell (Main.jsx) and not on game
// pages, so it stays put while the user browses the site.
export default function FloatingDmWindow() {
  const dm = useDmWindow();
  const user = useContext(UserContext);
  const isPhone = useIsPhoneDevice();
  const boxRef = useRef(null);
  const drag = useRef(null);
  const [livePos, setLivePos] = useState(null);

  const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });
  const size = () => ({
    width: boxRef.current ? boxRef.current.offsetWidth : DM_WINDOW_WIDTH,
    height: boxRef.current ? boxRef.current.offsetHeight : DM_WINDOW_HEIGHT,
  });

  useEffect(() => {
    function onResize() {
      if (dm.pos) dm.setPos(clampDmPos(dm.pos, size(), viewport()));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [dm.pos, dm.setPos]);

  // Locked (alive in a running ranked/competitive game): close the window.
  useEffect(() => {
    if (dm.access.locked && dm.open) dm.close();
  }, [dm.access.locked, dm.open]);

  const onLocked = useCallback(() => {
    dm.refreshAccess();
  }, [dm.refreshAccess]);

  if (!user.loggedIn || !dm.open || dm.access.locked) return null;

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
    setLivePos(
      clampDmPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy }, size(), viewport())
    );
  }

  function onPointerUp() {
    if (!drag.current) return;
    drag.current = null;
    setLivePos((p) => {
      if (p) dm.setPos(p);
      return null;
    });
  }

  const unreadText = formatUnreadBadge(dm.unread);
  const pos = livePos || dm.pos;
  const placed = pos
    ? { left: pos.x, top: pos.y }
    : isPhone
    ? { right: 8, bottom: "calc(72px + env(safe-area-inset-bottom))" }
    : { right: 24, bottom: 24 };
  const bodyHeight = DM_WINDOW_HEIGHT - 44 - 48;

  return (
    <Paper
      ref={boxRef}
      elevation={10}
      data-testid="dm-window"
      data-collapsed={dm.collapsed ? "true" : "false"}
      sx={{
        position: "fixed",
        ...placed,
        width: DM_WINDOW_WIDTH,
        maxWidth: "calc(100vw - 16px)",
        // Below MUI dialogs/menus (1300) so "New" and the channel picker open on top.
        zIndex: 1250,
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        data-testid="dm-drag-handle"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          if (!e.target.closest("button")) dm.setCollapsed(!dm.collapsed);
        }}
        sx={{
          height: 44,
          px: 1.25,
          cursor: "move",
          touchAction: "none",
          userSelect: "none",
          bgcolor: "action.hover",
          borderBottom: dm.collapsed ? "none" : "1px solid",
          borderColor: "divider",
        }}
      >
        <i className="fas fa-comment-dots" style={{ fontSize: 16 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }} noWrap>
          Messages
          {dm.collapsed && unreadText && (
            <span
              className="count-badge"
              data-testid="count-badge"
              aria-label={`${unreadText} unread conversations`}
              style={{ position: "static", display: "inline-block", marginLeft: 6, verticalAlign: "middle" }}
            >
              {unreadText}
            </span>
          )}
          <span style={{ opacity: 0.6, fontWeight: 400 }}> · drag to move</span>
        </Typography>
        <IconButton
          size="small"
          data-testid="dm-collapse"
          aria-label={dm.collapsed ? "Expand messages" : "Collapse messages"}
          onClick={() => dm.setCollapsed(!dm.collapsed)}
        >
          {dm.collapsed ? "▴" : "▾"}
        </IconButton>
        <IconButton
          size="small"
          data-testid="dm-close"
          aria-label="Close messages"
          onClick={dm.close}
        >
          <i className="fas fa-times" style={{ fontSize: 14 }} />
        </IconButton>
      </Stack>
      {/* Kept mounted while collapsed so the socket and unread counts stay live. */}
      <Box sx={{ display: dm.collapsed ? "none" : "block" }}>
        <Chat
          directsOnly
          embedded
          paused={dm.collapsed}
          height={`min(${bodyHeight}px, calc(100dvh - 160px))`}
          onUnreadChange={dm.setLiveUnread}
          onLocked={onLocked}
        />
      </Box>
    </Paper>
  );
}
