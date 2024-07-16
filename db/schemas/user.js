const mongoose = require("mongoose");

const user = new mongoose.Schema({
    id: { type: String, index: true },
    name: { type: String, index: true },
    ip: [{ type: String, index: true }],
    email: [{ type: String, index: true }],
    birthday: Date,
    fbUid: String,
    discordId: String,
    discordName: String,
    discordUsername: String,
    avatar: Boolean,
    banner: Boolean,
    bio: {
      type: String,
      default:
        "Click to edit your bio (ex. age, gender, location, interests, experience playing mafia)",
    },
    settings: {
      accessibilityTheme: {
        type: String,
        default: "",
        validate: {
          validator: (value) => accessibilityThemeValues.includes(value),
          message: ({ value }) =>
            `Invalid accessibilityTheme value "${value}. You must use one of: ${accessibilityThemeValues.join(
              ", "
            )}"`,
        },
      },
      showDiscord: { type: Boolean, default: false },
      showTwitch: { type: Boolean, default: false },
      showSteam: { type: Boolean, default: false },
      backgroundColor: String,
      bannerFormat: String,
      textColor: String,
      warnTextColor: String,
      ignoreTextColor: { type: Boolean, default: false },
      nameColor: String,
      warnNameColor: String,
      onlyFriendDMs: { type: Boolean, default: false },
      disablePg13Censor: { type: Boolean, default: false },
      disableAllCensors: { type: Boolean, default: false },
      hideDeleted: Boolean,
      roleIconScheme: { type: String, default: "vivid" },
      userColourScheme: { type: String, default: "dark" },
      autoplay: { type: Boolean, default: false },
      youtube: String,
      hideStatistics: { type: Boolean, default: false },
      deathMessage: String,
    },
    accounts: {
      discord: String,
      twitch: String,
      steam: String,
    },
    joined: { type: Number, index: true },
    lastActive: Number,
    numFriends: { type: Number, default: 0 },
    dev: Boolean,
    rank: Number,
    permissions: [String],
    setups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Setup" }],
    favSetups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Setup" }],
    anonymousDecks: [
      { type: mongoose.Schema.Types.ObjectId, ref: "AnonymousDeck" },
    ],
    games: [{ type: mongoose.Schema.Types.ObjectId, ref: "Game" }],
    globalNotifs: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
    ],
    blockedUsers: [String],
    coins: { type: Number, default: 0 },
    itemsOwned: {
      customProfile: { type: Number, default: 0 },
      nameChange: { type: Number, default: 1 },
      emotes: { type: Number, default: 0 },
      threeCharName: { type: Number, default: 0 },
      twoCharName: { type: Number, default: 0 },
      oneCharName: { type: Number, default: 0 },
      textColors: { type: Number, default: 0 },
      deathMessageEnabled: { type: Number, default: 0 },
      deathMessageChange: { type: Number, default: 0 },
      anonymousDeck: { type: Number, default: 0 },
    },
    stats: {},
    rankedPoints: { type: Number, default: 0 },
    competitivePoints: { type: Number, default: 0 },
    nameChanged: false,
    bdayChanged: false,
    playedGame: false,
    referrer: String,
    transactions: [Number],
    deleted: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    flagged: { type: Boolean, default: false },
});

const session = new mongoose.Schema({
  expires: Date,
  lastModified: Date,
  session: mongoose.Schema.Types.Mixed,
});

const friend = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    friendId: String,
    lastActive: Number,
  },
  { 
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

const friendRequest = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    targetId: String,
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

const docSave = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    saverId: String,
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

const love = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    loveId: String,
    type: String,
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

const loveRequest = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    targetId: String,
    type: String,
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
)

friend.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "id",
  justOne: true,
});

friend.virtual("friend", {
  ref: "User",
  localField: "friendId",
  foreignField: "id",
  justOne: true,
});

friendRequest.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "id",
  justOne: true,
});

friendRequest.virtual("target", {
  ref: "User",
  localField: "targetId",
  foreignField: "id",
  justOne: true,
});

docSave.virtual("saved", {
  ref: "User",
  localField: "savedId",
  foreignField: "id",
  justOne: true,
});

docSave.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "id",
  justOne: true,
});

love.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "id",
  justOne: true,
});

love.virtual("love", {
  ref: "User",
  localField: "loveId",
  foreignField: "id",
  justOne: true,
});

loveRequest.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "id",
  justOne: true,
});

loveRequest.virtual("target", {
  ref: "User",
  localField: "targetId",
  foreignField: "id",
  justOne: true,
});

module.exports = Object.freeze({user, session, friend, friendRequest, docSave, love, loveRequest});
