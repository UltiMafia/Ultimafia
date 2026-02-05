var mongoose = require("mongoose");
var stats = require("./stats");
var trophyData = require("../data/trophies");

const accessibilityThemeValues = ["", "Higher Contrast"];

const anonymousDeck = new mongoose.Schema({
  id: { type: String, index: true },
  name: { type: String, index: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  profiles: [{ type: mongoose.Schema.Types.ObjectId, ref: "DeckProfile" }],
  disabled: { type: Boolean, default: 0 },
  featured: { type: Boolean, index: true },
});

const skillRating = new mongoose.Schema({
  // See: https://www.npmjs.com/package/openskill
  mu: { type: Number }, // mean
  sigma: { type: Number }, // deviation
});

const factionRatings = [
  {
    factionName: { type: String },
    skillRating: skillRating,
    elo: { type: Number },
  },
];

var schemas = {
  User: new mongoose.Schema({
    id: { type: String, index: true },
    name: { type: String, index: true },
    previousNames: [
      {
        name: { type: String },
        changedAt: { type: Number },
      },
    ],
    ip: [{ type: String, index: true }],
    email: [{ type: String, index: true }],
    birthday: Date,
    pronouns: {
      type: String,
      default: "",
    },
    fbUid: String,
    discordId: String,
    discordName: String,
    discordUsername: String,
    avatar: Boolean,
    banner: Boolean,
    profileBackground: Boolean,
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
      backgroundColor: String,
      bannerFormat: String,
      avatarShape: { type: String, default: "circle" },
      iconFilter: { type: String, default: "none" },
      customPrimaryColor: { type: String, default: "none" },
      textColor: String,
      warnTextColor: String,
      ignoreTextColor: { type: Boolean, default: false },
      nameColor: String,
      warnNameColor: String,
      onlyFriendDMs: { type: Boolean, default: false },
      disablePg13Censor: { type: Boolean, default: false },
      disableAllCensors: { type: Boolean, default: false },
      hideDeleted: Boolean,
      fontSize: { type: String, default: "system" },
      minimumContrast: { type: String, default: "3.5" },
      siteColorScheme: { type: String, default: "dark" },
      disableProTips: { type: Boolean, default: false },
      disableSnowstorm: { type: Boolean, default: false },
      expHighDpiCorrection: { type: Boolean, default: false },
      roleSkins: String,
      autoplay: { type: Boolean, default: false },
      youtube: String,
      hideStatistics: { type: Boolean, default: false },
      hideKarma: { type: Boolean, default: false },
      hidePointsNegative: { type: Boolean, default: true },
      hideJoinDate: { type: Boolean, default: false },
      deathMessage: String,
      vanityUrl: { type: String, default: "" },
      backgroundRepeatMode: { type: String, default: "repeat" },
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
    contributorTypes: {
      type: [String],
      enum: ["code", "art", "music", "design"],
      default: [],
    },
    contributorBio: {
      type: String,
      maxlength: 240,
      default: "",
    },
    rank: Number,
    permissions: [String],
    setups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Setup" }],
    favSetups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Setup" }],
    anonymousDecks: [
      { type: mongoose.Schema.Types.ObjectId, ref: "AnonymousDeck" },
    ],
    customEmotes: [
      { type: mongoose.Schema.Types.ObjectId, ref: "CustomEmote" },
    ],
    games: [{ type: mongoose.Schema.Types.ObjectId, ref: "Game" }],
    globalNotifs: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
    ],
    blockedUsers: [String],
    coins: { type: Number, default: 0 },
    itemsOwned: {
      customProfile: { type: Number, default: 0 },
      avatarShape: { type: Number, default: 0 },
      iconFilter: { type: Number, default: 0 },
      customPrimaryColor: { type: Number, default: 0 },
      nameChange: { type: Number, default: 1 },
      emotes: { type: Number, default: 0 },
      threeCharName: { type: Number, default: 0 },
      twoCharName: { type: Number, default: 0 },
      oneCharName: { type: Number, default: 0 },
      textColors: { type: Number, default: 0 },
      deathMessageEnabled: { type: Number, default: 0 },
      deathMessageChange: { type: Number, default: 0 },
      anonymousDeck: { type: Number, default: 0 },
      customEmotes: { type: Number, default: 0 },
      customEmotesExtra: { type: Number, default: 0 },
      archivedGames: { type: Number, default: 0 },
      archivedGamesMax: { type: Number, default: 0 },
      bonusRedHearts: { type: Number, default: 0 },
      vanityUrl: { type: Number, default: 0 },
      profileBackground: { type: Number, default: 0 },
      createFamily: { type: Number, default: 0 },
    },
    stats: {},
    winRate: { type: Number, default: 0 },
    achievements: [],
    achievementCount: { type: Number, default: 0 },
    redHearts: { type: Number, default: 0 },
    goldHearts: { type: Number, default: 0 },
    kudos: { type: Number, default: 0 },
    karma: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    pointsNegative: { type: Number, default: 0 },
    championshipPoints: { type: Number, default: 0 },
    dailyChallenges: [String],
    dailyChallengesCompleted: { type: Number, default: 0 },
    nameChanged: { type: Boolean, default: false },
    bdayChanged: { type: Boolean, default: false },
    playedGame: { type: Boolean, default: false },
    referrer: String,
    transactions: [Number],
    deleted: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    flagged: { type: Boolean, default: false },
  }),
  Session: new mongoose.Schema({
    expires: Date,
    lastModified: Date,
    session: mongoose.Schema.Types.Mixed,
  }),
  Setup: new mongoose.Schema(
    {
      id: { type: String, index: true },
      hash: { type: String, index: true },
      name: { type: String, index: true },
      gameType: { type: String, index: true },
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
      closed: Boolean,
      unique: Boolean,
      uniqueWithoutModifier: Boolean,
      useRoleGroups: Boolean,
      roleGroupSizes: [Number],
      roles: String,
      count: { type: Map, of: Number },
      total: Number,
      gameSettings: { type: mongoose.Mixed, default: {} },
      startState: { type: String, default: "Night" },
      gameStartPrompt: { type: String, default: undefined },
      EventsPerNight: Number,
      noDeathLimit: Number,
      ForceMustAct: Boolean,
      GameEndEvent: { type: String, default: "Meteor" },
      swapAmt: Number,
      roundAmt: Number,
      firstTeamSize: Number,
      lastTeamSize: Number,
      numMissions: Number,
      teamFailLimit: Number,
      excessRoles: Number,
      favorites: Number,
      version: { type: Number, default: 0 },
      featured: { type: Boolean, index: true },
      ranked: { type: Boolean, default: false },
      competitive: { type: Boolean, default: false },
      played: { type: Number, index: true },
      rolePlays: {},
      roleWins: {},
      factionRatings: factionRatings,
      lockedFactionRatings: factionRatings,
    },
    { minimize: false }
  ),
  SetupVersion: new mongoose.Schema({
    version: { type: Number, index: true },
    setup: { type: mongoose.Schema.Types.ObjectId, ref: "Setup", index: true },
    timestamp: { type: Date, default: Date.now },
    changelog: { type: String, default: "" },
    manifest: { type: String, default: "" },
    played: { type: Number, default: 0 },
    rolePlays: {},
    roleWins: {},
    alignmentPlays: {},
    alignmentWins: {},
    dayCountWins: {},
  }),
  AnonymousDeck: anonymousDeck,
  CustomEmote: new mongoose.Schema({
    id: { type: String, index: true },
    name: { type: String, index: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    extension: String,
    deleted: { type: Boolean, default: false },
  }),
  DeckProfile: new mongoose.Schema({
    id: { type: String, index: true },
    deck: { type: mongoose.Schema.Types.ObjectId, ref: "AnonymousDeck" },
    avatar: { type: String, index: true, default: "" },
    name: { type: String, index: true },
    color: { type: String, index: true },
    deathMessage: { type: String, index: true, default: "" },
  }),
  Game: new mongoose.Schema({
    id: { type: String, index: true },
    type: String,
    lobby: { type: String, default: "Main" },
    lobbyName: { type: String, default: "" },
    setup: { type: mongoose.Schema.Types.ObjectId, ref: "Setup" },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    players: [String],
    left: [String],
    names: [String],
    spectatorsUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    spectators: [String],
    spectatorNames: [String],
    winners: [String],
    winnersInfo: {
      players: {
        type: [{ type: String }],
        default: [],
      },
      groups: {
        type: [{ type: String }],
        default: [],
      },
    },
    playerIdMap: { type: String, default: "{}" },
    playerAlignmentMap: { type: String, default: "{}" },
    history: String,
    startTime: Number,
    endTime: { type: Number, index: true },
    ranked: Boolean,
    competitive: Boolean,
    private: Boolean,
    guests: Boolean,
    spectating: Boolean,
    readyCheck: Boolean,
    noVeg: Boolean,
    stateLengths: { type: Map, of: Number },
    gameTypeOptions: String,
    broken: Boolean,
    kudosReceiver: { type: String, default: "" },
    anonymousGame: Boolean,
    // This is a mongoose subdocument. It won't change if the anonyonous deck that the game was started with changes.
    anonymousDeck: [anonymousDeck],
  }),
  ArchivedGame: new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      index: true,
    },
    description: { type: String, default: "" },
  }),
  ForumCategory: new mongoose.Schema({
    id: { type: String, index: true },
    name: String,
    rank: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
    boards: [{ type: mongoose.Schema.Types.ObjectId, ref: "ForumBoard" }],
  }),
  ForumBoard: new mongoose.Schema({
    id: { type: String, index: true },
    name: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "ForumCategory" },
    description: String,
    icon: String,
    newestThreads: [
      { type: mongoose.Schema.Types.ObjectId, ref: "ForumThread" },
    ],
    recentReplies: [
      { type: mongoose.Schema.Types.ObjectId, ref: "ForumReply" },
    ],
    threadCount: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
  }),
  ForumThread: new mongoose.Schema({
    id: { type: String, index: true },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumBoard",
      index: true,
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: String,
    content: String,
    postDate: { type: Number, index: true },
    bumpDate: { type: Number, index: true },
    replyCount: { type: Number, default: 0, index: true },
    voteCount: { type: Number, default: 0, index: true },
    viewCount: { type: Number },
    recentReplies: [
      { type: mongoose.Schema.Types.ObjectId, ref: "ForumReply" },
    ],
    pinned: { type: Boolean, default: false, index: true },
    locked: { type: Boolean, default: false },
    replyNotify: { type: Boolean, default: true },
    subscribers: [String], // Array of user IDs subscribed to this thread
    deleted: { type: Boolean, default: false },
    pending: { type: Boolean, default: false },
  }),
  ForumReply: new mongoose.Schema({
    id: { type: String, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumThread",
      index: true,
    },
    page: { type: Number, index: true },
    content: String,
    postDate: { type: Number, index: true },
    voteCount: { type: Number, default: 0 },
    deleted: { type: Boolean, default: false },
    pending: { type: Boolean, default: false },
  }),
  ForumVote: new mongoose.Schema(
    {
      voter: { type: String, index: true },
      item: { type: String, index: true },
      direction: Number,
    },
    {
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
    }
  ),
  KarmaVote: new mongoose.Schema(
    {
      voterId: { type: String, index: true },
      targetId: { type: String, index: true },
      direction: Number,
    },
    {
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
    }
  ),
  ChatChannel: new mongoose.Schema(
    {
      id: { type: String, index: true },
      name: String,
      public: { type: Boolean, index: true },
      memberIds: [String],
      rank: { type: Number, default: 0 },
      position: { type: Number, default: 0 },
      lastMessageDate: Number,
    },
    {
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
    }
  ),
  ChatMessage: new mongoose.Schema(
    {
      id: String,
      senderId: String,
      date: { type: Number, index: true },
      channel: { type: String, index: true },
      content: String,
    },
    {
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
    }
  ),
  ChannelOpen: new mongoose.Schema(
    {
      user: { type: String, index: true },
      channelId: String,
    },
    {
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
    }
  ),
  Strategy: new mongoose.Schema({
    id: { type: String, index: true },
    setup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Setup",
      index: true,
    },
    setupId: { type: String, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String },
    content: String,
    createdAt: { type: Number, index: true },
    updatedAt: { type: Number, index: true },
    voteCount: { type: Number, default: 0, index: true },
    deleted: { type: Boolean, default: false },
  }),
  Comment: new mongoose.Schema({
    id: { type: String, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    location: { type: String, index: true },
    content: String,
    date: { type: Number, index: true },
    voteCount: { type: Number, default: 0 },
    deleted: { type: Boolean, default: false },
    pending: { type: Boolean, default: false },
    board: { type: mongoose.Schema.Types.ObjectId, ref: "ForumBoard" },
    thread: { type: mongoose.Schema.Types.ObjectId, ref: "ForumThread" },
  }),
  Notification: new mongoose.Schema({
    id: { type: String, index: true },
    channelId: { type: String, index: true },
    user: { type: String, index: true },
    isChat: { type: Boolean, index: true },
    global: { type: Boolean, index: true },
    content: String,
    date: Number,
    icon: String,
    link: String,
    read: { type: Boolean, default: false, index: true },
  }),
  Friend: new mongoose.Schema(
    {
      userId: { type: String, index: true },
      friendId: String,
      lastActive: Number,
    },
    {
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
    }
  ),
  FriendRequest: new mongoose.Schema(
    {
      userId: { type: String, index: true },
      targetId: String,
    },
    {
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
    }
  ),
  DocSave: new mongoose.Schema(
    {
      userId: { type: String, index: true },
      saverId: String,
    },
    {
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
    }
  ),
  Love: new mongoose.Schema(
    {
      userId: { type: String, index: true },
      loveId: String,
      type: String,
    },
    {
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
    }
  ),
  LoveRequest: new mongoose.Schema(
    {
      userId: { type: String, index: true },
      targetId: String,
      type: String,
    },
    {
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
    }
  ),
  Trophy: new mongoose.Schema(
    {
      id: { type: String, index: true },
      name: { type: String, required: true },
      ownerId: { type: String, index: true, required: true },
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
      type: {
        type: String,
        enum: trophyData.trophyTypes || ["gold", "silver", "bronze", "crown"], // Fallback if trophies not loaded
        default: trophyData.defaultTrophyType || "silver",
        index: true,
      },
      revoked: { type: Boolean, default: false, index: true },
      revokedAt: { type: Date },
      revokedBy: { type: String },
      createdAt: { type: Date, default: Date.now, index: true },
      createdBy: { type: String },
    },
    {
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
    }
  ),
  Group: new mongoose.Schema({
    id: { type: String, index: true },
    name: { type: String, index: true },
    rank: { type: Number, default: 0 },
    permissions: [String],
    badge: String,
    badgeColor: String,
    visible: { type: Boolean, index: true },
  }),
  InGroup: new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", index: true },
  }),
  ModAction: new mongoose.Schema(
    {
      id: { type: String, index: true },
      modId: { type: String, index: true },
      name: { type: String, index: true },
      args: [String],
      reason: String,
      date: { type: Number, index: true },
    },
    {
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
    }
  ),
  Announcement: new mongoose.Schema(
    {
      id: { type: String, index: true },
      modId: { type: String, index: true },
      content: String,
      date: { type: Number, index: true },
    },
    {
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
    }
  ),
  Ban: new mongoose.Schema(
    {
      id: { type: String, index: true },
      userId: { type: String, index: true },
      modId: { type: String, index: true },
      expires: { type: Number, index: true },
      permissions: [String],
      type: String,
      auto: { type: Boolean, index: true },
    },
    {
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
    }
  ),
  Emoji: new mongoose.Schema({
    name: String,
    image: String,
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  }),
  Restart: new mongoose.Schema({
    when: Number,
  }),
  HeartRefresh: new mongoose.Schema({
    userId: { type: String, index: true },
    when: { type: Number, index: true },
    type: { type: String, index: true },
  }),
  DailyChallengeRefresh: new mongoose.Schema({
    when: { type: Number, index: true },
  }),
  LeavePenalty: new mongoose.Schema({
    userId: { type: String, index: true },
    expiresOn: { type: Number, index: true },
    canPlayAfter: { type: Number },
    level: { type: Number, default: 0 },
  }),
  Poll: new mongoose.Schema({
    id: { type: String, index: true },
    lobby: { type: String, index: true },
    threadId: { type: String, index: true },
    title: String,
    question: String,
    options: [String],
    creator: { type: String, index: true },
    created: { type: Number, index: true },
    completed: { type: Boolean, default: false, index: true },
    completedAt: { type: Number, index: true },
    expiresAt: { type: Number, index: true },
  }),
  PollVote: new mongoose.Schema({
    pollId: { type: String, index: true },
    userId: { type: String, index: true },
    optionIndex: { type: Number, index: true },
    votedAt: { type: Number, index: true },
  }),
  Family: new mongoose.Schema({
    id: { type: String, index: true, unique: true },
    name: { type: String, required: true, maxlength: 20 },
    avatar: { type: Boolean, default: false },
    background: { type: Boolean, default: false },
    backgroundRepeatMode: {
      type: String,
      default: "checker",
      enum: ["checker", "stretch"],
    },
    bio: {
      type: String,
      default: "",
      maxlength: 20000,
    },
    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdAt: { type: Number, index: true, default: Date.now },
  }),
  InFamily: new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      index: true,
    },
  }),
  FamilyJoinRequest: new mongoose.Schema({
    familyId: { type: String, index: true },
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      index: true,
    },
    requesterId: { type: String, index: true },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    createdAt: { type: Number, index: true, default: Date.now },
  }),
  CompetitiveSeason: new mongoose.Schema({
    number: { type: Number, index: true, unique: true },
    setups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Setup" }],
    setupOrder: [[{ type: Number }]], // each top level array corresponds to one round
    rounds: [{ type: mongoose.Schema.Types.ObjectId, ref: "CompetitiveRound" }],
    currentRound: { type: Number, default: 1 },
    startDate: { type: String, default: Date.now }, // YYYY-MM-DD
    paused: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    numRounds: { type: Number },
  }),
  CompetitiveRound: new mongoose.Schema({
    season: { type: Number },
    number: { type: Number },
    currentDay: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    accounted: { type: Boolean, default: false },
    startDate: { type: String }, // YYYY-MM-DD (inclusive)
    dateCompleted: { type: String }, // YYYY-MM-DD (inclusive)
    remainingOpenDays: { type: Number, required: true },
    remainingReviewDays: { type: Number, required: true },
  }),
  CompetitiveGameCompletion: new mongoose.Schema({
    userId: { type: String },
    game: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
    season: { type: Number },
    round: { type: Number },
    day: { type: Number },
    points: { type: Number }, // This is the same as fortune
    valid: { type: Boolean, default: true }, // A moderator can invalidate a game in the case of cheating
  }),
  CompetitiveSeasonStanding: new mongoose.Schema({
    userId: { type: String },
    season: { type: Number },
    points: { type: Number, default: 0 }, // championship points from winning rounds
    tiebreakerPoints: { type: Number, default: 0 }, // points from winning games
  }),
  ViolationTicket: new mongoose.Schema(
    {
      id: { type: String, index: true, unique: true },
      userId: { type: String, index: true },
      modId: { type: String, index: true },
      banType: { type: String, index: true },
      violationId: { type: String, index: true },
      violationName: { type: String },
      violationCategory: { type: String },
      notes: String,
      length: { type: Number },
      createdAt: { type: Number, index: true },
      expiresAt: { type: Number, index: true },
      activeUntil: { type: Number, index: true },
      linkedBanId: { type: String, index: true },
      appealed: { type: Boolean, default: false, index: true },
      appealedAt: { type: Number, index: true },
      appealedBy: { type: String, index: true },
    },
    {
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
    }
  ),
  Report: new mongoose.Schema(
    {
      id: { type: String, index: true, unique: true },
      reporterId: { type: String, index: true },
      reportedUserId: { type: String, index: true },
      gameId: { type: String, index: true },
      rule: { type: String, index: true },
      description: String,
      status: {
        type: String,
        enum: ["open", "in-progress", "complete", "appealed"],
        default: "open",
        index: true,
      },
      assignees: [{ type: String, index: true }],
      createdAt: { type: Number, index: true },
      updatedAt: { type: Number, index: true },
      completedAt: { type: Number, index: true },
      completedBy: { type: String, index: true },
      finalRuling: {
        violationId: String,
        violationName: String,
        violationCategory: String,
        banType: String,
        banLength: String,
        banLengthMs: Number,
        notes: String,
      },
      linkedViolationTicketId: { type: String, index: true },
      linkedBanId: { type: String, index: true },
      linkedAppealId: { type: String, index: true },
      reopenedAt: { type: Number },
      reopenedBy: { type: String },
      reopenedCount: { type: Number, default: 0 },
      history: [
        {
          status: String,
          changedBy: String,
          timestamp: Number,
          action: String,
          note: String,
          assigneesAdded: [String],
          assigneesRemoved: [String],
        },
      ],
    },
    {
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
    }
  ),
  Appeal: new mongoose.Schema(
    {
      id: { type: String, index: true, unique: true },
      userId: { type: String, index: true },
      reportId: { type: String, index: true },
      violationTicketId: { type: String, index: true },
      description: String,
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
        index: true,
      },
      reviewedBy: { type: String, index: true },
      reviewedAt: { type: Number, index: true },
      reviewNotes: String,
      createdAt: { type: Number, index: true },
      updatedAt: { type: Number, index: true },
    },
    {
      toObject: { virtuals: true },
      toJSON: { virtuals: true },
    }
  ),
};

