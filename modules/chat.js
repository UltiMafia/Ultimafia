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

const port = process.env.CHAT_PORT;
const server = new sockets.SocketServer(port);
const users = {};
const channelMembers = {};

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
        let user;
        let currentChannel;

        socket.send("connected");

        socket.on("auth", async (token) => {
          try {
            if (user) return;

            const userId = await redis.authenticateToken(String(token));
            if (!userId) return;

            user = await redis.getBasicUserInfo(userId);

            if (!user) return;

            users[user.id] = socket;
            sendChatInfo(userId, socket);
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("getChannel", async (channelId) => {
          try {
            if (!user) return;

            channelId = String(channelId);

            const permInfo = await redis.getUserPermissions(user.id);
            const channel = await models.ChatChannel.findOne({
              id: channelId,
              rank: { $lte: permInfo.rank },
            })
              .select("name public memberIds members -_id")
              .populate(
                "members",
                "id name avatar settings.nameColor settings.textColor -_id"
              );

            if (!channel) return;

            const messages = await models.ChatMessage.find({
              channel: channelId,
            })
              .select("id senderId sender date channel content -_id")
              .populate("sender", "id -_id")
              .sort("-date")
              .limit(constants.chatMessagesPerLoad);

            for (const i in messages) {
              const message = messages[i].toJSON();
              message.sender = await redis.getBasicUserInfo(
                message.sender.id,
                true
              );
              messages[i] = message;
            }

            socket.send("channel", {
              id: channelId,
              name: channel.name,
              public: channel.public,
              members: channel.members,
              messages: messages.reverse(),
            });

            if (currentChannel) delete channelMembers[currentChannel][user.id];

            if (!channelMembers[channelId]) channelMembers[channelId] = {};

            currentChannel = channelId;
            channelMembers[channelId][user.id] = socket;
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("getOldMessages", async (lastDate) => {
          try {
            lastDate = Number(lastDate);

            if (!user || !lastDate) return;

            const permInfo = await redis.getUserPermissions(user.id);
            const channel = await models.ChatChannel.findOne({
              id: currentChannel,
              rank: { $lte: permInfo.rank },
            }).select("_id");

            if (!channel) return;

            const messages = await models.ChatMessage.find({
              channel: currentChannel,
              date: { $lt: lastDate },
            })
              .select("id senderId sender date channel content -_id")
              .populate("sender", "id -_id")
              .sort("-date")
              .limit(constants.chatMessagesPerLoad);

            for (const i in messages) {
              const message = messages[i].toJSON();
              message.sender = await redis.getBasicUserInfo(
                message.sender.id,
                true
              );
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

            const permInfo = await redis.getUserPermissions(user.id);
            const channel = await models.ChatChannel.findOne({
              id: currentChannel,
              rank: { $lte: permInfo.rank },
            })
              .select("id public memberIds members lastMessageDate -_id")
              .populate("members", "id name blockedUsers settings -_id");

            if (!channel) return;
            if (channel.public && !permInfo.perms.publicChat) {
              socket.send("error", "You are unable to use public chat.");
              return;
            }
            if (
              !channel.public &&
              (channel.memberIds.indexOf(user.id) == -1 ||
                !permInfo.perms.privateChat)
            ) {
              let allowed = !(channel.memberIds.indexOf(user.id) == -1);

              if (allowed) {
                const modIds = await utils.getModIds();

                for (const memberId of channel.memberIds) {
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
            } else if (!(await utils.rateLimit(user.id, "sendChatMessage"))) {
              socket.send("error", "You are chatting too quickly.");
              return;
            } else if (!channel.public) {
              const blockedUsers = await redis.getBlockedUsers(user.id);

              for (const member of channel.members) {
                if (member.id == user.id) continue;
                else if (member.settings.onlyFriendDMs) {
                  const isFriend = await models.Friend.findOne({
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
                } else if (member.blockedUsers.indexOf(user.id) != -1) {
                  socket.send(
                    "error",
                    "Unable to send message, a member of this DM has blocked you."
                  );
                  return;
                } else if (blockedUsers.indexOf(member.id) != -1) {
                  socket.send(
                    "error",
                    "You cannot send a message to someone you have blocked."
                  );
                  return;
                }
              }
            }

            let message = new models.ChatMessage({
              id: shortid.generate(),
              senderId: user.id,
              date: Date.now(),
              channel: currentChannel,
              content,
            });
            message.save();

            message = message.toJSON();
            message.sender = user;
            delete message._id;

            broadcastMessage(message, channel);

            await models.ChatChannel.updateOne(
              { id: currentChannel },
              { $set: { lastMessageDate: Date.now() } }
            ).exec();

            if (channel.public) {
              const pingedNames = content.match(/@[\w-]+/g);

              if (!pingedNames) return;

              const pingedName = new RegExp(
                `^${pingedNames[0].replace("@", "")}$`,
                "i"
              );
              const pingedUser = await models.User.findOne({
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
                channel.memberIds.filter(
                  (uId) => uId != user.id && !channelMembers[channel.id][uId]
                ),
                users
              );

              for (const memberId of channel.memberIds) {
                if (memberId == user.id) continue;

                let channelOpen = await models.ChannelOpen.findOne({
                  user: memberId,
                  channelId: channel.id,
                }).select("_id");

                if (channelOpen) continue;

                if (users[memberId]) {
                  users[memberId].send("newDirectChannel", {
                    channel: {
                      ...channel.toJSON(),
                      lastMessageDate: Date.now(),
                      memberIds: undefined,
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

            let users = await models.User.find({
              name: new RegExp(query, "i"),
              deleted: false,
            })
              .select("id name avatar -_id")
              .limit(constants.chatUserSearchAmt)
              .sort("name");
            users = users.map((user) => user.toJSON());

            for (const user of users)
              user.status = await redis.getUserStatus(user.id);

            socket.send("users", users);
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("newDMChannel", async (users) => {
          try {
            if (!user || !Array.isArray(users)) return;

            const userHash = {};

            for (const userId of users)
              if (utils.validProp(String(userId)))
                userHash[String(userId)] = true;

            userHash[user.id] = true;
            users = Object.keys(userHash);

            users = await models.User.find({
              id: { $in: users },
              deleted: false,
            }).select("id name");

            const userIds = users.map((user) => user.id);
            const channelId = userIdsToChannelId(userIds);
            let channel = await models.ChatChannel.findOne({ id: channelId })
              .select("id public memberIds members lastMessageDate -_id")
              .populate("members", "id name -_id");

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
                channel: { ...channel.toJSON(), memberIds: undefined },
                focus: true,
              });
              return;
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
              .populate("members", "id name -_id");

            socket.send("newDirectChannel", {
              channel: { ...channel.toJSON(), memberIds: undefined },
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

            const notifs = await models.Notifications.find({ user: user.id });
            socket.send("notifs", notifs);
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("readNotifsInChannel", async (channelId) => {
          try {
            if (!user) return;

            await models.Notification.deleteMany({
              user: user.id,
              channelId,
            }).exec();
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("deleteMessage", async (messageId) => {
          try {
            const message = await models.ChatMessage.findOne({
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
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("closedChat", () => {
          try {
            if (!user) return;

            if (currentChannel) delete channelMembers[currentChannel][user.id];
          } catch (e) {
            logger.error(e);
          }
        });

        socket.on("disconnected", () => {
          try {
            if (!user) return;

            delete users[user.id];

            if (currentChannel) delete channelMembers[currentChannel][user.id];
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
  const permInfo = await redis.getUserPermissions(userId);
  const rooms = await models.ChatChannel.find({
    public: true,
    rank: { $lte: permInfo.rank },
  }).select("id public name lastMessageDate -_id");
  let directs = await models.ChannelOpen.find({ user: userId })
    .select("channelId channel -_id")
    .populate({
      path: "channel",
      select: "id public memberIds members lastMessageDate -_id",
      populate: {
        path: "members",
        select: "id name -_id",
      },
    });
  const notifs = await models.Notification.find({
    user: userId,
    isChat: true,
  }).select("channelId");
  const users = await redis.getOnlineUsersInfo(constants.chatUserOnlineAmt);

  directs = directs.reduce((directs, info) => {
    if (info.channel)
      directs.push({ ...info.channel.toJSON(), memberIds: undefined });

    return directs;
  }, []);

  socket.send("chatInfo", { rooms, directs, users, notifs });
}

function broadcastMessage(message, channel) {
  let members = channelMembers[message.channel] || {};

  for (const memberId in members)
    members[memberId].send("message", { ...message, senderId: undefined });

  members = channel.members;

  if (members)
    for (const member of members)
      if (users[member.id])
        users[member.id].send("dateUpdate", {
          channel: channel.id,
          date: message.date,
        });
}

function broadcastDeletion(messageId, channelId) {
  const members = channelMembers[channelId] || {};

  for (const memberId in members)
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
