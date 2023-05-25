var mongoose = require("mongoose");
var stats = require("./stats");

var schemas = {
    "User": new mongoose.Schema({
        id: { type: String, index: true },
        name: { type: String, index: true },
        ip: [{ type: String, index: true }],
        email: [{ type: String, index: true }],
        birthday: Date,
        fbUid: String,
        avatar: Boolean,
        banner: Boolean,
        bio: { type: String, default: "Click to edit your bio (ex. age, gender, location, interests, experience playing mafia)" },
        settings: {
            showDiscord: { type: Boolean, default: false },
            showTwitch: { type: Boolean, default: false },
            showSteam: { type: Boolean, default: false },
            backgroundColor: String,
            bannerFormat: String,
            textColor: String,
            nameColor: String,
            onlyFriendDMs: { type: Boolean, default: false },
            disablePg13Censor: { type: Boolean, default: false },
            disableAllCensors: { type: Boolean, default: false },
            hideDeleted: Boolean,
            siteColorScheme: {type: String, default: "auto"},
            autoplay: {type: Boolean, default: false},
            youtube: String,
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
        games: [{ type: mongoose.Schema.Types.ObjectId, ref: "Game" }],
        globalNotifs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notification" }],
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
        },
        stats: {},
        rankedPoints: { type: Number, default: 0 },
        nameChanged: false,
        bdayChanged: false,
        playedGame: false,
        referrer: String,
        transactions: [Number],
        deleted: { type: Boolean, default: false },
        banned: { type: Boolean, default: false },
        flagged: { type: Boolean, default: false },
    }),
    "Session": new mongoose.Schema({
        expires: Date,
        lastModified: Date,
        session: mongoose.Schema.Types.Mixed
    }),
    "Setup": new mongoose.Schema({
        id: { type: String, index: true },
        hash: { type: String, index: true },
        name: { type: String, index: true },
        gameType: { type: String, index: true },
        creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
        closed: Boolean,
        unique: Boolean,
        roles: String,
        count: { type: Map, of: Number },
        total: Number,
        startState: { type: String, default: "Night" },
        whispers: Boolean,
        leakPercentage: Number,
        dawn: Boolean,
        lastWill: Boolean,
        mustAct: Boolean,
        noReveal: Boolean,
        votesInvisible: Boolean,
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
        played: { type: Number, index: true },
        rolePlays: {},
        roleWins: {}
    }),
    "Game": new mongoose.Schema({
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
        private: Boolean,
        guests: Boolean,
        spectating: Boolean,
        voiceChat: Boolean,
        readyCheck: Boolean,
        stateLengths: { type: Map, of: Number },
        gameTypeOptions: String,
        broken: Boolean
    }),
    "ForumCategory": new mongoose.Schema({
        id: { type: String, index: true },
        name: String,
        rank: { type: Number, default: 0 },
        position: { type: Number, default: 0 },
        boards: [{ type: mongoose.Schema.Types.ObjectId, ref: "ForumBoard" }]
    }),
    "ForumBoard": new mongoose.Schema({
        id: { type: String, index: true },
        name: String,
        category: { type: mongoose.Schema.Types.ObjectId, ref: "ForumCategory" },
        description: String,
        icon: String,
        newestThreads: [{ type: mongoose.Schema.Types.ObjectId, ref: "ForumThread" }],
        recentReplies: [{ type: mongoose.Schema.Types.ObjectId, ref: "ForumReply" }],
        threadCount: { type: Number, default: 0 },
        rank: { type: Number, default: 0 },
        position: { type: Number, default: 0 },
    }),
    "ForumThread": new mongoose.Schema({
        id: { type: String, index: true },
        board: { type: mongoose.Schema.Types.ObjectId, ref: "ForumBoard", index: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        title: String,
        content: String,
        postDate: { type: Number, index: true },
        bumpDate: { type: Number, index: true },
        replyCount: { type: Number, default: 0, index: true },
        voteCount: { type: Number, default: 0, index: true },
        viewCount: { type: Number },
        recentReplies: [{ type: mongoose.Schema.Types.ObjectId, ref: "ForumReply" }],
        pinned: { type: Boolean, default: false, index: true },
        locked: { type: Boolean, default: false },
        replyNotify: { type: Boolean, default: true },
        deleted: { type: Boolean, default: false },
        pending: { type: Boolean, default: false },
    }),
    "ForumReply": new mongoose.Schema({
        id: { type: String, index: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        thread: { type: mongoose.Schema.Types.ObjectId, ref: "ForumThread", index: true },
        page: { type: Number, index: true },
        content: String,
        postDate: { type: Number, index: true },
        voteCount: { type: Number, default: 0 },
        deleted: { type: Boolean, default: false },
        pending: { type: Boolean, default: false },
    }),
    "ForumVote": new mongoose.Schema({
        voter: { type: String, index: true },
        item: { type: String, index: true },
        direction: Number
    }, {
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }),
    "ChatChannel": new mongoose.Schema({
        id: { type: String, index: true },
        name: String,
        public: { type: Boolean, index: true },
        memberIds: [String],
        rank: { type: Number, default: 0 },
        position: { type: Number, default: 0 },
        lastMessageDate: Number
    }, {
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }),
    "ChatMessage": new mongoose.Schema({
        id: String,
        senderId: String,
        date: { type: Number, index: true },
        channel: { type: String, index: true },
        content: String
    }, {
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }),
    "ChannelOpen": new mongoose.Schema({
        user: { type: String, index: true },
        channelId: String
    }, {
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }),
    "Comment": new mongoose.Schema({
        id: { type: String, index: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        location: { type: String, index: true },
        content: String,
        date: { type: Number, index: true },
        voteCount: { type: Number, default: 0 },
        deleted: { type: Boolean, default: false },
        pending: { type: Boolean, default: false },
    }),
    "Notification": new mongoose.Schema({
        id: { type: String, index: true },
        channelId: { type: String, index: true },
        user: { type: String, index: true },
        isChat: { type: Boolean, index: true },
        global: { type: Boolean, index: true },
        content: String,
        date: Number,
        icon: String,
        link: String
    }),
    "Friend": new mongoose.Schema({
        userId: { type: String, index: true },
        friendId: String,
        lastActive: Number
    }, {
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }),
    "FriendRequest": new mongoose.Schema({
        userId: { type: String, index: true },
        targetId: String
    }, {
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }),
    "Group": new mongoose.Schema({
        id: { type: String, index: true },
        name: { type: String, index: true },
        rank: { type: Number, default: 0 },
        permissions: [String],
        badge: String,
        badgeColor: String,
        visible: { type: Boolean, index: true }
    }),
    "InGroup": new mongoose.Schema({
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
        group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", index: true },
    }),
    "ModAction": new mongoose.Schema({
        id: { type: String, index: true },
        modId: { type: String, index: true },
        name: { type: String, index: true },
        args: [String],
        reason: String,
        date: { type: Number, index: true },
    }, {
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }),
    "Announcement": new mongoose.Schema({
        id: { type: String, index: true },
        modId: { type: String, index: true },
        content: String,
        date: { type: Number, index: true },
    }, {
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }),
    "Ban": new mongoose.Schema({
        id: { type: String, index: true },
        userId: { type: String, index: true },
        modId: { type: String, index: true },
        expires: { type: Number, index: true },
        permissions: [String],
        type: String,
        auto: { type: Boolean, index: true }
    }, {
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }),
    "Emoji": new mongoose.Schema({
        name: String,
        image: String,
        creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    }),
    "BlockedName": new mongoose.Schema({
        name: { type: String, index: true },
    }),
    "Restart": new mongoose.Schema({
        when: Number
    })
};

schemas.ForumVote.virtual("user", {
    ref: "User",
    localField: "voter",
    foreignField: "id",
    justOne: true
});

schemas.ChatChannel.virtual("members", {
    ref: "User",
    localField: "memberIds",
    foreignField: "id"
});

schemas.ChatMessage.virtual("sender", {
    ref: "User",
    localField: "senderId",
    foreignField: "id",
    justOne: true
});

schemas.ChannelOpen.virtual("channel", {
    ref: "ChatChannel",
    localField: "channelId",
    foreignField: "id",
    justOne: true
});

schemas.Notification.virtual("channel", {
    ref: "ChatChannel",
    localField: "channelId",
    foreignField: "id",
    justOne: true
});

schemas.Friend.virtual("user", {
    ref: "User",
    localField: "userId",
    foreignField: "id",
    justOne: true
});

schemas.Friend.virtual("friend", {
    ref: "User",
    localField: "friendId",
    foreignField: "id",
    justOne: true
});

schemas.FriendRequest.virtual("user", {
    ref: "User",
    localField: "userId",
    foreignField: "id",
    justOne: true
});

schemas.FriendRequest.virtual("target", {
    ref: "User",
    localField: "targetId",
    foreignField: "id",
    justOne: true
});

schemas.ModAction.virtual("mod", {
    ref: "User",
    localField: "modId",
    foreignField: "id",
    justOne: true
});

schemas.Announcement.virtual("mod", {
    ref: "User",
    localField: "modId",
    foreignField: "id",
    justOne: true
});

schemas.Ban.virtual("user", {
    ref: "User",
    localField: "userId",
    foreignField: "id",
    justOne: true
});

schemas.Ban.virtual("mod", {
    ref: "User",
    localField: "modId",
    foreignField: "id",
    justOne: true
});

module.exports = schemas;
