const models = require("../db/models");
const { getBasicUserInfo } = require("./redis");

async function getReactionSummaries(itemIds, userId) {
  const summaries = {};

  if (!itemIds.length) return summaries;

  for (const id of itemIds) summaries[id] = [];

  const grouped = await models.ItemReaction.aggregate([
    { $match: { item: { $in: itemIds } } },
    {
      $group: {
        _id: { item: "$item", emote: "$emote", emoteKind: "$emoteKind" },
        count: { $sum: 1 },
        emotePath: { $first: "$emotePath" },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const userReactions = userId
    ? await models.ItemReaction.find({
        reactor: userId,
        item: { $in: itemIds },
      })
        .select("item emote -_id")
        .lean()
    : [];

  const userReactionSet = new Set(
    userReactions.map((r) => `${r.item}:${r.emote}`)
  );

  for (const row of grouped) {
    const itemId = row._id.item;
    summaries[itemId].push({
      emote: row._id.emote,
      emoteKind: row._id.emoteKind || "unicode",
      emotePath: row.emotePath || "",
      count: row.count,
      mine: userReactionSet.has(`${itemId}:${row._id.emote}`),
    });
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
