const mongoose = require("mongoose");

const group = new mongoose.Schema({
  id: { type: String, index: true },
  name: { type: String, index: true },
  rank: { type: Number, default: 0 },
  permissions: [String],
  badge: String,
  badgeColor: String,
  visible: { type: Boolean, index: true },
});

const inGroup = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", index: true },
});

const modAction = new mongoose.Schema(
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
);

const announcement = new mongoose.Schema(
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
);

const ban = new mongoose.Schema(
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
);

modAction.virtual("mod", {
  ref: "User",
  localField: "modId",
  foreignField: "id",
  justOne: true,
});

announcement.virtual("mod", {
  ref: "User",
  localField: "modId",
  foreignField: "id",
  justOne: true,
});

ban.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "id",
  justOne: true,
});

ban.virtual("mod", {
  ref: "User",
  localField: "modId",
  foreignField: "id",
  justOne: true,
});

module.exports = Object.freeze({
  group,
  inGroup,
  modAction,
  announcement,
  ban,
});
