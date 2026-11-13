import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { IconButton, Paper, Stack } from "@mui/material";
import FocusTrap from "@mui/material/Unstable_TrapFocus";
import UiIcon from "../ui/UiIcon";
import { useDismissOnBack } from "../../hooks/useDismissOnBack";

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
  useDismissOnBack(isPhone && user.loggedIn && dm.open && !dm.access.locked, dm.close);
  useEffect(() => {
    if (isPhone && dm.open && dm.collapsed) dm.setCollapsed(false);
  }, [isPhone, dm.open, dm.collapsed, dm.setCollapsed]);

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
    if (isPhone) return;
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
  const placed = isPhone
    ? { left: 0, right: 0, top: "var(--app-top, 0px)", bottom: "var(--app-bottom, 0px)" }
    : pos
    ? { left: pos.x, top: pos.y }
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
        title={isPhone ? undefined : "Drag to move"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          if (!isPhone && !e.target.closest("button")) dm.setCollapsed(!dm.collapsed);
        }}
        sx={{
          minHeight: DM_TITLE_BAR_HEIGHT, flexShrink: 0,
          pl: 1.5,
          pr: 0.75,
          cursor: isPhone ? undefined : "move",
          touchAction: isPhone ? "auto" : "none",
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
        {!isPhone && <IconButton
          size="small"
          data-testid="dm-collapse"
          aria-label={dm.collapsed ? "Expand messages" : "Collapse messages"}
          title={dm.collapsed ? "Expand" : "Collapse"}
          onClick={() => dm.setCollapsed(!dm.collapsed)}
        >
          <UiIcon name={dm.collapsed ? "up" : "down"} size={18} />
        </IconButton>}
        <IconButton
          size="small"
          data-testid="dm-close"
          aria-label="Close messages"
          title="Close"
          onClick={dm.close}
        >
          <UiIcon name="close" size={20} />
        </IconButton>
      </Stack>
    );
  }

  return (
    <FocusTrap open={isPhone}>
    <Paper
      ref={boxRef}
      elevation={10}
      data-testid="dm-window"
      data-collapsed={dm.collapsed ? "true" : "false"}
      role={isPhone ? "dialog" : "region"} aria-modal={isPhone ? true : undefined} aria-label="Direct messages" tabIndex={-1}
      sx={{
        position: "fixed",
        ...placed,
        width: isPhone ? "auto" : DM_WINDOW_WIDTH,
        maxWidth: isPhone ? "none" : "calc(100vw - 16px)",
        display: "flex", flexDirection: "column", minHeight: 0,
        ...(isPhone ? { "& [data-testid='dm-chat']": { height: "auto", flex: 1, minHeight: 0 } } : {}),
        // Below MUI dialogs/menus (1300) so menus open on top.
        zIndex: 1250,
        borderRadius: isPhone ? 0 : 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow:
          "rgba(0, 0, 0, 0.24) 0px 0px 15px, rgba(0, 0, 0, 0.18) 0px 0px 3px 1px",
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
    </FocusTrap>
  );
}
