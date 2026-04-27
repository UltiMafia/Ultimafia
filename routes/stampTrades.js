const express = require("express");
const routeUtils = require("./utils");
const models = require("../db/models");
const logger = require("../modules/logging")(".");
const shortid = require("shortid");
const roleData = require("../data/roles");
const errors = require("../lib/errors");
const { pickAvailableStampIds } = require("../shared/stampBorder");
const router = express.Router();

const ACTIVE_STATUSES = ["PENDING_RESPONSE", "PENDING_CONFIRMATION"];
const MAX_ACTIVE_TRADES_PER_PAIR = 3;

function validateStampRole(gameType, role) {
  if (
    !gameType ||
    !role ||
    !Object.prototype.hasOwnProperty.call(roleData, gameType) ||
    !Object.prototype.hasOwnProperty.call(roleData[gameType], role)
  ) {
    return "Unknown stamp role.";
  }
  const info = roleData[gameType][role];
  if (!info) return "Unknown stamp role.";
  if (info.alignment === "Event") return "Events cannot be traded.";
  return null;
}

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

// Returns the list of candidate stamp ids (as strings) of a role the user owns
// that are not currently attached to an active trade. Caller is responsible
// for attempting to reserve one of them; reservations can still race, so the
// caller should be prepared for the DB-level unique index to reject a pick.
async function getAvailableStampIds(userId, gameType, role) {
  const stamps = await models.Stamp.find({ userId, gameType, role }).select(
    "_id borderType"
  );
  if (stamps.length < 2) {
    throw new Error("You need at least 2 of this stamp to trade.");
  }
  const lockedIds = await getLockedStampIds(userId);
  const available = pickAvailableStampIds(stamps, lockedIds);
  if (available.length < 2) {
    throw new Error(
      "Not enough unlocked copies of this stamp (need 2+ available)."
    );
  }
  return available;
}

async function getGiftableStampId(userId, gameType, role) {
  const stamps = await models.Stamp.find({ userId, gameType, role }).select(
    "_id borderType"
  );
  if (stamps.length < 2) {
    throw new Error("You need at least 2 of this stamp to gift.");
  }
  const lockedIds = await getLockedStampIds(userId);
  const available = pickAvailableStampIds(stamps, lockedIds);
  if (available.length < 2) {
    throw new Error(
      "Not enough unlocked copies of this stamp (need 2+ available)."
    );
  }
  return available[0];
}

// Detects whether a recent insert collided with another active trade that
// already referenced the same stamp (cross-field case where the DB partial
// unique indexes on initiatorStamp / recipientStamp cannot help because the
// stamp was attached to the *opposite* field on a sibling trade).
async function stampHasCrossFieldConflict(stampId, ownTradeDocId) {
  const conflict = await models.StampTrade.findOne({
    _id: { $ne: ownTradeDocId },
    status: { $in: ACTIVE_STATUSES },
    $or: [
      { initiatorStamp: stampId },
      { recipientStamp: stampId },
    ],
  }).select("_id");
  return !!conflict;
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
    expiresAt: trade.expiresAt,
    createdAt: trade.createdAt,
    updatedAt: trade.updatedAt,
  };
}

async function expireOldTrades() {
  await models.StampTrade.updateMany(
    {
      status: { $in: ["PENDING_RESPONSE", "PENDING_CONFIRMATION"] },
      expiresAt: { $ne: null, $lt: Date.now() },
    },
    { $set: { status: "REJECTED", updatedAt: Date.now() } }
  );
}

router.get("/incoming", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    await expireOldTrades();
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
    errors.serverError(res, "Could not load incoming trades. Please refresh and try again.");
  }
});

router.get("/pending-confirmation", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    await expireOldTrades();
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
    errors.serverError(res, "Could not load pending trades. Please refresh and try again.");
  }
});

router.get("/recent", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    await routeUtils.verifyLoggedIn(req);
    const trades = await models.StampTrade.find({ status: "COMPLETED" })
      .sort({ completedAt: -1 })
      .limit(10);
    const result = [];
    for (const t of trades) result.push(await populateTradeForDisplay(t));
    res.send(result);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not load recent trades. Please refresh and try again.");
  }
});

