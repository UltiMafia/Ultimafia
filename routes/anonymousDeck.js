const express = require("express");
const models = require("../db/models");
const routeUtils = require("./utils");
const { textIncludesSlurs } = require("../react_main/src/lib/profanity");
const {
  maxOwnedAnonymousDecks,
  minDeckSize,
  maxDeckSize,
  maxNameLengthInDeck,
} = require("../data/constants");
const logger = require("../modules/logging")(".");
const router = express.Router();

router.get("profile/:id", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    let deckProfileId = String(req.params.id);
    let profile = await models.AnonymousProfile.findOne({ id: deckProfileId })
      .select("id name avatar deathMessage parentDeck")
      .populate("parentDeck", "id name creator disabled");

    if (!profile) {
      res.status(500);
      res.send("Deck profile does not exist");
    }
    
    profile = profile.toJSON();
    res.send(profile);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to find deck profile.");
  }
});

router.post("/profile/create", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);

    let parentDeckId = req.body.parentDeckId;
    if (!parentDeckId) {
      res.status(500);
      res.send("Deck does not exist");
    }

    let foundParentDeck = await models.AnonymousDeck.findOne({ id: String(req.body.parentDeckId) })
      .select("creator")
      .populate("creator", "id");

    if (!foundParentDeck || foundParentDeck.creator.id != userId) {
      res.status(500);
      res.send("You can only edit decks you have created.");
      return;
    }

    // TODO check parent max size

    let deckProfile = {}
    let deckObj = Object(req.body);
    deckProfile.name = String(deckObj.name || "");

    // TOOD check name length and slurs

    if (req.body.editing) {
      await models.AnonymousDeck.updateOne({ id: deck.id }, { $set: deck }).exec();
      res.send(req.body.id);
    } else {
      deck.id = shortid.generate();
      deck.creator = req.session.user._id;

      deck = new models.AnonymousDeck(deck);
      await deck.save();
      await models.User.updateOne(
        { id: userId },
        { $push: { setups: deck._id } }
      ).exec();
      res.send(deck.id);
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to make deck profile.");
  }
});

router.post("/profile/delete", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);

    let parentDeckId = req.body.parentDeckId;
    if (!parentDeckId) {
      res.status(500);
      res.send("The parent deck does not exist");
    }

    let foundParentDeck = await models.AnonymousDeck.findOne({ id: String(req.body.parentDeckId) })
      .select("creator")
      .populate("creator", "id");

    if (!foundParentDeck || foundParentDeck.creator.id != userId) {
      res.status(500);
      res.send("You can only edit decks you have created.");
      return;
    }

    // TODO check parent deck min size

  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to delete deck profile.");
  }
});

router.get("/:id", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    let deckId = String(req.params.id);
    let deck = await models.AnonymousDeck.findOne({ id: deckId })
      .select("id name creator profiles disable featured")
      .populate("creator", "id name avatar -_id")
      .populate("profiles", "name avatar deathMessage -_id");

    if (deck) {
      deck = deck.toJSON();
      res.send(deck);
    } else {
      res.status(500);
      res.send("Unable to find deck.");
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to find deck.");
  }
});

router.post("/create", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    var user = await models.User.findOne({ id: userId, deleted: false }).select(
      "anonymousDecks"
    );
    user = user.toJSON();

    if (!req.body.editing && user.anonymousDecks.length >= user.itemsOwned.anonymousDecks) {
      res.status(500);
      res.send("You need to purchase more anonymous decks from the shop.");
      return;
    }

    if (user.anonymousDecks.length >= constants.maxOwnedAnonymousDecks) {
      res.status(500);
      res.send(`You can only have up to ${constants.maxOwnedAnonymousDecks} created anonymous decks linked to your account.`);
      return;
    }

    if (req.body.editing) {
      var foundDeck = await models.AnonymousDeck.findOne({ id: String(req.body.id) })
        .select("creator")
        .populate("creator", "id");

      if (!foundDeck || foundDeck.creator.id != userId) {
        res.status(500);
        res.send("You can only edit decks you have created.");
        return;
      }
    }

    let deck = Object(req.body);
    deck.name = String(deck.name || "");
    // check name
    if (!deck.name || !deck.name.length) {
      res.status(500);
      res.send("You must give your deck a name.");
      return;
    }

    if (req.body.editing) {
      await models.AnonymousDeck.updateOne({ id: deck.id }, { $set: deck }).exec();
      res.send(req.body.id);
      return;
    }

    deck.id = shortid.generate();
    deck.creator = req.session.user._id;
    // TODO if new, automatically create 5 profiles

    deck = new models.AnonymousDeck(deck);
    await deck.save();
    await models.User.updateOne(
      { id: userId },
      { $push: { setups: deck._id } }
    ).exec();
    res.send(deck.id);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to make deck.");
  }
});

