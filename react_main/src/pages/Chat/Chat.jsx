import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useReducer,
  useContext,
  useMemo,
} from "react";
import axios from "axios";
import update from "immutability-helper";
import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useTheme } from "@mui/material/styles";

import { ClientSocket as Socket, subscribeSocketListeners } from "../../Socket";
import { LatestRequest } from "../../lib/latestRequest.js";
import { useErrorAlert } from "../../components/Alerts";
import { NameWithAvatar, StatusIcon } from "../User/UserWidgets";
import { UserContext } from "../../Contexts";
import { MaxChatMessageLength } from "../../Constants";
import { Time, UserText, useOnOutsideClick } from "../../components/Basic";
import {
  resolveDisplayNameColor,
  resolveDisplayTextColor,
} from "../../utils/accessibleNameColors";

import { countUnreadDmChannels, sendErrorText } from "../../utils/dmWindow";
import DmPanel from "../../components/dms/DmPanel";

import "css/chat.css";

// The site chatbox. The homepage shows every channel; the floating DM window
// (components/dms/FloatingDmWindow.jsx) mounts this same component with
// `directsOnly`, so 1:1 and group DMs use one implementation and one socket
// protocol (modules/chat.js).
//   directsOnly    hide public rooms
//   paused         window collapsed: leave the channel so new messages count
//                  as unread, and rejoin it when expanded
//   onUnreadChange called with the number of DM conversations with unread
//   onLocked       called with { message, gameId } when the server refuses DMs
//                  (alive in a running ranked/competitive game)
//   embedded       drop the outer card and the "Chat" label
//   panel          render the X Chat style DM panel (components/dms/DmPanel)
//                  instead of the chatbox: conversation list, conversation
//                  view with a back arrow, and a new-message view. Same
//                  socket, state and events as the chatbox.
//   renderTitleBar panel only: ({ left, actions }) => the window's title bar
//   initialChannelId / onChannelChange
//                  panel only: the open conversation, kept by the window
export default function Chat({
  directsOnly = false,
  paused = false,
  onUnreadChange,
  onLocked,
  embedded = false,
  height = 480,
  panel = false,
  renderTitleBar,
  initialChannelId = null,
  onChannelChange,
} = {}) {
  const [connected, setConnected] = useState(0);
  const [token, setToken] = useState("");
  const [socket, setSocket] = useState({});
  const [chatInfo, updateChatInfo] = useChatInfoReducer();
  const [currentChannelId, setCurrentChannelId] = useState(
    panel ? initialChannelId || null : undefined
  );
  const [channel, updateChannel] = useChannelReducer();
  const [newDMUsers, setNewDMUsers] = useState({});
  const [textInput, setTextInput] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [userSearchVal, setUserSearchVal] = useState("");
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [dmLocked, setDmLocked] = useState(null);
  // Panel: inline error under the composer / new-message view, and the texts
  // sent but not yet echoed back, so a refused one can be put back.
  const [sendError, setSendError] = useState(null);
  const pendingSends = useRef([]);
  const currentChannelRef = useRef(currentChannelId);
  currentChannelRef.current = currentChannelId;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const messageListRef = useRef();
  const oldScrollHeight = useRef();
  const isMountedRef = useRef(true);
  const tokenRequests = useRef(new LatestRequest());
  const registeredSocketRef = useRef(null);
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const theme = useTheme();

  useLayoutEffect(() => manageScroll());

  useEffect(() => {
    if (!user.loggedIn) {
      tokenRequests.current.invalidate();
      if (token) setToken("");
    }
  }, [user.loggedIn]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      tokenRequests.current.invalidate();
    };
  }, []);

  useEffect(() => {
    if (!token || !user.loggedIn) return;

    var socketURL;

    if (import.meta.env.REACT_APP_USE_PORT === "true")
      socketURL = `${import.meta.env.REACT_APP_SOCKET_PROTOCOL}://${
        import.meta.env.REACT_APP_SOCKET_URI
      }:${import.meta.env.REACT_APP_CHAT_PORT}`;
    else
      socketURL = `${import.meta.env.REACT_APP_SOCKET_PROTOCOL}://${
        import.meta.env.REACT_APP_SOCKET_URI
      }/chatSocket`;

    var newSocket = new Socket(socketURL);
    newSocket.on("connected", () => setConnected((current) => current + 1));
    newSocket.on("disconnected", () => setConnected((current) => current - 1));
    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.clear();
    };
  }, [token, user.loggedIn]);

  useEffect(() => {
    if (!user.loaded || !user.loggedIn) return;
    if (socket.readyState !== 1) {
      if (socket.readyState == null || socket.readyState === 3) getToken();

      return;
    }

    socket.send("auth", token);

    const replay = registeredSocketRef.current !== socket;
    registeredSocketRef.current = socket;
    return subscribeSocketListeners(socket, (socket) => {
    socket.on("chatInfo", (chatInfo) => {
      updateChatInfo({
        type: "set",
        chatInfo,
      });

      if (!directsOnly && chatInfo.rooms && chatInfo.rooms.length > 0) {
        if (!currentChannelId) {
          var roomId = chatInfo.rooms[0].id;
          setCurrentChannelId(roomId);
        }
      }

      // Panel: reopen the conversation that was open (page change, reload
      // or reconnect).
      if (panel && currentChannelRef.current && !pausedRef.current)
        socket.send("getChannel", currentChannelRef.current);
    });

    socket.on("channel", (channel) => {
      setDmLocked(null);
      updateChannel({
        type: "set",
        channel,
      });
    });

    socket.on("message", (message) => {
      if (panel && message.sender && message.sender.id === user.id) {
        const i = pendingSends.current.indexOf(message.content);
        if (i !== -1) pendingSends.current.splice(i, 1);
      }
      updateChannel({
        type: "message",
        message,
      });
    });

    socket.on("oldMessages", (messages) => {
      updateChannel({
        type: "oldMessages",
        messages,
        messageListRef,
      });
    });

    socket.on("users", (users) => {
      updateChatInfo({
        type: "users",
        users,
      });
    });

    socket.on("newDirectChannel", (info) => {
      updateChatInfo({
        type: "directs",
        channel: info.channel,
      });

      if (info.focus) {
        setCurrentChannelId(info.channel.id);
        socket.send("getChannel", info.channel.id);
      }
    });

    socket.on("openDM", (channelId) => {
      setCurrentChannelId(channelId);
      socket.send("getChannel", channelId);
    });

    socket.on("dateUpdate", (info) => {
      updateChatInfo({
        type: "date",
        channelId: info.channel,
        date: info.date,
        lastMessage: info.lastMessage,
      });
    });

    // A DM's last message was deleted: new preview (or none).
    socket.on("previewUpdate", (info) => {
      updateChatInfo({
        type: "preview",
        channelId: info.channel,
        lastMessage: info.lastMessage,
      });
    });

    socket.on("newNotif", (info) => {
      updateChatInfo({
        type: "addNotif",
        channelId: info.notif.channelId,
      });

      if (document.hidden && document.title.indexOf("🔴") === -1)
        document.title = document.title + "🔴";
    });

    // Another of this user's chat windows read a channel.
    socket.on("notifsRead", (channelId) => {
      updateChatInfo({ type: "readNotifs", channelId });
    });

    // The server refused a DM action: the user is alive in a running ranked
    // or competitive game (modules/dmGate.js).
    socket.on("dmLocked", (info) => {
      setDmLocked((info && info.message) || "Direct messages are locked right now.");
      updateChannel({ type: "clear" });
      if (onLocked) onLocked(info || {});
    });

    socket.on("messageDeleted", (messageId) => {
      updateChannel({
        type: "deleteMessage",
        messageId,
      });
    });

    socket.on("error", (error) => {
      // Panel: show it in the window, next to what it is about, and put a
      // refused message back in the composer (rate limit, blocks, ...).
      if (panel) {
        const refused = pendingSends.current.pop();
        if (refused != null)
          setTextInput((current) => (current ? current : refused));
        setSendError(refused != null ? sendErrorText(error) : String(error));
        return;
      }
      errorAlert(error);
    });
    }, { replay });
  }, [connected, user.loaded, user.loggedIn]);

  useEffect(() => {
    if (!channel.id) return;

    if (chatInfo.notifs.byChannel[channel.id])
      socket.send("readNotifsInChannel", channel.id);

    updateChatInfo({
      type: "readNotifs",
      channelId: channel.id,
    });
  }, [channel]);

  useEffect(() => {
    if (onUnreadChange)
      onUnreadChange(countUnreadDmChannels(chatInfo.notifs.byChannel));
  }, [chatInfo.notifs]);

  // Collapsing the floating window leaves the channel on the server (so new
  // messages raise unread badges); expanding it rejoins.
  const wasPaused = useRef(paused);
  useEffect(() => {
    if (wasPaused.current === paused) return;
    wasPaused.current = paused;
    if (!socket || socket.readyState !== 1) return;
    if (paused) socket.send("closedChat");
    else if (currentChannelId) {
      socket.send("getChannel", currentChannelId);
      setAutoScroll(true);
    }
  }, [paused]);

  function getToken() {
    const request = tokenRequests.current.begin();
    axios
      .get("/api/chat/connect", { signal: request.signal })
      .then((res) => {
        if (isMountedRef.current && request.isCurrent()) {
          setToken(res.data);
        }
      })
      .catch((err) => {
        if (isMountedRef.current && request.isCurrent()) {
          errorAlert(err);
        }
      });
  }

  function onOpenNewChatDialog() {
    setNewChatDialogOpen(true);
    setUserSearchVal("");
  }

  function onCloseNewChatDialog() {
    setNewChatDialogOpen(false);
    setNewDMUsers({});
  }

  function onChannelSelect(id, type) {
    if (type !== "users") {
      if (!paused) socket.send("getChannel", id);

      setCurrentChannelId(id);
      setAutoScroll(true);
    } else {
      if (!newDMUsers[id]) {
        setNewDMUsers(
          update(newDMUsers, {
            [id]: {
              $set: true,
            },
          })
        );
      } else {
        setNewDMUsers(
          update(newDMUsers, {
            $unset: [id],
          })
        );
      }
    }
  }

  function onSendMessage(e) {
    if (e.key === "Enter" && textInput.length) {
      const message = e.target.value;
      socket.send("sendMessage", message);
      setTextInput("");
      setAutoScroll(true);
    }
  }

  function onMessagesScroll() {
    var messageList = messageListRef.current;

    if (
      Math.round(messageList.scrollTop + messageList.clientHeight) >=
      Math.round(messageList.scrollHeight)
    )
      setAutoScroll(true);
    else {
      setAutoScroll(false);

      if (messageList.scrollTop === 0 && channel.messages.length)
        socket.send("getOldMessages", channel.messages[0].date);
    }
  }

  function manageScroll() {
    if (messageListRef.current) {
      if (oldScrollHeight.current == null)
        oldScrollHeight.current = messageListRef.current.scrollHeight;
      else if (
        oldScrollHeight.current !== messageListRef.current.scrollHeight
      ) {
        if (messageListRef.current.scrollTop === 0) {
          var scrollTo =
            messageListRef.current.scrollHeight *
            (1 - oldScrollHeight.current / messageListRef.current.scrollHeight);
          messageListRef.current.scrollTop = scrollTo - 5;
        }

        oldScrollHeight.current = messageListRef.current.scrollHeight;
      }
    }

    if (autoScroll && messageListRef.current)
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }

  function onUserSearch(e) {
    const query = e.target.value;
    setUserSearchVal(query);
  }

  useEffect(() => {
    if (!newChatDialogOpen) return;

    // Typing fires a request per keystroke and clearing the box fetches the
    // online list; only the newest answer may fill the list, or a slow one
    // for an old query lands on top of it.
    let stale = false;
    const url =
      userSearchVal.length > 0
        ? `/api/user/searchName?query=${encodeURIComponent(userSearchVal)}`
        : "/api/user/online";
    axios
      .get(url)
      .then((res) => {
        if (stale) return;
        updateChatInfo({
          type: "users",
          users: res.data,
        });
      })
      .catch((e) => {
        if (!stale) errorAlert(e);
      });
    return () => {
      stale = true;
    };
  }, [newChatDialogOpen, userSearchVal]);

  // ---- Panel actions ----
  useEffect(() => {
    if (!panel) return;
    if (onChannelChange) onChannelChange(currentChannelId || null);
    // A DM opened (from the list, or by newDMChannel): leave the new view.
    if (currentChannelId) setNewChatDialogOpen(false);
    setSendError(null);
  }, [currentChannelId]);

  function openConversation(id) {
    onChannelSelect(id, "directs");
  }

  // Back arrow: leave the channel on the server so new messages in it count
  // as unread again, and show the list.
  function backToList() {
    if (socket && socket.readyState === 1) socket.send("closedChat");
    setCurrentChannelId(null);
    updateChannel({ type: "clear" });
    setDmLocked(null);
  }

  function openNewConversation() {
    backToList();
    setUserSearchVal("");
    setSendError(null);
    setNewChatDialogOpen(true);
  }

  function closeNewConversation() {
    setNewChatDialogOpen(false);
    setUserSearchVal("");
    setSendError(null);
  }

  // Same server path as the chatbox's "Create DM": newDMChannel opens (or
  // reuses) the channel for exactly these members plus me, then the server
  // answers newDirectChannel { focus } or openDM, which opens it here.
  function startConversation(userIds) {
    if (!userIds.length) return;
    setSendError(null);
    socket.send("newDMChannel", userIds);
  }

  function sendPanelMessage(text) {
    if (!text || !text.trim().length || !socket || socket.readyState !== 1) return;
    pendingSends.current.push(text);
    if (pendingSends.current.length > 10) pendingSends.current.shift();
    socket.send("sendMessage", text);
    setTextInput("");
    setSendError(null);
    setAutoScroll(true);
  }

  function onCreateDM() {
    var users = Object.keys(newDMUsers);
    socket.send("newDMChannel", users);
    setNewDMUsers({});
  }

  function onCloseDM(channelId) {
    socket.send("closeDM", channelId);

    setCurrentChannelId(null);
    updateChannel({ type: "clear" });
    updateChatInfo({
      type: "remove",
      channelType: channel?.public ? "rooms" : "directs",
      channelId,
    });
  }

  const rooms = chatInfo.rooms || [];
  const directs = (chatInfo.directs || []).slice();
  const usersList = chatInfo.users || [];

  const navEntries = useMemo(
    () => [
      ...(directsOnly ? [] : rooms).map((channel) => ({ channel, type: "rooms" })),
      ...directs.sort(sortDMs).map((channel) => ({
        channel,
        type: "directs",
      })),
    ],
    [rooms, directs]
  );

  useEffect(() => {
    if (panel) return;
    if (!currentChannelId && navEntries.length > 0) {
      const first = navEntries[0];
      onChannelSelect(first.channel.id, first.type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChannelId, navEntries]);

  const navChannelItems = navEntries.reduce((items, entry) => {
    const { channel, type } = entry;

    const notifCount = chatInfo.notifs.byChannel[channel.id] || 0;
    const isSelected = channel.id === currentChannelId;

    items.push(
      <MenuItem
        key={`${type}-${channel.id}`}
        selected={isSelected}
        onClick={() => onChannelSelect(channel.id, type)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          py: 1,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{ flexGrow: 1, minWidth: 0 }}
        >
          <ChannelName short channelType={type} channel={channel} user={user} />
        </Stack>
        {notifCount > 0 && (
          <Badge
            color="error"
            badgeContent={notifCount > 99 ? "99+" : notifCount}
            sx={{
              "& .MuiBadge-badge": {
                fontSize: "0.65rem",
                minWidth: 20,
                height: 18,
              },
            }}
          />
        )}
      </MenuItem>
    );

    return items;
  }, []);

  const makeRoomItems = usersList.reduce((items, channel) => {
    if (channel.id === user.id) return items;

    const isSelected = Boolean(newDMUsers[channel.id]);

    items.push(
      <ListItemButton
        key={`user-${channel.id}`}
        selected={isSelected}
        onClick={() => onChannelSelect(channel.id, "users")}
        sx={{
          borderRadius: 1,
          mb: 1,
          px: 1.5,
          py: 1,
          bgcolor: isSelected ? "action.selected" : "transparent",
          "&.Mui-selected:hover": { bgcolor: "action.selected" },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{ flexGrow: 1, minWidth: 0 }}
        >
          <ChannelName
            short
            channelType="users"
            channel={channel}
            user={user}
          />
        </Stack>
      </ListItemButton>
    );

    return items;
  }, []);

  const messages = channel.messages.map((message) => (
    <Message message={message} socket={socket} key={message.id} />
  ));

  // const closeChatTab = () => {
  //   setShowChatTab(false);
  //   localStorage.setItem("showChatTab", false);
  // }; // TODO: Remove comments

  if (panel)
    return (
      <DmPanel
        loading={!token}
        user={user}
        socket={socket}
        directs={directs}
        notifsByChannel={chatInfo.notifs.byChannel}
        channel={channel}
        currentChannelId={currentChannelId}
        composing={newChatDialogOpen}
        collapsed={paused}
        dmLocked={dmLocked}
        sendError={sendError}
        clearSendError={() => setSendError(null)}
        textInput={textInput}
        setTextInput={setTextInput}
        onSend={sendPanelMessage}
        onOpen={openConversation}
        onBack={backToList}
        onNew={openNewConversation}
        onCancelNew={closeNewConversation}
        onStart={startConversation}
        searchVal={userSearchVal}
        setSearchVal={setUserSearchVal}
        searchResults={usersList}
        messageListRef={messageListRef}
        onMessagesScroll={onMessagesScroll}
        renderTitleBar={renderTitleBar}
      />
    );

  if (!token) return null;

  return (
    <Paper
      elevation={embedded ? 0 : 4}
      data-testid={directsOnly ? "dm-chat" : undefined}
      sx={{
        width: "100%",
        overflow: "hidden",
        ...(embedded ? { borderRadius: 0 } : {}),
        bgcolor:
          theme.palette.mode === "dark"
            ? theme.palette.background.paper
            : theme.palette.background.default,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          color: theme.palette.text.primary,
          ...(embedded ? { px: 1, py: 0.75 } : {}),
        }}
      >
        {!embedded && (
        <>
        <Badge
          color="error"
          overlap="circular"
          badgeContent={
            chatInfo.notifs.all > 0
              ? chatInfo.notifs.all > 99
                ? "99+"
                : chatInfo.notifs.all
              : null
          }
        ></Badge>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Chat
        </Typography>
        </>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Select
          size="small"
          value={currentChannelId || (navEntries[0]?.channel.id ?? "")}
          onChange={(event) => {
            const value = event.target.value;
            const entry = navEntries.find((item) => item.channel.id === value);
            if (entry) onChannelSelect(value, entry.type);
          }}
          renderValue={(value) => {
            const entry = navEntries.find((item) => item.channel.id === value);
            if (!entry) {
              return (
                <Typography variant="body2" color="text.secondary">
                  {directsOnly ? "No conversations" : "No chats available"}
                </Typography>
              );
            }
            return (
              <ChannelName
                short
                channelType={entry.type}
                channel={entry.channel}
                user={user}
              />
            );
          }}
          sx={{
            minWidth: 160,
            bgcolor: theme.palette.background.paper,
            borderRadius: 1,
            "& .MuiSelect-select": { display: "flex", alignItems: "center" },
          }}
          disabled={navEntries.length === 0}
        >
          {navChannelItems}
        </Select>
        <Button
          size="small"
          variant="contained"
          color="secondary"
          onClick={onOpenNewChatDialog}
        >
          New
        </Button>
      </Stack>

      <Box
        className="chat-window"
        sx={{
          display: "flex",
          flexDirection: "column",
          height,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {dmLocked && (
            <Box
              data-testid="dm-locked"
              sx={{ p: 2, textAlign: "center", color: "text.secondary", m: "auto" }}
            >
              <i className="fas fa-lock" style={{ fontSize: 20, marginBottom: 8 }} />
              <Typography variant="body2">{dmLocked}</Typography>
            </Box>
          )}
          {!dmLocked && directsOnly && navEntries.length === 0 && (
            <Box sx={{ p: 2, textAlign: "center", color: "text.secondary", m: "auto" }}>
              <Typography variant="body2">
                No conversations yet. Click New to message someone, or pick
                several people for a group chat.
              </Typography>
            </Box>
          )}
          {!dmLocked && channel.id && (
            <>
              <Box
                className="channel-messages"
                ref={messageListRef}
                onScroll={onMessagesScroll}
                sx={{
                  flexGrow: 1,
                  overflowY: "auto",
                  px: 2,
                  py: 1,
                  backgroundColor: theme.palette.background.default,
                }}
              >
                {messages}
              </Box>

              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  bgcolor: theme.palette.background.paper,
                }}
              >
                <TextField
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={onSendMessage}
                  placeholder="Send message"
                  fullWidth
                  size="small"
                  inputProps={{ maxLength: MaxChatMessageLength }}
                />
              </Box>
            </>
          )}
        </Box>
      </Box>

      <Dialog open={newChatDialogOpen} onClose={onCloseNewChatDialog} fullWidth>
        <DialogTitle>Start New Chat</DialogTitle>
        <DialogContent dividers>
          <TextField
            value={userSearchVal}
            onChange={onUserSearch}
            placeholder="Search users"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          />
          <List
            disablePadding
            sx={{
              maxHeight: 300,
              overflowY: "auto",
            }}
          >
            {makeRoomItems.length ? (
              makeRoomItems
            ) : (
              <Box
                sx={{
                  py: 6,
                  textAlign: "center",
                  color: "text.secondary",
                }}
              >
                <Typography variant="body2">
                  No users found. Try another search.
                </Typography>
              </Box>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseNewChatDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              onCreateDM();
              onCloseNewChatDialog();
            }}
            disabled={Object.keys(newDMUsers).length === 0}
          >
            Create DM ({Object.keys(newDMUsers).length})
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function Message(props) {
  const message = props.message;
  const socket = props.socket;

  const [menuPosition, setMenuPosition] = useState(null);

  const longPressTimerRef = useRef();
  const touchStartRef = useRef();
  const user = useContext(UserContext);
  const isSelf = message.sender.id === user.id;
  const canDelete = isSelf || user.perms.deleteChatMessage;
  const age = Date.now() - message.date;
  const showTimestamp = age > 1000 * 60;

  useEffect(() => {
    return () => clearTimeout(longPressTimerRef.current);
  }, []);

  function openDeleteMenu(x, y) {
    if (!canDelete) return;
    setMenuPosition({ top: y, left: x });
  }

  function onContextMenu(e) {
    if (!canDelete) return;
    e.preventDefault();
    openDeleteMenu(e.clientX, e.clientY);
  }

  function onTouchStart(e) {
    if (!canDelete || e.touches.length !== 1) return;

    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      openDeleteMenu(touch.clientX, touch.clientY);
    }, 550);
  }

  function onTouchMove(e) {
    const start = touchStartRef.current;
    const touch = e.touches[0];
    if (!start || !touch) return;

    if (
      Math.abs(touch.clientX - start.x) > 10 ||
      Math.abs(touch.clientY - start.y) > 10
    ) {
      clearTimeout(longPressTimerRef.current);
    }
  }

  function cancelLongPress() {
    clearTimeout(longPressTimerRef.current);
    touchStartRef.current = null;
  }

  function onDeleteClick() {
    setMenuPosition(null);
    socket.send("deleteMessage", message.id);
  }

  const theme = useTheme();
  const accessibleNameColors = user.settings?.accessibleNameColors;
  const rawNameColor = message.sender.settings?.nameColor || null;
  const rawTextColor = message.sender.settings?.textColor || null;

  const textColorOverride = resolveDisplayTextColor({
    accessibleNameColors,
    ignoreTextColor: user.settings?.ignoreTextColor,
    rawTextColor,
    autoContrastColor: user.autoContrastColor.bind(user),
    theme,
  });

  const nameColorOverride = resolveDisplayNameColor({
    accessibleNameColors,
    ignoreTextColor: user.settings?.ignoreTextColor,
    rawNameColor,
    autoContrastColor: user.autoContrastColor.bind(user),
    theme,
  });

  return (
    <Box
      className={`message ${isSelf ? "self" : ""}`}
      onContextMenu={onContextMenu}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={cancelLongPress}
      onTouchCancel={cancelLongPress}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: 2,
        py: 1,
        borderRadius: 1.5,
        maxWidth: "100%",
        transition: "background-color 120ms ease",
        "&:hover": {
          backgroundColor: "action.hover",
        },
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ flexWrap: "wrap", flexGrow: 1, minWidth: 0 }}
      >
        <NameWithAvatar
          small
          id={message.sender.id}
          name={message.sender.name}
          avatar={message.sender.avatar}
          avatarUrl={message.sender.avatarUrl}
          color={nameColorOverride || ""}
          nameColorSwatch={
            accessibleNameColors && rawNameColor ? rawNameColor : undefined
          }
          groups={message.sender.groups}
          vanityUrl={message.sender.vanityUrl}
          noLink={isSelf || message.sender.site}
        />
        <Typography
          variant="body2"
          component="span"
          className="content"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            display: "inline-flex",
            flexWrap: "wrap",
            alignItems: "center",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            color: textColorOverride || "inherit",
          }}
        >
          <UserText
            text={message.content}
            settings={user.settings}
            filterProfanity
            linkify
            emotify
            roleify
          />
        </Typography>
        {showTimestamp && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ whiteSpace: "nowrap" }}
          >
            <Time millisec={age} suffix=" ago" />
          </Typography>
        )}
      </Stack>
      <Menu
        open={Boolean(menuPosition)}
        onClose={() => setMenuPosition(null)}
        anchorReference="anchorPosition"
        anchorPosition={menuPosition}
        slotProps={{ paper: { sx: { minWidth: 150, borderRadius: 2 } } }}
      >
        <MenuItem onClick={onDeleteClick} sx={{ color: "error.main", py: 1.25 }}>
          <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
            <DeleteOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Delete message" />
        </MenuItem>
      </Menu>
    </Box>
  );
}

