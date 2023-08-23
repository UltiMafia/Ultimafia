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

    // let deck = Object(req.body);
    let deck = Object();
    deck.editing = Boolean(req.body.editing);
    deck.id = String(req.body.id || "");
    deck.name = String(req.body.name || "");
    //deck.profiles = Object(deck.profiles);

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

    // profiles
    // var [result, newProfiles] = verifyDeckProfiles(req.body.profiles);
    // if (result != true) {
    //   if (result == "Invalid deck data")
    //     logger.warn(
    //       `Bad deck data: \n${userId}\n${JSON.stringify(deck.profiles)}`
    //     );

    //   res.status(500);
    //   res.send(result);
    //   return;
    // }
    // deck.profiles = JSON.stringify(newProfiles);

    if (req.body.editing) {
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
    res.send(deck.id);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to make deck.");
  }
});

router.post("/edit", async function (req, res) {
  try {
    userId = await routeUtils.verifyLoggedIn(req);
    let deckId = String(req.body.id);

    let deck = await models.AnonymousDeck.findOne({
      id: deckId,
    })
      .select("_id id name creator")
      .populate("creator", "id");

    if (!deck || deck.creator.id != userId) {
      res.status(500);
      res.send("You can only edit decks you have created.");
      return;
    }

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
    
    let profiles = await models.AnonymousDeck.findOne({ id: deckId })
      .select("profiles");

    profiles = await models.DeckProfile.find({"_id": { $in: profiles}})
      .select("_id name avatar color deathMessage");

    //Case 1: No profiles exist, so just create new ones.
    if (profiles.length == 0) {
      var [result, newProfiles] = verifyDeckProfiles(req.body.profiles);
      if (result != true) {
        if (result == "Invalid deck data")
          logger.warn(
            `Bad deck data: \n${userId}\n${JSON.stringify(deck.profiles)}`
          );

        res.status(500);
        res.send(result);
        return;
      }
      deck.profiles = newProfiles;
      
      var [result, newProfiles] = verifyDeckProfiles(req.body.profiles);
      if (result != true) {
        if (result == "Invalid deck data")
          logger.warn(
            `Bad deck data: \n${userId}\n${JSON.stringify(deck.profiles)}`
          );

        res.status(500);
        res.send(result);
        return;
      }
      deck.profiles = newProfiles;

      await models.AnonymousDeck.updateOne(
        { id: deck.id },
        { $set: deck }
      ).exec();

      res.send(deck);
      return;
    }
  }
  catch(e){
    logger.error(e);
    res.status(500);
    res.send("Unable to edit anonymous deck.");
  }
});

router.post("/deleteProfile/:id", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    let profileId = String(req.params.id);

    let profile = await models.DeckProfile.findOne({
      _id: profileId,
    })
      .select("_id id name deck")
      .populate("deck");

    fs.unlinkSync(`${process.env.UPLOAD_PATH}/decks/${profile.id}.webp`);

    await models.DeckProfile.deleteOne({
      _id: profileId,
    }).exec();
    await models.AnonymousDeck.updateOne(
      { id: profile.deck.id },
      { $pull: { profiles: profile._id } }
    ).exec();

    res.send(`Deleted profile ${profile.name}`);
    return;
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to delete profile.");
  }
});

//TODO: Delete associated profiles.
router.post("/delete", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    let deckId = String(req.body.id);

    let deck = await models.AnonymousDeck.findOne({
      id: deckId,
    })
      .select("_id id name creator")
      .populate("creator", "id");

    if (!deck || deck.creator.id != userId) {
      res.status(500);
      res.send("You can only delete decks you have created.");
      return;
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



function parseProfileFormData(fields, files) {
  
  let profileTotal;

  let deckProfiles = [];

  let profileKeys = Object.keys(fields);
  for (let i = 50; i > 0; i--) {
    if (profileKeys[profileKeys.length-1].includes(`${i}`)) {
      profileTotal = i+1;
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
    })
      .select("profiles");

    currentProfiles = await models.DeckProfile.find({"_id": { $in: currentProfiles.toJSON().profiles}})
      .select("_id id name avatar color deathMessage");

    // For each of the current profiles,
    for (let i = 0; i < currentProfiles.length; i++) {
      // If the profile is not in the new profiles, delete it.
      if (!deckProfiles.find((profile) => profile.id == currentProfiles[i].id)) {
        fs.unlinkSync(`${process.env.UPLOAD_PATH}/decks/${currentProfiles[i].id}.webp`);
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
        id: deckProfiles[i].id
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
          fs.unlinkSync(`${process.env.UPLOAD_PATH}/decks/${profile.id}.webp`);
          profile.avatar = `/decks/${profile.id}.webp`;
          await sharp(deckProfiles[i].avatar.path)
            .webp()
            .resize(100, 100)
            .toFile(`${process.env.UPLOAD_PATH}/decks/${profile.id}.webp`);
        }

        await profile.save();
        continue;
      }
      else {
        let id = shortid.generate();

        await sharp(deckProfiles[i].avatar.path)
        .webp()
        .resize(100, 100)
        .toFile(`${process.env.UPLOAD_PATH}/decks/${id}.webp`);

        profile = new models.DeckProfile( {
          id: id,
          name: deckProfiles[i].name,
          avatar: `/decks/${id}.webp`,
          color: deckProfiles[i].color,
          deck: deck._id,
          deathMessage: deckProfiles[i].deathMessage,
        });
        await profile.save();
    }
  
      await models.AnonymousDeck.updateOne(
        { id: deckProfiles[i].deckId },
        { $push: { profiles: profile } }
      ).exec();
    }

    res.send(true);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to create profile.");

    if (image) {
      fs.unlinkSync(image.path);
    }
    return;
  }
});

