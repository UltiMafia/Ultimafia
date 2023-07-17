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

router.get("/id", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var setup = await models.Setup.findOne({
      id: String(req.query.query),
    }).select("id gameType name roles closed count useRoleGroups total -_id");
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
      search.name = { $regex: String(req.query.query), $options: "i" };
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
          "id gameType name roles closed useRoleGroups count total featured -_id"
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

router.get("/:id", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var setup = await models.Setup.findOne({ id: req.params.id })
      .select("-_id -__v -hash")
      .populate("creator", "id name avatar tag -_id");

    if (setup) {
      setup = setup.toJSON();
      res.send(setup);
    } else {
      res.status(500);
      res.send("Unable to find setup.");
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Unable to find setup.");
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
        .select("creator")
        .populate("creator", "id");

      if (!setup || setup.creator.id != userId) {
        res.status(500);
        res.send("You can only edit setups you have created.");
        return;
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

    if (req.body.editing) {
      await models.Setup.updateOne({ id: setup.id }, { $set: obj }).exec();
      res.send(req.body.id);
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
      if (!verifyRole(role, gameType)) return ["Invalid role data"];

    var newCount = {};
    var rolesByAlignment = {};

    for (let alignment of alignments) {
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

      let roleSetSize = Object.keys(roleset).length;
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
        if (!verifyRole(role, gameType)) return ["Invalid role data"];

        if (unique && uniqueWithoutModifier) {
          let roleName = role.split(":")[0];
          uniqueRolesCount[roleName] = true;
        }
      }

      if (
        unique &&
        uniqueWithoutModifier &&
        Object.keys(uniqueRolesCount).length < roleGroupSizes[i]
      ) {
        return [
          `Roleset ${i} has insufficient roles for the uniqueness without modifier condition.`,
        ];
      }

      // TODO each roleset can only have one alignment?
    }

    let totalSize = roleGroupSizes.reduce((a, b) => a + b);
    
    let tempRoleset = {};

    Object.keys(roles[0])
      .sort(sortRoles(gameType))
      .forEach((role) => {
        tempRoleset[role] = roles[0][role];
        delete roles[0][role];
        roles[0][role] = tempRoleset[role];
      });
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

      //Check that all roles are valid roles
      for (let role in roleset)
        if (!verifyRole(role, gameType)) return ["Invalid role data"];

      //Count up role alignments
      let tempCount = {};
      let tempTotal = 0;

      for (let alignment of alignments) tempCount[alignment] = 0;

      for (let role in roleset) {
        let roleName = role.split(":")[0];
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

function verifyRole(role, gameType, alignment) {
  var roleName = role.split(":")[0];
  var modifier = role.split(":")[1];

  if (!roleData.hasOwnProperty(gameType)) return false;

  if (!roleData[gameType].hasOwnProperty(roleName)) return false;

  if (modifier && !constants.modifiers[gameType][modifier]) return false;

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
      return "Must have at least 1 Mafia, Cult, or Independent role.";

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
  "Split Decision": (roles, count, total, closed, unique) => {
    if (total < 4) return "Must have between 4 and 50 players.";

    // If modifiers are added to Split Decision then this needs to be changed
    if (!closed) {
      if (!hasOpenRole(roles, "President")) return "Must have a President";

      if (!hasOpenRole(roles, "Bomber")) return "Must have a Bomber";
    } else {
      if (roles["Blue"].indexOf("President") == -1)
        return "Must have a President";

      if (roles["Red"].indexOf("Bomber") == -1) return "Must have a Bomber";
    }

    return true;
  },
  Resistance: (roles, count, total, closed, unique) => {
    if (count["Resistance"] < 1 || count["Spies"] < 1)
      return "Must have at least one Resistance member and at leasty one Spies member.";

    return true;
  },
  "One Night": (roles, count, total, closed, unique) => {
    if (count["Village"] < 1 || count["Werewolves"] < 1)
      return "Must have at least one Village member and at leasty one Werewolf member.";

    return true;
  },
  Ghost: (roles, count, total, closed, unique) => {
    if (count["Town"] < 1 || count["Ghost"] < 1)
      return "Must have at least one Town member and at leasty one Ghost member.";

    if (count["Ghost"] >= count["Town"])
      return "Ghosts must not make up the majority.";
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
  "Secret Hitler": (roles, count, total, closed, unique) => {
    if (total < 5 || total > 10) return "Only for 5 to 10 players.";

    if (roles["Hitler:"] != 1)
      return "You must add one Hitler, and only one Hitler.";

    let expectedFascistCount = Math.floor((total + 1) / 2) - 2;
    if (roles["Fascist:"] != expectedFascistCount)
      return `A setup of ${total} players should have ${expectedFascistCount} fascists.`;

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
  "Split Decision": (setup) => {
    var swapAmt = Number(setup.swapAmt);
    var roundAmt = Number(setup.roundAmt) || 3;

    if (swapAmt < 1 || swapAmt > setup.total / 2 - 1)
      return "Swap amount must be between 1 and one less than the number of players in a room.";

    if (roundAmt < 2 || roundAmt > 10)
      return "Games must have between 2 and 10 rounds.";

    return { swapAmt, roundAmt };
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
  "One Night": (setup) => {
    var votesInvisible = Boolean(setup.votesInvisible);
    var excessRoles = Number(setup.excessRoles);
    var newTotal = setup.total - excessRoles;

    if (excessRoles < 2 || excessRoles > 5)
      return "Excess roles must be between 2 and 5.";

    if (newTotal < 3)
      return "Total roles minus excess roles must be at least 3.";

    return { votesInvisible, excessRoles, total: newTotal };
  },
  Ghost: (setup) => {
    return setup;
  },
  Jotto: (setup) => {
    return setup;
  },
  Acrotopia: (setup) => {
    return setup;
  },
  "Secret Hitler": (setup) => {
    return setup;
  },
};

module.exports = router;