schemas.ForumVote.virtual("user", {
  ref: "User",
  localField: "voter",
  foreignField: "id",
  justOne: true,
});

schemas.KarmaVote.virtual("voter", {
  ref: "User",
  localField: "voterId",
  foreignField: "id",
  justOne: true,
});

schemas.KarmaVote.virtual("target", {
  ref: "User",
  localField: "targetId",
  foreignField: "id",
  justOne: true,
});

schemas.ChatChannel.virtual("members", {
  ref: "User",
  localField: "memberIds",
  foreignField: "id",
});

schemas.ChatMessage.virtual("sender", {
  ref: "User",
  localField: "senderId",
  foreignField: "id",
  justOne: true,
});

schemas.ChannelOpen.virtual("channel", {
  ref: "ChatChannel",
  localField: "channelId",
  foreignField: "id",
  justOne: true,
});

schemas.Notification.virtual("channel", {
  ref: "ChatChannel",
  localField: "channelId",
  foreignField: "id",
  justOne: true,
});

schemas.Friend.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "id",
  justOne: true,
});

schemas.Friend.virtual("friend", {
  ref: "User",
  localField: "friendId",
  foreignField: "id",
  justOne: true,
});

schemas.FriendRequest.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "id",
  justOne: true,
});

schemas.FriendRequest.virtual("target", {
  ref: "User",
  localField: "targetId",
  foreignField: "id",
  justOne: true,
});

