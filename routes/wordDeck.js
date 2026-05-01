const express = require("express");
const models = require("../db/models");
const routeUtils = require("./utils");
const constants = require("../data/constants");
const shortid = require("shortid");
const logger = require("../modules/logging")(".");
const router = express.Router();
const formidable = require("formidable");
const fs = require("fs");
const sharp = require("sharp");
const errors = require("../lib/errors");

// param: editing - flag for edit instead of create
// param: id - id of deck, only required when editing
// param: name - name of deck
// param: words - array of strings
router.post("/create", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    var user = await models.User.findOne({ id: userId, deleted: false }).select(
      "itemsOwned wordDecks"
    );
    user = user.toJSON();

    if (
      !req.body.editing &&
      user.wordDecks.length >= (user.itemsOwned.wordDeck || 0)
    ) {
      errors.forbidden(
        res,
        "You need to purchase more word decks from the shop."
      );
      return;
    }

    if (
      !req.body.editing &&
      user.wordDecks.length >= constants.maxOwnedWordDecks
    ) {
      errors.conflict(
        res,
        `You can only have up to ${constants.maxOwnedWordDecks} created word decks linked to your account.`
      );
      return;
    }

    if (req.body.editing) {
      var foundDeck = await models.WordDeck.findOne({
        id: String(req.body.id),
      })
        .select("creator isDefault")
        .populate("creator", "id");

      if (!foundDeck) {
        errors.notFound(
          res,
          "That deck does not exist. It may have been removed."
        );
        return;
      }

      if (foundDeck.isDefault) {
        errors.forbidden(res, "Default decks cannot be edited.");
        return;
      }

      if (
        (!foundDeck.creator || foundDeck.creator.id != userId) &&
        !(await routeUtils.verifyPermission(res, userId, "editAnyDeck"))
      ) {
        errors.forbidden(res, "You can only edit decks you have created.");
        return;
      }
    }

    let deck = Object();
    deck.editing = Boolean(req.body.editing);
    deck.id = String(req.body.id || "");
    deck.name = String(req.body.name || "");
    deck.description = String(req.body.description || "");

    // deck name
    if (!deck.name || !deck.name.length) {
      errors.unprocessable(res, "You must give your deck a name.");
      return;
    }
    if (deck.name.length > constants.maxWordDeckNameLength) {
      errors.unprocessable(res, "Deck name is too long.");
      return;
    }

    if (deck.description.length > constants.maxWordDeckDescriptionLength) {
      errors.unprocessable(res, "Deck description is too long.");
      return;
    }

    var [result, cleanedWords] = verifyDeckWords(req.body.words);
    if (result !== true) {
      errors.unprocessable(res, result);
      return;
    }

    if (req.body.editing) {
      await models.WordDeck.updateOne(
        { id: deck.id },
        {
          $set: {
            name: deck.name,
            description: deck.description,
            words: cleanedWords,
          },
        }
      ).exec();
      res.send(req.body.id);
      return;
    }

    deck.id = shortid.generate();
    deck.creator = req.session.user._id;
    deck.words = cleanedWords;

    deck = new models.WordDeck(deck);
    await deck.save();
    await models.User.updateOne(
      { id: userId },
      { $push: { wordDecks: deck._id } }
    ).exec();

    deck = await models.WordDeck.findOne({ _id: deck._id }).select(
      "id name description words"
    );

    models.SiteActivity.create({
      id: shortid.generate(),
      type: "wordDeckCreate",
      actorId: userId,
      meta: { deckId: deck.id, deckName: deck.name },
      date: Date.now(),
    }).catch(() => {});

    res.send(deck);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not create deck. Please try again.");
  }
});

