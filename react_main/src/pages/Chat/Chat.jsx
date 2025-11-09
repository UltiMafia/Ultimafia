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
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { ClientSocket as Socket } from "../../Socket";
import { useErrorAlert } from "../../components/Alerts";
import { NameWithAvatar, StatusIcon } from "../User/User";
import { UserContext } from "../../Contexts";
import { MaxChatMessageLength } from "../../Constants";
import { Time, UserText, useOnOutsideClick } from "../../components/Basic";

import "css/chat.css";

export default function Chat() {
  const [connected, setConnected] = useState(0);
  const [token, setToken] = useState("");
  const [socket, setSocket] = useState({});
  const [chatInfo, updateChatInfo] = useChatInfoReducer();
  const [currentChannelId, setCurrentChannelId] = useState();
  const [channel, updateChannel] = useChannelReducer();
  const [newDMUsers, setNewDMUsers] = useState({});
  const [textInput, setTextInput] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [userSearchVal, setUserSearchVal] = useState("");
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);

  const messageListRef = useRef();
  const oldScrollHeight = useRef();
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const theme = useTheme();

  useLayoutEffect(() => manageScroll());

  useEffect(() => {
    if (!user.loggedIn && token) setToken("");
  }, [user.loggedIn]);

  useEffect(() => {
    if (!token) return;

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
    newSocket.on("connected", () => setConnected(connected + 1));
    newSocket.on("disconnected", () => setConnected(connected - 1));
    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.clear();
    };
  }, [token]);

  useEffect(() => {
    if (socket.readyState !== 1) {
      if (socket.readyState == null || socket.readyState === 3) getToken();

      return;
    }

    socket.send("auth", token);

    socket.on("chatInfo", (chatInfo) => {
      updateChatInfo({
        type: "set",
        chatInfo,
      });

      if (chatInfo.rooms && chatInfo.rooms.length > 0) {
        if (!currentChannelId) {
          var roomId = chatInfo.rooms[0].id;
          setCurrentChannelId(roomId);
        }
      }
    });

    socket.on("channel", (channel) => {
      updateChannel({
        type: "set",
        channel,
      });
    });

    socket.on("message", (message) => {
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
        setCurrentTab("chats");
        setCurrentChannelId(info.channel.id);
        socket.send("getChannel", info.channel.id);
      }
    });

    socket.on("openDM", (channelId) => {
      setCurrentTab("chats");
      setCurrentChannelId(channelId);
      socket.send("getChannel", channelId);
    });

    socket.on("dateUpdate", (info) => {
      updateChatInfo({
        type: "date",
        channelId: info.channel,
        date: info.date,
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

    socket.on("messageDeleted", (messageId) => {
      updateChannel({
        type: "deleteMessage",
        messageId,
      });
    });

    socket.on("error", (error) => {
      errorAlert(error);
    });
  }, [connected]);

  useEffect(() => {
    if (!channel.id) return;

    if (chatInfo.notifs.byChannel[channel.id])
      socket.send("readNotifsInChannel", channel.id);

    updateChatInfo({
      type: "readNotifs",
      channelId: channel.id,
    });
  }, [channel]);

  function getToken() {
    axios
      .get("/api/chat/connect")
      .then((res) => {
        setToken(res.data);
      })
      .catch(errorAlert);
  }

  function onOpenNewChatDialog() {
    setNewChatDialogOpen(true);
    setUserSearchVal("");
    socket.send("getUsers", "");
  }

  function onCloseNewChatDialog() {
    setNewChatDialogOpen(false);
    setNewDMUsers({});
  }

  function onChannelSelect(id, type) {
    if (type !== "users") {
      socket.send("getChannel", id);

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

      if (messageList.scrollTop === 0)
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
    socket.send("getUsers", query);
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
      ...rooms.map((channel) => ({ channel, type: "rooms" })),
      ...directs.sort(sortDMs).map((channel) => ({
        channel,
        type: "directs",
      })),
    ],
    [rooms, directs]
  );

  useEffect(() => {
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
          <ChannelName
            short
            channelType={type}
            channel={channel}
            user={user}
          />
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

  if (!token) return null;

  return (
    <Paper
      elevation={4}
      sx={{
        width: "100%",
        overflow: "hidden",
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
          color: theme.palette.primary.contrastText,
        }}
      >
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
        >
        </Badge>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Chat
        </Typography>
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
                  No chats available
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
          height: 480,
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
          {channel.id && (
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

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [clickCoords, setClickCoords] = useState({});

  const messageRef = useRef();
  const contextMenuRef = useRef();
  const user = useContext(UserContext);
  const isSelf = message.sender.id === user.id;
  const age = Date.now() - message.date;
  const showTimestamp = age > 1000 * 60;

  useOnOutsideClick(messageRef, () => setShowContextMenu(false));

  useEffect(() => {
    if (!contextMenuRef.current) return;

    const messageRect = messageRef.current.getBoundingClientRect();

    contextMenuRef.current.style.top = clickCoords.y - messageRect.top + "px";

    if (!isSelf)
      contextMenuRef.current.style.left =
        clickCoords.x - messageRect.left + "px";
    else
      contextMenuRef.current.style.right =
        messageRect.right - clickCoords.x + "px";

    contextMenuRef.current.style.visibility = "visible";
  }, [clickCoords]);

  function onMessageClick(e) {
    if (e.type === "contextmenu") {
      e.preventDefault();
      setShowContextMenu(true);
      setClickCoords({ x: e.clientX, y: e.clientY });
    }
  }

  function onDeleteClick() {
    socket.send("deleteMessage", message.id);
  }

  const textColorOverride =
    !user.settings?.ignoreTextColor &&
    message.sender.settings &&
    message.sender.settings.textColor
      ? message.sender.settings.textColor
      : null;

  return (
    <Box
      className={`message ${isSelf ? "self" : ""}`}
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
          color={
            message.sender.settings && message.sender.settings.nameColor
          }
          groups={message.sender.groups}
          vanityUrl={message.sender.vanityUrl}
          noLink={isSelf}
        />
        <Typography
          variant="body2"
          component="span"
          className="content"
          onContextMenu={onMessageClick}
          ref={messageRef}
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
      {showContextMenu &&
        (user.id === message.sender.id || user.perms.deleteChatMessage) && (
          <div className="context" ref={contextMenuRef}>
            <div className="item" onClick={onDeleteClick}>
              Delete
            </div>
          </div>
        )}
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
          newChatInfo = update(chatInfo, {
            directs: {
              $unshift: [action.channel],
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
            if (channel.id === action.channelId)
              channel.lastMessageDate = action.date;

            return channel;
          });

          newChatInfo = update(chatInfo, {
            directs: {
              $set: newDirects,
            },
          });
          break;
        case "addNotif":
          var channelType =
            action.channelId.length === 32 ? "directs" : "rooms";
          var newAll = chatInfo.notifs.all + 1;
          var newByChannelType = chatInfo.notifs[channelType]
            ? chatInfo.notifs[channelType] + 1
            : 1;
          var newByChannel = chatInfo.notifs[action.channelId]
            ? chatInfo.notifs[action.channelId] + 1
            : 1;

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
          var newAll = chatInfo.notifs.all - amt;
          var newByChannelType =
            chatInfo.notifs.byChannelType[channelType] - amt;

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
