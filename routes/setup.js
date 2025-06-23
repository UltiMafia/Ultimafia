const express = require("express");
const shortid = require("shortid");
const oHash = require("object-hash");
const models = require("../db/models");
const routeUtils = require("./utils");
const constants = require("../data/constants");
const roleData = require("../data/roles");
const modifierData = require("../data/modifiers");
const redis = require("../modules/redis");
const logger = require("../modules/logging")(".");
const utils = require("./utils");
const mongoose = require("mongoose");
const { min } = require("mocha/lib/reporters");
const router = express.Router();
const mongo = require("mongodb");
const ObjectID = mongo.ObjectID;
const Diff = require("diff");

function markFavSetups(userId, setups) {
  return new Promise(async (resolve, reject) => {
    try {
      if (userId) {
        var favSetups = await redis.getFavSetupsHashtable(userId);

        for (let i in setups) {
          if (favSetups[setups[i].id]) {
            let setup = setups[i].toJSON();
            setup.favorite = true;
            setups[i] = setup;
          }
        }
      }

      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

// The setup manifest should be a human readable, easily diff-able file that concisely describes the setup
function generateMafiaSetupManifest(setup, roles) {
  try {
    // Start with the lines for all of the global stuff
    lines = [
      `Name: ${setup.name}`,
      `Starting state: ${setup.startState}`,
      `Whispers enabled: ${setup.whispers}`,
      `Whisper leak percentage: ${setup.leakPercentage}`,
      `Last wills enabled: ${setup.lastWill}`,
      `Banished count: ${setup.banished}`,
      `Talking dead enabled: ${setup.talkingDead}`,
      `Voting dead enabled: ${setup.votingDead}`,
      `Majority Voting: ${setup.majorityVoting}`,
      `Hidden converts: ${setup.hiddenConverts}`,
      `Role sharing: ${setup.RoleShare}`,
      `Alignment sharing: ${setup.AlignmentShare}`,
      `Private sharing: ${setup.PrivateShare}`,
      `Public sharing: ${setup.PublicShare}`,
      `Events per night: ${setup.EventsPerNight}`,
      `No death limit: ${setup.noDeathLimit}`,
      `Force must act: ${setup.ForceMustAct}`,
      `Is closed: ${setup.closed}`,
      `Unique roles: ${setup.unique}`,
      `Unique roles sans modifier: ${setup.uniqueWithoutModifier}`,
      `Use role groups: ${setup.useRoleGroups}`,
      `Dawn enabled: ${setup.dawn}`,
      `Must act: ${setup.mustAct}`,
      `Must condemn: ${setup.mustCondemn}`,
      `Game start prompt: ${setup.gameStartPrompt}`,
      `No reveal: ${setup.noReveal}`,
      `Votes invisible: ${setup.votesInvisible}`,
      `Game ending event: ${setup.GameEndEvent}`,
    ];

    if (setup.useRoleGroups) {
      lines.push(`Role group sizes:`);
      for (var i = 0; i < setup.roleGroupSizes.length; i++) {
        lines.push(`- Role group ${i + 1} size: ${setup.roleGroupSizes[i]}`);
      }
    }

    lines.push(`Roles:`);
    for (var i = 0; i < roles.length; i++) {
      lines.push(`- Role group ${i}:`);

      const roleGroup = roles[i];
      Object.keys(roleGroup).forEach(function (role) {
        const tokens = role.split(":");
        const roleName =
          tokens.length < 2 || tokens[1] === "" ? tokens[0] : role;
        lines.push(`  - ${roleName}: ${roleGroup[role]}`);
      });
    }

    return lines.join("\n");
  } catch (e) {
    logger.error(e);
    console.log(setup);
  }
}

router.get("/id", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var setup = await models.Setup.findOne({
      id: String(req.query.query),
    }).select(
      "id gameType name roles closed useRoleGroups roleGroupSizes count total -_id"
    );
    var setups = setup ? [setup] : [];

    await markFavSetups(userId, setups);
    res.send({ setups: setups, pages: 0 });
  } catch (e) {
    logger.error(e);
    res.send({ setups: [], pages: 0 });
  }
});

router.get("/search", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var sessionUserId = req.session?.user?._id;

    var userId = await routeUtils.verifyLoggedIn(req, true);
    var gameType = String(req.query.gameType);
    var minSlots = req.query.minSlots ? parseInt(req.query.minSlots) : null;
    var maxSlots = req.query.maxSlots ? parseInt(req.query.maxSlots) : null;
    var pageSize = 7;
    var pageLimit = 10;
    var start = ((Number(req.query.page) || 1) - 1) * pageSize;
    var setupLimit = pageSize * pageLimit;

    if (!utils.verifyGameType(gameType)) {
      res.send({ setups: [], pages: 0 });
      return;
    }

    const search = {};
    search.gameType = gameType;

    if (minSlots || maxSlots) {
      search.total = {};
      if (minSlots) {
        search.total.$gte = minSlots;
      }
      if (maxSlots) {
        search.total.$lte = maxSlots;
      }
    }

    const sort = {};

    if (req.query.query) {
      search["$or"] = [
        { name: { $regex: String(req.query.query), $options: "i" } },
        { roles: { $regex: String(req.query.query), $options: "i" } },
      ];
    }
    if (req.query.option) {
      const options = Array.isArray(req.query.option)
        ? req.query.option
        : [req.query.option];
      await Promise.all(
        options.map(async (option) => {
          switch (option.toLowerCase()) {
            case "featured":
              search.featured = true;
              sort._id = -1;
              break;
            case "popular":
              sort.played = -1;
              break;
            case "ranked":
              search.ranked = true;
              sort._id = -1;
              break;
            case "competitive":
              search.competitive = true;
              sort._id = -1;
              break;
            case "favorites":
              const favSetupsIds = (
                await models.User.findOne({
                  _id: mongoose.Types.ObjectId(sessionUserId),
                }).select("favSetups")
              )?.favSetups?.map((e) => e._id);
              search._id = { $in: favSetupsIds };
              sort._id = -1;
              break;
            case "yours":
              sort._id = -1;
              search.creator = mongoose.Types.ObjectId(sessionUserId);
              break;
            default:
              break;
          }
          return true;
        })
      );
    }

    if (start < setupLimit) {
      var setups = await models.Setup.find(search)
        .sort(sort)
        .skip(start)
        .limit(pageSize)
        .select(
          "id gameType name roles closed useRoleGroups roleGroupSizes count total featured -_id"
        )
        .populate("creator", "id name avatar tag -_id");
      var count = await models.Setup.countDocuments(search);

      await markFavSetups(userId, setups);
      res.send({
        setups: setups,
        pages: Math.min(Math.ceil(count / pageSize), pageLimit) || 1,
      });
    } else {
      res.send({ setups: [], pages: 0 });
    }
  } catch (e) {
    logger.error(e);
    res.send({ setups: [], pages: 0 });
  }
});

