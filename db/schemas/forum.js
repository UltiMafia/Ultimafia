const mongoose = require("mongoose");

const category = new mongoose.Schema({
  id: { type: String, index: true },
  name: String,
  rank: { type: Number, default: 0 },
  position: { type: Number, default: 0 },
  boards: [{ type: mongoose.Schema.Types.ObjectId, ref: "ForumBoard" }],
});

const board = new mongoose.Schema({
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
});

const thread = new mongoose.Schema({
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
  recentReplies: [{ type: mongoose.Schema.Types.ObjectId, ref: "ForumReply" }],
  pinned: { type: Boolean, default: false, index: true },
  locked: { type: Boolean, default: false },
  replyNotify: { type: Boolean, default: true },
  deleted: { type: Boolean, default: false },
  pending: { type: Boolean, default: false },
});

const reply = new mongoose.Schema({
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
});

const vote = new mongoose.Schema(
  {
    voter: { type: String, index: true },
    item: { type: String, index: true },
    direction: Number,
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

vote.virtual("user", {
  ref: "User",
  localField: "voter",
  foreignField: "id",
  justOne: true,
});

module.exports = Object.freeze({ category, board, thread, reply, vote });
