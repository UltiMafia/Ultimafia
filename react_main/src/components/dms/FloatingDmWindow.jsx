import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { IconButton, Paper, Stack } from "@mui/material";

import Chat from "../../pages/Chat/Chat";
import { formatUnreadBadge } from "../../utils/unreadBadge";

import "css/countBadge.css";
import { useDmWindow } from "./DmWindowContext";
import {
  clampDmPos,
  DM_TITLE_BAR_HEIGHT,
  DM_WINDOW_HEIGHT,
  DM_WINDOW_WIDTH,
} from "../../utils/dmWindow";
import { useIsPhoneDevice } from "../../hooks/useIsPhoneDevice";
import { UserContext } from "../../Contexts";

// Floating DM window. Same drag-by-header / collapse pattern as the tutorial
// box (components/TutorialOverlay.jsx); the body is the homepage chatbox
// limited to DMs, drawn X Chat style (pages/Chat/Chat.jsx `panel`,
// components/dms/DmPanel.jsx). Mounted once at the app shell (Main.jsx) and not on game
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

  // Title bar: drag handle with the view's own content on the left (title,
  // or back arrow + who you're talking to), then collapse and X.
  function renderTitleBar({ left, actions }) {
    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        data-testid="dm-drag-handle"
        title="Drag to move"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          if (!e.target.closest("button")) dm.setCollapsed(!dm.collapsed);
        }}
        sx={{
          height: DM_TITLE_BAR_HEIGHT,
          pl: 1.5,
          pr: 0.75,
          cursor: "move",
          touchAction: "none",
          userSelect: "none",
          bgcolor: "background.paper",
          borderBottom: dm.collapsed ? "none" : "1px solid",
          borderColor: "divider",
        }}
      >
        {left}
        {dm.collapsed && unreadText && (
          <span
            className="count-badge"
            data-testid="count-badge"
            aria-label={`${unreadText} unread conversations`}
            style={{ position: "static", display: "inline-block", flexShrink: 0 }}
          >
            {unreadText}
          </span>
        )}
        {actions}
        <IconButton
          size="small"
          data-testid="dm-collapse"
          aria-label={dm.collapsed ? "Expand messages" : "Collapse messages"}
          title={dm.collapsed ? "Expand" : "Collapse"}
          onClick={() => dm.setCollapsed(!dm.collapsed)}
        >
          <i
            className={dm.collapsed ? "fas fa-chevron-up" : "fas fa-chevron-down"}
            style={{ fontSize: 13 }}
          />
        </IconButton>
        <IconButton
          size="small"
          data-testid="dm-close"
          aria-label="Close messages"
          title="Close"
          onClick={dm.close}
        >
          <i className="fas fa-times" style={{ fontSize: 14 }} />
        </IconButton>
      </Stack>
    );
  }

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
        // Below MUI dialogs/menus (1300) so menus open on top.
        zIndex: 1250,
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow:
          "rgba(101, 119, 134, 0.2) 0px 0px 15px, rgba(101, 119, 134, 0.15) 0px 0px 3px 1px",
      }}
    >
      <Chat
        directsOnly
        embedded
        panel
        paused={dm.collapsed}
        renderTitleBar={renderTitleBar}
        initialChannelId={dm.channelId}
        onChannelChange={dm.setChannelId}
        onUnreadChange={dm.setLiveUnread}
        onLocked={onLocked}
      />
    </Paper>
  );
}