function calculateStats(setupVersion, gameType) {
  var stats = {};

  // No stats for other gameTypes for now
  if (gameType !== "Mafia") {
    return stats;
  }
  if (!setupVersion) {
    return stats;
  }

  // Infer that a setup is "legacy" if it lacks a manifest
  const isLegacy = setupVersion.manifest === "";

  // =========================================================================

  const rolePlays = setupVersion.rolePlays || {};
  const roleWins = setupVersion.roleWins || {};

  // Calculate role winrate
  var totalRoleWinPercent = 0.0;
  var roleWinrate = {};
  var roleWinrateNormalized = {};

  Object.keys(rolePlays).forEach(function (key) {
    var numWins = key in roleWins ? roleWins[key] : 0;
    var winPercent = numWins / rolePlays[key];

    roleWinrate[key] = winPercent;
    totalRoleWinPercent += winPercent;
  });

  // totalRoleWinPercent will be 1 in most cases, but can be larger if factions joint
  if (totalRoleWinPercent < 1) {
    totalRoleWinPercent = 1;
  }

  Object.keys(roleWinrate).forEach(function (key) {
    roleWinrateNormalized[key] = roleWinrate[key] / totalRoleWinPercent;
  });

  // =========================================================================

  var alignmentPlays = setupVersion.alignmentPlays || {};
  var alignmentWins = setupVersion.alignmentWins || {};

  // Convert role win data from old setups into alignment win data. This may lead to misleading results in multi-setups
  if (isLegacy) {
    alignmentPlays = {};
    alignmentWins = {};

    Object.keys(rolePlays).forEach(function (key) {
      if (!key in roleData[gameType]) {
        console.error(`Could not find role data for ${key}`);
        return;
      }

      const numWins = key in roleWins ? roleWins[key] : 0;
      const alignment = roleData[gameType][key].alignment;

      if (!(alignment in alignmentPlays)) alignmentPlays[alignment] = 0;
      if (!(alignment in alignmentWins)) alignmentWins[alignment] = 0;

      alignmentPlays[alignment] += rolePlays[key];
      alignmentWins[alignment] += numWins;
    });
  }

  // Calculate alignment winrate
  var totalAlignmentWinPercent = 0.0;
  var alignmentWinrate = {};
  var alignmentWinrateNormalized = {};

  Object.keys(alignmentPlays).forEach(function (key) {
    var numWins = key in alignmentWins ? alignmentWins[key] : 0;
    var winPercent = numWins / alignmentPlays[key];

    alignmentWinrate[key] = winPercent;
    totalAlignmentWinPercent += winPercent;
  });

  // totalAlignmentWinPercent will be 1 in most cases, but can be larger if factions joint
  if (totalAlignmentWinPercent < 1) {
    totalAlignmentWinPercent = 1;
  }

  Object.keys(alignmentWinrate).forEach(function (key) {
    alignmentWinrateNormalized[key] =
      alignmentWinrate[key] / totalAlignmentWinPercent;
  });

  // =========================================================================

  stats.roleWinrate = roleWinrateNormalized;
  stats.alignmentWinrate = alignmentWinrateNormalized;

  return stats;
}

