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

// param: editing - flag for edit instead of create
// param: id - id of deck, only required when editing
// param: name - name of deck
// param: profiles - JSON [{ name: x, avatar: y, deathMessage: z}, { name: x2, avatar: y2, deathMessage: z2}]
router.post("/create", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    var user = await models.User.findOne({ id: userId, deleted: false }).select(
      "itemsOwned anonymousDecks"
    );
    user = user.toJSON();

    if (
      !req.body.editing &&
      user.anonymousDecks.length >= user.itemsOwned.anonymousDeck
    ) {
      res.status(500);
      res.send("You need to purchase more anonymous decks from the shop.");
      return;
    }

    if (
      !req.body.editing &&
      user.anonymousDecks.length >= constants.maxOwnedAnonymousDecks
    ) {
      res.status(500);
      res.send(
        `You can only have up to ${constants.maxOwnedAnonymousDecks} created anonymous decks linked to your account.`
      );
      return;
    }

    if (req.body.editing) {
      var foundDeck = await models.AnonymousDeck.findOne({
        id: String(req.body.id),
      })
        .select("creator")
        .populate("creator", "id");

      if (!foundDeck || foundDeck.creator.id != userId) {
        res.status(500);
        res.send("You can only edit decks you have created.");
        return;
      }
    }

    let deck = Object();
    deck.editing = Boolean(req.body.editing);
    deck.id = String(req.body.id || "");
    deck.name = String(req.body.name || "");

    // deck name
    if (!deck.name || !deck.name.length) {
      res.status(500);
      res.send("You must give your deck a name.");
      return;
    }
    if (deck.name.length > constants.maxDeckNameLength) {
      res.status(500);
      res.send("Deck name is too long.");
      return;
    }

    if (req.body.editing) {
      var [result, newProfiles] = verifyDeckProfiles(req.body.profiles);

      if (result != true) {
        if (result == "Invalid deck data") {
          logger.warn(
            `Bad deck data: \n${userId}\n${JSON.stringify(deck.profiles)}`
          );
        }
        res.status(500);
        res.send(result);
        return;
      }
      await models.AnonymousDeck.updateOne(
        { id: deck.id },
        { $set: deck }
      ).exec();
      res.send(req.body.id);
      return;
    }

    deck.id = shortid.generate();
    deck.creator = req.session.user._id;

    deck = new models.AnonymousDeck(deck);
    await deck.save();
    await models.User.updateOne(
      { id: userId },
      { $push: { anonymousDecks: deck._id } }
    ).exec();

    //Add 5 default profiles.
    for (let i = 1; i <= 5; i++) {
      var id = shortid.generate();
      profile = new models.DeckProfile({
        id: id,
        name: `Profile ${i}`,
        color: `#FFFFFF`,
        deck: deck._id,
      });
      await profile.save();
      await models.AnonymousDeck.updateOne(
        { _id: deck._id },
        { $push: { profiles: profile } }
      ).exec();
    }

    deck = await models.AnonymousDeck.findOne({ _id: deck._id })
      .select("id name profiles")
      .populate({
        path: "profiles",
        model: "DeckProfile",
        select: "id name avatar color deathMessage -_id",
      });

    res.send(deck);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to make deck.");
  }
});

