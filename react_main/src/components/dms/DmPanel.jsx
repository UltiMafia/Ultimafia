import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputBase,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { alpha, useTheme } from "@mui/material/styles";

import { Avatar, StatusIcon } from "../../pages/User/UserWidgets";
import { UserText } from "../Basic";
import EmotePicker from "../EmotePicker";
import { MaxChatMessageLength } from "../../Constants";
import { formatUnreadBadge } from "../../utils/unreadBadge";
import {
  dmPreviewText,
  dmTitle,
  formatDmTime,
  groupMessages,
  insertEmote,
  isGroupDm,
  isStickerOnlyMessage,
  otherMembers,
  sortDirects,
} from "../../utils/dmWindow";
import { UserContext } from "../../Contexts";

// X Chat style body of the floating DM window: a conversation list, one
// conversation (back arrow top-left), and a new-message view where you type
// names. All state and socket traffic live in pages/Chat/Chat.jsx (`panel`),
// the same code the homepage chatbox runs; this file only draws it.
export default function DmPanel(props) {
  const {
    loading,
    user,
    directs,
    notifsByChannel,
    channel,
    currentChannelId,
    composing,
    collapsed,
    dmLocked,
    sendError,
    renderTitleBar,
  } = props;

  const sorted = useMemo(() => sortDirects(directs), [directs]);
  const current = currentChannelId
    ? sorted.find((c) => c.id === currentChannelId) ||
      (channel.id === currentChannelId ? channel : null)
    : null;

  let view = "list";
  if (currentChannelId) view = "conversation";
  else if (composing) view = "new";

  let left;
  let actions = null;
  let body;

  if (view === "conversation") {
    left = (
      <>
        <BackButton onClick={props.onBack} />
        {current && <ConversationAvatar channel={current} selfId={user.id} size={30} />}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            data-testid="dm-conversation-title"
            noWrap
            sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}
          >
            {current ? dmTitle(current, user.id) : "Conversation"}
          </Typography>
          {current && isGroupDm(current) && (
            <Typography noWrap variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
              {current.members.length} people
            </Typography>
          )}
        </Box>
      </>
    );
    body = <ConversationView {...props} current={current} />;
  } else if (view === "new") {
    left = (
      <>
        <BackButton onClick={props.onCancelNew} />
        <Typography sx={{ fontWeight: 700, fontSize: 16, flex: 1 }} noWrap>
          New message
        </Typography>
      </>
    );
    body = <NewConversationView {...props} />;
  } else {
    left = (
      <Typography sx={{ fontWeight: 700, fontSize: 17, flex: 1 }} noWrap>
        Messages
      </Typography>
    );
    actions = (
      <IconButton
        size="small"
        data-testid="dm-new"
        aria-label="New message"
        title="New message"
        onClick={props.onNew}
        disabled={loading}
      >
        <i className="fas fa-plus" style={{ fontSize: 14 }} />
      </IconButton>
    );
    body = (
      <ConversationList
        loading={loading}
        directs={sorted}
        notifsByChannel={notifsByChannel}
        selfId={user.id}
        onOpen={props.onOpen}
        onNew={props.onNew}
        error={sendError}
      />
    );
  }

  if (dmLocked) {
    body = (
      <Box
        data-testid="dm-locked"
        sx={{ p: 3, textAlign: "center", color: "text.secondary", m: "auto" }}
      >
        <i className="fas fa-lock" style={{ fontSize: 20, marginBottom: 8 }} />
        <Typography variant="body2">{dmLocked}</Typography>
      </Box>
    );
  }

  return (
    <>
      {renderTitleBar({ left, actions, view })}
      {/* Kept mounted while collapsed so the socket and unread counts stay live. */}
      <Box
        data-testid="dm-chat"
        data-view={view}
        sx={{
          display: collapsed ? "none" : "flex",
          flexDirection: "column",
          height: "min(416px, calc(100dvh - 140px))",
          bgcolor: "background.paper",
        }}
      >
        {body}
      </Box>
    </>
  );
}

function BackButton({ onClick }) {
  return (
    <IconButton
      size="small"
      data-testid="dm-back"
      aria-label="Back"
      title="Back"
      onClick={onClick}
      sx={{ ml: -0.5 }}
    >
      <i className="fas fa-arrow-left" style={{ fontSize: 15 }} />
    </IconButton>
  );
}