function ChannelName(props) {
  const channelType = props.channelType;
  const channel = props.channel;
  const user = props.user;
  const short = props.short;

  switch (channelType) {
    case "rooms":
      return (
        <Typography
          variant={short ? "body2" : "subtitle1"}
          noWrap={short}
          sx={{ fontWeight: short ? 500 : 600 }}
        >
          {channel.name}
        </Typography>
      );
    case "directs":
      // A named DM (the admins' "Ban Appeals" channel) shows its name.
      if (channel.name)
        return (
          <Typography
            variant={short ? "body2" : "subtitle1"}
            noWrap={short}
            sx={{ fontWeight: short ? 500 : 600 }}
          >
            {channel.name}
          </Typography>
        );
      if (short) {
        var memberNames = channel.members
          .filter((m) => m.id !== user.id)
          .map((m) => m.name);
        var name = memberNames.join(", ");

        if (memberNames.length > 1 && name.length > 20)
          name = name.slice(0, 17) + "…";

        return (
          <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
            {name}
          </Typography>
        );
      } else {
        var members = channel.members.filter((m) => m.id !== user.id);
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            {members.map((m) => (
              <NameWithAvatar
                small
                id={m.id}
                name={m.name}
                avatar={m.avatar}
                vanityUrl={m.vanityUrl}
                key={m.id}
              />
            ))}
          </Stack>
        );
      }
    case "users":
      return (
        <Stack direction="row" spacing={1} alignItems="center">
          <NameWithAvatar
            small
            noLink
            id={channel.id}
            name={channel.name}
            avatar={channel.avatar}
            vanityUrl={channel.vanityUrl}
          />
          <StatusIcon status={channel.status} />
        </Stack>
      );
  }
}