router.post("/delete", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    let deckId = String(req.body.id);

    let deck = await models.AnonymousDeck.findOne({
      id: deckId,
    })
      .select("_id id name creator profiles coverPhoto")
      .populate([
        {
          path: "profiles",
          model: "DeckProfile",
          select: "id name avatar color deathMessage -_id",
        },
        {
          path: "creator",
          model: "User",
          select: "id name avatar -_id",
        },
      ]);

    if (!deck || deck.creator.id != userId) {
      res.status(500);
      res.send("You can only delete decks you have created.");
      return;
    }

    for (let i = 0; i < deck.profiles.length; i++) {
      if (deck.profiles[i].avatar) {
        fs.unlinkSync(
          `${process.env.UPLOAD_PATH}/decks/${deck.profiles[i].id}.webp`
        );
      }
      await models.DeckProfile.deleteOne({
        id: deck.profiles[i].id,
      }).exec();
    }

    if (deck.coverPhoto) {
      let coverPath = `${process.env.UPLOAD_PATH}/decks/cover-${deck.id}.webp`;
      if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
    }

    await models.AnonymousDeck.deleteOne({
      id: deckId,
    }).exec();
    await models.User.updateOne(
      { id: deck.creator.id },
      { $pull: { anonymousDecks: deck._id } }
    ).exec();

    res.send(`Deleted deck ${deck.name}`);
    return;
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to delete anonymous deck.");
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

async function attachDeckPreviews(decks) {
  if (!decks || !decks.length) return decks;
  let allPreviewIds = [];
  for (let deck of decks) {
    deck.profileCount = (deck.profiles || []).length;
    const previewIds = (deck.profiles || []).slice(0, 5);
    deck._previewIds = previewIds;
    allPreviewIds.push(...previewIds);
  }
  let profiles = [];
  if (allPreviewIds.length) {
    profiles = await models.DeckProfile.find({ _id: { $in: allPreviewIds } })
      .select("id name avatar color _id")
      .lean();
  }
  let profileMap = new Map();
  for (let p of profiles) profileMap.set(String(p._id), p);
  for (let deck of decks) {
    deck.profilePreviews = (deck._previewIds || [])
      .map((id) => profileMap.get(String(id)))
      .filter(Boolean)
      .map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        color: p.color,
      }));
    delete deck._previewIds;
    delete deck.profiles;
  }
  return decks;
}

function parseProfileFormData(fields, files) {
  let profileTotal;
  let deckProfiles = [];
  let profileKeys = Object.keys(fields);

  for (let i = 50; i > 0; i--) {
    if (profileKeys[profileKeys.length - 1].includes(`${i}`)) {
      profileTotal = i + 1;
      break;
    }
  }

  for (let i = 0; i < profileTotal; i++) {
    let profile = {};
    if (files[`${i}[avatar]`]) {
      profile.avatar = files[`${i}[avatar]`];
    }
    profile.name = fields[`${i}[name]`];
    profile.color = fields[`${i}[color]`];
    profile.deathMessage = fields[`${i}[deathMessage]`];
    profile.deckId = fields[`${i}[deckId]`];
    profile.id = fields[`${i}[id]`];
    deckProfiles.push(profile);
  }

  return deckProfiles;
}