router.get("/open", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    await expireOldTrades();
    await routeUtils.verifyLoggedIn(req);
    const trades = await models.StampTrade.find({
      recipientId: null,
      status: "PENDING_RESPONSE",
    }).sort({ createdAt: -1 }).limit(20);
    const result = [];
    for (const t of trades) result.push(await populateTradeForDisplay(t));
    res.send(result);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not load open trades. Please refresh and try again.");
  }
});

router.post("/initiate", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.rateLimit(userId, "tradeStamp", res))) return;
    const gameType = String(req.body.gameType || "").trim();
    const role = String(req.body.role || "").trim();
    const recipientUserId = String(req.body.recipientUserId || "").trim();
    const requestedGameType = String(req.body.requestedGameType || "").trim();
    const requestedRole = String(req.body.requestedRole || "").trim();

    if (!gameType || !role) {
      res.status(400);
      res.send("Stamp gameType and role are required.");
      return;
    }
    const roleErr = validateStampRole(gameType, role);
    if (roleErr) {
      res.status(400);
      res.send(roleErr);
      return;
    }
    if (recipientUserId) {
      if (recipientUserId === userId) {
        res.status(400);
        res.send("You cannot trade with yourself.");
        return;
      }
    }

    let recipient = null;
    if (recipientUserId) {
      recipient = await models.User.findOne({
        id: recipientUserId,
        deleted: false,
      }).select("_id id name blockedUsers");
      if (!recipient) {
        res.status(404);
        res.send("Recipient not found.");
        return;
      }
      if ((recipient.blockedUsers || []).includes(userId)) {
        res.status(403);
        res.send("You cannot trade with this user.");
        return;
      }

      // Cap active trades between this user pair to prevent spam.
      const activeBetween = await models.StampTrade.countDocuments({
        $or: [
          { initiatorId: userId, recipientId: recipientUserId },
          { initiatorId: recipientUserId, recipientId: userId },
        ],
        status: { $in: ACTIVE_STATUSES },
      });
      if (activeBetween >= MAX_ACTIVE_TRADES_PER_PAIR) {
        res.status(429);
        res.send(
          `You already have ${MAX_ACTIVE_TRADES_PER_PAIR} active trades with this user.`
        );
        return;
      }
    } else {
      const openOffers = await models.StampTrade.countDocuments({
        initiatorId: userId,
        recipientId: null,
        status: "PENDING_RESPONSE",
      });
      if (openOffers >= 1) {
        res.status(429);
        res.send("You can only have 1 open public trade.");
        return;
      }
    }

    let requestedStampId = null;
    if (recipientUserId && requestedGameType && requestedRole) {
      const roleErr2 = validateStampRole(requestedGameType, requestedRole);
      if (roleErr2) {
        res.status(400);
        res.send(roleErr2);
        return;
      }
      // Recipient must have at least 2 copies so they keep one after the trade.
      const recipientStamps = await models.Stamp.find({
        userId: recipientUserId,
        gameType: requestedGameType,
        role: requestedRole,
      }).select("_id borderType");
      if (recipientStamps.length < 2) {
        res.status(400);
        res.send("Recipient does not have a duplicate of this stamp.");
        return;
      }
      const recipientLockedIds = await getLockedStampIds(recipientUserId);
      const availableRecipient = pickAvailableStampIds(
        recipientStamps,
        recipientLockedIds
      );
      if (availableRecipient.length < 2) {
        res.status(400);
        res.send(
          "Recipient does not have enough unlocked copies of this stamp."
        );
        return;
      }
      requestedStampId = availableRecipient[0];
    }

    const initiatorUser = await models.User.findOne({
      id: userId,
      deleted: false,
    }).select("_id name");
    if (!initiatorUser) {
      res.status(404);
      res.send("User not found.");
      return;
    }

    let availableStampIds;
    try {
      availableStampIds = await getAvailableStampIds(userId, gameType, role);
    } catch (e) {
      res.status(400);
      res.send(e.message);
      return;
    }

    // When a specific stamp was requested from the recipient (profile trade),
    // auto-respond: skip PENDING_RESPONSE and go straight to PENDING_CONFIRMATION
    // so the recipient only needs to confirm.
    const autoResponded = !!requestedStampId;
    const tradeStatus = autoResponded ? "PENDING_CONFIRMATION" : "PENDING_RESPONSE";

    // Try each available stamp; the partial unique index on initiatorStamp
    // will throw E11000 if another concurrent request already reserved it.
    let trade = null;
    let lastErr = null;
    for (const stampId of availableStampIds) {
      try {
        trade = await models.StampTrade.create({
          id: shortid.generate(),
          initiatorId: userId,
          initiator: initiatorUser._id,
          initiatorStamp: stampId,
          initiatorGameType: gameType,
          initiatorRole: role,
          recipientId: recipientUserId || null,
          recipient: recipient ? recipient._id : null,
          ...(autoResponded
            ? {
                recipientStamp: requestedStampId,
                recipientGameType: requestedGameType,
                recipientRole: requestedRole,
              }
            : {}),
          expiresAt: autoResponded ? Date.now() + 2 * 24 * 60 * 60 * 1000 : null,
          status: tradeStatus,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      } catch (e) {
        if (e && e.code === 11000) {
          lastErr = e;
          continue;
        }
        throw e;
      }

      // Cover the cross-field race: another active trade may already have
      // this stamp in recipientStamp. If so, release ours and try again.
      if (await stampHasCrossFieldConflict(stampId, trade._id)) {
        await models.StampTrade.deleteOne({ _id: trade._id });
        trade = null;
        lastErr = new Error("stamp already locked");
        continue;
      }

      // Same cross-field check for the recipient stamp, if present (auto-responded).
      if (
        autoResponded &&
        (await stampHasCrossFieldConflict(requestedStampId, trade._id))
      ) {
        await models.StampTrade.deleteOne({ _id: trade._id });
        trade = null;
        lastErr = new Error("recipient stamp already locked");
        continue;
      }
      break;
    }

    if (!trade) {
      res.status(409);
      res.send(
        "Could not reserve a stamp — please try again (it may be locked in another trade)."
      );
      if (lastErr) logger.error(lastErr);
      return;
    }

    // Enforce MAX_ACTIVE_TRADES_PER_PAIR after create to close the count race.
    // Only applies to directed trades (with a specific recipient).
    if (recipientUserId) {
      const activeList = await models.StampTrade.find({
        $or: [
          { initiatorId: userId, recipientId: recipientUserId },
          { initiatorId: recipientUserId, recipientId: userId },
        ],
        status: { $in: ACTIVE_STATUSES },
      })
        .sort({ createdAt: 1, _id: 1 })
        .select("_id")
        .limit(MAX_ACTIVE_TRADES_PER_PAIR + 1);
      const ourIdx = activeList.findIndex(
        (t) => String(t._id) === String(trade._id)
      );
      if (ourIdx >= MAX_ACTIVE_TRADES_PER_PAIR) {
        await models.StampTrade.deleteOne({ _id: trade._id });
        res.status(429);
        res.send(
          `You already have ${MAX_ACTIVE_TRADES_PER_PAIR} active trades with this user.`
        );
        return;
      }
    }

    if (recipientUserId) {
      const notifContent = autoResponded
        ? `${initiatorUser.name} wants to trade their ${role} stamp for your ${requestedRole}. Confirm on your profile.`
        : `${initiatorUser.name} wants to trade their ${role} stamp with you.`;
      await routeUtils.createNotification(
        {
          content: notifContent,
          icon: "fas fa-exchange-alt",
          link: `/user/${recipientUserId}`,
        },
        [recipientUserId]
      );
    }

    res.send({ id: trade.id });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Error starting trade. Please try again.");
  }
});