router.get("/:id", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var setup = await models.Setup.findOne({ id: req.params.id })
      .select("-__v -hash")
      .populate("creator", "id name avatar tag -_id");

    if (setup) {
      setup = setup.toJSON();

      var setupVersionNum = setup.version || 0;
      let setupVersion = await models.SetupVersion.findOne({
        setup: new ObjectID(setup._id),
        version: setupVersionNum,
      }).select(
        "-_id timestamp changelog manifest played rolePlays roleWins alignmentPlays alignmentWins dayCountWins"
      );
      setup.setupVersion = setupVersion || {};

      if (req.get("includeStats") == "true") {
        setup.stats = calculateStats(setupVersion, setup.gameType);
      }

      res.send(setup);
    } else {
      res.status(500);
      res.send("Unable to find setup.");
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error getting setup.");
  }
});

router.get("/:id/version/:setupVersionNum", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var setup = await models.Setup.findOne({ id: req.params.id }).select(
      "-__v -hash"
    );

    if (setup) {
      setup = setup.toJSON();

      let setupVersion = await models.SetupVersion.findOne({
        setup: new ObjectID(setup._id),
        version: req.params.setupVersionNum,
      }).select(
        "-_id timestamp changelog manifest played rolePlays roleWins alignmentPlays alignmentWins dayCountWins"
      );

      if (setupVersion) {
        setupVersion = setupVersion.toJSON();
        setupVersion.stats = calculateStats(setupVersion, setup.gameType);
        res.send(setupVersion);
      } else {
        res.status(500);
        res.send("Unable to find setup version.");
      }
    } else {
      res.status(500);
      res.send("Unable to find setup.");
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error getting setup.");
  }
});

router.post("/feature", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var setupId = String(req.body.setupId);

    if (!(await routeUtils.verifyPermission(res, userId, "featureSetup")))
      return;

    var setup = await models.Setup.findOne({ id: setupId });

    if (!setup) {
      res.status(500);
      res.send("Setup not found.");
      return;
    }

    await models.Setup.updateOne(
      { id: setupId },
      { featured: !setup.featured }
    ).exec();
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error featuring setup.");
  }
});

router.post("/ranked", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var setupId = String(req.body.setupId);

    if (!(await routeUtils.verifyPermission(res, userId, "approveRanked")))
      return;

    var setup = await models.Setup.findOne({ id: setupId });

    if (!setup) {
      res.status(500);
      res.send("Setup not found.");
      return;
    }

    await models.Setup.updateOne(
      { id: setupId },
      { ranked: !setup.ranked }
    ).exec();

    routeUtils.createModAction(userId, "Toggle Ranked Setup", [setupId]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error making setup ranked.");
  }
});

router.post("/competitive", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var setupId = String(req.body.setupId);

    if (!(await routeUtils.verifyPermission(res, userId, "approveCompetitive")))
      return;

    var setup = await models.Setup.findOne({ id: setupId });

    if (!setup) {
      res.status(500);
      res.send("Setup not found.");
      return;
    }

    await models.Setup.updateOne(
      { id: setupId },
      { competitive: !setup.competitive }
    ).exec();

    routeUtils.createModAction(userId, "Toggle Competitive Setup", [setupId]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error making setup competitive.");
  }
});

router.post("/favorite", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var setupId = String(req.body.id);

    if (!(await routeUtils.rateLimit(userId, "favSetup", res))) return;

    var result = await redis.updateFavSetup(userId, setupId);

    if (result != "-2") res.send(result);
    else {
      res.status(500);
      res.send("You may only favorite a maximum of 100 setups.");
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error favoriting setup.");
  }
});

