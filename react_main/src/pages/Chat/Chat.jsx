import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useReducer,
  useContext,
} from "react";
import axios from "axios";
import update from "immutability-helper";

import { ClientSocket as Socket } from "../../Socket";
import { useErrorAlert } from "../../components/Alerts";
import { NameWithAvatar, StatusIcon } from "../User/User";
import { UserContext } from "../../Contexts";
import { MaxChatMessageLength } from "../../Constants";
import { Time, UserText } from "../../components/Basic";
import {
  NotificationHolder,
  filterProfanity,
  useOnOutsideClick,
} from "../../components/Basic";

import "../../css/chat.css";
import { flipTextColor } from "../../utils";

export default function Chat() {
  const [showWindow, setShowWindow] = useState(false);
  const [connected, setConnected] = useState(0);
  const [token, setToken] = useState("");
  const [socket, setSocket] = useState({});
  const [chatInfo, updateChatInfo] = useChatInfoReducer();
  const [currentTab, setCurrentTab] = useState("rooms");
  const [currentChannelId, setCurrentChannelId] = useState();
  const [channel, updateChannel] = useChannelReducer();
  const [newDMUsers, setNewDMUsers] = useState({});
  const [textInput, setTextInput] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [userSearchVal, setUserSearchVal] = useState("");

  const messageListRef = useRef();
  const oldScrollHeight = useRef();
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  useLayoutEffect(() => manageScroll());

  useEffect(() => {
    if (!user.loggedIn && token) setToken("");
  }, [user.loggedIn]);

  useEffect(() => {
    if (!token) return;

    var socketURL;

    if (process.env.REACT_APP_USE_PORT == "true")
      socketURL = `${process.env.REACT_APP_SOCKET_PROTOCOL}://${process.env.REACT_APP_SOCKET_URI}:${process.env.REACT_APP_CHAT_PORT}`;
    else
      socketURL = `${process.env.REACT_APP_SOCKET_PROTOCOL}://${process.env.REACT_APP_SOCKET_URI}/chatSocket`;

    var newSocket = new Socket(socketURL);
    newSocket.on("connected", () => setConnected(connected + 1));
    newSocket.on("disconnected", () => setConnected(connected - 1));
    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.clear();
    };
  }, [token]);

  useEffect(() => {
    if (socket.readyState != 1) {
      if (socket.readyState == null || socket.readyState == 3) getToken();

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
        setCurrentTab("directs");
        setCurrentChannelId(info.channel.id);
        socket.send("getChannel", info.channel.id);
      }
    });

    socket.on("openDM", (channelId) => {
      setCurrentTab("directs");
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

      if (document.hidden && document.title.indexOf("🔴") == -1)
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
      .get("/chat/connect")
      .then((res) => {
        setToken(res.data);
      })
      .catch(errorAlert);
  }

  function onTopBarClick() {
    setShowWindow(!showWindow);
    setAutoScroll(true);

    if (!showWindow) {
      if (currentChannelId) socket.send("getChannel", currentChannelId);

      if (currentChannelId) {
        if (chatInfo.notifs.byChannel[currentChannelId])
          socket.send("readNotifsInChannel", currentChannelId);

        updateChatInfo({
          type: "readNotifs",
          channelId: currentChannelId,
        });
      }
    } else socket.send("closedChat");
  }

  function onTabClick(type) {
    setCurrentTab(type);

    if (type == "users") socket.send("getUsers", userSearchVal);
  }

  function onChannelClick(id) {
    if (currentTab != "users") {
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
    if (e.key == "Enter" && textInput.length) {
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

      if (messageList.scrollTop == 0)
        socket.send("getOldMessages", channel.messages[0].date);
    }
  }

  function manageScroll() {
    if (messageListRef.current) {
      if (oldScrollHeight.current == null)
        oldScrollHeight.current = messageListRef.current.scrollHeight;
      else if (oldScrollHeight.current != messageListRef.current.scrollHeight) {
        if (messageListRef.current.scrollTop == 0) {
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
      channelType: currentTab,
      channelId,
    });
  }

  var channels = chatInfo[currentTab];

  if (currentTab == "directs") channels = channels.sort(sortDMs);

  channels = channels.reduce((channels, channel) => {
    if (currentTab == "users" && channel.id == user.id) return channels;

    var className = "channel";

    if (currentTab != "users" && channel.id == currentChannelId)
      className += " sel";
    else if (currentTab == "users" && newDMUsers[channel.id])
      className += " sel";

    channels.push(
      <NotificationHolder
        className={className}
        key={channel.id}
        notifCount={chatInfo.notifs.byChannel[channel.id]}
        onClick={() => onChannelClick(channel.id)}
      >
        <ChannelName
          short
          channelType={currentTab}
          channel={channel}
          user={user}
        />
      </NotificationHolder>
    );

    return channels;
  }, []);

  const messages = channel.messages.map((message) => (
    <Message message={message} socket={socket} key={message.id} />
  ));

  return (
    token && (
      <NotificationHolder
        className="chat-wrapper"
        notifCount={chatInfo.notifs.all}
      >
        <div className="top-bar" onClick={onTopBarClick}>
          <i className="fas fa-comment" />
          <div className="label">Chat</div>
        </div>
        {showWindow && (
          <div className="window">
            <div className="left-panel">
              <div className="channel-type-nav">
                <NotificationHolder
                  className={`channel-type ${
                    currentTab == "rooms" ? "sel" : ""
                  }`}
                  notifCount={chatInfo.notifs.byChannelType["rooms"]}
                  onClick={() => onTabClick("rooms")}
                >
                  Rooms
                </NotificationHolder>
                <NotificationHolder
                  className={`channel-type ${
                    currentTab == "directs" ? "sel" : ""
                  }`}
                  notifCount={chatInfo.notifs.byChannelType["directs"]}
                  onClick={() => onTabClick("directs")}
                >
                  Directs
                </NotificationHolder>
                <div
                  className={`channel-type ${
                    currentTab == "users" ? "sel" : ""
                  }`}
                  onClick={() => onTabClick("users")}
                >
                  Users
                </div>
              </div>
              {currentTab == "users" && (
                <input
                  className="user-search"
                  value={userSearchVal}
                  placeholder={"Search"}
                  onChange={onUserSearch}
                />
              )}
              <div className="channel-list">{channels}</div>
              {currentTab == "users" && Object.keys(newDMUsers).length > 0 && (
                <div
                  className="create-dm-btn btn btn-theme"
                  onClick={onCreateDM}
                >
                  <i className="fas fa-plus" />
                  Create DM ({Object.keys(newDMUsers).length})
                </div>
              )}
            </div>
            <div className="right-panel">
              {channel.id && (
                <>
                  <div className="channel-top">
                    <div className="channel-name">
                      <ChannelName
                        channelType={channel.public ? "rooms" : "directs"}
                        channel={channel}
                        user={user}
                      />
                    </div>
                    {!channel.public && (
                      <i
                        className="close-dm fas fa-times"
                        onClick={() => onCloseDM(channel.id)}
                      />
                    )}
                  </div>
                  <div
                    className="channel-messages"
                    ref={messageListRef}
                    onScroll={onMessagesScroll}
                  >
                    {messages}
                  </div>
                  <div className="channel-input-wrapper">
                    <input
                      className="channel-input"
                      value={textInput}
                      maxLength={MaxChatMessageLength}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyPress={onSendMessage}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </NotificationHolder>
    )
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
  const isSelf = message.sender.id == user.id;
  const age = Date.now() - message.date;

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
    if (e.type == "contextmenu") {
      e.preventDefault();
      setShowContextMenu(true);
      setClickCoords({ x: e.clientX, y: e.clientY });
    }
  }

  function onDeleteClick() {
    socket.send("deleteMessage", message.id);
  }

  return (
    <div className={`message ${isSelf ? "self" : ""}`}>
      <div className="info">
        {!isSelf && (
          <NameWithAvatar
            small
            id={message.sender.id}
            name={message.sender.name}
            avatar={message.sender.avatar}
            color={
              message.sender.settings &&
              message.sender.settings.nameColor
            }
            groups={message.sender.groups}
          />
        )}
        {age > 1000 * 60 && (
          <div className="timestamp">
            <Time millisec={age} suffix=" ago" />
          </div>
        )}
      </div>
      <div
        className="content"
        style={
          !user.settings?.ignoreTextColor &&
          message.sender.settings &&
          message.sender.settings.textColor
            ? { color: message.sender.settings.textColor}
            // ? { color: flipTextColor(message.sender.settings.textColor) }
            : {}
        }
        onContextMenu={onMessageClick}
        ref={messageRef}
      >
        {/* {linkify(message.content)} */}
        <UserText
          text={message.content}
          settings={user.settings}
          filterProfanity
          linkify
          emotify
        />
      </div>
      {showContextMenu &&
        (user.id == message.sender.id || user.perms.deleteChatMessage) && (
          <div className="context" ref={contextMenuRef}>
            <div className="item" onClick={onDeleteClick}>
              Delete
            </div>
          </div>
        )}
    </div>
  );
}

function ChannelName(props) {
  const channelType = props.channelType;
  const channel = props.channel;
  const user = props.user;
  const short = props.short;

  switch (channelType) {
    case "rooms":
      return channel.name;
    case "directs":
      if (short) {
        var memberNames = channel.members
          .filter((m) => m.id != user.id)
          .map((m) => m.name);
        var name = memberNames.join(", ");

        if (memberNames.length > 1 && name.length > 20)
          name = name.slice(0, 17) + "...";

        return name;
      } else {
        var members = channel.members.filter((m) => m.id != user.id);
        return members.map((m) => (
          <NameWithAvatar
            small
            id={m.id}
            name={m.name}
            avatar={m.avatar}
            key={m.id}
          />
        ));
      }
    case "users":
      return (
        <>
          <NameWithAvatar
            small
            noLink
            id={channel.id}
            name={channel.name}
            avatar={channel.avatar}
          />
          <StatusIcon status={channel.status} />
        </>
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
              notif.channelId.length == 32 ? "directs" : "rooms";

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
            (channel) => channel.id != action.channelId
          );

          newChatInfo = update(chatInfo, {
            [action.channelType]: {
              $set: newChannels,
            },
          });
          break;
        case "date":
          var newDirects = chatInfo.directs.map((channel) => {
            if (channel.id == action.channelId)
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
          var channelType = action.channelId.length == 32 ? "directs" : "rooms";
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
          var channelType = action.channelId.length == 32 ? "directs" : "rooms";
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
          if (action.message.channel != channel.id) break;

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

            if (message.id == action.messageId) {
              index = i;
              break;
            }
          }

          if (index != -1) {
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
