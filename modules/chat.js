const dotenv = require("dotenv").config();
const shortid = require("shortid");
const md5 = require("md5");
const sockets = require("../lib/sockets");
const logger = require("./logging")("chat");
const db = require("../db/db");
const models = require("../db/models");
const redis = require("./redis");
const constants = require("../data/constants");
const utils = require("../routes/utils");
const blocks = require("./blocks");
const dmGate = require("./dmGate");
const { addSocket, removeSocket } = require("./socketGroup");

const port = process.env.CHAT_PORT;
const server = new sockets.SocketServer(port);
// users[userId] and channelMembers[channelId][userId] are SocketGroups: a
// user can have several chat sockets open (tabs, or the homepage chatbox and
// the floating DM window together), each with its own current channel.
const users = {};
const channelMembers = {};

function leaveCurrentChannel(channelId, userId, socket) {
  if (channelId && channelMembers[channelId])
    removeSocket(channelMembers[channelId], userId, socket);
}

// DMs are refused while the user is alive in a running ranked/competitive
// game (modules/dmGate.js). Sends "dmLocked" so clients can show why.
// A DM whose other members are all moderators stays open, as it did under
// the old privateChat lock, so a player can still reach a mod mid-game.
async function refuseIfDmLocked(socket, userId, memberIds) {
  const access = await dmGate.getDmAccess(userId);
  if (!access.locked) return false;
  if (memberIds && (await onlyModsBesides(memberIds, userId))) return false;
  socket.send("dmLocked", { message: access.message, gameId: access.gameId });
  return true;
}

// Member fields DM clients get: enough for names and avatars, nothing else
// (sendMessage populates blockedUsers/settings for its own checks).
function publicMembers(members) {
  return (members || []).map((m) => ({ id: m.id, name: m.name, avatar: m.avatar }));
}

// A DM channel as clients see it, with the last-message preview the floating
// DM window lists conversations by.
function directForClient(channel, lastMessage) {
  const json = channel.toJSON ? channel.toJSON() : { ...channel };
  return {
    ...json,
    members: publicMembers(json.members),
    memberIds: undefined,
    lastMessage: lastMessage || null,
  };
}

function previewOf(message) {
  if (!message) return null;
  return {
    content: String(message.content || "").slice(0, 120),
    senderId: message.senderId || (message.sender && message.sender.id),
    date: message.date,
  };
}

// Newest message of each channel, keyed by channel id.
async function lastMessagesFor(channelIds) {
  const out = {};
  if (!channelIds.length) return out;
  const rows = await models.ChatMessage.aggregate([
    { $match: { channel: { $in: channelIds } } },
    { $sort: { date: -1 } },
    {
      $group: {
        _id: "$channel",
        content: { $first: "$content" },
        senderId: { $first: "$senderId" },
        date: { $first: "$date" },
      },
    },
  ]);
  for (const row of rows) out[row._id] = previewOf(row);
  return out;
}

// DMs render the sender's own custom emotes and stickers (":name:" codes),
// the same maps game chat uses (user settings, remapped by redis.cacheUserInfo).
// Only for DMs, so public room messages stay small.
async function addSenderEmotes(sender, cache) {
  if (!sender || !sender.id) return sender;
  let maps = cache && cache.get(sender.id);
  if (!maps) {
    try {
      maps = await redis.getUserCustomEmotes(sender.id);
    } catch (e) {
      logger.error(e);
      maps = { customEmotes: {}, customStickers: {} };
    }
    if (cache) cache.set(sender.id, maps);
  }
  sender.customEmotes = maps.customEmotes;
  sender.customStickers = maps.customStickers;
  return sender;
}

async function onlyModsBesides(memberIds, userId) {
  const others = (memberIds || []).filter((id) => id != userId);
  if (others.length === 0) return false;
  const modIds = await utils.getModIds();
  return others.every((id) => modIds.indexOf(id) != -1);
}