function sortDMs(a, b) {
  return b.lastMessageDate - a.lastMessageDate;
}

function useChatInfoReducer() {
  return useReducer(
    (chatInfo, action) => {
      var newChatInfo = chatInfo;

      switch (action.type) {
        case "set":
          var notifsArray = action.chatInfo.notifs;
          var notifsTotal = 0;
          var notifsByChannelType = { rooms: 0, directs: 0 };
          var notifsByChannel = {};

          for (let notif of notifsArray) {
            if (!notifsByChannel[notif.channelId])
              notifsByChannel[notif.channelId] = 0;

            let channelType =
              notif.channelId.length === 32 ? "directs" : "rooms";

            notifsTotal += 1;
            notifsByChannelType[channelType] += 1;
            notifsByChannel[notif.channelId] += 1;
          }

          newChatInfo = { ...action.chatInfo, notifs: chatInfo.notifs };
          newChatInfo = update(newChatInfo, {
            notifs: {
              all: {
                $set: notifsTotal,
              },
              byChannelType: {
                $set: notifsByChannelType,
              },
              byChannel: {
                $set: notifsByChannel,
              },
            },
          });
          break;
        case "directs":
          // Reopened DMs come back through here too: replace, don't duplicate.
          newChatInfo = update(chatInfo, {
            directs: {
              $set: [
                action.channel,
                ...(chatInfo.directs || []).filter(
                  (channel) => channel.id !== action.channel.id
                ),
              ],
            },
          });
          break;
        case "users":
          newChatInfo = update(chatInfo, {
            users: {
              $set: action.users,
            },
          });
          break;
        case "remove":
          var newChannels = chatInfo[action.channelType];
          newChannels = newChannels.filter(
            (channel) => channel.id !== action.channelId
          );

          newChatInfo = update(chatInfo, {
            [action.channelType]: {
              $set: newChannels,
            },
          });
          break;
        case "date":
          var newDirects = chatInfo.directs.map((channel) => {
            if (channel.id !== action.channelId) return channel;
            var updated = { ...channel, lastMessageDate: action.date };
            if (action.lastMessage) updated.lastMessage = action.lastMessage;
            return updated;
          });

          newChatInfo = update(chatInfo, {
            directs: {
              $set: newDirects,
            },
          });
          break;
        case "preview":
          newChatInfo = update(chatInfo, {
            directs: {
              $set: chatInfo.directs.map((channel) =>
                channel.id === action.channelId
                  ? { ...channel, lastMessage: action.lastMessage }
                  : channel
              ),
            },
          });
          break;
        case "addNotif":
          var channelType =
            action.channelId.length === 32 ? "directs" : "rooms";
          var newAll = chatInfo.notifs.all + 1;
          var newByChannelType =
            (chatInfo.notifs.byChannelType[channelType] || 0) + 1;
          var newByChannel =
            (chatInfo.notifs.byChannel[action.channelId] || 0) + 1;

          newChatInfo = update(chatInfo, {
            notifs: {
              all: {
                $set: newAll,
              },
              byChannelType: {
                [channelType]: {
                  $set: newByChannelType,
                },
              },
              byChannel: {
                [action.channelId]: {
                  $set: newByChannel,
                },
              },
            },
          });
          break;
        case "readNotifs":
          var amt = chatInfo.notifs.byChannel[action.channelId] || 0;
          var channelType =
            action.channelId.length === 32 ? "directs" : "rooms";
          var newAll = Math.max(0, chatInfo.notifs.all - amt);
          var newByChannelType = Math.max(
            0,
            (chatInfo.notifs.byChannelType[channelType] || 0) - amt
          );

          newChatInfo = update(chatInfo, {
            notifs: {
              all: {
                $set: newAll,
              },
              byChannelType: {
                [channelType]: {
                  $set: newByChannelType,
                },
              },
              byChannel: {
                [action.channelId]: {
                  $set: 0,
                },
              },
            },
          });
          break;
      }

      return newChatInfo;
    },
    {
      rooms: [],
      directs: [],
      users: [],
      notifs: { all: 0, byChannelType: {}, byChannel: {} },
    }
  );
}

function useChannelReducer() {
  return useReducer(
    (channel, action) => {
      var newChannel = channel;

      switch (action.type) {
        case "set":
          newChannel = action.channel;
          break;
        case "message":
          if (action.message.channel !== channel.id) break;

          newChannel = update(channel, {
            messages: {
              $push: [action.message],
            },
          });
          break;
        case "deleteMessage":
          var index = -1;

          for (let i in channel.messages) {
            let message = channel.messages[i];

            if (message.id === action.messageId) {
              index = i;
              break;
            }
          }

          if (index !== -1) {
            newChannel = update(channel, {
              messages: {
                $splice: [[index, 1]],
              },
            });
          }
          break;
        case "oldMessages":
          newChannel = update(channel, {
            messages: {
              $unshift: action.messages,
            },
          });
          break;
        case "clear":
          newChannel = { messages: [] };
          break;
      }

      return newChannel;
    },
    { messages: [] }
  );
}