router.post("/delete", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    let deckId = String(req.body.id);

    let deck = await models.WordDeck.findOne({
      id: deckId,
    })
      .select("_id id name creator coverPhoto isDefault")
      .populate({
        path: "creator",
        model: "User",
        select: "id name avatar -_id",
      });

    if (!deck) {
      errors.notFound(
        res,
        "That deck does not exist. It may have been removed."
      );
      return;
    }

    if (deck.isDefault) {
      errors.forbidden(res, "Default decks cannot be deleted.");
      return;
    }

    if (!deck.creator || deck.creator.id != userId) {
      errors.forbidden(res, "You can only delete decks you have created.");
      return;
    }

    if (deck.coverPhoto) {
      let coverPath = `${process.env.UPLOAD_PATH}/wordDecks/cover-${deck.id}.webp`;
      if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
    }

    await models.WordDeck.deleteOne({
      id: deckId,
    }).exec();
    await models.User.updateOne(
      { id: deck.creator.id },
      { $pull: { wordDecks: deck._id } }
    ).exec();

    res.send(`Deleted deck ${deck.name}`);
    return;
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not delete word deck. Please try again.");
  }
});

async function attachUserVotes(decks, userId) {
  if (!decks || !decks.length) return decks;
  for (let deck of decks) {
    deck.voteCount = deck.voteCount ?? 0;
    deck.vote = 0;
  }
  if (!userId) return decks;
  const deckIds = decks.map((d) => d.id);
  const votes = await models.ForumVote.find({
    voter: userId,
    item: { $in: deckIds },
  })
    .select("item direction -_id")
    .lean();
  const voteMap = new Map();
  for (let v of votes) voteMap.set(v.item, v.direction);
  for (let deck of decks) {
    deck.vote = voteMap.get(deck.id) || 0;
  }
  return decks;
}

function attachWordPreviews(decks) {
  if (!decks || !decks.length) return decks;
  for (let deck of decks) {
    const words = deck.words || [];
    deck.wordCount = words.length;
    deck.wordPreview = words.slice(0, 5);
    delete deck.words;
  }
  return decks;
}

router.post("/coverPhoto", async function (req, res) {
  let uploadedPath = null;
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    let form = new formidable();
    form.maxFileSize = 2 * 1024 * 1024;

    let [fields, files] = await form.parseAsync(req);
    let deckId = String(fields.deckId || "");
    let coverFile = files.coverPhoto;

    if (!deckId) {
      res.status(400);
      res.send("Missing deckId.");
      return;
    }

    let deck = await models.WordDeck.findOne({ id: deckId })
      .select("id creator coverPhoto isDefault")
      .populate("creator", "id");

    if (!deck) {
      res.status(404);
      res.send("That deck does not exist. It may have been removed.");
      return;
    }

    if (deck.isDefault) {
      res.status(403);
      res.send("Default decks cannot be edited.");
      return;
    }

    if (
      (!deck.creator || deck.creator.id != userId) &&
      !(await routeUtils.verifyPermission(res, userId, "editAnyDeck"))
    ) {
      res.status(403);
      res.send("You can only edit decks you have created.");
      return;
    }

    if (!fs.existsSync(`${process.env.UPLOAD_PATH}/wordDecks/`)) {
      fs.mkdirSync(`${process.env.UPLOAD_PATH}/wordDecks/`);
    }

    if (!coverFile) {
      // remove cover photo
      if (deck.coverPhoto) {
        let coverPath = `${process.env.UPLOAD_PATH}/wordDecks/cover-${deck.id}.webp`;
        if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
      }
      await models.WordDeck.updateOne(
        { id: deckId },
        { $set: { coverPhoto: "" } }
      );
      res.send({ coverPhoto: "" });
      return;
    }

    uploadedPath = coverFile.path;
    let relPath = `/wordDecks/cover-${deck.id}.webp`;
    await sharp(coverFile.path)
      .webp()
      .resize(480, 270, { fit: "cover" })
      .toFile(`${process.env.UPLOAD_PATH}${relPath}`);

    await models.WordDeck.updateOne(
      { id: deckId },
      { $set: { coverPhoto: relPath } }
    );
    res.send({ coverPhoto: relPath });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not upload cover photo. Please try again.");
    if (uploadedPath && fs.existsSync(uploadedPath)) {
      try {
        fs.unlinkSync(uploadedPath);
      } catch (err) {}
    }
  }
});

