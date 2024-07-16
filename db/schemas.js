const gameSchemas = require("./schemas/game");
const userSchemas = require("./schemas/user");
const forumSchemas = require("./schemas/forum");
const chatSchemas = require("./schemas/chat");
const modSchemas = require("./schemas/moderation");
const siteSchemas = require("./schemas/site");

const schemas = {
  User: userSchemas.user,
  Session: userSchemas.session,
  Friend: userSchemas.friend,
  FriendRequest: userSchemas.friendRequest,
  Love: userSchemas.love,
  LoveRequest: userSchemas.loveRequest,
  DocSave: userSchemas.docSave,

  Setup: gameSchemas.setup,
  AnonymousDeck: gameSchemas.anonymousDeck,
  DeckProfile: gameSchemas.anonDeckProfile,
  Game: gameSchemas.game,

  ForumCategory: forumSchemas.category,
  ForumBoard: forumSchemas.board,
  ForumThread: forumSchemas.thread,
  ForumReply: forumSchemas.reply,
  ForumVote: forumSchemas.vote,

  ChatChannel: chatSchemas.channel,
  ChatMessage: chatSchemas.message,
  ChannelOpen: chatSchemas.channelOpen,

  Comment: siteSchemas.comment,
  Notification: siteSchemas.notification,
  Emoji: siteSchemas.emoji,
  Restart: siteSchemas.restart,

  Group: modSchemas.group,
  InGroup: modSchemas.inGroup,
  ModAction: modSchemas.modAction,
  Announcement: modSchemas.announcement,
  Ban: modSchemas.ban,
};

module.exports = Object.freeze(schemas);