schemas.DocSave.virtual("saved", {
  ref: "User",
  localField: "savedId",
  foreignField: "id",
  justOne: true,
});

schemas.DocSave.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "id",
  justOne: true,
});

schemas.Love.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "id",
  justOne: true,
});

schemas.Love.virtual("love", {
  ref: "User",
  localField: "loveId",
  foreignField: "id",
  justOne: true,
});

schemas.LoveRequest.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "id",
  justOne: true,
});

schemas.LoveRequest.virtual("target", {
  ref: "User",
  localField: "targetId",
  foreignField: "id",
  justOne: true,
});

schemas.ModAction.virtual("mod", {
  ref: "User",
  localField: "modId",
  foreignField: "id",
  justOne: true,
});

schemas.Announcement.virtual("mod", {
  ref: "User",
  localField: "modId",
  foreignField: "id",
  justOne: true,
});

schemas.Ban.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "id",
  justOne: true,
});

schemas.Ban.virtual("mod", {
  ref: "User",
  localField: "modId",
  foreignField: "id",
  justOne: true,
});

schemas.ViolationTicket.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "id",
  justOne: true,
});

schemas.ViolationTicket.virtual("mod", {
  ref: "User",
  localField: "modId",
  foreignField: "id",
  justOne: true,
});

schemas.ViolationTicket.virtual("ban", {
  ref: "Ban",
  localField: "linkedBanId",
  foreignField: "id",
  justOne: true,
});