router.post("/delete", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    let deckId = req.body.deckId;

    let deck = await models.AnonymousDeck.findOne({
      id: deckId,
    })
      .select("name creator")
      .populate("creator", "id");

    if (!deck || deck.creator.id != userId) {
      res.status(500);
      res.send("You can only delete decks you have created.");
      return;
    }

    await models.AnonymousDeck.deleteOne({
      id: deckId,
    }).exec();

    res.send(`Deleted deck ${deck.name}`);
    return;
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to delete anonymous deck.");
  }
});

router.post("/disable", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    let deckId = req.body.deckId;

    if (
      !(await routeUtils.verifyPermission(res, userId, "disableAnonymousDeck"))
    ) {
      return;
    }

    let deck = await models.AnonymousDeck.findOne({ id: deckId });
    if (!deck) {
      res.status(500);
      res.send("Deck not found.");
      return;
    }

    await models.AnonymousDeck.updateOne(
      { id: deckId },
      { disabled: !deck.disabled }
    ).exec();

    routeUtils.createModAction(userId, "Toggle Disabled Anonymous Deck", [
      deckId,
    ]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to toggle disable on anonymous deck.");
  }
});

router.post("/feature", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    let deckId = req.body.deckId;

    if (
      !(await routeUtils.verifyPermission(res, userId, "featureAnonymousDeck"))
    ) {
      return;
    }

    let deck = await models.AnonymousDeck.findOne({ id: deckId });
    if (!deck) {
      res.status(500);
      res.send("Deck not found.");
      return;
    }

    await models.AnonymousDeck.updateOne(
      { id: deckId },
      { featured: !deck.featured }
    ).exec();

    routeUtils.createModAction(userId, "Toggle Featured Anonymous Deck", [
      deckId,
    ]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to toggle feature on anonymous deck.");
  }
});

router.get("/featured", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var pageSize = 7;
    var pageLimit = 10;
    var start = ((Number(req.query.page) || 1) - 1) * pageSize;
    var deckLimit = pageSize * pageLimit;

    if (!utils.verifyGameType(gameType)) {
      res.send({ decks: [], pages: 0 });
      return;
    }

    if (start < deckLimit) {
      let decks = await models.AnonymousDeck.find({ featured: true })
        .skip(start)
        .limit(pageSize)
        .select("id name featured");
      let count = await models.AnonymousDeck.countDocuments({
        featured: true,
      });

      res.send({
        decks: decks,
        pages: Math.min(Math.ceil(count / pageSize), pageLimit) || 1,
      });
    } else res.send({ decks: [], pages: 0 });
  } catch (e) {
    logger.error(e);
    res.send({ decks: [], pages: 0 });
  }
});

router.get("/search", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var pageSize = 7;
    var pageLimit = 5;
    var start = ((Number(req.query.page) || 1) - 1) * pageSize;
    var deckLimit = pageSize * pageLimit;

    if (!utils.verifyGameType(gameType)) {
      res.send({ decks: [], pages: 0 });
      return;
    }

    if (start < deckLimit) {
      var decks = await models.AnonymousDeck.find({
        name: { $regex: String(req.query.query), $options: "i" },
        gameType,
      })
        .sort("played")
        .limit(deckLimit)
        .select("id gameType name roles closed count featured -_id");
      var count = decks.length;
      decks = decks.slice(start, start + pageSize);

      res.send({
        decks: decks,
        pages: Math.min(Math.ceil(count) / pageSize, pageLimit) || 1,
      });
    } else res.send({ decks: [], pages: 0 });
  } catch (e) {
    logger.error(e);
    res.send({ decks: [], pages: 0 });
  }
});

router.get("/yours", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var pageSize = 7;
    var start = ((Number(req.query.page) || 1) - 1) * pageSize;
    var deckLimit = maxOwnedAnonymousDecks;
    var pageLimit = Math.ceil(deckLimit / pageSize);

    if (!userId) {
      res.send({ decks: [], pages: 0 });
      return;
    }

    let user = await models.User.findOne({ id: userId, deleted: false })
      .select("anonymousDecks")
      .populate({
        path: "anonymousDecks",
        select: "id name featured -_id",
        options: { limit: deckLimit },
      });

    if (!user) {
      res.send({ decks: [], pages: 0 });
      return;
    }

    let decks = user.anonymousDecks;
    let count = decks.length;
    decks = decks.reverse().slice(start, start + pageSize);

    res.send({
      decks: decks,
      pages: Math.min(Math.ceil(count / pageSize), pageLimit),
    });
  } catch (e) {
    logger.error(e);
    res.send({ decks: [], pages: 0 });
  }
});