router.post("/gift", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.rateLimit(userId, "tradeStamp", res))) return;
    const gameType = String(req.body.gameType || "").trim();
    const role = String(req.body.role || "").trim();
    const recipientUserId = String(req.body.recipientUserId || "").trim();

    if (!gameType || !role || !recipientUserId) {
      res.status(400);
      res.send("Stamp gameType, role, and recipientUserId are required.");
      return;
    }
    const roleErr = validateStampRole(gameType, role);
    if (roleErr) {
      res.status(400);
      res.send(roleErr);
      return;
    }
    if (recipientUserId === userId) {
      res.status(400);
      res.send("You cannot gift to yourself.");
      return;
    }

    const [initiatorUser, recipientUser] = await Promise.all([
      models.User.findOne({ id: userId, deleted: false }).select("_id name"),
      models.User.findOne({
        id: recipientUserId,
        deleted: false,
      }).select("_id id name blockedUsers"),
    ]);
    if (!initiatorUser) {
      res.status(404);
      res.send("User not found.");
      return;
    }
    if (!recipientUser) {
      res.status(404);
      res.send("Recipient not found.");
      return;
    }
    if ((recipientUser.blockedUsers || []).includes(userId)) {
      res.status(403);
      res.send("You cannot gift to this user.");
      return;
    }

    let stampId;
    try {
      stampId = await getGiftableStampId(userId, gameType, role);
    } catch (e) {
      res.status(400);
      res.send(e.message);
      return;
    }

    const moved = await models.Stamp.findOneAndUpdate(
      { _id: stampId, userId },
      [
        {
          $set: {
            originalOwnerId: { $ifNull: ["$originalOwnerId", userId] },
            originalOwner: { $ifNull: ["$originalOwner", initiatorUser._id] },
            user: recipientUser._id,
            userId: recipientUserId,
            hidden: false,
            borderType: "u",
          },
        },
      ],
      { new: true }
    );
    if (!moved) {
      res.status(409);
      res.send("Could not gift this stamp right now. Please try again.");
      return;
    }

    const now = Date.now();
    await models.StampTrade.create({
      id: shortid.generate(),
      initiatorId: userId,
      initiator: initiatorUser._id,
      initiatorStamp: moved._id,
      initiatorGameType: gameType,
      initiatorRole: role,
      recipientId: recipientUserId,
      recipient: recipientUser._id,
      status: "COMPLETED",
      createdAt: now,
      updatedAt: now,
      completedAt: now,
    });

    await routeUtils.createNotification(
      {
        content: `${initiatorUser.name} gifted you a ${role} stamp.`,
        icon: "fas fa-gift",
        link: `/user/${userId}`,
      },
      [recipientUserId]
    );

    res.send({ ok: true });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error gifting stamp.");
  }
});

