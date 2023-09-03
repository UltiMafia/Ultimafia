const express = require("express");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const models = require("../db/models");
const constants = require("../data/constants");
const logger = require("../modules/logging")(".");
const router = express.Router();

const shopItems = [
  {
    name: "Name and Text Colors",
    desc: "Set the colors of your name and text in games and chat",
    key: "textColors",
    price: 20,
    limit: 1,
    onBuy: function () {},
  },
  {
    name: "Profile Customization",
    desc: "Change the panel color and banner image on your profile",
    key: "customProfile",
    price: 20,
    limit: 1,
    onBuy: function () {},
  },
  {
    name: "Name Change",
    desc: "Change your name once per purchase",
    key: "nameChange",
    price: 20,
    limit: null,
    onBuy: function () {},
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
    onBuy: function () {},
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
    onBuy: function () {},
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
    onBuy: function () {},
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
    onBuy: function () {},
  },
  {
    name: "Death Message Change",
    desc: "Change your death message, requires enabling custom death messages.",
    key: "deathMessageChange",
    price: 10,
    disableOn: (user) => !user.itemsOwned.deathMessageEnabled,
    onBuy: function () {},
  },
  {
    name: "Anonymous Deck",
    desc: "Create name decks for anonymous games. More Add-ons to come.",
    key: "anonymousDeck",
    price: 70,
    limit: constants.maxOwnedAnonymousDecks,
    onBuy: function () {},
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

router.post("/spendCoins", async function (req, res) {
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

    await redis.cacheUserInfo(userId, true);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error spending coins.");
  }
});

module.exports = router;
