const express = require("express");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const models = require("../db/models");
const constants = require("../data/constants");
const logger = require("../modules/logging")(".");
const shortid = require("shortid");
const axios = require("axios");
const errors = require("../lib/errors");
const router = express.Router();

const COINS_PER_USD = 5;
const MIN_PURCHASE_USD = 1;
const MAX_PURCHASE_USD = 200;
const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";

let payPalTokenCache = {
  accessToken: "",
  expiresAt: 0,
};

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const missing = [];
    if (!clientId) {
      missing.push("PAYPAL_CLIENT_ID");
    }
    if (!clientSecret) {
      missing.push("PAYPAL_CLIENT_SECRET");
    }
    throw new Error(`PayPal credentials are missing: ${missing.join(", ")}.`);
  }

  const now = Date.now();
  if (
    payPalTokenCache.accessToken &&
    payPalTokenCache.expiresAt &&
    payPalTokenCache.expiresAt > now + 10_000
  ) {
    return payPalTokenCache.accessToken;
  }

  const tokenResponse = await axios.post(
    `${PAYPAL_API_BASE}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      auth: {
        username: clientId,
        password: clientSecret,
      },
      timeout: 15_000,
    }
  );

  const accessToken = tokenResponse.data?.access_token;
  const expiresInSeconds = Number(tokenResponse.data?.expires_in || 0);
  if (!accessToken || !expiresInSeconds) {
    throw new Error("Could not authenticate with PayPal.");
  }

  payPalTokenCache = {
    accessToken,
    expiresAt: now + expiresInSeconds * 1000,
  };

  return accessToken;
}

function getPayPalRequestPhase(error) {
  const url = String(error?.config?.url || "");
  if (url.includes("/v1/oauth2/token")) {
    return "token";
  }
  if (url.includes("/v2/checkout/orders")) {
    return "create-order";
  }
  if (url.includes("/capture")) {
    return "capture-order";
  }
  return "unknown";
}

function parseCompletedCapture(orderData) {
  const purchaseUnits = orderData?.purchase_units || [];
  for (const purchaseUnit of purchaseUnits) {
    const captures = purchaseUnit?.payments?.captures || [];
    for (const capture of captures) {
      if (capture?.status === "COMPLETED") {
        return capture;
      }
    }
  }
  return null;
}

async function ensureDonorStatus(userId) {
  const [donorGroup, userDoc] = await Promise.all([
    models.Group.findOne({ name: "Donor" }).select("_id").lean().exec(),
    models.User.findOne({ id: userId, deleted: false }).select("_id").lean().exec(),
  ]);

  if (!donorGroup || !userDoc) {
    return false;
  }

  const inGroup = await models.InGroup.findOne({
    user: userDoc._id,
    group: donorGroup._id,
  })
    .select("_id")
    .lean()
    .exec();

  if (!inGroup) {
    await models.InGroup.create({
      user: userDoc._id,
      group: donorGroup._id,
    });
  }

  await Promise.all([
    redis.cacheUserInfo(userId, true),
    redis.cacheUserPermissions(userId),
  ]);

  return true;
}

async function checkStampEligibility(userId, gameId) {
  const game = await models.Game.findOne({ id: gameId }).select(
    "type endTime broken winners playerIdMap playerRoleMap history ranked competitive"
  );

  if (!game) throw new Error("Game not found.");
  if (!game.endTime) throw new Error("This game has not finished yet.");
  if (game.type !== "Mafia")
    throw new Error("Stamps are only available for Mafia games.");
  if (game.broken)
    throw new Error("Cannot purchase a stamp from a broken game.");

  const playerIdMap = JSON.parse(game.playerIdMap || "{}");
  const playerId = playerIdMap[userId];
  if (!playerId) throw new Error("You were not a player in this game.");

  if (!game.winners.includes(playerId))
    throw new Error("You did not win this game.");

  let role;
  const playerRoleMap = JSON.parse(game.playerRoleMap || "{}");
  if (playerRoleMap[userId]) {
    role = playerRoleMap[userId];
  } else {
    try {
      const history = JSON.parse(game.history || "{}");
      const stateKeys = Object.keys(history)
        .filter((k) => !isNaN(k))
        .sort((a, b) => Number(b) - Number(a));
      for (const key of stateKeys) {
        const stateRoles = history[key]?.roles;
        if (stateRoles && stateRoles[playerId]) {
          role = stateRoles[playerId].split(":")[0];
          break;
        }
      }
    } catch (e) {
      // history parsing failed
    }
  }

  if (!role)
    throw new Error("Could not determine your role in this game.");

  const borderType = game.competitive ? "c" : game.ranked ? "r" : "u";
  return { gameType: game.type, role, borderType };
}

const shopItems = [
  {
    name: "Name and Text Colors",
    desc: "Set the colors of your name and text in games and chat",
    key: "textColors",
    price: 20,
    limit: 1,
    onBuy: async function (userId) {},
  },
  {
    name: "Profile Customization",
    desc: "Change the panel color and banner image on your profile",
    key: "customProfile",
    price: 20,
    limit: 1,
    onBuy: async function (userId) {},
  },
  {
    name: "Name Change",
    desc: "Change your name once per purchase",
    key: "nameChange",
    price: 20,
    limit: null,
    onBuy: async function (userId) {},
  },
  {
    name: "3 Character Username",
    desc: "Set your name to one that is 3 characters long",
    key: "threeCharName",
    price: 100,
    limit: 1,
    propagateItemUpdates: {
      nameChange: 1,
    },
    onBuy: async function (userId) {},
  },
  {
    name: "2 Character Username",
    desc: "Set your name to one that is 2 characters long",
    key: "twoCharName",
    price: 400,
    limit: 1,
    propagateItemUpdates: {
      nameChange: 1,
    },
    onBuy: async function (userId) {},
  },
  {
    name: "1 Character Username",
    desc: "Set your name to one that is 1 character long",
    key: "oneCharName",
    price: 800,
    limit: 1,
    propagateItemUpdates: {
      nameChange: 1,
    },
    onBuy: async function (userId) {},
  },
  {
    name: "Custom Death Message",
    desc: "Set the system message that appears on death. Comes with 2 free death message changes.",
    key: "deathMessageEnabled",
    price: 50,
    limit: 1,
    propagateItemUpdates: {
      deathMessageChange: 2,
    },
    onBuy: async function (userId) {},
  },
  {
    name: "Death Message Change",
    desc: "Change your death message, requires enabling custom death messages.",
    key: "deathMessageChange",
    price: 10,
    disableOn: (user) => !user.itemsOwned.deathMessageEnabled,
    onBuy: async function (userId) {},
  },
  {
    name: "Anonymous Deck",
    desc: "Create name decks for anonymous games.",
    key: "anonymousDeck",
    price: 70,
    limit: constants.maxOwnedAnonymousDecks,
    onBuy: async function (userId) {},
  },
  {
    name: "Word Deck",
    desc: "Create word decks of drawable nouns for the Draw It minigame.",
    key: "wordDeck",
    price: 100,
    limit: constants.maxOwnedWordDecks,
    onBuy: async function (userId) {},
  },
  {
    name: "Custom Emotes",
    desc: "Create custom emotes that you can use in game.",
    key: "customEmotes",
    price: 5,
    limit: constants.maxOwnedCustomEmotes,
    onBuy: async function (userId) {},
  },
  {
    name: "MORE Custom Emotes",
    desc: "Once you've bought all of the cheaper ones, get more custom emotes here.",
    key: "customEmotesExtra",
    price: 25,
    limit: constants.maxOwnedCustomEmotesExtra,
    onBuy: async function (userId) {},
  },
  {
    name: "Archived Games",
    desc: "Gain the ability to archive games and have them displayed on your profile!",
    key: "archivedGames",
    price: 100,
    limit: 1,
    propagateItemUpdates: {
      archivedGamesMax: 5,
    },
    onBuy: async function (userId) {},
  },
  {
    name: "Maximum Archived Games",
    desc: "Increases the amount of games that you can archive.",
    key: "archivedGamesMax",
    price: 30,
    limit: constants.maxArchivedGamesMax,
    onBuy: async function (userId) {},
  },
  {
    name: "Bonus Red Heart Capacity",
    desc: "Increases the amount of red hearts that you can hold.",
    key: "bonusRedHearts",
    price: 10,
    limit: constants.maxBonusRedHearts,
    onBuy: async function (userId) {
      // Immediately give the user their red heart
      await models.User.updateOne(
        { id: userId },
        { $inc: { redHearts: 1 } }
      ).exec();
    },
  },
  {
    name: "Square",
    desc: "Unlock the ability to become a square (currently profile only)",
    key: "avatarShape",
    price: 20,
    limit: 1,
    onBuy: async function (userId) {},
  },
  {
    name: "Vanity URL",
    desc: "Set a custom URL for your profile (1-20 characters)",
    key: "vanityUrl",
    price: 100,
    limit: 1,
    onBuy: async function (userId) {},
  },
  {
    name: "Custom Site Primary Color",
    desc: "Change the primary color of the site to whatever you'd like",
    key: "customPrimaryColor",
    price: 100,
    limit: 1,
    onBuy: async function (userId) {},
  },
  {
    name: "Icon Filter",
    desc: "Unlock the ability to apply a filter to all icons on the site",
    key: "iconFilter",
    price: 40,
    limit: 1,
    onBuy: async function (userId) {},
  },
  {
    name: "Profile Background",
    desc: "Upload a custom background image to replace the default pattern on all pages",
    key: "profileBackground",
    price: 20,
    limit: 1,
    onBuy: async function (userId) {},
  },
  {
    name: "Forum Banner",
    desc: "Upload a slim banner that appears above your forum post header.",
    key: "forumBanner",
    price: 30,
    limit: 1,
    onBuy: async function (userId) {},
  },
  {
    name: "Create Family",
    desc: "Create a Crime Family and top the leaderboard",
    key: "createFamily",
    price: 1000,
    limit: 1,
    onBuy: async function (userId) {},
  },
  {
    name: "Scrapbook Stamp",
    desc: "Commemorate a Mafia game win with a stamp of your role. Displayed on your profile scrapbook.",
    key: "stamp",
    price: 5,
    limit: null,
    validate: async function (userId, body) {
      const gameId = String(body.gameId || "").trim();
      if (!gameId) throw new Error("Please provide a game ID.");

      const existing = await models.Stamp.findOne({
        $or: [{ originalOwnerId: userId }, { originalOwnerId: null, userId }],
        gameId,
      });
      if (existing) throw new Error("You already have a stamp from this game.");

      const result = await checkStampEligibility(userId, gameId);
      return {
        gameId,
        gameType: result.gameType,
        role: result.role,
        borderType: result.borderType,
      };
    },
    onBuy: async function (userId, context) {
      const userDoc = await models.User.findOne({ id: userId }).select("_id");
      try {
        await models.Stamp.create({
          user: userDoc._id,
          userId,
          originalOwner: userDoc._id,
          originalOwnerId: userId,
          gameId: context.gameId,
          gameType: context.gameType,
          role: context.role,
          borderType: context.borderType,
        });
      } catch (e) {
        if (e.code === 11000) {
          throw new Error("You already have a stamp from this game.");
        }
        throw e;
      }
    },
  },
];

router.get("/info", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var user = await models.User.findOne({ id: userId });

    //let customDisable = item.disableOn && item.disableOn(user);

    /*
    let shopItemsParsed = shopItems.map((item) => {
      let limitReached =
        item.limit != null && user.itemsOwned[item.key] >= item.limit;
      item.disabled = item.disabled || limitReached || false;
      return item;
    });*/

    res.send({ shopItems: shopItems, balance: user.coins });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not load shop data. Please refresh and try again.");
  }
});

router.post(
  "/spendCoins",
  async function (req, res) {
    try {
      var userId = await routeUtils.verifyLoggedIn(req);
      var itemIndex = Number(req.body.item);
      if (itemIndex < 0 || itemIndex >= shopItems.length) {
        errors.badRequest(res, "Invalid item purchased.");
        return;
      }
      var item = shopItems[itemIndex];

      var user = await models.User.findOne({ id: userId }).select(
        "coins itemsOwned"
      );

      if (user.coins < item.price) {
        errors.forbidden(res, "You do not have enough coins to purchase this.");
        return;
      }

      if (item.limit != null && user.itemsOwned[item.key] >= item.limit) {
        errors.conflict(res, "You already own this.");
        return;
      }

      var context;
      if (item.validate) {
        try {
          context = await item.validate(userId, req.body);
        } catch (e) {
          res.status(400);
          res.send(e.message);
          return;
        }
      }

      let userChanges = {
        [`itemsOwned.${item.key}`]: 1,
        coins: -1 * item.price,
      };

      for (let k in item.propagateItemUpdates) {
        let change = item.propagateItemUpdates[k];
        userChanges[`itemsOwned.${k}`] = change;
      }

      await models.User.updateOne(
        { id: userId },
        {
          $inc: userChanges,
        }
      ).exec();

      await item.onBuy(userId, context);

      await redis.cacheUserInfo(userId, true);

      res.send(context || {});
    } catch (e) {
      logger.error(e);
      errors.serverError(res, "Error spending coins. Please try again.");
    }
  },

  router.post("/transferCoins", async function (req, res) {
    try {
      const senderId = await routeUtils.verifyLoggedIn(req);
      const { recipientUsername, amount } = req.body;

      const transferAmount = Number(amount);
      if (
        !recipientUsername ||
        !Number.isFinite(transferAmount) ||
        transferAmount <= 0
      ) {
        return res.status(400).send("Invalid transfer data.");
      }

      const [recipient, sender] = await Promise.all([
        models.User.findOne({
          name: recipientUsername,
          deleted: false,
        })
          .select("id")
          .lean()
          .exec(),
        models.User.findOne({ id: senderId }).select("name").lean().exec(),
      ]);

      if (!recipient) {
        return res.status(404).send("Recipient not found.");
      }
      if (!sender) {
        return res.status(404).send("Sender not found.");
      }
      if (recipient.id === senderId) {
        return res.status(400).send("Cannot transfer coins to yourself.");
      }

      // Atomically subtract coins only if balance is sufficient
      const debitResult = await models.User.updateOne(
        { id: senderId, coins: { $gte: transferAmount } },
        { $inc: { coins: -transferAmount } }
      ).exec();

      const modified =
        debitResult.modifiedCount ??
        debitResult.nModified ??
        debitResult.matchedCount ??
        0;
      if (!modified) {
        return res.status(400).send("Insufficient balance.");
      }

      const coinText = transferAmount === 1 ? "coin" : "coins";

      try {
        await Promise.all([
          models.User.updateOne(
            { id: recipient.id },
            { $inc: { coins: transferAmount } }
          ).exec(),
          models.Notification.create({
            id: shortid.generate(),
            user: recipient.id,
            isChat: false,
            content: `${sender.name} has sent you ${transferAmount} ${coinText}!`,
            date: Date.now(),
            read: false,
          }),
        ]);

        await Promise.all([
          redis.cacheUserInfo(senderId, true),
          redis.cacheUserInfo(recipient.id, true),
        ]);

        return res.sendStatus(200);
      } catch (e) {
        // If adding to recipient fails, refund the sender
        await models.User.updateOne(
          { id: senderId },
          { $inc: { coins: transferAmount } }
        ).exec();
        throw e;
      }
    } catch (e) {
      logger.error(e);
      errors.serverError(res, "Error transferring coins. Please try again.");
      return;
    }
  })
);

router.get("/paypal-client-id", async function (req, res) {
  try {
    await routeUtils.verifyLoggedIn(req);
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return res.status(500).send("PayPal is not configured.");
    }
    return res.send({ clientId: process.env.PAYPAL_CLIENT_ID });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not load PayPal configuration. Please refresh and try again.");
    return;
  }
});

router.post("/paypal/create-order", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const amountUsd = Number(req.body.amountUsd);

    if (!Number.isInteger(amountUsd)) {
      return res.status(400).send("USD amount must be an integer.");
    }
    if (amountUsd < MIN_PURCHASE_USD || amountUsd > MAX_PURCHASE_USD) {
      return res
        .status(400)
        .send(
          `USD amount must be between ${MIN_PURCHASE_USD} and ${MAX_PURCHASE_USD}.`
        );
    }

    const coins = amountUsd * COINS_PER_USD;
    const accessToken = await getPayPalAccessToken();

    const createResponse = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amountUsd.toFixed(2),
            },
            custom_id: userId,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 15_000,
      }
    );

    const paypalOrderId = createResponse.data?.id;
    if (!paypalOrderId) {
      errors.serverError(res, "PayPal order creation failed. Please try again.");
      return;
    }

    await models.PayPalShopOrder.create({
      paypalOrderId,
      userId,
      usd: amountUsd,
      coins,
      status: "pending",
    });

    return res.send({ orderID: paypalOrderId });
  } catch (e) {
    const phase = getPayPalRequestPhase(e);
    const paypalStatus = e?.response?.status;
    const paypalData = e?.response?.data;
    logger.error({
      message: "PayPal create-order failed",
      phase,
      status: paypalStatus,
      data: paypalData || e?.message || e,
    });

    if (e.message?.startsWith("PayPal credentials are missing")) {
      return res.status(500).send("PayPal server configuration is incomplete.");
    }
    if (phase === "token") {
      return res.status(502).send("Could not authenticate with PayPal.");
    }
    if (phase === "create-order") {
      return res.status(502).send("PayPal could not create checkout order.");
    }
    return res.status(500).send("Error creating PayPal order.");
  }
});

router.post("/paypal/capture-order", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const paypalOrderId = String(req.body.orderID || "").trim();

    if (!paypalOrderId) {
      return res.status(400).send("Missing PayPal order ID.");
    }

    const orderDoc = await models.PayPalShopOrder.findOne({
      paypalOrderId,
      userId,
    }).exec();
    if (!orderDoc) {
      return res.status(404).send("PayPal order not found.");
    }

    if (orderDoc.status === "completed") {
      await ensureDonorStatus(userId);
      const user = await models.User.findOne({ id: userId })
        .select("coins")
        .lean()
        .exec();
      return res.send({
        coinsAdded: 0,
        balance: user?.coins ?? 0,
        alreadyProcessed: true,
      });
    }

    const accessToken = await getPayPalAccessToken();
    const captureResponse = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 15_000,
      }
    );

    const capture = parseCompletedCapture(captureResponse.data);
    if (!capture) {
      await models.PayPalShopOrder.updateOne(
        { paypalOrderId, userId },
        { $set: { status: "failed" } }
      ).exec();
      return res.status(400).send("PayPal payment was not completed.");
    }

    const capturedCurrency = capture.amount?.currency_code;
    const capturedValue = Number(capture.amount?.value);
    if (capturedCurrency !== "USD" || !Number.isFinite(capturedValue)) {
      return res.status(400).send("Invalid PayPal capture amount.");
    }

    if (Math.abs(capturedValue - orderDoc.usd) > 0.0001) {
      return res.status(400).send("Captured amount does not match order.");
    }

    const updateOrderResult = await models.PayPalShopOrder.updateOne(
      {
        paypalOrderId,
        userId,
        status: "pending",
      },
      {
        $set: {
          status: "completed",
          paypalCaptureId: capture.id || "",
          completedAt: new Date(),
        },
      }
    ).exec();

    const updatedCount =
      updateOrderResult.modifiedCount ??
      updateOrderResult.nModified ??
      updateOrderResult.matchedCount ??
      0;

    if (!updatedCount) {
      const user = await models.User.findOne({ id: userId })
        .select("coins")
        .lean()
        .exec();
      return res.send({
        coinsAdded: 0,
        balance: user?.coins ?? 0,
        alreadyProcessed: true,
      });
    }

    const updatedUser = await models.User.findOneAndUpdate(
      { id: userId },
      { $inc: { coins: orderDoc.coins } },
      { new: true }
    )
      .select("coins")
      .lean()
      .exec();

    await ensureDonorStatus(userId);

    return res.send({
      coinsAdded: orderDoc.coins,
      balance: updatedUser?.coins ?? 0,
    });
  } catch (e) {
    logger.error(e?.response?.data || e);
    errors.serverError(res, "Error capturing PayPal payment. Please try again.");
    return;
  }
});

router.get("/stampSuggestions", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userDoc = await models.User.findOne({ id: userId, deleted: false })
      .select("_id")
      .lean();

    if (!userDoc) {
      return res.status(404).send("User not found.");
    }

    // Get last 30 finished Mafia games
    var games = await models.Game.find({
      users: userDoc._id,
      type: "Mafia",
      endTime: { $exists: true },
      broken: { $ne: true },
    })
      .sort("-endTime")
      .limit(30)
      .select("id users players winners playerRoleMap")
      .lean();

    // Filter to games the user won
    var wonGames = [];
    for (var game of games) {
      var userIdx = (game.users || []).findIndex(
        (u) => u && u.toString() === userDoc._id.toString()
      );
      if (userIdx === -1 || !game.players || !game.players[userIdx]) continue;
      var playerId = game.players[userIdx];
      if (!game.winners || !game.winners.includes(playerId)) continue;

      var roleMap = JSON.parse(game.playerRoleMap || "{}");
      var role = roleMap[userId];
      if (!role) continue;

      wonGames.push({ gameId: game.id, role });
    }

    // Remove games where user already has a stamp
    var gameIds = wonGames.map((g) => g.gameId);
    var existingStamps = await models.Stamp.find({
      $or: [{ originalOwnerId: userId }, { originalOwnerId: null, userId }],
      gameId: { $in: gameIds },
    })
      .select("gameId")
      .lean();
    var stampedGameIds = new Set(existingStamps.map((s) => s.gameId));

    var suggestions = wonGames.filter((g) => !stampedGameIds.has(g.gameId));

    res.send(suggestions);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not load stamp suggestions. Please refresh and try again.");
  }
});

router.post("/checkStampEligibility", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);

    let gameId = String(req.body.gameId || "").trim();
    const urlMatch = gameId.match(/\/game\/([^/?\s]+)/);
    if (urlMatch) gameId = urlMatch[1];

    if (!gameId) {
      return res.status(400).send("Please provide a game URL or ID.");
    }

    var result;
    try {
      result = await checkStampEligibility(userId, gameId);
    } catch (e) {
      return res.status(400).send(e.message);
    }
    res.send({ gameId, gameType: result.gameType, role: result.role });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Error checking stamp eligibility. Please try again.");
  }
});

router.post("/stamp/toggle-hide", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    const { stampId } = req.body;

    if (!stampId) {
      return res.status(400).send("Missing stamp ID.");
    }

    var stamp;
    try {
      stamp = await models.Stamp.findById(stampId);
    } catch (e) {
      return res.status(400).send("Invalid stamp ID.");
    }
    if (!stamp || stamp.userId !== userId) {
      return res.status(404).send("Stamp not found.");
    }

    stamp.hidden = !stamp.hidden;
    await stamp.save();

    res.send({ hidden: stamp.hidden });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Error toggling stamp visibility. Please try again.");
  }
});

module.exports = router;