router.post("/profiles/create", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    let form = new formidable();
    form.maxFields = 100;
    form.maxFileSize = 100 * 1024 * 1024;

    let [fields, files] = await form.parseAsync(req);

    let deckProfiles = parseProfileFormData(fields, files);

    // Get the deck information
    let deck = await models.AnonymousDeck.findOne({
      id: deckProfiles[0].deckId,
    })
      .select("_id id name creator")
      .populate("creator", "id");

    if (!fs.existsSync(`${process.env.UPLOAD_PATH}/decks/`)) {
      fs.mkdirSync(`${process.env.UPLOAD_PATH}/decks/`);
    }

    let currentProfiles = await models.AnonymousDeck.findOne({
      id: deckProfiles[0].deckId,
    }).select("profiles");

    currentProfiles = await models.DeckProfile.find({
      _id: { $in: currentProfiles.toJSON().profiles },
    }).select("_id id name avatar color deathMessage");

    // For each of the current profiles,
    for (let i = 0; i < currentProfiles.length; i++) {
      // If the profile is not in the new profiles, delete it.
      if (
        !deckProfiles.find((profile) => profile.id == currentProfiles[i].id)
      ) {
        // If profile has an avatar, delete it.
        if (currentProfiles[i].avatar) {
          fs.unlinkSync(
            `${process.env.UPLOAD_PATH}/decks/${currentProfiles[i].id}.webp`
          );
        }
        await models.DeckProfile.deleteOne({
          id: currentProfiles[i].id,
        }).exec();
        await models.AnonymousDeck.updateOne(
          { id: deckProfiles[0].deckId },
          { $pull: { profiles: currentProfiles[i]._id } }
        ).exec();
      }
    }

    // For every profile in the deck,
    for (let i = 0; i < deckProfiles.length; i++) {
      // Check if the profile already exists
      let profile = await models.DeckProfile.findOne({
        id: deckProfiles[i].id,
      })
        .select("_id name id avatar color deathMessage")
        .populate("deck", "id");

      // If the profile exists, update it.
      if (profile) {
        profile.name = deckProfiles[i].name;
        profile.color = deckProfiles[i].color;
        profile.deathMessage = deckProfiles[i].deathMessage;
        // If the avatar is being updated, delete the old one.
        if (deckProfiles[i].avatar) {
          if (profile.avatar) {
            fs.unlinkSync(
              `${process.env.UPLOAD_PATH}/decks/${profile.id}.webp`
            );
          }
          profile.avatar = `/decks/${profile.id}.webp`;
          await sharp(deckProfiles[i].avatar.path)
            .webp()
            .resize(100, 100)
            .toFile(`${process.env.UPLOAD_PATH}/decks/${profile.id}.webp`);
        }

        await profile.save();
        continue;
      } else {
        let id = shortid.generate();

        if (deckProfiles[i].avatar) {
          await sharp(deckProfiles[i].avatar.path)
            .webp()
            .resize(100, 100)
            .toFile(`${process.env.UPLOAD_PATH}/decks/${id}.webp`);

          profile = new models.DeckProfile({
            id: id,
            name: deckProfiles[i].name,
            avatar: `/decks/${id}.webp`,
            color: deckProfiles[i].color,
            deck: deck._id,
            deathMessage: deckProfiles[i].deathMessage,
          });
        } else {
          profile = new models.DeckProfile({
            id: id,
            name: deckProfiles[i].name,
            color: deckProfiles[i].color,
            deck: deck._id,
            deathMessage: deckProfiles[i].deathMessage,
          });
        }
        await profile.save();
      }

      await models.AnonymousDeck.updateOne(
        { _id: deck._id },
        { $push: { profiles: profile } }
      ).exec();
    }

    res.send(true);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to edit profiles.");

    if (image) {
      fs.unlinkSync(image.path);
    }
    return;
  }
});

