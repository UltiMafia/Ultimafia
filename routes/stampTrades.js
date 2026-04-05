const express = require("express");
const routeUtils = require("./utils");
const models = require("../db/models");
const logger = require("../modules/logging")(".");
const shortid = require("shortid");
const router = express.Router();

const ACTIVE_STATUSES = ["PENDING_RESPONSE", "PENDING_CONFIRMATION"];

async function getLockedStampIds(userId) {
  const trades = await models.StampTrade.find({
    $or: [{ initiatorId: userId }, { recipientId: userId }],
    status: { $in: ACTIVE_STATUSES },
  }).select("initiatorStamp recipientStamp");
  const set = new Set();
  for (const t of trades) {
    if (t.initiatorStamp) set.add(String(t.initiatorStamp));
    if (t.recipientStamp) set.add(String(t.recipientStamp));
  }
  return set;
}

async function pickUnlockedStamp(userId, gameType, role) {
  const stamps = await models.Stamp.find({ userId, gameType, role }).select(
    "_id"
  );
  if (stamps.length < 2) {
    throw new Error("You need at least 2 of this stamp to trade.");
  }
  const lockedIds = await getLockedStampIds(userId);
  const available = stamps.filter((s) => !lockedIds.has(String(s._id)));
  if (available.length < 2) {
    throw new Error(
      "Not enough unlocked copies of this stamp (need 2+ available)."
    );
  }
  return available[0]._id;
}

async function populateTradeForDisplay(trade) {
  const initiator = await models.User.findById(trade.initiator).select(
    "id name avatar"
  );
  const recipient = trade.recipient
    ? await models.User.findById(trade.recipient).select("id name avatar")
    : null;
  return {
    id: trade.id,
    status: trade.status,
    initiator: initiator
      ? { id: initiator.id, name: initiator.name, avatar: initiator.avatar }
      : null,
    initiatorGameType: trade.initiatorGameType,
    initiatorRole: trade.initiatorRole,
    recipient: recipient
      ? { id: recipient.id, name: recipient.name, avatar: recipient.avatar }
      : null,
    recipientGameType: trade.recipientGameType,
    recipientRole: trade.recipientRole,
    createdAt: trade.createdAt,
    updatedAt: trade.updatedAt,
  };
}

router.get("/incoming", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const trades = await models.StampTrade.find({
      recipientId: userId,
      status: "PENDING_RESPONSE",
    }).sort({ createdAt: -1 });
    const result = [];
    for (const t of trades) result.push(await populateTradeForDisplay(t));
    res.send(result);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading incoming trades.");
  }
});

router.get("/pending-confirmation", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const trades = await models.StampTrade.find({
      initiatorId: userId,
      status: "PENDING_CONFIRMATION",
    }).sort({ updatedAt: -1 });
    const result = [];
    for (const t of trades) result.push(await populateTradeForDisplay(t));
    res.send(result);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading pending trades.");
  }
});

router.get("/recent", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const trades = await models.StampTrade.find({ status: "COMPLETED" })
      .sort({ completedAt: -1 })
      .limit(10);
    const result = [];
    for (const t of trades) result.push(await populateTradeForDisplay(t));
    res.send(result);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading recent trades.");
  }
});

router.post("/initiate", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const gameType = String(req.body.gameType || "").trim();
    const role = String(req.body.role || "").trim();
    const recipientUserId = String(req.body.recipientUserId || "").trim();

    if (!gameType || !role) {
      res.status(400);
      res.send("Stamp gameType and role are required.");
      return;
    }
    if (!recipientUserId) {
      res.status(400);
      res.send("Recipient is required.");
      return;
    }
    if (recipientUserId === userId) {
      res.status(400);
      res.send("You cannot trade with yourself.");
      return;
    }

    const friend = await models.Friend.findOne({
      userId,
      friendId: recipientUserId,
    });
    if (!friend) {
      res.status(403);
      res.send("You can only initiate trades with friends.");
      return;
    }

    const recipient = await models.User.findOne({
      id: recipientUserId,
      deleted: false,
    }).select("_id id name");
    if (!recipient) {
      res.status(404);
      res.send("Recipient not found.");
      return;
    }

    const initiatorUser = await models.User.findOne({ id: userId }).select(
      "_id name"
    );

    let stampId;
    try {
      stampId = await pickUnlockedStamp(userId, gameType, role);
    } catch (e) {
      res.status(400);
      res.send(e.message);
      return;
    }

    const trade = await models.StampTrade.create({
      id: shortid.generate(),
      initiatorId: userId,
      initiator: initiatorUser._id,
      initiatorStamp: stampId,
      initiatorGameType: gameType,
      initiatorRole: role,
      recipientId: recipientUserId,
      recipient: recipient._id,
      status: "PENDING_RESPONSE",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await routeUtils.createNotification(
      {
        content: `${initiatorUser.name} wants to trade their ${role} stamp with you.`,
        icon: "fas fa-exchange-alt",
        link: `/user/${recipientUserId}`,
      },
      [recipientUserId]
    );

    res.send({ id: trade.id });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error starting trade.");
  }
});