router.post("/respond", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.rateLimit(userId, "tradeStamp", res))) return;
    const tradeId = String(req.body.tradeId || "").trim();
    const gameType = String(req.body.gameType || "").trim();
    const role = String(req.body.role || "").trim();

    if (!tradeId || !gameType || !role) {
      res.status(400);
      res.send("Trade id, gameType, and role are required.");
      return;
    }
    const roleErr = validateStampRole(gameType, role);
    if (roleErr) {
      res.status(400);
      res.send(roleErr);
      return;
    }

    const trade = await models.StampTrade.findOne({ id: tradeId });
    if (!trade) {
      res.status(404);
      res.send("Trade not found.");
      return;
    }
    if (trade.recipientId && trade.recipientId !== userId) {
      res.status(403);
      res.send("You are not the recipient of this trade.");
      return;
    }
    if (trade.initiatorId === userId) {
      res.status(400);
      res.send("You cannot respond to your own trade.");
      return;
    }
    if (trade.status !== "PENDING_RESPONSE") {
      res.status(400);
      res.send("This trade is no longer awaiting a response.");
      return;
    }

    const responderUser = await models.User.findOne({ id: userId, deleted: false }).select("_id");
    if (!responderUser) {
      res.status(404);
      res.send("User not found.");
      return;
    }

    let availableStampIds;
    try {
      availableStampIds = await getAvailableStampIds(userId, gameType, role);
    } catch (e) {
      res.status(400);
      res.send(e.message);
      return;
    }

    // Try each available stamp; the partial unique index on recipientStamp
    // rejects E11000 if another concurrent request already reserved it.
    let updated = null;
    let transitionErr = null;
    for (const stampId of availableStampIds) {
      try {
        updated = await models.StampTrade.findOneAndUpdate(
          { id: tradeId, status: "PENDING_RESPONSE" },
          {
            $set: {
              recipientStamp: stampId,
              recipientGameType: gameType,
              recipientRole: role,
              status: "PENDING_CONFIRMATION",
              updatedAt: Date.now(),
              ...(trade.recipientId ? {} : { recipientId: userId, recipient: responderUser._id }),
            },
          },
          { new: true }
        );
      } catch (e) {
        if (e && e.code === 11000) {
          transitionErr = e;
          continue;
        }
        throw e;
      }
      if (!updated) break; // trade no longer pending — handled below

      // Cross-field race: the stamp may already be attached (as initiatorStamp
      // or recipientStamp) to a different active trade. Revert and retry.
      if (await stampHasCrossFieldConflict(stampId, updated._id)) {
        await models.StampTrade.updateOne(
          { _id: updated._id, status: "PENDING_CONFIRMATION" },
          {
            $set: { status: "PENDING_RESPONSE", updatedAt: Date.now() },
            $unset: {
              recipientStamp: "",
              recipientGameType: "",
              recipientRole: "",
            },
          }
        );
        updated = null;
        transitionErr = new Error("stamp already locked");
        continue;
      }
      break;
    }

    if (!updated) {
      // Either the trade is no longer PENDING_RESPONSE, or we couldn't
      // reserve any stamp.
      const current = await models.StampTrade.findOne({ id: tradeId }).select(
        "status"
      );
      if (current && current.status !== "PENDING_RESPONSE") {
        res.status(409);
        res.send("This trade is no longer awaiting a response.");
      } else {
        if (transitionErr) logger.error(transitionErr);
        res.status(409);
        res.send(
          "Could not reserve a stamp — please try again (it may be locked in another trade)."
        );
      }
      return;
    }

    const responder = await models.User.findOne({
      id: userId,
      deleted: false,
    }).select("name");
    if (!responder) {
      res.status(404);
      res.send("User not found.");
      return;
    }
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
    errors.serverError(res, "Error responding to trade. Please try again.");
  }
});

