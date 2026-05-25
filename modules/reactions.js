const models = require("../db/models");

async function getReactionSummaries(itemIds, userId) {
  const summaries = {};
  const validItemIds = itemIds.filter(Boolean);

  if (!validItemIds.length) return summaries;

  for (const id of validItemIds) summaries[id] = [];

  if (!models.ItemReaction) return summaries;

  const allReactions = await models.ItemReaction.find({
    item: { $in: validItemIds },
  })
    .select("item emote emoteKind emotePath reactor -_id")
    .lean();

  const userReactionSet = new Set();

  for (const reaction of allReactions) {
    if (userId && String(reaction.reactor) === String(userId)) {
      userReactionSet.add(`${reaction.item}:${reaction.emote}`);
    }
  }

  const buckets = {};

  for (const reaction of allReactions) {
    const bucketKey = `${reaction.item}:${reaction.emote}`;
    if (!buckets[bucketKey]) {
      buckets[bucketKey] = {
        item: reaction.item,
        emote: reaction.emote,
        emoteKind: reaction.emoteKind || "unicode",
        emotePath: reaction.emotePath || "",
        count: 0,
      };
    }
    buckets[bucketKey].count += 1;
  }

  for (const bucket of Object.values(buckets)) {
    const itemId = bucket.item;
    if (!summaries[itemId]) summaries[itemId] = [];
    summaries[itemId].push({
      emote: bucket.emote,
      emoteKind: bucket.emoteKind,
      emotePath: bucket.emotePath,
      count: bucket.count,
      mine: userReactionSet.has(`${itemId}:${bucket.emote}`),
    });
  }

  for (const itemId of Object.keys(summaries)) {
    summaries[itemId].sort((a, b) => b.count - a.count);
  }

  return summaries;
}

function attachReactionSummaries(items, summaries, idField = "id") {
  return items.map((item) => ({
    ...item,
    reactions: summaries[item[idField]] || [],
  }));
}

async function getItemReactionContext(itemId, itemType) {
  let itemModel;
  let itemQuery;

  switch (itemType) {
    case "thread":
      itemModel = models.ForumThread;
      break;
    case "reply":
      itemModel = models.ForumReply;
      break;
    case "comment":
      itemModel = models.Comment;
      break;
    default:
      return { error: "Invalid item type." };
  }

  itemQuery = itemModel.findOne({ id: itemId });

  if (itemModel.schema.paths.board) {
    itemQuery = itemQuery.select("board thread rank").populate({
      path: "board",
      select: "rank",
    });
  }

  if (itemModel.schema.paths.thread) {
    itemQuery = itemQuery
      .select("board thread rank")
      .populate({
        path: "thread",
        select: "board",
        populate: {
          path: "board",
          select: "rank",
        },
      });
  }

  const item = await itemQuery;

  if (!item) return { error: "Item does not exist." };

  const requiredRank =
    (item.board && item.board.rank) ||
    (item.thread && item.thread.board && item.thread.board.rank) ||
    0;

  return { requiredRank };
}

async function getReactionDetails(itemId) {
  const { getBasicUserInfo } = require("./redis");
  const reactions = await models.ItemReaction.find({ item: itemId })
    .select("emote emoteKind emotePath reactor -_id")
    .lean();

  const byEmote = {};

  for (const reaction of reactions) {
    const key = reaction.emote;
    if (!byEmote[key]) {
      byEmote[key] = {
        emote: reaction.emote,
        emoteKind: reaction.emoteKind || "unicode",
        emotePath: reaction.emotePath || "",
        reactors: [],
      };
    }

    byEmote[key].reactors.push(reaction.reactor);
  }

  const result = [];

  for (const entry of Object.values(byEmote)) {
    entry.reactors = await Promise.all(
      entry.reactors.map((reactorId) => getBasicUserInfo(reactorId, true))
    );
    result.push(entry);
  }

  result.sort((a, b) => b.reactors.length - a.reactors.length);
  return result;
}

module.exports = {
  getReactionSummaries,
  attachReactionSummaries,
  getItemReactionContext,
  getReactionDetails,
};