router.post("/disable", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    let deckId = req.body.deckId;

    if (!(await routeUtils.verifyPermission(res, userId, "disableDeck"))) {
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

    routeUtils.createModAction(userId, "Toggle Disable Deck", [deckId]);
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

    if (!(await routeUtils.verifyPermission(res, userId, "featureSetup"))) {
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

    routeUtils.createModAction(userId, "Toggle Featured Deck", [deckId]);
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

    if (start < deckLimit) {
      let decks = await models.AnonymousDeck.find({
        featured: true,
        disabled: false,
      })
        .skip(start)
        .limit(pageSize)
        .select("id name profiles creator coverPhoto voteCount")
        .populate("creator", "id name avatar -_id")
        .lean();
      decks = await attachDeckPreviews(decks);
      decks = await attachUserVotes(decks, userId);
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

    let canSeeDisabled = await routeUtils.verifyPermission(
      userId,
      "disableDeck"
    );
    let query = String(req.query.query);
    let searchClause = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { id: query },
      ],
    };
    if (!canSeeDisabled) {
      searchClause.disabled = false;
    }

    if (start < deckLimit) {
      var decks = await models.AnonymousDeck.find(searchClause)
        .limit(deckLimit)
        .select("id name profiles coverPhoto voteCount")
        .lean();
      var count = decks.length;
      decks = decks.slice(start, start + pageSize);
      decks = await attachDeckPreviews(decks);
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
      name: { $regex: String(req.query.query), $options: "i" },
    };
    if (!canSeeDisabled) {
      searchClause.disabled = false;
    }

    if (start < deckLimit) {
      var decks = await models.AnonymousDeck.find({
        disabled: false,
      })
        .limit(deckLimit)
        .select("id name profiles coverPhoto voteCount")
        .lean();
      var count = decks.length;
      decks = decks.slice(start, start + pageSize);
      decks = await attachDeckPreviews(decks);
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
    var deckLimit = constants.maxOwnedAnonymousDecks;
    var pageLimit = Math.ceil(deckLimit / pageSize);

    if (!userId) {
      res.send({ decks: [], pages: 0 });
      return;
    }

    let user = await models.User.findOne({ id: userId, deleted: false })
      .select("anonymousDecks name avatar id")
      .populate({
        path: "anonymousDecks",
        select:
          "id name profiles disabled featured coverPhoto voteCount creator",
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

    let decks = user.anonymousDecks || [];
    let count = decks.length;
    decks = decks.reverse().slice(start, start + pageSize);
    decks = await attachDeckPreviews(decks);
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

    let deck = await models.AnonymousDeck.findOne({ id: deckId })
      .select("id creator coverPhoto")
      .populate("creator", "id");

    if (!deck || deck.creator.id != userId) {
      res.status(403);
      res.send("You can only edit decks you have created.");
      return;
    }

    if (!fs.existsSync(`${process.env.UPLOAD_PATH}/decks/`)) {
      fs.mkdirSync(`${process.env.UPLOAD_PATH}/decks/`);
    }

    if (!coverFile) {
      // remove cover photo
      if (deck.coverPhoto) {
        let coverPath = `${process.env.UPLOAD_PATH}/decks/cover-${deck.id}.webp`;
        if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
      }
      await models.AnonymousDeck.updateOne(
        { id: deckId },
        { $set: { coverPhoto: "" } }
      );
      res.send({ coverPhoto: "" });
      return;
    }

    uploadedPath = coverFile.path;
    let relPath = `/decks/cover-${deck.id}.webp`;
    await sharp(coverFile.path)
      .webp()
      .resize(480, 270, { fit: "cover" })
      .toFile(`${process.env.UPLOAD_PATH}${relPath}`);

    await models.AnonymousDeck.updateOne(
      { id: deckId },
      { $set: { coverPhoto: relPath } }
    );
    res.send({ coverPhoto: relPath });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to upload cover photo.");
    if (uploadedPath && fs.existsSync(uploadedPath)) {
      try {
        fs.unlinkSync(uploadedPath);
      } catch (err) {}
    }
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
      "itemsOwned anonymousDecks"
    );
    if (!user) {
      res.send({ owned: 0, purchased: 0 });
      return;
    }
    res.send({
      owned: user.anonymousDecks.length,
      purchased: user.itemsOwned.anonymousDeck || 0,
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
    let deck = await models.AnonymousDeck.findOne({ id: deckId })
      .select("id name creator profiles disabled featured coverPhoto voteCount")
      .populate([
        {
          path: "profiles",
          model: "DeckProfile",
          select: "id name avatar color deathMessage -_id",
        },
        {
          path: "creator",
          model: "User",
          select: "id name avatar -_id",
        },
      ]);

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
      res.status(500);
      res.send("Unable to find anonymous deck.");
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to find anonymous deck.");
  }
});

function verifyDeckProfiles(profiles) {
  if (!profiles || profiles.length < constants.minDeckSize) {
    return ["Please add more anonymous profiles."];
  }

  if (profiles.length > constants.maxDeckSize) {
    return ["Too many anonymous profiles added."];
  }

  let newProfiles = [];
  let names = {};
  for (let i in profiles) {
    const profileIndex = parseInt(i) + 1;
    p = profiles[i];
    if (!p.name) {
      return [`Found empty anonymous profile name (#${profileIndex}).`];
    }

    if (names[p.name]) {
      return [`Duplicate name found: ${p.name} (#${profileIndex})`];
    }
    names[p.name] = true;

    if (p.name.length > constants.maxNameLengthInDeck) {
      return [
        `Profile name is too long: ${p.name.substring(
          0,
          constants.maxNameLengthInDeck
        )}… (#${profileIndex})`,
      ];
    }

    if (p.deathMessage && !p.deathMessage.includes("${name}")) {
      return [
        `You must use "$name" in the death message as a placeholder (#${profileIndex})`,
      ];
    }

    pNew = {
      name: p.name,
      avatar: p.image,
      color: p.color,
      deathMessage: p.deathMessage,
    };

    newProfiles.push(pNew);
  }

  return [true, newProfiles];
}

module.exports = router;