router.post("/confirm", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.rateLimit(userId, "tradeStamp", res))) return;
    const tradeId = String(req.body.tradeId || "").trim();

    const trade = await models.StampTrade.findOne({ id: tradeId });
    if (!trade) {
      res.status(404);
      res.send("Trade not found.");
      return;
    }
    // Auto-responded trades (initiated from profile, indicated by expiresAt)
    // are confirmed by the recipient. Normal trades are confirmed by the initiator.
    const autoResponded = !!trade.expiresAt;
    const canConfirm = autoResponded
      ? trade.recipientId === userId
      : trade.initiatorId === userId;
    if (!canConfirm) {
      res.status(403);
      res.send(
        autoResponded
          ? "Only the recipient can confirm this trade."
          : "Only the initiator can confirm this trade."
      );
      return;
    }
    if (trade.status !== "PENDING_CONFIRMATION") {
      res.status(400);
      res.send("This trade is not awaiting confirmation.");
      return;
    }

    // Claim the trade atomically so only one confirm request proceeds.
    const claimed = await models.StampTrade.findOneAndUpdate(
      { id: tradeId, status: "PENDING_CONFIRMATION" },
      { $set: { status: "COMPLETED", completedAt: Date.now(), updatedAt: Date.now() } },
      { new: true }
    );
    if (!claimed) {
      res.status(409);
      res.send("This trade is no longer awaiting confirmation.");
      return;
    }

    async function markFailed(reason) {
      // Move trade out of COMPLETED so it isn't left orphaned. Use FAILED
      // (distinct from REJECTED, which implies a party opted out).
      await models.StampTrade.updateOne(
        { id: tradeId, status: "COMPLETED", completedAt: claimed.completedAt },
        {
          $set: { status: "FAILED", updatedAt: Date.now() },
          $unset: { completedAt: "" },
        }
      );
      res.status(400);
      res.send(reason);
    }

    const [iStamp, rStamp] = await Promise.all([
      models.Stamp.findById(trade.initiatorStamp).select("_id userId"),
      models.Stamp.findById(trade.recipientStamp).select("_id userId"),
    ]);
    if (!iStamp || !rStamp) {
      return markFailed("One of the stamps no longer exists.");
    }
    if (
      iStamp.userId !== trade.initiatorId ||
      rStamp.userId !== trade.recipientId
    ) {
      return markFailed("Stamp ownership has changed.");
    }

    const [initiatorUser, recipientUser] = await Promise.all([
      models.User.findOne({ id: trade.initiatorId, deleted: false }).select(
        "_id name"
      ),
      models.User.findOne({ id: trade.recipientId, deleted: false }).select(
        "_id name"
      ),
    ]);
    if (!initiatorUser || !recipientUser) {
      return markFailed("One of the trade participants no longer exists.");
    }

    // Atomic swap via conditional updates: each update is guarded by the
    // current userId, so concurrent ownership changes cause the update to
    // return null instead of overwriting. If the second leg fails, we revert
    // the first leg via an equivalently-guarded update.
    const iSwap = await models.Stamp.findOneAndUpdate(
      { _id: iStamp._id, userId: trade.initiatorId },
      [
        {
          $set: {
            originalOwnerId: { $ifNull: ["$originalOwnerId", trade.initiatorId] },
            originalOwner: { $ifNull: ["$originalOwner", initiatorUser._id] },
            user: recipientUser._id,
            userId: trade.recipientId,
            hidden: false,
            borderType: "u",
          },
        },
      ],
      { new: true }
    );
    if (!iSwap) {
      return markFailed("Stamp ownership has changed.");
    }

    const rSwap = await models.Stamp.findOneAndUpdate(
      { _id: rStamp._id, userId: trade.recipientId },
      [
        {
          $set: {
            originalOwnerId: { $ifNull: ["$originalOwnerId", trade.recipientId] },
            originalOwner: { $ifNull: ["$originalOwner", recipientUser._id] },
            user: initiatorUser._id,
            userId: trade.initiatorId,
            hidden: false,
            borderType: "u",
          },
        },
      ],
      { new: true }
    );
    if (!rSwap) {
      // Revert the first leg. Guard by the new userId so we don't clobber an
      // unrelated change that may have slipped in between the two updates.
      const reverted = await models.Stamp.findOneAndUpdate(
        { _id: iStamp._id, userId: trade.recipientId },
        {
          $set: {
            user: initiatorUser._id,
            userId: trade.initiatorId,
          },
        },
        { new: true }
      );
      if (!reverted) {
        logger.error(
          `CRITICAL: stamp swap inconsistent for trade ${trade.id}: could not revert iStamp ${iStamp._id}`
        );
      }
      return markFailed("Stamp ownership has changed.");
    }

    await routeUtils.createNotification(
      {
        content: `Trade completed with ${recipientUser.name}: you received a ${trade.recipientRole}.`,
        icon: "fas fa-exchange-alt",
        link: `/user/${trade.recipientId}`,
      },
      [trade.initiatorId]
    );
    await routeUtils.createNotification(
      {
        content: `Trade completed with ${initiatorUser.name}: you received a ${trade.initiatorRole}.`,
        icon: "fas fa-exchange-alt",
        link: `/user/${trade.initiatorId}`,
      },
      [trade.recipientId]
    );

    res.send({ id: claimed.id, status: claimed.status });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Error confirming trade. Please try again.");
  }
});