router.post("/delete", async function (req, res) {
  try {
    let setupId = String(req.body.id);
    var userId = await routeUtils.verifyLoggedIn(req);
    var user = await models.User.findOne({ id: userId, deleted: false }).select(
      "_id"
    );
    var setup = await models.Setup.findOne({ id: setupId })
      .select("_id creator")
      .populate("creator", "_id id");
    if (!user || !setup || !setup.creator) {
      res.status(500);
      res.send("Setup not found.");
      return;
    }

    let isSetupOwner = userId == setup.creator.id.toString();
    if (
      !isSetupOwner &&
      !(await routeUtils.verifyPermission(res, userId, "deleteSetup"))
    ) {
      res.status(500);
      res.send("You are not the owner of this setup.");
      return;
    }

    await models.User.updateOne(
      { id: setup.creator.id },
      { $pull: { setups: setup._id } }
    ).exec();
    await models.Setup.updateOne(
      { id: setupId, creator: setup.creator._id },
      { $unset: { creator: "" } }
    ).exec();
    if (!isSetupOwner) {
      // mod action was used
      routeUtils.createModAction(userId, "Delete Setup", [setupId]);
    }

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error deleting setup");
  }
});

router.post("/create", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);

    var user = await models.User.findOne({ id: userId, deleted: false }).select(
      "setups"
    );
    user = user.toJSON();

    if (user.setups.length >= constants.maxOwnedSetups) {
      res.status(500);
      res.send(
        "You can only have up to 100 created setups linked to your account."
      );
      return;
    }

    if (req.body.editing) {
      var setup = await models.Setup.findOne({ id: String(req.body.id) })
        .select("creator ranked")
        .populate("creator", "id");

      if (!setup || setup.creator.id != userId) {
        res.status(500);
        res.send("You can only edit setups you have created.");
        return;
      }

      if (setup.ranked) {
        res.status(500);
        res.send("You cannot edit ranked setups.");
      }
    }

    var setup = Object(req.body);
    setup.gameType = String(setup.gameType);
    setup.name = String(setup.name || "");
    setup.roles = Object(setup.roles);
    setup.count = Object(setup.count);
    setup.closed = Boolean(setup.closed);
    setup.unique = setup.closed ? Boolean(setup.unique) : false;
    setup.uniqueWithoutModifier = setup.unique
      ? Boolean(setup.uniqueWithoutModifier)
      : false;
    setup.useRoleGroups = setup.closed ? Boolean(setup.useRoleGroups) : false;
    setup.roleGroupSizes = setup.useRoleGroups
      ? setup.roleGroupSizes
      : Array(setup.roles.length).fill(1);
    setup.startState = String(
      setup.startState || constants.startStates[setup.gameType][0]
    );
    setup.whispers = Boolean(setup.whispers);
    setup.leakPercentage = Number(setup.leakPercentage);
    setup.dawn = Boolean(setup.dawn);
    setup.mustAct = Boolean(setup.mustAct);
    setup.mustCondemn = Boolean(setup.mustCondemn);
    setup.gameStartPrompt = String(setup.gameStartPrompt || "");
    setup.banished = Number(setup.banished || 0);
    setup.talkingDead = Boolean(setup.talkingDead);
    setup.votingDead = Boolean(setup.votingDead);
    setup.majorityVoting = Boolean(setup.majorityVoting);
    setup.hiddenConverts = Boolean(setup.hiddenConverts);
    setup.RoleShare = Boolean(setup.RoleShare);
    setup.AlignmentShare = Boolean(setup.AlignmentShare);
    setup.PrivateShare = Boolean(setup.PrivateShare);
    setup.PublicShare = Boolean(setup.PublicShare);
    setup.EventsPerNight = Number(setup.EventsPerNight || 0);
    setup.noDeathLimit = Number(setup.noDeathLimit || 6);
    setup.ForceMustAct = Boolean(setup.ForceMustAct);
    setup.GameEndEvent = String(setup.GameEndEvent || "Meteor");

    if (
      !routeUtils.validProp(setup.gameType) ||
      constants.gameTypes.indexOf(setup.gameType) == -1
    ) {
      res.status(500);
      res.send("Invalid game type.");
      return;
    }

    if (!setup.name || !setup.name.length) {
      res.status(500);
      res.send("You must give your setup a name.");
      return;
    }

    if (setup.gameStartPrompt.length > 1000) {
      res.status(500);
      res.send("Game Start Prompt can't be longer than 1000 characters");
      return;
    }

    if (setup.roles.length != setup.roleGroupSizes.length) {
      // patch size array
      let intendedSize = setup.roles.length;
      let currentSize = setup.roleGroupSizes.length;
      if (currentSize < intendedSize) {
        setup.roleGroupSizes.length = intendedSize;
        setup.roleGroupSizes.fill(1, currentSize, intendedSize);
      } else if (currentSize > intendedSize) {
        setup.roleGroupSizes.length = intendedSize;
      }
    }

    var [result, newRoles, newCount, newTotal] = verifyRolesAndCount(setup);

    if (result != true) {
      if (result == "Invalid role data")
        logger.warn(
          `Bad role data: \n${userId}\n${JSON.stringify(setup.roles)}`
        );

      res.status(500);
      res.send(result);
      return;
    }

    if (setup.gameType == "Mafia" && newTotal < constants.minMafiaSetupTotal) {
      res.status(500);
      res.send(
        `Mafia setups must have at least ${constants.minMafiaSetupTotal} players.`
      );
      return;
    }

    setup.roles = newRoles;
    setup.count = newCount;
    setup.total = newTotal;

    var gameTypeOptions = optionsChecks[setup.gameType](setup);

    if (typeof gameTypeOptions == "string") {
      res.status(500);
      res.send(gameTypeOptions);
      return;
    }

    setup = {
      ...setup,
      ...gameTypeOptions,
    };

    //Check whisper leak rate
    if (setup.whispers) {
      if (setup.leakPercentage < 0 || setup.leakPercentage > 100) {
        res.status(500);
        res.send("Leak percentage must be between 0% and 100%.");
        return;
      }
    }

    //Check starting state
    if (constants.startStates[setup.gameType].indexOf(setup.startState) == -1) {
      res.status(500);
      res.send("Invalid starting state.");
      return;
    }

    //Verify unique hash and save
    var obj = {
      ...setup,
      roles: JSON.stringify(setup.roles),
      count: JSON.stringify(setup.count),
    };

    const hash = oHash(obj);
    const existingSetup = await models.Setup.findOne({ hash });

    if (
      existingSetup &&
      (!req.body.editing || existingSetup.id != req.body.id)
    ) {
      res.status(500);
      res.send(`Setup already exists: "${existingSetup.name}".`);
      return;
    }

    if (!(await routeUtils.rateLimit(userId, "createSetup", res))) return;

    obj = {
      ...obj,
      hash: hash,
      count: setup.count,
    };

    var setupId = null;
    if (req.body.editing) {
      await models.Setup.updateOne({ id: setup.id }, { $set: obj }).exec();
      await models.Setup.updateOne(
        { id: setup.id },
        { $inc: { version: 1 } }
      ).exec();
      res.send(req.body.id);
      setupId = setup.id;
    } else {
      obj.id = shortid.generate();
      obj.creator = req.session.user._id;

      setup = new models.Setup(obj);
      await setup.save();
      await models.User.updateOne(
        { id: userId },
        { $push: { setups: setup._id } }
      ).exec();
      res.send(setup.id);
      setupId = obj.id;
    }

    const setupAfterChanges = await models.Setup.findOne({
      id: setupId,
    }).select("_id id version");

    if (setupAfterChanges) {
      const oldSetupVersion = await models.SetupVersion.findOne({
        setup: new ObjectID(setupAfterChanges._id),
        version: setupAfterChanges.version - 1,
      }).select("_id manifest");

      var oldSetupManifest = "";
      if (oldSetupVersion) {
        oldSetupManifest = oldSetupVersion.manifest;
      }

      const setupManifest = generateMafiaSetupManifest(setup, newRoles);

      setupVersion = new models.SetupVersion({
        version: setupAfterChanges.version,
        setup: new ObjectID(setupAfterChanges._id),
        manifest: setupManifest,
        changelog: JSON.stringify(
          Diff.diffLines(oldSetupManifest, setupManifest)
        ),
      });
      await setupVersion.save();
    } else {
      logger.warn(
        `failed to find setup for ID: ${setupId}. A setup version will not be created as a result.`
      );
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to make setup.");
  }
});