router.post("/respond", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const tradeId = String(req.body.tradeId || "").trim();
    const gameType = String(req.body.gameType || "").trim();
    const role = String(req.body.role || "").trim();

    if (!tradeId || !gameType || !role) {
      res.status(400);
      res.send("Trade id, gameType, and role are required.");
      return;
    }

    const trade = await models.StampTrade.findOne({ id: tradeId });
    if (!trade) {
      res.status(404);
      res.send("Trade not found.");
      return;
    }
    if (trade.recipientId !== userId) {
      res.status(403);
      res.send("You are not the recipient of this trade.");
      return;
    }
    if (trade.status !== "PENDING_RESPONSE") {
      res.status(400);
      res.send("This trade is no longer awaiting a response.");
      return;
    }

    let stampId;
    try {
      stampId = await pickUnlockedStamp(userId, gameType, role);
    } catch (e) {
      res.status(400);
      res.send(e.message);
      return;
    }

    trade.recipientStamp = stampId;
    trade.recipientGameType = gameType;
    trade.recipientRole = role;
    trade.status = "PENDING_CONFIRMATION";
    trade.updatedAt = Date.now();
    await trade.save();

    const responder = await models.User.findOne({ id: userId }).select("name");
    await routeUtils.createNotification(
      {
        content: `${responder.name} offered their ${role} stamp. Confirm the trade on your profile.`,
        icon: "fas fa-exchange-alt",
        link: `/user/${trade.initiatorId}`,
      },
      [trade.initiatorId]
    );

    res.send({ id: trade.id });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error responding to trade.");
  }
});

router.post("/confirm", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const tradeId = String(req.body.tradeId || "").trim();

    const trade = await models.StampTrade.findOne({ id: tradeId });
    if (!trade) {
      res.status(404);
      res.send("Trade not found.");
      return;
    }
    if (trade.initiatorId !== userId) {
      res.status(403);
      res.send("Only the initiator can confirm this trade.");
      return;
    }
    if (trade.status !== "PENDING_CONFIRMATION") {
      res.status(400);
      res.send("This trade is not awaiting confirmation.");
      return;
    }

    const [iStamp, rStamp] = await Promise.all([
      models.Stamp.findById(trade.initiatorStamp),
      models.Stamp.findById(trade.recipientStamp),
    ]);
    if (!iStamp || !rStamp) {
      res.status(400);
      res.send("One of the stamps no longer exists.");
      return;
    }
    if (
      iStamp.userId !== trade.initiatorId ||
      rStamp.userId !== trade.recipientId
    ) {
      res.status(400);
      res.send("Stamp ownership has changed.");
      return;
    }

    const initiatorUser = await models.User.findOne({
      id: trade.initiatorId,
    }).select("_id name");
    const recipientUser = await models.User.findOne({
      id: trade.recipientId,
    }).select("_id name");

    // Swap ownership.
    iStamp.user = recipientUser._id;
    iStamp.userId = trade.recipientId;
    iStamp.hidden = false;
    rStamp.user = initiatorUser._id;
    rStamp.userId = trade.initiatorId;
    rStamp.hidden = false;
    await Promise.all([iStamp.save(), rStamp.save()]);

    trade.status = "COMPLETED";
    trade.completedAt = Date.now();
    trade.updatedAt = Date.now();
    await trade.save();

    await routeUtils.createNotification(
      {
        content: `Trade completed with ${recipientUser.name}: you received a ${trade.recipientRole}.`,
        icon: "fas fa-exchange-alt",
        link: `/user/${trade.initiatorId}`,
      },
      [trade.initiatorId]
    );
    await routeUtils.createNotification(
      {
        content: `Trade completed with ${initiatorUser.name}: you received a ${trade.initiatorRole}.`,
        icon: "fas fa-exchange-alt",
        link: `/user/${trade.recipientId}`,
      },
      [trade.recipientId]
    );

    res.send({ id: trade.id, status: trade.status });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error confirming trade.");
  }
});

router.post("/reject", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const tradeId = String(req.body.tradeId || "").trim();

    const trade = await models.StampTrade.findOne({ id: tradeId });
    if (!trade) {
      res.status(404);
      res.send("Trade not found.");
      return;
    }
    if (trade.initiatorId !== userId && trade.recipientId !== userId) {
      res.status(403);
      res.send("You are not a party to this trade.");
      return;
    }
    if (!ACTIVE_STATUSES.includes(trade.status)) {
      res.status(400);
      res.send("This trade cannot be rejected.");
      return;
    }

    trade.status = "REJECTED";
    trade.updatedAt = Date.now();
    await trade.save();

    const rejector = await models.User.findOne({ id: userId }).select("name");
    const otherUserId =
      userId === trade.initiatorId ? trade.recipientId : trade.initiatorId;
    await routeUtils.createNotification(
      {
        content: `${rejector.name} rejected the stamp trade.`,
        icon: "fas fa-exchange-alt",
        link: `/user/${otherUserId}`,
      },
      [otherUserId]
    );

    res.send({ id: trade.id, status: trade.status });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error rejecting trade.");
  }
});

module.exports = router;