(async function () {
  try {
    await db.promise;

    process
      .on("unhandledRejection", (err) => logger.error(err))
      .on("uncaughtException", (err) => logger.error(err))
      .on("exit", onClose)
      .on("SIGINT", onClose)
      .on("SIGUSR1", onClose)
      .on("SIGUSR2", onClose);

    server.on("connection", async (socket) => {
      try {
        var user, currentChannel;

        socket.send("connected");

        socket.on("auth", async (token) => {
          try {
            if (user) return;

            var userId = await redis.authenticateToken(String(token));
            if (!userId) return;

            user = await redis.getBasicUserInfo(userId);

            if (!user) return;

            addSocket(users, user.id, socket);
            sendChatInfo(userId, socket);
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("getChannel", async (channelId) => {
          try {
            if (!user) return;

            channelId = String(channelId);

            var permInfo = await redis.getUserPermissions(user.id);
            var channel = await models.ChatChannel.findOne({
              id: channelId,
              rank: { $lte: permInfo.rank },
            })
              .select("name public memberIds members -_id")
              .populate(
                "members",
                "id name avatar settings.nameColor settings.textColor -_id"
              );

            if (!channel) return;

            if (!channel.public) {
              if (channel.memberIds.indexOf(user.id) == -1) return;
              if (await refuseIfDmLocked(socket, user.id, channel.memberIds)) {
                leaveCurrentChannel(currentChannel, user.id, socket);
                currentChannel = null;
                return;
              }
            }

            var messages = await models.ChatMessage.find({ channel: channelId })
              .select("id senderId sender date channel content -_id")
              .populate("sender", "id -_id")
              .sort("-date")
              .limit(constants.chatMessagesPerLoad);

            const emoteCache = new Map();
            for (let i in messages) {
              let message = messages[i].toJSON();
              message.sender = await redis.getBasicUserInfo(
                message.sender.id,
                true
              );
              if (!channel.public)
                await addSenderEmotes(message.sender, emoteCache);
              messages[i] = message;
            }

            socket.send("channel", {
              id: channelId,
              name: channel.name,
              public: channel.public,
              members: channel.members,
              messages: messages.reverse(),
            });

            leaveCurrentChannel(currentChannel, user.id, socket);

            if (!channelMembers[channelId]) channelMembers[channelId] = {};

            currentChannel = channelId;
            addSocket(channelMembers[channelId], user.id, socket);
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("getOldMessages", async (lastDate) => {
          try {
            lastDate = Number(lastDate);

            if (!user || !lastDate) return;

            var permInfo = await redis.getUserPermissions(user.id);
            var channel = await models.ChatChannel.findOne({
              id: currentChannel,
              rank: { $lte: permInfo.rank },
            }).select("_id public memberIds");

            if (!channel) return;
            if (
              !channel.public &&
              (await refuseIfDmLocked(socket, user.id, channel.memberIds))
            )
              return;

            var messages = await models.ChatMessage.find({
              channel: currentChannel,
              date: { $lt: lastDate },
            })
              .select("id senderId sender date channel content -_id")
              .populate("sender", "id -_id")
              .sort("-date")
              .limit(constants.chatMessagesPerLoad);

            const emoteCache = new Map();
            for (let i in messages) {
              let message = messages[i].toJSON();
              message.sender = await redis.getBasicUserInfo(
                message.sender.id,
                true
              );
              if (!channel.public)
                await addSenderEmotes(message.sender, emoteCache);
              messages[i] = message;
            }

            socket.send("oldMessages", messages.reverse());
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("sendMessage", async (content) => {
          try {
            if (!user) return;

            content = String(content).slice(0, constants.maxChatMessageLength);

            var permInfo = await redis.getUserPermissions(user.id);
            var channel = await models.ChatChannel.findOne({
              id: currentChannel,
              rank: { $lte: permInfo.rank },
            })
              .select("id public memberIds members lastMessageDate -_id")
              .populate("members", "id name avatar blockedUsers settings -_id");

            if (!channel) return;
            else if (channel.public && !permInfo.perms.publicChat) {
              socket.send("error", "You are unable to use public chat.");
              return;
            } else if (
              !channel.public &&
              (channel.memberIds.indexOf(user.id) == -1 ||
                !(await dmGate.hasPrivateChat(user.id, permInfo)))
            ) {
              var allowed = !(channel.memberIds.indexOf(user.id) == -1);

              if (allowed) {
                var modIds = await utils.getModIds();

                for (let memberId of channel.memberIds) {
                  if (memberId == user.id) continue;
                  else if (modIds.indexOf(memberId) == -1) {
                    allowed = false;
                    break;
                  }
                }
              }

              if (!allowed) {
                socket.send("error", "You are unable to use private chat.");
                return;
              }
            } else if (
              !channel.public &&
              (await refuseIfDmLocked(socket, user.id, channel.memberIds))
            ) {
              return;
            } else if (!(await utils.rateLimit(user.id, "sendChatMessage"))) {
              socket.send("error", "You are chatting too quickly.");
              return;
            } else if (!channel.public) {
              var blockedUsers = await redis.getBlockedUsers(user.id);

              for (let member of channel.members) {
                if (member.id == user.id) continue;
                // Blocks first: a friends-only setting must not let a
                // blocked friend through.
                const blockMessage = blocks.dmBlockMessage(
                  user.id,
                  blockedUsers,
                  member
                );
                if (blockMessage) {
                  socket.send("error", blockMessage);
                  return;
                } else if (member.settings && member.settings.onlyFriendDMs) {
                  var isFriend = await models.Friend.findOne({
                    userId: member.id,
                    friendId: user.id,
                  }).select("_id");

                  if (!isFriend) {
                    socket.send(
                      "error",
                      "A user in this channel is only accepting DMs from friends."
                    );
                    return;
                  }
                }
              }
            }

            var message = new models.ChatMessage({
              id: shortid.generate(),
              senderId: user.id,
              date: Date.now(),
              channel: currentChannel,
              content,
            });
            message.save();

            message = message.toJSON();
            message.sender = user;
            if (!channel.public) {
              // A copy: `user` is this socket's own session info.
              message.sender = { ...user };
              await addSenderEmotes(message.sender);
            }
            delete message._id;

            await broadcastMessage(message, channel);

            await models.ChatChannel.updateOne(
              { id: currentChannel },
              { $set: { lastMessageDate: Date.now() } }
            ).exec();

            if (channel.public) {
              var pingedNames = content.match(/@[\w-]+/g);

              if (!pingedNames) return;

              var pingedName = new RegExp(
                `^${pingedNames[0].replace("@", "")}$`,
                "i"
              );
              var pingedUser = await models.User.findOne({
                name: pingedName,
              }).select("id");

              if (pingedUser) {
                utils.createNotification(
                  {
                    channel: channel.id,
                    isChat: true,
                  },
                  [pingedUser.id],
                  users
                );
              }
            } else {
              utils.createNotification(
                {
                  channel: channel.id,
                  isChat: true,
                },
                channel.memberIds.filter((uId) => {
                  return uId != user.id && !channelMembers[channel.id][uId];
                }),
                users
              );

              for (let memberId of channel.memberIds) {
                if (memberId == user.id) continue;

                let channelOpen = await models.ChannelOpen.findOne({
                  user: memberId,
                  channelId: channel.id,
                }).select("_id");

                if (channelOpen) continue;

                if (users[memberId]) {
                  users[memberId].send("newDirectChannel", {
                    channel: {
                      ...directForClient(channel, previewOf(message)),
                      lastMessageDate: Date.now(),
                    },
                    focus: false,
                  });
                }

                channelOpen = new models.ChannelOpen({
                  user: memberId,
                  channelId: channel.id,
                });
                await channelOpen.save();
              }
            }
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("getUsers", async (query) => {
          try {
            if (!user) return;

            query = utils.strParseAlphaNum(query);

            if (query == null || query.length == 0) {
              socket.send(
                "users",
                await redis.getOnlineUsersInfo(constants.chatUserOnlineAmt)
              );
              return;
            }

            var users = await models.User.find({
              name: new RegExp(query, "i"),
              deleted: false,
            })
              .select("id name avatar -_id")
              .limit(constants.chatUserSearchAmt)
              .sort("name");
            users = users.map((user) => user.toJSON());

            for (let user of users)
              user.status = await redis.getUserStatus(user.id);

            socket.send("users", users);
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("newDMChannel", async (users) => {
          try {
            if (!user || !Array.isArray(users)) return;

            var userHash = {};

            for (let userId of users)
              if (utils.validProp(String(userId)))
                userHash[String(userId)] = true;

            userHash[user.id] = true;
            users = Object.keys(userHash);

            users = await models.User.find({
              id: { $in: users },
              deleted: false,
            }).select("id name");

            var userIds = users.map((user) => user.id);
            if (await refuseIfDmLocked(socket, user.id, userIds)) return;
            var channelId = userIdsToChannelId(userIds);
            var channel = await models.ChatChannel.findOne({ id: channelId })
              .select("id public memberIds members lastMessageDate -_id")
              .populate("members", "id name avatar -_id");

            if (channel) {
              var channelOpen = await models.ChannelOpen.findOne({
                user: user.id,
                channelId,
              }).select("_id");

              if (channelOpen) {
                socket.send("openDM", channelId);
                return;
              }

              channelOpen = new models.ChannelOpen({
                user: user.id,
                channelId,
              });
              await channelOpen.save();

              socket.send("newDirectChannel", {
                channel: directForClient(
                  channel,
                  (await lastMessagesFor([channelId]))[channelId]
                ),
                focus: true,
              });
              return;
            }

            // No new DM with someone either side has blocked. An existing
            // DM still opens (history stays readable); sending is refused.
            const blockCache = new Map();
            for (let otherId of userIds) {
              if (otherId == user.id) continue;
              if (await blocks.usersBlockEachOther(user.id, otherId, blockCache)) {
                socket.send(
                  "error",
                  "You can't start a DM with someone you have blocked or who has blocked you."
                );
                return;
              }
            }

            channel = new models.ChatChannel({
              id: channelId,
              public: false,
              memberIds: userIds,
              lastMessageDate: Date.now(),
            });
            await channel.save();

            var channelOpen = new models.ChannelOpen({
              user: user.id,
              channelId,
            });
            await channelOpen.save();

            channel = await models.ChatChannel.findOne({ id: channelId })
              .select("id public memberIds members lastMessageDate -_id")
              .populate("members", "id name avatar -_id");

            socket.send("newDirectChannel", {
              channel: directForClient(channel, null),
              focus: true,
            });
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("closeDM", async (channelId) => {
          try {
            if (!user) return;

            channelId = String(channelId);
            await models.ChannelOpen.deleteOne({
              user: user.id,
              channelId,
            }).exec();
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("getNotifs", async () => {
          try {
            if (!user) return;

            var notifs = await models.Notifications.find({ user: user.id });
            socket.send("notifs", notifs);
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("readNotifsInChannel", async (channelId) => {
          try {
            if (!user) return;

            channelId = String(channelId);
            await models.Notification.deleteMany({
              user: user.id,
              channelId,
            }).exec();
            // Clear the badge in the user's other chat windows too.
            if (users[user.id])
              users[user.id].sendExcept(socket, "notifsRead", channelId);
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("deleteMessage", async (messageId) => {
          try {
            var message = await models.ChatMessage.findOne({
              id: messageId,
            }).select("senderId channel");

            if (!user || !message) return;

            if (
              message.senderId != user.id &&
              !(await utils.verifyPermission(user.id, "deleteChatMessage"))
            ) {
              socket.send("error", "You do not have the required permissions.");
              return;
            }

            await models.ChatMessage.deleteOne({ id: messageId }).exec();
            broadcastDeletion(messageId, message.channel);
            await sendPreviewUpdate(message.channel);
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("closedChat", () => {
          try {
            if (!user) return;

            leaveCurrentChannel(currentChannel, user.id, socket);
            currentChannel = null;
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("disconnected", () => {
          try {
            if (!user) return;

            removeSocket(users, user.id, socket);
            leaveCurrentChannel(currentChannel, user.id, socket);
          } catch (e) {
            logger.error(e);
          }
        });
      } catch (e) {
        logger.error(e);
      }
    });
  } catch (e) {
    logger.log(e);
  }
})();

async function sendChatInfo(userId, socket) {
  var permInfo = await redis.getUserPermissions(userId);
  var rooms = await models.ChatChannel.find({
    public: true,
    rank: { $lte: permInfo.rank },
  }).select("id public name lastMessageDate -_id");
  var directs = await models.ChannelOpen.find({ user: userId })
    .select("channelId channel -_id")
    .populate({
      path: "channel",
      select: "id public memberIds members lastMessageDate -_id",
      populate: {
        path: "members",
        select: "id name avatar -_id",
      },
    });
  var notifs = await models.Notification.find({
    user: userId,
    isChat: true,
  }).select("channelId");
  var users = await redis.getOnlineUsersInfo(constants.chatUserOnlineAmt);

  // Last-message previews, left out while DMs are locked for this user.
  var previews = {};
  try {
    if (!(await dmGate.getDmAccess(userId)).locked)
      previews = await lastMessagesFor(
        directs.filter((info) => info.channel).map((info) => info.channel.id)
      );
  } catch (e) {
    logger.error(e);
  }

  directs = directs.reduce((directs, info) => {
    if (info.channel)
      directs.push(directForClient(info.channel, previews[info.channel.id]));

    return directs;
  }, []);

  socket.send("chatInfo", { rooms, directs, users, notifs });
}

async function broadcastMessage(message, channel) {
  var members = channelMembers[message.channel] || {};

  for (let memberId in members) {
    // A DM member who had the channel open before their game started does
    // not keep receiving it while locked.
    if (!channel.public && memberId != message.sender.id) {
      try {
        if (
          (await dmGate.getDmAccess(memberId)).locked &&
          !(await onlyModsBesides(channel.memberIds, memberId))
        )
          continue;
      } catch (e) {
        logger.error(e);
      }
    }
    if (members[memberId])
      members[memberId].send("message", { ...message, senderId: undefined });
  }

  members = channel.members;

  // dateUpdate reorders every member's conversation list; DM members also
  // get the preview, unless their DMs are locked right now.
  if (members)
    for (let member of members) {
      if (!users[member.id]) continue;
      const update = { channel: channel.id, date: message.date };
      if (!channel.public) {
        let locked = false;
        if (member.id != message.sender.id) {
          try {
            locked = (await dmGate.getDmAccess(member.id)).locked;
          } catch (e) {
            logger.error(e);
          }
        }
        if (!locked) update.lastMessage = previewOf(message);
      }
      if (users[member.id]) users[member.id].send("dateUpdate", update);
    }
}

// After a DM message is deleted, members' conversation lists show the
// message before it (or nothing).
async function sendPreviewUpdate(channelId) {
  const channel = await models.ChatChannel.findOne({ id: channelId }).select(
    "public memberIds"
  );
  if (!channel || channel.public) return;
  const lastMessage = (await lastMessagesFor([channelId]))[channelId] || null;
  for (const memberId of channel.memberIds) {
    if (!users[memberId]) continue;
    if ((await dmGate.getDmAccess(memberId)).locked) continue;
    if (users[memberId])
      users[memberId].send("previewUpdate", { channel: channelId, lastMessage });
  }
}

function broadcastDeletion(messageId, channelId) {
  var members = channelMembers[channelId] || {};

  for (let memberId in members)
    members[memberId].send("messageDeleted", messageId);
}

async function onClose() {
  try {
    await redis.client.quitAsync();
    process.exit();
  } catch (e) {
    logger.error(e);
  }
}

function userIdsToChannelId(userIds) {
  userIds = userIds.sort();
  return md5(userIds.join(","));
}