function verifyRolesAndCount(setup) {
  const gameType = setup.gameType;
  const alignments = constants.alignments[gameType];
  const closed = setup.closed;
  const unique = setup.unique;
  const uniqueWithoutModifier = setup.uniqueWithoutModifier;
  const useRoleGroups = setup.useRoleGroups;
  const roleGroupSizes = setup.roleGroupSizes;
  var roles = setup.roles;
  var count = setup.count;
  var total = 0;

  if (!roles || !count) return ["Invalid role data"];

  if (closed && !useRoleGroups) {
    /*
     * Closed role setup
     */

    if (!Array.isArray(roles)) return ["Invalid role data"];

    roles = roles.slice(0, 1);

    //Check that all roles are valid roles
    for (let role in roles[0])
      if (!verifyRole(role, gameType)) {
        return [`Attempted to add invalid role: ${role}`];
      }

    var newCount = {};
    var rolesByAlignment = {};

    for (let alignment of alignments) {
      if (alignment == "Event") continue;
      newCount[alignment] = Math.abs(Math.floor(Number(count[alignment]) || 0));
      total += newCount[alignment];
      rolesByAlignment[alignment] = [];

      if (isNaN(newCount[alignment])) return ["Invalid role data"];

      for (let role in roles[0]) {
        let roleName = role.split(":")[0];

        if (roleData[gameType][roleName].alignment == alignment)
          rolesByAlignment[alignment].push(roleName);
      }
    }

    count = newCount;

    //Check the alignment counts
    var countCheck = countChecks[gameType](
      rolesByAlignment,
      count,
      total,
      closed,
      unique,
      uniqueWithoutModifier
    );

    if (countCheck != true) return [countCheck];

    //Sort the roles by alignment
    let tempRoleset = {};

    Object.keys(roles[0])
      .sort(sortRoles(gameType))
      .forEach((role) => {
        tempRoleset[role] = roles[0][role];
        delete roles[0][role];
        roles[0][role] = tempRoleset[role];
      });
  } else if (closed && useRoleGroups) {
    count = null;

    if (!Array.isArray(roles)) return ["Invalid role data"];

    if (roles.length == 0) return ["You must specify some roles"];

    //Check each roleset
    for (let i in roles) {
      let roleset = roles[i];
      let eventCount = 0;
      //roleset = Object.keys(roleset).filter((role) => roleData[gameType][role.split(":")[0]].alignment != "Event");
      for (let role in roles[i]) {
        let roleName = role.split(":")[0];
        let modifiers = role.split(":")[1];
        if (roleData[gameType][roleName].alignment == "Event" || (modifiers && modifiers.toLowerCase().includes("banished"))) eventCount++;
      }

      let roleSetSize = Object.keys(roleset).length - eventCount;
      let requiredRoleSetSize = roleGroupSizes[i];
      if (roleSetSize < 1) return ["Add at least one role in each role group"];

      if (
        unique &&
        !uniqueWithoutModifier &&
        roleSetSize < requiredRoleSetSize
      ) {
        return [
          `Roleset ${i} has insufficient roles for the uniqueness condition.`,
        ];
      }

      let uniqueRolesCount = {};
      //Check that all roles are valid roles
      for (let role in roleset) {
        if (!verifyRole(role, gameType)) {
          return [`Attempted to add invalid role: ${role}`];
        }

        if (unique && uniqueWithoutModifier) {
          let roleName = role.split(":")[0];
          uniqueRolesCount[roleName] = true;
        }
      }

      if (
        unique &&
        uniqueWithoutModifier &&
        Object.keys(uniqueRolesCount).length - eventCount < roleGroupSizes[i]
      ) {
        return [
          `Roleset ${i} has insufficient roles for the uniqueness without modifier condition.`,
        ];
      }

      // TODO each roleset can only have one alignment?
    }

    let totalSize = roleGroupSizes.reduce((a, b) => a + b);

    // sort roles
    for (let i in roles) {
      let tempRoleset = {};
      Object.keys(roles[i])
        .sort(sortRoles(gameType))
        .forEach((role) => {
          tempRoleset[role] = roles[i][role];
          delete roles[i][role];
          roles[i][role] = tempRoleset[role];
        });
    }
    return [true, roles, {}, totalSize];
  } else {
    /*
     * Open role setup
     */

    count = null;

    if (!Array.isArray(roles)) return ["Invalid role data"];

    if (roles.length == 0) return ["You must specify some roles"];

    //Check each roleset
    for (let i in roles) {
      let roleset = roles[i];
      let eventCount = 0;
      //roleset = Object.keys(roleset).filter((role) => roleData[gameType][role.split(":")[0]].alignment != "Event");
      for (let role in roles[i]) {
        let roleName = role.split(":")[0];
        let modifiers = role.split(":")[1];
        if (roleData[gameType][roleName].alignment == "Event" || (modifiers && modifiers.toLowerCase().includes("banished"))) eventCount++;
      }
      //Check that all roles are valid roles
      for (let role in roleset)
        if (!verifyRole(role, gameType)) {
          return [`Attempted to add invalid role: ${role}`];
        }
      //Count up role alignments
      let tempCount = {};
      let tempTotal = 0;

      for (let alignment of alignments) tempCount[alignment] = 0;

      for (let role in roleset) {
        let roleName = role.split(":")[0];
        let modifiers = role.split(":")[1];
        if (roleData[gameType][roleName].alignment == "Event") continue;
        if (modifiers && modifiers.toLowerCase().includes("banished")) continue;
        roleset[role] = Math.abs(Math.floor(Number(roleset[role]) || 0));
        tempCount[roleData[gameType][roleName].alignment] += roleset[role];
        tempTotal += roleset[role];
      }

      //Verify that all player totals are the same
      if (i == 0) total = tempTotal;
      else if (tempTotal != total)
        return ["All rolesets must have the same number of roles"];

      //Check the alignment counts
      let countCheck = countChecks[gameType](roleset, tempCount, total);

      if (countCheck != true) return [countCheck];

      //Sort the roles by alignment
      let tempRoleset = {};

      Object.keys(roleset)
        .sort(sortRoles(gameType))
        .forEach((role) => {
          tempRoleset[role] = roleset[role];
          delete roleset[role];
          roleset[role] = tempRoleset[role];
        });
    }
  }

  return [true, roles, count, total];
}