router.post("/disable", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    let deckId = req.body.deckId;

    if (!(await routeUtils.verifyPermission(res, userId, "disableDeck"))) {
      return;
    }

    let deck = await models.WordDeck.findOne({ id: deckId });
    if (!deck) {
      errors.notFound(
        res,
        "That deck does not exist. It may have been removed."
      );
      return;
    }

    await models.WordDeck.updateOne(
      { id: deckId },
      { disabled: !deck.disabled }
    ).exec();

    routeUtils.createModAction(userId, "Toggle Disable Word Deck", [deckId]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    errors.serverError(
      res,
      "Could not toggle disable on this deck. Please try again."
    );
  }
});

router.post("/feature", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    let deckId = req.body.deckId;

    if (!(await routeUtils.verifyPermission(res, userId, "featureSetup"))) {
      return;
    }

    let deck = await models.WordDeck.findOne({ id: deckId });
    if (!deck) {
      errors.notFound(
        res,
        "That deck does not exist. It may have been removed."
      );
      return;
    }

    await models.WordDeck.updateOne(
      { id: deckId },
      { featured: !deck.featured }
    ).exec();

    routeUtils.createModAction(userId, "Toggle Featured Word Deck", [deckId]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    errors.serverError(
      res,
      "Could not toggle feature on this deck. Please try again."
    );
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

    if (start < deckLimit) {
      let decks = await models.WordDeck.find({
        featured: true,
        disabled: false,
      })
        .skip(start)
        .limit(pageSize)
        .select("id name description words creator coverPhoto voteCount isDefault")
        .populate("creator", "id name avatar -_id")
        .lean();
      decks = attachWordPreviews(decks);
      decks = await attachUserVotes(decks, userId);
      let count = await models.WordDeck.countDocuments({
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

    let canSeeDisabled = await routeUtils.verifyPermission(
      userId,
      "disableDeck"
    );
    let query = String(req.query.query);
    let searchClause = {
      $or: [{ name: { $regex: query, $options: "i" } }, { id: query }],
    };
    if (!canSeeDisabled) {
      searchClause.disabled = false;
    }

    if (start < deckLimit) {
      var decks = await models.WordDeck.find(searchClause)
        .limit(deckLimit)
        .select("id name description words coverPhoto voteCount isDefault")
        .lean();
      var count = decks.length;
      decks = decks.slice(start, start + pageSize);
      decks = attachWordPreviews(decks);
      decks = await attachUserVotes(decks, userId);

      res.send({
        decks: decks,
        pages: Math.min(Math.ceil(count) / pageSize, pageLimit) || 1,
      });
    } else {
      res.send({ decks: [], pages: 0 });
    }
  } catch (e) {
    logger.error(e);
    res.send({ decks: [], pages: 0 });
  }
});

router.get("/popular", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var pageSize = 7;
    var pageLimit = 15;
    var start = ((Number(req.query.page) || 1) - 1) * pageSize;
    var deckLimit = pageSize * pageLimit;

    let canSeeDisabled = await routeUtils.verifyPermission(
      userId,
      "disableDeck"
    );
    let searchClause = {
      disabled: false,
    };
    if (canSeeDisabled) {
      delete searchClause.disabled;
    }

    if (start < deckLimit) {
      var decks = await models.WordDeck.find(searchClause)
        .limit(deckLimit)
        .select("id name description words coverPhoto voteCount isDefault")
        .lean();
      var count = decks.length;
      decks = decks.slice(start, start + pageSize);
      decks = attachWordPreviews(decks);
      decks = await attachUserVotes(decks, userId);

      res.send({
        decks: decks,
        pages:
          Math.ceil(count / pageSize) + 1 <= pageLimit
            ? Math.ceil(count / pageSize) + 1
            : pageLimit,
      });
    } else {
      res.send({ decks: [], pages: 0 });
    }
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
    var deckLimit = constants.maxOwnedWordDecks;
    var pageLimit = Math.ceil(deckLimit / pageSize);

    if (!userId) {
      res.send({ decks: [], pages: 0 });
      return;
    }

    let user = await models.User.findOne({ id: userId, deleted: false })
      .select("wordDecks name avatar id")
      .populate({
        path: "wordDecks",
        select:
          "id name description words disabled featured coverPhoto voteCount creator isDefault",
        options: { limit: deckLimit },
        populate: [
          {
            path: "creator",
            model: "User",
            select: "id name avatar -_id",
          },
        ],
      })
      .lean();

    if (!user) {
      res.send({ decks: [], pages: 0 });
      return;
    }

    let decks = user.wordDecks || [];
    let count = decks.length;
    decks = decks.reverse().slice(start, start + pageSize);
    decks = attachWordPreviews(decks);
    decks = await attachUserVotes(decks, userId);

    res.send({
      decks: decks,
      pages: Math.min(Math.ceil(count / pageSize), pageLimit),
    });
  } catch (e) {
    logger.error(e);
    res.send({ decks: [], pages: 0 });
  }
});