router.post("/profile/create", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    let form = new formidable;
    form.maxFileSize = 1024 * 1024;
    form.maxFields = 4;

    let [fields, files] = await form.parseAsync(req);

    let deckId = fields.deckId;
    let avatar = files.avatar;
    let color = fields.color;
    let deathMessage = fields.deathMessage;

    if (!fs.existsSync(`${process.env.UPLOAD_PATH}/decks`)) {
      fs.mkdirSync(`${process.env.UPLOAD_PATH}/decks`);
    }

    let id = shortid.generate();

    await sharp(image.path)
      .webp()
      .resize(100, 100)
      .toFile(`${process.env.UPLOAD_PATH}/decks/${id}_image.webp`);

      let deck = await models.AnonymousDeck.findOne({
        id: deckId,
      })
        .select("_id id name creator")
        .populate("creator", "id");
  
      if (!deck || deck.creator.id != userId) {
        res.status(500);
        res.send("You can only edit decks you have created.");
        return;
      }
    
    profile = new models.DeckProfile({
      id: id,
      image: `${process.env.UPLOAD_PATH}/decks/${id}_image.webp`,
      deathMessage: deathMessage,
      name: fields.name,
      deck: deck._id,
      color: color,
    });
    await profile.save();


    await models.AnonymousDeck.updateOne(
      { id: deckId },
      { $push: { profiles: profile._id } }
    ).exec();

    res.send(`Updated profile ${profile.name} for deck ${deck.name}`);
    return;
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to update profile for anonymous deck.");
  }
});

//TODO:
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
        .select("id name profiles creator")
        .populate("creator", "id name avatar -_id");
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
    let searchClause = {
      name: { $regex: String(req.query.query), $options: "i" },
    };
    if (!canSeeDisabled) {
      searchClause.disabled = false;
    }

    if (start < deckLimit) {
      var decks = await models.AnonymousDeck.find(searchClause)
        .limit(deckLimit)
        .select("id name profiles");
      var count = decks.length;
      decks = decks.slice(start, start + pageSize);

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

    //Multiple nested populates! https://stackoverflow.com/a/60593673/5965052
    let user = await models.User.findOne({ id: userId, deleted: false })
      .select("anonymousDecks name avatar id")
      .populate({
        path: "anonymousDecks",
        select: "id name profiles disabled featured -_id creator",
        options: { limit: deckLimit },
        populate: [{
          path: "profiles",
          model: "DeckProfile",
          select: "name id avatar -_id",
        }, 
        {
          path: "creator",
          model: "User",
          select: "id name avatar -_id",
        }],
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

router.get("/profile", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    let profileId = String(req.query.id);
    let profile = await models.DeckProfile.findOne({ id: profileId })
      .select("id name avatar deck color deathMessage")
      .populate("deck", "id name -_id");

    if (profile) {
      profile = profile.toJSON();
      res.send(profile);
    } else {
      res.status(500);
      res.send("Unable to find deck profile.");
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to find deck profile.");
  }
});

router.get("/profiles/:id", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    // Gets all profiles for a deck, given a list of profile ids.
    let deckId = String(req.params.id);
    let profiles = await models.AnonymousDeck.findOne({ id: deckId })
      .select("profiles");

    profiles = await models.DeckProfile.find({"_id": { $in: profiles.toJSON().profiles}})
      .select("_id name avatar id color deathMessage");

    if (profiles) {
      profiles = profiles.map((profile) => profile.toJSON());
      res.send(profiles);
    } else {
      res.status(500);
      res.send("Unable to find deck profiles.");
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to find deck profiles.");
  }
});

router.get("/:id", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    let deckId = String(req.params.id);
    let deck = await models.AnonymousDeck.findOne({ id: deckId })
      .select("id name creator profiles disabled featured")
      .populate("profiles", "id name avatar -_id")
      .populate("creator", "id name avatar -_id");

    if (deck) {
      deck = deck.toJSON();
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
  for (let p of profiles) {
    if (!p.name) {
      return ["Found empty anonymous profile name."];
    }

    if (names[p.name]) {
      return [`Duplicate name found: ${p.name}`];
    }
    names[p.name] = true;

    if (p.name.length > constants.maxNameLengthInDeck) {
      return [
        `Anonymous profile  is too long: ${p.name.substring(
          0,
          constants.maxNameLengthInDeck
        )}...`,
      ];
    }

    // TODO avatar
    // TODO deathMessage

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