// One avatar for a 1:1; two overlapping ones for a group.
export function ConversationAvatar({ channel, selfId, size = 40 }) {
  const theme = useTheme();
  const others = otherMembers(channel, selfId);
  const sized = (px) => ({
    lineHeight: 0,
    "& .avatar": { width: `${px}px !important`, height: `${px}px !important` },
  });

  if (others.length <= 1) {
    const m = others[0] || {};
    return (
      <Box sx={{ ...sized(size), flexShrink: 0 }}>
        <Avatar id={m.id} name={m.name} hasImage={m.avatar} />
      </Box>
    );
  }

  const small = Math.round(size * 0.68);
  const ring = `2px solid ${theme.palette.background.paper}`;
  return (
    <Box
      data-testid="dm-group-avatar"
      sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      {others.slice(0, 2).map((m, i) => (
        <Box
          key={m.id}
          sx={{
            ...sized(small),
            position: "absolute",
            ...(i === 0 ? { top: 0, left: 0 } : { bottom: 0, right: 0, zIndex: 1 }),
            "& .avatar": {
              ...sized(small)["& .avatar"],
              border: i === 1 ? ring : undefined,
              boxSizing: "content-box",
            },
          }}
        >
          <Avatar id={m.id} name={m.name} hasImage={m.avatar} />
        </Box>
      ))}
    </Box>
  );
}