schemas.Report.virtual("reporter", {
  ref: "User",
  localField: "reporterId",
  foreignField: "id",
  justOne: true,
});

schemas.Report.virtual("reportedUser", {
  ref: "User",
  localField: "reportedUserId",
  foreignField: "id",
  justOne: true,
});

// VanityUrl schema for custom user URLs
schemas.VanityUrl = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    unique: true,
    index: true,
    minlength: 1,
    maxlength: 20,
    match: /^[a-zA-Z0-9-]+$/,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
schemas.VanityUrl.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual to populate user data
schemas.VanityUrl.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "id",
  justOne: true,
});

schemas.CompetitiveRound.index({ season: 1, number: 1 }, { unique: true });
schemas.CompetitiveSeasonStanding.index(
  { userId: 1, season: 1 },
  { unique: true }
);
schemas.CompetitiveGameCompletion.index(
  { userId: 1, game: 1 },
  { unique: true }
);
schemas.CompetitiveGameCompletion.index({ season: 1, round: 1, day: 1 });

// Compound indexes for Report schema
schemas.Report.index({ status: 1, createdAt: -1 });
schemas.Report.index({ assignees: 1, status: 1 });
schemas.Report.index({ reportedUserId: 1, status: 1 });

// Compound indexes for ViolationTicket schema
schemas.ViolationTicket.index({ userId: 1, createdAt: -1 });
schemas.ViolationTicket.index({ userId: 1, activeUntil: 1 });
schemas.ViolationTicket.index({ userId: 1, violationName: 1, activeUntil: 1 });

// Compound indexes for ViolationTicket schema
schemas.ViolationTicket.index({ userId: 1, createdAt: -1 });
schemas.ViolationTicket.index({ userId: 1, violationId: 1 });
schemas.ViolationTicket.index({ userId: 1, activeUntil: 1 });
schemas.ViolationTicket.index({ userId: 1, violationName: 1, activeUntil: 1 });

module.exports = schemas;