function areModifiersCompatible(gameType, modifiers) {
  const mappedModifiers = modifiers
    .split("/")
    .map((modifier) =>
      Object.entries(modifierData[gameType]).find(
        (mData) => mData[0] === modifier
      )
    );
  const incompatibles = mappedModifiers.map((e) => e[1].incompatible).flat();
  const usedModifiers = [];
  for (const modifier of mappedModifiers) {
    if (
      incompatibles.includes(modifier[0]) ||
      (usedModifiers.includes(modifier[0]) && !modifier[1].allowDuplicate)
    ) {
      return false;
    }
    usedModifiers.push(modifier[0]);
  }
  return true;
}

function verifyRole(role, gameType, alignment) {
  var roleName = role.split(":")[0];
  var modifiers = role.split(":")[1];

  if (!roleData.hasOwnProperty(gameType)) return false;

  if (!roleData[gameType].hasOwnProperty(roleName)) return false;

  if (modifiers) {
    for (const modifier of modifiers.split("/")) {
      if (!constants.modifiers[gameType][modifier]) return false;
    }
    if (!areModifiersCompatible(gameType, modifiers)) {
      return false;
    }
  }

  if (roleData[gameType][roleName].disabled) return false;

  if (alignment && roleData[gameType][roleName].alignment != alignment)
    return false;

  return true;
}