function useNow(ms = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

function ConversationList({ loading, directs, notifsByChannel, selfId, onOpen, onNew, error }) {
  const theme = useTheme();
  const now = useNow();
  const viewer = useContext(UserContext);

  if (loading)
    return (
      <Box sx={{ m: "auto" }}>
        <CircularProgress size={24} />
      </Box>
    );

  if (directs.length === 0)
    return (
      <Box sx={{ m: "auto", p: 3, textAlign: "center" }} data-testid="dm-empty">
        <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 0.5 }}>
          Welcome to your inbox!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Message someone, or pick a few people for a group chat.
        </Typography>
        <Button variant="contained" size="small" onClick={onNew} sx={{ borderRadius: 99 }}>
          New message
        </Button>
      </Box>
    );

  return (
    <Box sx={{ overflowY: "auto", flex: 1 }} data-testid="dm-list">
      {error && <InlineError text={error} />}
      {directs.map((c) => {
        const unread = notifsByChannel[c.id] || 0;
        const preview = dmPreviewText(c, selfId);
        const date = Math.max(c.lastMessageDate || 0, (c.lastMessage && c.lastMessage.date) || 0);
        return (
          <Box
            key={c.id}
            role="button"
            tabIndex={0}
            data-testid="dm-row"
            data-channel-id={c.id}
            data-unread={unread > 0 ? "true" : "false"}
            onClick={() => onOpen(c.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen(c.id);
              }
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1.25,
              cursor: "pointer",
              bgcolor: unread ? alpha(theme.palette.primary.main, 0.06) : "transparent",
              "&:hover": { bgcolor: "action.hover" },
              "&:focus-visible": { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 },
            }}
          >
            <ConversationAvatar channel={c} selfId={selfId} size={44} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ minWidth: 0 }}>
                <Typography
                  noWrap
                  sx={{ fontWeight: 700, fontSize: 15, minWidth: 0, flexShrink: 1 }}
                >
                  {dmTitle(c, selfId)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
                >
                  · {formatDmTime(date, now)}
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                noWrap
                data-testid="dm-preview"
                sx={{
                  color: unread ? "text.primary" : "text.secondary",
                  fontWeight: unread ? 600 : 400,
                }}
              >
                {preview ? (
                  <UserText text={preview} settings={viewer.settings} filterProfanity />
                ) : (
                  <span style={{ fontStyle: "italic" }}>No messages yet</span>
                )}
              </Typography>
            </Box>
            {unread > 0 && (
              <Box
                data-testid="dm-row-unread"
                aria-label={`${unread} unread`}
                sx={{
                  minWidth: 20,
                  height: 20,
                  px: 0.75,
                  borderRadius: 99,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {formatUnreadBadge(unread)}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function InlineError({ text }) {
  return (
    <Box
      role="alert"
      data-testid="dm-send-error"
      sx={{
        px: 2,
        py: 0.75,
        fontSize: 13,
        color: "error.main",
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      <i className="fas fa-exclamation-circle" />
      <span>{text}</span>
    </Box>
  );
}

function ConversationView(props) {
  const {
    user,
    socket,
    channel,
    current,
    textInput,
    setTextInput,
    onSend,
    sendError,
    clearSendError,
    messageListRef,
    onMessagesScroll,
  } = props;
  const theme = useTheme();
  const now = useNow();
  const group = current ? isGroupDm(current) : false;
  const loaded = channel.id && channel.id === props.currentChannelId;
  const groups = groupMessages(loaded ? channel.messages : []);

  return (
    <>
      <Box
        ref={messageListRef}
        onScroll={onMessagesScroll}
        data-testid="dm-messages"
        sx={{ flex: 1, overflowY: "auto", px: 1.5, py: 1.5 }}
      >
        {!loaded && (
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <CircularProgress size={22} />
          </Box>
        )}
        {loaded && groups.length === 0 && (
          <Box sx={{ textAlign: "center", mt: 4, color: "text.secondary" }}>
            {current && <Box sx={{ display: "inline-block", mb: 1 }}><ConversationAvatar channel={current} selfId={user.id} size={56} /></Box>}
            <Typography variant="body2">Say hi to start the conversation.</Typography>
          </Box>
        )}
        {groups.map((g) => {
          const mine = g.senderId === user.id;
          const lastMsg = g.messages[g.messages.length - 1];
          return (
            <Box
              key={g.messages[0].id}
              sx={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", mb: 1.25 }}
            >
              {!mine && group && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 4.5, mb: 0.25 }}>
                  {g.sender.name}
                </Typography>
              )}
              <Stack direction="row" alignItems="flex-end" spacing={0.75} sx={{ maxWidth: "100%" }}>
                {!mine && (
                  <Box sx={{ lineHeight: 0, "& .avatar": { width: "28px !important", height: "28px !important" } }}>
                    <Avatar id={g.sender.id} name={g.sender.name} hasImage={g.sender.avatar} />
                  </Box>
                )}
                <Stack spacing={0.25} alignItems={mine ? "flex-end" : "flex-start"} sx={{ maxWidth: 250 }}>
                  {g.messages.map((m, i) => (
                    <Bubble
                      key={m.id}
                      message={m}
                      mine={mine}
                      first={i === 0}
                      last={i === g.messages.length - 1}
                      socket={socket}
                    />
                  ))}
                </Stack>
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.25, ...(mine ? { mr: 0.5 } : { ml: 4.5 }) }}
              >
                {formatDmTime(lastMsg.date, now)}
              </Typography>
            </Box>
          );
        })}
      </Box>
      {sendError && <InlineError text={sendError} />}
      <Box sx={{ px: 1.5, py: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
            borderRadius: 99,
            pl: 2,
            pr: 0.5,
          }}
        >
          <InputBase
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
              if (sendError) clearSendError();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend(textInput);
              }
            }}
            placeholder="Start a new message"
            inputProps={{ maxLength: MaxChatMessageLength, "aria-label": "Message", "data-testid": "dm-input" }}
            sx={{ flex: 1, fontSize: 14, py: 0.75 }}
            disabled={!loaded}
          />
          {/* Same picker as game chat: site emotes, my custom emotes and
              my stickers, inserted as ":code:" text. */}
          <Box
            data-testid="dm-emote-picker"
            sx={{
              display: "flex",
              alignItems: "center",
              "& .dropdown-control": {
                minWidth: 0,
                width: 32,
                height: "32px !important",
                p: 0.5,
                border: "none !important",
                borderRadius: "50%",
              },
              "& .dropdown-control img": { width: 20, height: 20 },
              opacity: loaded ? 1 : 0.5,
              pointerEvents: loaded ? "auto" : "none",
            }}
          >
            <EmotePicker
              onEmoteSelected={(emote) => {
                setTextInput(insertEmote(textInput, emote));
                if (sendError) clearSendError();
              }}
            />
          </Box>
          <IconButton
            size="small"
            color="primary"
            aria-label="Send"
            data-testid="dm-send"
            disabled={!loaded || !textInput.trim().length}
            onClick={() => onSend(textInput)}
          >
            <i className="fas fa-paper-plane" style={{ fontSize: 14 }} />
          </IconButton>
        </Stack>
      </Box>
    </>
  );
}

function Bubble({ message, mine, first, last, socket }) {
  const theme = useTheme();
  const user = useContext(UserContext);
  const [menu, setMenu] = useState(null);
  const canDelete = mine || (user.perms && user.perms.deleteChatMessage);
  // The sender's own custom emotes/stickers, sent by the chat server with
  // each DM (as game chat does with player settings).
  const customEmotes = (message.sender && message.sender.customEmotes) || null;
  const customStickers = (message.sender && message.sender.customStickers) || null;
  const stickerOnly = isStickerOnlyMessage(message.content, customStickers);
  const r = 18;
  const tight = 4;
  const radius = mine
    ? `${r}px ${first ? r : tight}px ${last ? tight : tight}px ${r}px`
    : `${first ? r : tight}px ${r}px ${r}px ${last ? tight : tight}px`;

  return (
    <>
      <Box
        data-testid="dm-bubble"
        data-sticker-only={stickerOnly ? "true" : "false"}
        className={mine ? "self" : ""}
        onContextMenu={(e) => {
          if (!canDelete) return;
          e.preventDefault();
          setMenu({ top: e.clientY, left: e.clientX });
        }}
        sx={{
          px: stickerOnly ? 0 : 1.5,
          py: stickerOnly ? 0.25 : 0.75,
          borderRadius: radius,
          fontSize: 14,
          lineHeight: 1.35,
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
          bgcolor: stickerOnly
            ? "transparent"
            : mine
            ? "primary.main"
            : theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.07)",
          color: mine ? "primary.contrastText" : "text.primary",
          "& a": { color: "inherit", textDecoration: "underline" },
          "& .emote": { verticalAlign: "middle" },
          // Stickers at 96px fit the 360px window (game chat uses up to 128).
          "& .sticker": { width: "96px !important", height: "96px !important" },
        }}
      >
        <UserText
          text={message.content}
          settings={user.settings}
          filterProfanity
          linkify
          emotify
          customEmotes={customEmotes}
          customStickers={customStickers}
        />
      </Box>
      <Menu
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={menu}
        sx={{ zIndex: 1400 }}
      >
        <MenuItem
          onClick={() => {
            setMenu(null);
            socket.send("deleteMessage", message.id);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "inherit", minWidth: 32 }}>
            <DeleteOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Delete message" />
        </MenuItem>
      </Menu>
    </>
  );
}

function NewConversationView(props) {
  const { user, searchVal, setSearchVal, searchResults, onStart, sendError } = props;
  const theme = useTheme();
  const [selected, setSelected] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const selectedIds = selected.map((u) => u.id);
  const found = (searchResults || []).filter((u) => u && u.id !== user.id);
  // With the box empty the list is "Online now"; keep the people already
  // picked at the top (checked) even when they aren't online.
  const results = searchVal
    ? found
    : [...selected.filter((s) => !found.some((u) => u.id === s.id)), ...found];

  function toggle(u) {
    setSelected((cur) =>
      cur.some((s) => s.id === u.id) ? cur.filter((s) => s.id !== u.id) : [...cur, u]
    );
    setSearchVal("");
    if (inputRef.current) inputRef.current.focus();
  }

  return (
    <>
      <Box
        onClick={() => inputRef.current && inputRef.current.focus()}
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 0.75,
          px: 2,
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          cursor: "text",
        }}
      >
        <Typography color="text.secondary" sx={{ fontSize: 14, mr: 0.5 }}>
          To:
        </Typography>
        {selected.map((u) => (
          <Chip
            key={u.id}
            size="small"
            data-testid="dm-chip"
            label={u.name}
            onDelete={() => toggle(u)}
            avatar={
              <Box sx={{ lineHeight: 0, "& .avatar": { width: "20px !important", height: "20px !important" } }}>
                <Avatar id={u.id} name={u.name} hasImage={u.avatar} />
              </Box>
            }
            sx={{ fontWeight: 600 }}
          />
        ))}
        <InputBase
          inputRef={inputRef}
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !searchVal && selected.length)
              setSelected((cur) => cur.slice(0, -1));
            if (e.key === "Enter" && searchVal && results.length) {
              e.preventDefault();
              toggle(results[0]);
            }
          }}
          placeholder={selected.length ? "" : "Type a name"}
          inputProps={{ "aria-label": "Search people", "data-testid": "dm-search" }}
          sx={{ flex: 1, minWidth: 90, fontSize: 14 }}
        />
      </Box>
      {sendError && <InlineError text={sendError} />}
      <Typography variant="caption" color="text.secondary" sx={{ px: 2, pt: 1, display: "block" }}>
        {searchVal ? "People" : selected.length ? "Selected and online now" : "Online now"}
      </Typography>
      <Box sx={{ flex: 1, overflowY: "auto" }} data-testid="dm-search-results">
        {results.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 3, textAlign: "center" }}>
            {searchVal ? "No one found. Try another name." : "No one else is online."}
          </Typography>
        )}
        {results.map((u) => {
          const isSel = selectedIds.includes(u.id);
          return (
            <Box
              key={u.id}
              role="button"
              tabIndex={0}
              data-testid="dm-search-result"
              aria-pressed={isSel}
              onClick={() => toggle(u)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(u);
                }
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1,
                cursor: "pointer",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Box sx={{ lineHeight: 0, position: "relative", "& .avatar": { width: "36px !important", height: "36px !important" } }}>
                <Avatar id={u.id} name={u.name} hasImage={u.avatar} />
              </Box>
              <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 14 }} noWrap>
                {u.name}
              </Typography>
              {u.status && <StatusIcon status={u.status} />}
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: `2px solid ${isSel ? theme.palette.primary.main : theme.palette.divider}`,
                  bgcolor: isSel ? "primary.main" : "transparent",
                  color: "primary.contrastText",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  flexShrink: 0,
                }}
              >
                {isSel && <i className="fas fa-check" />}
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ px: 2, py: 1.25, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          fullWidth
          variant="contained"
          data-testid="dm-start"
          disabled={!selected.length}
          onClick={() => onStart(selectedIds)}
          sx={{ borderRadius: 99, fontWeight: 700, textTransform: "none" }}
        >
          {selected.length > 1
            ? `Start group chat (${selected.length + 1} people)`
            : "Start conversation"}
        </Button>
      </Box>
    </>
  );
}