router.post("/reject", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.rateLimit(userId, "tradeStamp", res))) return;
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

    // Atomic transition: only reject if still active.
    const updated = await models.StampTrade.findOneAndUpdate(
      { id: tradeId, status: { $in: ACTIVE_STATUSES } },
      { $set: { status: "REJECTED", updatedAt: Date.now() } },
      { new: true }
    );
    if (!updated) {
      res.status(409);
      res.send("This trade cannot be rejected.");
      return;
    }

    const rejector = await models.User.findOne({
      id: userId,
      deleted: false,
    }).select("name");
    if (!rejector) {
      res.status(404);
      res.send("User not found.");
      return;
    }
    const otherUserId =
      userId === trade.initiatorId ? trade.recipientId : trade.initiatorId;
    if (otherUserId) {
      const tradeDesc = trade.recipientRole
        ? `${trade.initiatorRole} for ${trade.recipientRole}`
        : `${trade.initiatorRole}`;
      await routeUtils.createNotification(
        {
          content: `${rejector.name} rejected the stamp trade (${tradeDesc}).`,
          icon: "fas fa-exchange-alt",
          link: `/user/${otherUserId}`,
        },
        [otherUserId]
      );
    }

    res.send({ id: trade.id, status: trade.status });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Error rejecting trade. Please try again.");
  }
});

module.exports = router;