function sortRoles(gameType) {
  const alignments = constants.alignments[gameType];

  return (roleA, roleB) => {
    var roleAName = roleA.split(":")[0];
    var roleBName = roleB.split(":")[0];
    var alignA = roleData[gameType][roleAName].alignment;
    var alignB = roleData[gameType][roleBName].alignment;

    if (alignA != alignB)
      //Sort roles by alignment
      return alignments.indexOf(alignA) - alignments.indexOf(alignB);
    //Sort roles of same alignment by alphabetical order
    else return roleA < roleB ? -1 : 1;
  };
}

function hasOpenRole(roles, roleName) {
  roles = Object.keys(roles);
  roleName = utils.strParseAlphaNum(roleName);
  var regex = new RegExp(`${roleName}:`);

  for (let role of roles) if (role.match(regex)) return true;

  return false;
}

const countChecks = {
  Mafia: (roles, count, total, closed, unique, uniqueWithoutModifier) => {
    if (total < 3 || total > constants.maxPlayers)
      return "Must have between 3 and 50 players.";

    if (count["Mafia"] == 0 && count["Cult"] == 0 && count["Independent"] == 0)
      return "Must have at least 1 Mafia, Cult, or Hostile Independent role.";

    if (
      count["Mafia"] >= total - count["Mafia"] ||
      count["Cult"] >= total - count["Cult"]
    )
      return "Cult or Mafia must not make up the majority.";

    if (!closed) return true;

    if (unique && uniqueWithoutModifier) {
      // make count unique
      let uniqueRoles = {};
      for (alignment in roles) {
        uniqueRoles[alignment] = roles[alignment].filter(
          (val, index, arr) => arr.indexOf(val) === index
        );
      }
      roles = uniqueRoles;
    }

    if (
      unique &&
      (count["Village"] > roles["Village"].length ||
        count["Mafia"] > roles["Mafia"].length ||
        count["Cult"] > roles["Cult"].length ||
        count["Independent"] > roles["Independent"].length)
    ) {
      return "Not enough roles chosen for unique selections with given alignment counts.";
    }

    if (
      !unique &&
      ((count["Village"] > 0 && roles["Village"].length == 0) ||
        (count["Mafia"] > 0 && roles["Mafia"].length == 0) ||
        (count["Cult"] > 0 && roles["Cult"].length == 0) ||
        (count["Independent"] > 0 && roles["Independent"].length == 0))
    ) {
      return "No roles chosen for some nonzero alignments.";
    }

    return true;
  },
  Resistance: (roles, count, total, closed, unique) => {
    if (count["Resistance"] < 1 || count["Spies"] < 1)
      return "Must have at least one Resistance member and at leasty one Spies member.";

    return true;
  },
  Ghost: (roles, count, total, closed, unique) => {
    if (count["Town"] < 1 || count["Ghost"] < 1)
      return "Must have at least one Town member and at leasty one Ghost member.";

    if (count["Ghost"] >= count["Town"])
      return "Ghosts must not make up the majority.";
    return true;
  },
  Battlesnakes: (roles, count, total, closed, unique) => {
    if (total < 2 || total > 10)
      return "Only 2 to 10 players for now. Will support more players soon.";
    return true;
  },
  Jotto: (roles, count, total, closed, unique) => {
    if (total < 2 || total > 4)
      return "Only 2 to 4 players for now. Will support more players soon.";
    return true;
  },
  Acrotopia: (roles, count, total, closed, unique) => {
    if (total < 3) return "Must have at least 3 players.";

    const acrotopiaMaxPlayers = 20;
    if (total > acrotopiaMaxPlayers)
      return `Must have at most ${acrotopiaMaxPlayers} players.`;

    return true;
  },
  "Secret Dictator": (roles, count, total, closed, unique) => {
    if (total < 5 || total > 10) return "Only for 5 to 10 players.";

    if (roles["Dictator:"] != 1)
      return "You must add one Dictator, and only one Dictator.";

    let expectedFascistCount = Math.floor((total + 1) / 2) - 2;
    if (roles["Fascist:"] != expectedFascistCount)
      return `A setup of ${total} players should have ${expectedFascistCount} fascists.`;

    return true;
  },
  "Wacky Words": (roles, count, total, closed, unique) => {
    if (total < 3) return "Must have at least 3 players.";

    const wackyWordsMaxPlayers = 20;
    if (total > wackyWordsMaxPlayers)
      return `Must have at most ${wackyWordsMaxPlayers} players.`;

    return true;
  },
  "Liars Dice": (roles, count, total, closed, unique) => {
    if (total < 2 || total > 50) return "Must have between 2 and 50 players.";
    return true;
  },
  "Card Games": (roles, count, total, closed, unique) => {
    if (total < 2 || total > 20) return "Must have between 2 and 20 players.";
    return true;
  },
};

