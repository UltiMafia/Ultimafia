const mongoose = require("mongoose");

const game = new mongoose.Schema({
    id: { type: String, index: true },
    type: String,
    lobby: { type: String, default: "Main" },
    setup: { type: mongoose.Schema.Types.ObjectId, ref: "Setup" },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    players: [String],
    left: [String],
    names: [String],
    winners: [String],
    history: String,
    startTime: Number,
    endTime: { type: Number, index: true },
    ranked: Boolean,
    competitive: Boolean,
    private: Boolean,
    guests: Boolean,
    spectating: Boolean,
    voiceChat: Boolean,
    readyCheck: Boolean,
    noVeg: Boolean,
    stateLengths: { type: Map, of: Number },
    gameTypeOptions: String,
    broken: Boolean,
    anonymousGame: Boolean,
    anonymousDeck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AnonymousDeck",
    },
  }
);

const setup = new mongoose.Schema({
  id: { type: String, index: true },
  hash: { type: String, index: true },
  name: { type: String, index: true },
  gameType: { type: String, index: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  closed: Boolean,
  unique: Boolean,
  uniqueWithoutModifier: Boolean,
  useRoleGroups: Boolean,
  roleGroupSizes: [Number],
  roles: String,
  count: { type: Map, of: Number },
  total: Number,
  startState: { type: String, default: "Night" },
  whispers: Boolean,
  leakPercentage: Number,
  dawn: Boolean,
  lastWill: Boolean,
  mustAct: Boolean,
  mustCondemn: Boolean,
  noReveal: Boolean,
  alignmentReveal: Boolean,
  votesInvisible: Boolean,
  gameStartPrompt: { type: String, default: undefined },
  swapAmt: Number,
  roundAmt: Number,
  firstTeamSize: Number,
  lastTeamSize: Number,
  numMissions: Number,
  teamFailLimit: Number,
  excessRoles: Number,
  favorites: Number,
  featured: { type: Boolean, index: true },
  ranked: { type: Boolean, default: false },
  competitive: { type: Boolean, default: false },
  played: { type: Number, index: true },
  rolePlays: {},
  roleWins: {},
});

const anonymousDeck = new mongoose.Schema({
    id: { type: String, index: true },
    name: { type: String, index: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    profiles: [{ type: mongoose.Schema.Types.ObjectId, ref: "DeckProfile" }],
    disabled: { type: Boolean, default: 0 },
    featured: { type: Boolean, index: true },
  }
);

const anonDeckProfile = new mongoose.Schema({
    id: { type: String, index: true },
    deck: { type: mongoose.Schema.Types.ObjectId, ref: "AnonymousDeck" },
    avatar: { type: String, index: true, default: "" },
    name: { type: String, index: true },
    color: { type: String, index: true },
    deathMessage: { type: String, index: true, default: "" },
  }
);

module.exports = Object.freeze({game, setup, anonymousDeck, anonDeckProfile});
