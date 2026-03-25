const express = require("express");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const models = require("../db/models");
const constants = require("../data/constants");
const logger = require("../modules/logging")(".");
const shortid = require("shortid");
const router = express.Router();

async function checkStampEligibility(userId, gameId) {
  const game = await models.Game.findOne({ id: gameId }).select(
    "type endTime broken winners playerIdMap playerRoleMap history"
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

  return { gameType: game.type, role };
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

      const existing = await models.Stamp.findOne({ userId, gameId });
      if (existing) throw new Error("You already have a stamp from this game.");

      const result = await checkStampEligibility(userId, gameId);
      return { gameId, gameType: result.gameType, role: result.role };
    },
    onBuy: async function (userId, context) {
      const userDoc = await models.User.findOne({ id: userId }).select("_id");
      try {
        await models.Stamp.create({
          user: userDoc._id,
          userId,
          gameId: context.gameId,
          gameType: context.gameType,
          role: context.role,
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
    res.status(500);
    res.send("Error loading shop data.");
  }
});

router.post(
  "/spendCoins",
  async function (req, res) {
    try {
      var userId = await routeUtils.verifyLoggedIn(req);
      var itemIndex = Number(req.body.item);
      if (itemIndex < 0 || itemIndex >= shopItems.length) {
        res.status(500);
        res.send("Invalid item purchased.");
        return;
      }
      var item = shopItems[itemIndex];

      var user = await models.User.findOne({ id: userId }).select(
        "coins itemsOwned"
      );

      if (user.coins < item.price) {
        res.status(500);
        res.send("You do not have enough coins to purchase this.");
        return;
      }

      if (item.limit != null && user.itemsOwned[item.key] >= item.limit) {
        res.status(500);
        res.send("You already own this.");
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
      res.status(500);
      res.send("Error spending coins.");
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
      return res.status(500).send("Error transferring coins.");
    }
  })
);

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
    res.status(500).send("Error checking stamp eligibility.");
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
    res.status(500).send("Error toggling stamp visibility.");
  }
});

module.exports = router;