const optionsChecks = {
  Mafia: (setup) => {
    var lastWill = Boolean(setup.lastWill);
    var noReveal = Boolean(setup.noReveal);
    var votesInvisible = Boolean(setup.votesInvisible);

    return { lastWill, noReveal, votesInvisible };
  },
  Resistance: (setup) => {
    var firstTeamSize = Number(setup.firstTeamSize);
    var lastTeamSize = Number(setup.lastTeamSize);
    var numMissions = Number(setup.numMissions);
    var teamFailLimit = Number(setup.teamFailLimit);

    if (firstTeamSize < 2 || firstTeamSize > setup.total - 1)
      return "First team size must be between 2 and the number of players minus 1.";

    if (lastTeamSize < firstTeamSize)
      return "Last team size cannot be smaller than the first team size.";

    if (lastTeamSize > setup.total - 1)
      return "Last team size must be at most 1 less than the number of players.";

    if (numMissions < 2 || numMissions > 10)
      return "Number of missions must be between 2 and 10.";

    if (teamFailLimit < 1 || teamFailLimit > setup.total)
      return "Team fail limit must be between 1 and the number of players.";

    return { firstTeamSize, lastTeamSize, numMissions, teamFailLimit };
  },
  Ghost: (setup) => {
    return setup;
  },
  Battlesnakes: (setup) => {
    return setup;
  },
  Jotto: (setup) => {
    return setup;
  },
  Acrotopia: (setup) => {
    return setup;
  },
  "Secret Dictator": (setup) => {
    return setup;
  },
  "Wacky Words": (setup) => {
    return setup;
  },
  "Liars Dice": (setup) => {
    return setup;
  },
  "Card Games": (setup) => {
    return setup;
  },
};

module.exports = router;