router.get("/slots/info", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    if (!userId) {
      res.send({ owned: 0, purchased: 0 });
      return;
    }
    let user = await models.User.findOne({ id: userId, deleted: false }).select(
      "itemsOwned wordDecks"
    );
    if (!user) {
      res.send({ owned: 0, purchased: 0 });
      return;
    }
    res.send({
      owned: user.wordDecks.length,
      purchased: user.itemsOwned.wordDeck || 0,
    });
  } catch (e) {
    logger.error(e);
    res.send({ owned: 0, purchased: 0 });
  }
});

router.get("/:id", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    let deckId = String(req.params.id);
    let deck = await models.WordDeck.findOne({ id: deckId })
      .select(
        "id name description creator words disabled featured coverPhoto voteCount isDefault"
      )
      .populate({
        path: "creator",
        model: "User",
        select: "id name avatar -_id",
      });

    if (deck) {
      deck = deck.toJSON();
      deck.voteCount = deck.voteCount ?? 0;
      var viewerId = await routeUtils.verifyLoggedIn(req, true);
      deck.vote = 0;
      if (viewerId) {
        var voteDoc = await models.ForumVote.findOne({
          voter: viewerId,
          item: deck.id,
        }).select("direction");
        deck.vote = voteDoc ? voteDoc.direction : 0;
      }
      res.send(deck);
    } else {
      errors.notFound(
        res,
        "That deck does not exist. It may have been removed."
      );
    }
  } catch (e) {
    logger.error(e);
    errors.serverError(
      res,
      "Failed to load word deck. Please refresh and try again."
    );
  }
});

function verifyDeckWords(words) {
  if (!Array.isArray(words)) return ["Words must be a list."];
  if (words.length < constants.minWordDeckSize)
    return [`Deck must have at least ${constants.minWordDeckSize} words.`];
  if (words.length > constants.maxWordDeckSize)
    return [`Deck cannot exceed ${constants.maxWordDeckSize} words.`];

  const seen = new Set();
  const cleaned = [];
  for (const raw of words) {
    if (typeof raw !== "string") return ["Each word must be text."];
    const w = raw.trim().toLowerCase();
    if (!/^[a-z][a-z-]{1,29}$/.test(w))
      return [
        `Bad word: "${raw}" (single word, letters or hyphen, 2-30 chars)`,
      ];
    if (seen.has(w)) return [`Duplicate word: ${w}`];
    seen.add(w);
    cleaned.push(w);
  }
  return [true, cleaned];
}

module.exports = router;
