const mongoose = require("mongoose");

const comment = new mongoose.Schema({
  id: { type: String, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  location: { type: String, index: true },
  content: String,
  date: { type: Number, index: true },
  voteCount: { type: Number, default: 0 },
  deleted: { type: Boolean, default: false },
  pending: { type: Boolean, default: false },
});

const notification = new mongoose.Schema({
  id: { type: String, index: true },
  channelId: { type: String, index: true },
  user: { type: String, index: true },
  isChat: { type: Boolean, index: true },
  global: { type: Boolean, index: true },
  content: String,
  date: Number,
  icon: String,
  link: String,
});

const emoji = new mongoose.Schema({
  name: String,
  image: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const restart = new mongoose.Schema({
  when: Number,
});

notification.virtual("channel", {
  ref: "ChatChannel",
  localField: "channelId",
  foreignField: "id",
  justOne: true,
});

module.exports = Object.freeze({ comment, notification, emoji, restart });
