const mongoose = require("mongoose");

const channel = new mongoose.Schema(
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
);

const message = new mongoose.Schema(
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
);

const channelOpen = new mongoose.Schema(
  {
    user: { type: String, index: true },
    channelId: String,
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

channel.virtual("members", {
  ref: "User",
  localField: "memberIds",
  foreignField: "id",
});

message.virtual("sender", {
  ref: "User",
  localField: "senderId",
  foreignField: "id",
  justOne: true,
});

channelOpen.virtual("channel", {
  ref: "ChatChannel",
  localField: "channelId",
  foreignField: "id",
  justOne: true,
});

module.exports = Object.freeze({ channel, message, channelOpen });
