const express = require("express");
const shortid = require("shortid");
const constants = require("../data/constants");
const {
  violationDefinitions,
  violationMapById,
  getViolationsForBanType,
} = require("../data/violations");
const DailyChallengeData = require("../data/DailyChallenge");
const roleData = require("../data/roles");
const Random = require("../lib/Random");
const fbAdmin = require("firebase-admin");
const crypto = require("crypto");
const models = require("../db/models");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const gameLoadBalancer = require("../modules/gameLoadBalancer");
const logger = require("../modules/logging")(".");
const router = express.Router();

function getValidatedViolation(res, banType, violationId) {
  const violation = violationMapById[violationId];

  if (!violation) {
    res.status(400);
    res.send("Invalid violation type.");
    return null;
  }

  if (!violation.appliesTo.includes(banType)) {
    res.status(400);
    res.send("Violation type is not applicable for this action.");
    return null;
  }

  return violation;
}

function sanitizeViolationNotes(notes) {
  if (notes == null) return "";
  return String(notes).trim().slice(0, 500);
}

router.get("/groups", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var visibleGroups = await models.Group.find({ visible: true }).select(
      "name rank badge badgeColor"
    );
    visibleGroups = visibleGroups.map((group) => group.toJSON());

    for (let group of visibleGroups) {
      group.members = await models.InGroup.find({ group: group._id })
        .select("user")
        .populate("user", "id name avatar -_id");
      group.members = group.members
        .map((member) => member.toJSON().user)
        .filter((member) => member !== null);

      for (let member of group.members)
        member.status = await redis.getUserStatus(member.id);

      if (group.rank == null) group.rank == Infinity;

      delete group._id;
    }

    res.send(visibleGroups);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading groups.");
  }
});

router.get("/groupPerms", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var perm = "viewPerms";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var name = routeUtils.capitalizeWords(String(req.query.name));
    var group = await models.Group.findOne({ name: name }).select(
      "permissions"
    );

    if (!group) {
      res.status(500);
      res.send("Group does not exist.");
      return;
    }

    res.send(group.permissions);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error getting permissions.");
  }
});

router.get("/userPerms", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var perm = "viewPerms";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var userIdToGet = String(req.query.userId);
    var permInfo = await redis.getUserPermissions(userIdToGet);

    if (permInfo.noUser) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    res.send(Object.keys(permInfo.perms));
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error getting permissions.");
  }
});

router.post("/group", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var name = routeUtils.capitalizeWords(String(req.body.name));
    var rank = Number(req.body.rank);
    var badge = String(req.body.badge || "");
    var badgeColor = String(req.body.badgeColor || "");
    var perm = "createGroup";

    if (!(await routeUtils.verifyPermission(res, userId, perm, rank + 1)))
      return;

    var permissions = req.body.permissions || [];

    if (!name.match(/^([a-zA-Z]+)( [a-zA-Z]+)*$/)) {
      res.status(500);
      res.send("Group names can only contain letters and spaces.");
      return;
    }

    if (!Array.isArray(permissions)) {
      res.status(500);
      res.send("Bad permission format");
      return;
    }

    permissions = permissions.map((perm) => String(perm));

    for (let perm of permissions) {
      if (!constants.allPerms[perm]) {
        res.status(500);
        res.send(`"${perm}" is not a valid permission.`);
        return;
      }
    }

    var existingGroup = await models.Group.findOne({ name: name }).select(
      "_id"
    );

    if (existingGroup) {
      res.status(500);
      res.send("A group with this name already exists.");
      return;
    }

    var group = new models.Group({
      id: shortid.generate(),
      name,
      rank,
      badge,
      badgeColor,
      permissions,
    });
    await group.save();

    routeUtils.createModAction(userId, "Create Group", [
      name,
      String(rank),
      permissions.join(","),
    ]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error creating group.");
  }
});

router.post("/group/delete", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var name = routeUtils.capitalizeWords(String(req.body.name));
    var perm = "deleteGroup";

    var group = await models.Group.findOne({ name: name }).select("id rank");

    if (!group) {
      res.status(500);
      res.send("Group not found.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, group.rank + 1)))
      return;

    var members = await models.InGroup.find({ group: group._id })
      .select("user")
      .populate("user", "id");
    members = members.map((m) => m.user.id);

    await models.Group.deleteOne({ id: group.id }).exec();
    await models.InGroup.deleteMany({ group: group._id }).exec();

    for (let member of members) await redis.cacheUserPermissions(member);

    routeUtils.createModAction(userId, "Delete Group", [name]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error deleting group.");
  }
});

router.post("/groupPerms", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var groupName = routeUtils.capitalizeWords(String(req.body.groupName));
    var perm = "updateGroupPerms";

    var group = await models.Group.findOne({ name: groupName }).select("rank");

    if (!group) {
      res.status(500);
      res.send("Group does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, group.rank + 1)))
      return;

    var addPermissions = req.body.addPermissions || [];
    var removePermissions = req.body.removePermissions || [];

    if (!Array.isArray(addPermissions) || !Array.isArray(removePermissions)) {
      res.status(500);
      res.send("Bad permission format");
      return;
    }

    addPermissions = addPermissions
      .map((perm) => String(perm))
      .filter((p) => p.length > 0);
    removePermissions = removePermissions
      .map((perm) => String(perm))
      .filter((p) => p.length > 0);

    var userPermissionInfo = await redis.getUserPermissions(userId);
    var userPermissions = userPermissionInfo.perms;
    var userRank = userPermissionInfo.rank;

    for (let perm of addPermissions.concat(removePermissions)) {
      if (
        userRank < Infinity &&
        (!userPermissions[perm] || constants.protectedPerms.indexOf(perm) != -1)
      ) {
        res.status(500);
        res.send(`You cannot grant the ${perm} permission.`);
        return;
      }

      if (!constants.allPerms[perm]) {
        res.status(500);
        res.send(`"${perm}" is not a valid permission.`);
        return;
      }
    }

    await models.Group.updateOne(
      { name: groupName },
      {
        $push: {
          permissions: {
            $each: addPermissions,
          },
        },
      }
    ).exec();

    await models.Group.updateOne(
      { name: groupName },
      {
        $pull: {
          permissions: {
            $in: removePermissions,
          },
        },
      }
    ).exec();
    await redis.cacheUserPermissions(userId);

    routeUtils.createModAction(userId, "Update Group Permissions", [
      groupName,
      addPermissions.join(","),
      removePermissions.join(","),
    ]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error updating group permissions.");
  }
});

router.post("/addToGroup", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var groupName = routeUtils.capitalizeWords(String(req.body.groupName));
    var userIdToAdd = String(req.body.userId);
    var perm = "giveGroup";

    var group = await models.Group.findOne({ name: groupName }).select("rank");

    if (!group) {
      res.status(500);
      res.send("Group does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, group.rank + 1)))
      return;

    var userToAdd = await models.User.findOne({
      id: userIdToAdd,
      deleted: false,
    }).select("_id");

    if (!userToAdd) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    var inGroup = await models.InGroup.findOne({
      user: userToAdd._id,
      group: group._id,
    });

    if (inGroup) {
      res.status(500);
      res.send("User is already in this group.");
      return;
    }

    inGroup = new models.InGroup({
      user: userToAdd._id,
      group: group._id,
    });
    await inGroup.save();
    await redis.cacheUserInfo(userIdToAdd, true);
    await redis.cacheUserPermissions(userIdToAdd);

    routeUtils.createModAction(userId, "Add User to Group", [
      userIdToAdd,
      groupName,
    ]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error adding user to group.");
  }
});

router.post("/removeFromGroup", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var groupName = routeUtils.capitalizeWords(String(req.body.groupName));
    var userIdToRemove = String(req.body.userId);
    var perm = "removeFromGroup";

    var group = await models.Group.findOne({ name: groupName }).select("rank");

    if (!group) {
      res.status(500);
      res.send("Group does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, group.rank + 1)))
      return;

    var userToRemove = await models.User.findOne({
      id: userIdToRemove,
      deleted: false,
    }).select("_id");

    if (!userToRemove) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    await models.InGroup.deleteOne({
      user: userToRemove._id,
      group: group._id,
    }).exec();
    await redis.cacheUserInfo(userIdToRemove, true);
    await redis.cacheUserPermissions(userIdToRemove);

    routeUtils.createModAction(userId, "Remove User from Group", [
      userIdToRemove,
      groupName,
    ]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error adding user to group.");
  }
});

router.post("/forumBan", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToBan = String(req.body.userId);
    var lengthStr = String(req.body.length);
    var perm = "forumBan";
    var banRank = await redis.getUserRank(userIdToBan);

    if (banRank == null) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, banRank + 1)))
      return;

    var length = routeUtils.parseTime(lengthStr);

    if (length == null) {
      res.status(500);
      res.send(
        "Invalid time string. Must have the format 'length unit', e.g. '1 hour'."
      );
      return;
    }

    if (length < 1000 * 60 * 60) {
      res.status(500);
      res.send("Minimum ban time is 1 hour.");
      return;
    }

    await routeUtils.banUser(
      userIdToBan,
      length,
      ["vote", "createThread", "postReply", "deleteOwnPost", "editPost"],
      "forum",
      userId
    );

    await routeUtils.createNotification(
      {
        content: `You have been banned from the forums for ${routeUtils.timeDisplay(
          length
        )}.`,
        icon: "ban",
      },
      [userIdToBan]
    );

    routeUtils.createModAction(userId, "Forum Ban", [userIdToBan, lengthStr]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error forum banning user.");
  }
});

router.post("/chatBan", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToBan = String(req.body.userId);
    var lengthStr = String(req.body.length);
    var perm = "chatBan";
    var banRank = await redis.getUserRank(userIdToBan);

    if (banRank == null) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, banRank + 1)))
      return;

    var length = routeUtils.parseTime(lengthStr);

    if (length == null) {
      res.status(500);
      res.send(
        "Invalid time string. Must have the format 'length unit', e.g. '1 hour'."
      );
      return;
    }

    if (length < 1000 * 60 * 60) {
      res.status(500);
      res.send("Minimum ban time is 1 hour.");
      return;
    }

    await routeUtils.banUser(
      userIdToBan,
      length,
      ["publicChat", "privateChat"],
      "chat",
      userId
    );

    await routeUtils.createNotification(
      {
        content: `You have been banned from chat for ${routeUtils.timeDisplay(
          length
        )}.`,
        icon: "ban",
      },
      [userIdToBan]
    );

    routeUtils.createModAction(userId, "Chat Ban", [userIdToBan, lengthStr]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error chat banning user.");
  }
});

router.post("/gameBan", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToBan = String(req.body.userId);
    var lengthStr = String(req.body.length);
    var violationType = String(req.body.violationType || "");
    var violationNotes = sanitizeViolationNotes(req.body.violationNotes);
    var perm = "gameBan";
    var banRank = await redis.getUserRank(userIdToBan);

    if (banRank == null) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, banRank + 1)))
      return;

    var length = routeUtils.parseTime(lengthStr);

    if (!violationType) {
      res.status(400);
      res.send("Violation type is required.");
      return;
    }

    const violation = getValidatedViolation(res, "game", violationType);
    if (!violation) return;

    if (length == null) {
      res.status(500);
      res.send(
        "Invalid time string. Must have the format 'length unit', e.g. '1 hour'."
      );
      return;
    }

    if (length < 1000 * 60 * 60) {
      res.status(500);
      res.send("Minimum ban time is 1 hour.");
      return;
    }

    const ban = await routeUtils.banUser(
      userIdToBan,
      length,
      ["playGame"],
      "game",
      userId
    );

    await routeUtils.createViolationTicket({
      userId: userIdToBan,
      modId: userId,
      banType: "game",
      violationId: violation.id,
      violationName: violation.name,
      violationCategory: violation.category,
      notes: violationNotes,
      length,
      expiresAt: ban.expires,
      linkedBanId: ban.id,
    });

    await routeUtils.createNotification(
      {
        content: `You have been banned from games for ${routeUtils.timeDisplay(
          length
        )}.`,
        icon: "ban",
      },
      [userIdToBan]
    );

    routeUtils.createModAction(userId, "Game Ban", [
      userIdToBan,
      lengthStr,
      violation.id,
    ]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error game banning user.");
  }
});

router.post("/rankedBan", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToBan = String(req.body.userId);
    var lengthStr = String(req.body.length);
    var perm = "rankedBan";
    var banRank = await redis.getUserRank(userIdToBan);

    if (banRank == null) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, banRank + 1)))
      return;

    length = routeUtils.parseTime(lengthStr);

    if (length == null) {
      res.status(500);
      res.send(
        "Invalid time string. Must have the format 'length unit', e.g. '1 hour'."
      );
      return;
    }

    if (length < 1000 * 60 * 60) {
      res.status(500);
      res.send("Minimum ban time is 1 hour.");
      return;
    }

    await routeUtils.banUser(
      userIdToBan,
      length,
      ["playRanked"],
      "playRanked",
      userId
    );

    await routeUtils.createNotification(
      {
        content: `You have been banned from playing ranked games for ${routeUtils.timeDisplay(
          length
        )}.`,
        icon: "ban",
      },
      [userIdToBan]
    );

    routeUtils.createModAction(userId, "Ranked Ban", [userIdToBan, lengthStr]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error ranked banning user.");
  }
});

router.post("/competitiveBan", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToBan = String(req.body.userId);
    var lengthStr = String(req.body.length);
    var perm = "competitiveBan";
    var banRank = await redis.getUserRank(userIdToBan);

    if (banRank == null) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, banRank + 1)))
      return;

    length = routeUtils.parseTime(lengthStr);

    if (length == null) {
      res.status(500);
      res.send(
        "Invalid time string. Must have the format 'length unit', e.g. '1 hour'."
      );
      return;
    }

    if (length < 1000 * 60 * 60) {
      res.status(500);
      res.send("Minimum ban time is 1 hour.");
      return;
    }

    await routeUtils.banUser(
      userIdToBan,
      length,
      ["playCompetitive"],
      "playCompetitive",
      userId
    );

    await routeUtils.createNotification(
      {
        content: `You have been banned from playing competitive games for ${routeUtils.timeDisplay(
          length
        )}.`,
        icon: "ban",
      },
      [userIdToBan]
    );

    routeUtils.createModAction(userId, "Competitive Ban", [
      userIdToBan,
      lengthStr,
    ]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error competitive banning user.");
  }
});

router.post("/siteBan", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToBan = String(req.body.userId);
    var lengthStr = String(req.body.length);
    var violationType = String(req.body.violationType || "");
    var violationNotes = sanitizeViolationNotes(req.body.violationNotes);
    var perm = "siteBan";
    var banRank = (await redis.getUserRank(userIdToBan)) || 0;

    if (!(await routeUtils.verifyPermission(res, userId, perm, banRank + 1)))
      return;

    if (!violationType) {
      res.status(400);
      res.send("Violation type is required.");
      return;
    }

    const violation = getValidatedViolation(res, "site", violationType);
    if (!violation) return;

    var length = routeUtils.parseTime(lengthStr);

    if (length == null) {
      res.status(500);
      res.send(
        "Invalid time string. Must have the format 'length unit', e.g. '1 hour'."
      );
      return;
    }

    if (length < 1000 * 60 * 60) {
      res.status(500);
      res.send("Minimum ban time is 1 hour.");
      return;
    }

    const ban = await routeUtils.banUser(
      userIdToBan,
      length,
      ["signIn"],
      "site",
      userId
    );

    await routeUtils.createViolationTicket({
      userId: userIdToBan,
      modId: userId,
      banType: "site",
      violationId: violation.id,
      violationName: violation.name,
      violationCategory: violation.category,
      notes: violationNotes,
      length,
      expiresAt: ban.expires,
      linkedBanId: ban.id,
    });

    await models.User.updateOne(
      { id: userIdToBan },
      { $set: { banned: true } }
    ).exec();
    await models.Session.deleteMany({ "session.user.id": userIdToBan }).exec();

    routeUtils.createModAction(userId, "Site Ban", [
      userIdToBan,
      lengthStr,
      violation.id,
    ]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error site banning user.");
  }
});

router.post("/logout", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToActOn = String(req.body.userId);
    var perm = "forceSignOut";
    var rank = await redis.getUserRank(userIdToActOn);

    if (rank == null) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, rank + 1)))
      return;

    await models.Session.deleteMany({
      "session.user.id": userIdToActOn,
    }).exec();

    routeUtils.createModAction(userId, "Force Sign Out", [userIdToActOn]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error signing user out.");
  }
});

router.post("/forumUnban", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToActOn = String(req.body.userId);
    var perm = "forumUnban";
    var rank = await redis.getUserRank(userIdToActOn);

    if (rank == null) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, rank + 1)))
      return;

    await models.Ban.deleteMany({
      userId: userIdToActOn,
      type: "forum",
      auto: false,
    }).exec();
    await redis.cacheUserPermissions(userIdToActOn);

    routeUtils.createModAction(userId, "Forum Unban", [userIdToActOn]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error forum unbanning user.");
  }
});

router.post("/chatUnban", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToActOn = String(req.body.userId);
    var perm = "chatUnban";
    var rank = await redis.getUserRank(userIdToActOn);

    if (rank == null) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, rank + 1)))
      return;

    await models.Ban.deleteMany({
      userId: userIdToActOn,
      type: "chat",
      auto: false,
    }).exec();
    await redis.cacheUserPermissions(userIdToActOn);

    routeUtils.createModAction(userId, "Chat Unban", [userIdToActOn]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error chat unbanning user.");
  }
});

router.post("/gameUnban", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToActOn = String(req.body.userId);
    var perm = "gameUnban";
    var rank = await redis.getUserRank(userIdToActOn);

    if (rank == null) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, rank + 1)))
      return;

    await models.Ban.deleteMany({
      userId: userIdToActOn,
      type: "game",
      auto: false,
    }).exec();
    await redis.cacheUserPermissions(userIdToActOn);

    routeUtils.createModAction(userId, "Game Unban", [userIdToActOn]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error game unbanning user.");
  }
});

router.post("/rankedUnban", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToActOn = String(req.body.userId);
    var perm = "rankedUnban";
    var rank = await redis.getUserRank(userIdToActOn);

    if (rank == null) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, rank + 1)))
      return;

    await models.Ban.deleteMany({
      userId: userIdToActOn,
      type: "playRanked",
      auto: false,
    }).exec();
    await redis.cacheUserPermissions(userIdToActOn);

    routeUtils.createModAction(userId, "Ranked Unban", [userIdToActOn]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error ranked unbanning user.");
  }
});

router.post("/competitiveUnban", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToActOn = String(req.body.userId);
    var perm = "competitiveUnban";
    var rank = await redis.getUserRank(userIdToActOn);

    if (rank == null) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, rank + 1)))
      return;

    await models.Ban.deleteMany({
      userId: userIdToActOn,
      type: "playCompetitive",
      auto: false,
    }).exec();
    await redis.cacheUserPermissions(userIdToActOn);

    routeUtils.createModAction(userId, "Competitive Unban", [userIdToActOn]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error competitive unbanning user.");
  }
});

router.post("/siteUnban", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToActOn = String(req.body.userId);
    var perm = "siteUnban";
    var rank = await redis.getUserRank(userIdToActOn);

    if (rank == null) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, rank + 1)))
      return;

    await models.Ban.deleteMany({
      userId: userIdToActOn,
      type: "site",
      auto: false,
    }).exec();
    await models.User.updateOne(
      { id: userIdToActOn },
      { $set: { banned: false } }
    ).exec();
    await redis.cacheUserPermissions(userIdToActOn);

    routeUtils.createModAction(userId, "Site Unban", [userIdToActOn]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error site unbanning user.");
  }
});

router.post("/whitelist", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToActOn = String(req.body.userId);
    var perm = "whitelist";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    await models.Ban.deleteMany({
      userId: userIdToActOn,
      type: "ipFlag",
    }).exec();
    await models.User.updateOne(
      { id: userIdToActOn },
      { $set: { flagged: false } }
    );
    await redis.cacheUserPermissions(userIdToActOn);

    routeUtils.createModAction(userId, "Whitelist", [userIdToActOn]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error whitelisting user.");
  }
});

router.post("/givePerms", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var perm = "givePermissions";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var userIdToActOn = String(req.body.userId || "").trim();
    var permissionsInput = req.body.permissions;

    if (!userIdToActOn) {
      res.status(400);
      res.send("User is required.");
      return;
    }

    if (
      permissionsInput == null ||
      (typeof permissionsInput === "string" &&
        permissionsInput.trim().length === 0)
    ) {
      res.status(400);
      res.send("At least one permission is required.");
      return;
    }

    var permissionsList = [];

    if (Array.isArray(permissionsInput)) {
      permissionsList = permissionsInput
        .map((value) => String(value || "").trim())
        .filter((value) => value.length > 0);
    } else if (typeof permissionsInput === "string") {
      permissionsList = permissionsInput
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    } else {
      res.status(400);
      res.send("Permissions must be a string or array.");
      return;
    }

    if (permissionsList.length === 0) {
      res.status(400);
      res.send("At least one permission is required.");
      return;
    }

    for (let permission of permissionsList) {
      if (!constants.allPerms[permission]) {
        res.status(400);
        res.send(`"${permission}" is not a valid permission.`);
        return;
      }
    }

    var userToActOn = await models.User.findOne({
      id: userIdToActOn,
      deleted: false,
    }).select("_id id");

    if (!userToActOn) {
      res.status(404);
      res.send("User does not exist.");
      return;
    }

    await models.User.updateOne(
      { _id: userToActOn._id },
      {
        $addToSet: {
          permissions: { $each: permissionsList },
        },
      }
    ).exec();

    await redis.cacheUserPermissions(userIdToActOn);
    await redis.cacheUserInfo(userIdToActOn, true);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error giving permissions.");
  }
});

router.post("/blacklist", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToActOn = String(req.body.userId);
    var perm = "whitelist";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    await routeUtils.banUser(
      userIdToActOn,
      0,
      [
        "vote",
        "createThread",
        "postReply",
        "publicChat",
        "privateChat",
        "playGame",
        "editBio",
        "editPronouns",
        "changeName",
      ],
      "ipFlag"
    );
    await routeUtils.createNotification(
      {
        content: `Your IP address has been flagged as suspicious. Please message an admin or moderator in the chat panel to gain full access to the site. A list of moderators can be found by clicking on this message.`,
        icon: "flag",
        link: "/community/moderation",
      },
      [userIdToActOn]
    );
    await redis.cacheUserInfo(userIdToActOn, true);
    await models.User.updateOne(
      { id: userIdToActOn },
      { $set: { flagged: true } }
    );
    await redis.cacheUserPermissions(userIdToActOn);

    routeUtils.createModAction(userId, "Blacklist", [userIdToActOn]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error blacklisting user.");
  }
});

router.get("/ips", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToActOn = String(req.query.userId);
    var perm = "viewIPs";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var user = await models.User.findOne({
      id: userIdToActOn /*, deleted: false*/,
    }).select("ip");

    if (!user) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }
    var response = user.toJSON();

    for (var i = 0; i < response.ip.length; i++) {
      response.ip[
        i
      ] = `<a target="_blank" rel="noopener noreferrer nofollow" href="https://www.ipqualityscore.com/free-ip-lookup-proxy-vpn-test/lookup/${response.ip[i]}">${response.ip[i]}</a>`;
    }

    res.send(response.ip);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading IPs.");
  }
});

router.get("/alts", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToActOn = String(req.query.userId);
    var perm = "viewAlts";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var user = await models.User.findOne({
      id: userIdToActOn /*, deleted: false*/,
    }).select("ip");

    if (!user) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    var ips = user.ip;
    var users = await models.User.find({
      ip: { $elemMatch: { $in: ips } },
    }).select("id name -_id");

    // routeUtils.createModAction(userId, "Get Alt Accounts", [userIdToActOn]);
    res.send(users);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading alt accounts.");
  }
});

router.get("/bans", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToActOn = String(req.query.userId);
    var perm = "viewBans";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var user = await models.User.findOne({
      id: userIdToActOn,
      deleted: false,
    }).select("_id");

    if (!user) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    var bans = await models.Ban.find({
      userId: userIdToActOn,
      auto: false,
    }).select("type expires modId -_id");

    res.send(bans);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading alt accounts.");
  }
});

router.get("/violationTypes", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);

    if (!(await routeUtils.verifyPermission(res, userId, "viewBans"))) return;

    res.send(violationDefinitions);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading violation types.");
  }
});

router.get("/violations", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToActOn = String(req.query.userId);

    if (!userIdToActOn) {
      res.status(400);
      res.send("Missing userId.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, "viewBans"))) return;

    const baseUser = await models.User.findOne({
      id: userIdToActOn,
      deleted: false,
    })
      .select("id name avatar ip")
      .lean();

    if (!baseUser) {
      res.status(404);
      res.send("User not found.");
      return;
    }

    const targetTickets = await models.ViolationTicket.find({
      userId: userIdToActOn,
    })
      .sort("-createdAt")
      .lean();

    const targetBans = await models.Ban.find({ userId: userIdToActOn })
      .select(
        "id type expires permissions modId violationType violationTicketId"
      )
      .lean();

    const canViewAlts = await routeUtils.verifyPermission(
      userId,
      "viewAlts"
    );
    const canViewIps = await routeUtils.verifyPermission(userId, "viewIPs");

    let linkedAccounts = [];
    let linkedTickets = [];
    let linkedBans = [];

    if (canViewAlts && Array.isArray(baseUser.ip) && baseUser.ip.length) {
      const linkedUsers = await models.User.find({
        id: { $ne: userIdToActOn },
        deleted: false,
        ip: { $elemMatch: { $in: baseUser.ip } },
      })
        .select("id name avatar ip")
        .limit(10)
        .lean();

      const linkedUserIds = linkedUsers.map((u) => u.id);

      if (linkedUserIds.length) {
        linkedTickets = await models.ViolationTicket.find({
          userId: { $in: linkedUserIds },
        })
          .sort("-createdAt")
          .lean();

        linkedBans = await models.Ban.find({ userId: { $in: linkedUserIds } })
          .select(
            "id userId type expires permissions modId violationType violationTicketId"
          )
          .lean();

        linkedAccounts = linkedUsers;
      }
    }

    const records = targetTickets
      .concat(targetBans)
      .concat(linkedTickets)
      .concat(linkedBans);
    const modIds = [
      ...new Set(
        records
          .map((record) => record && record.modId)
          .filter((modId) => modId)
      ),
    ];

    const modInfo = modIds.length
      ? await models.User.find({ id: { $in: modIds } })
          .select("id name avatar")
          .lean()
      : [];

    const modMap = modInfo.reduce((acc, mod) => {
      acc[mod.id] = mod;
      return acc;
    }, {});

    function decorate(record) {
      if (!record) return record;
      if (record.modId) {
        record.mod = modMap[record.modId] || null;
      }
      return record;
    }

    const target = {
      userId: baseUser.id,
      name: baseUser.name,
      avatar: baseUser.avatar,
      tickets: targetTickets.map((ticket) => decorate(ticket)),
      activeBans: targetBans.map((ban) => decorate(ban)),
    };

    const targetIps = Array.isArray(baseUser.ip) ? baseUser.ip : [];

    const linkedAccountSummaries = linkedAccounts.map((linkedUser) => {
      const sharedIps = Array.isArray(linkedUser.ip)
        ? linkedUser.ip.filter((ip) => targetIps.includes(ip))
        : [];

      return {
        userId: linkedUser.id,
        name: linkedUser.name,
        avatar: linkedUser.avatar,
        sharedIpCount: sharedIps.length,
        sharedIps: canViewIps ? sharedIps : undefined,
        tickets: linkedTickets
          .filter((ticket) => ticket.userId === linkedUser.id)
          .map((ticket) => decorate(ticket)),
        activeBans: linkedBans
          .filter((ban) => ban.userId === linkedUser.id)
          .map((ban) => decorate(ban)),
      };
    });

    res.send({
      target,
      linkedAccounts: linkedAccountSummaries,
      violationTypes: violationDefinitions,
      permissions: {
        canViewLinkedAccounts: canViewAlts,
        canViewSharedIps: canViewIps,
      },
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading violations.");
  }
});

router.get("/flagged", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToActOn = String(req.query.userId);
    var perm = "viewFlagged";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var user = await models.User.findOne({
      id: userIdToActOn /*, deleted: false*/,
    }).select("flagged");

    if (!user) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    res.send(user.flagged);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading alt accounts.");
  }
});

router.post("/clearSetupName", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var setupId = String(req.body.setupId);
    var perm = "clearSetupName";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    await models.Setup.updateOne(
      { id: setupId },
      { $set: { name: `Setup ${setupId}` } }
    ).exec();

    routeUtils.createModAction(userId, "Clear Setup Name", [setupId]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error clearing setup name.");
  }
});

router.post("/deleteStrategy", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var strategyId = String(req.body.strategyId || "").trim();
    var reason = String(req.body.reason || "").trim();
    var perm = "deleteStrategy";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    if (!strategyId) {
      res.status(400);
      res.send("Strategy ID is required.");
      return;
    }

    var strategy = await models.Strategy.findOne({ id: strategyId }).select(
      "deleted"
    );

    if (!strategy) {
      res.status(404);
      res.send("Strategy not found.");
      return;
    }

    if (!strategy.deleted) {
      await models.Strategy.updateOne(
        { id: strategyId },
        { $set: { deleted: true } }
      ).exec();
    }

    const modArgs = [strategyId];
    if (reason) modArgs.push(reason);
    routeUtils.createModAction(userId, "Delete Strategy", modArgs);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error deleting strategy.");
  }
});

// Unified route for clearing user content
router.post("/clearUserContent", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToClear = String(req.body.userId);
    var contentType = String(req.body.contentType);
    var perm = "clearUserContent";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var user = await models.User.findOne({ id: userIdToClear }).select("_id");

    if (!user) {
      res.status(500);
      res.send("User not found.");
      return;
    }

    let modActionName = "";
    let updateQuery = {};
    let additionalOperations = [];

    switch (contentType) {
      case "avatar":
        updateQuery = { $set: { avatar: false } };
        modActionName = "Clear Avatar";
        break;

      case "bio":
        updateQuery = { $set: { bio: "" } };
        modActionName = "Clear Bio";
        break;

      case "customEmotes":
        updateQuery = { $set: { customEmotes: [] } };
        modActionName = "Clear Custom Emotes";
        additionalOperations.push(
          models.CustomEmote.updateMany(
            { creator: user._id },
            { $set: { deleted: true } }
          ).exec()
        );
        break;

      case "name":
        updateQuery = {
          $set: {
            name: routeUtils.nameGen().slice(0, constants.maxUserNameLength),
          },
        };
        modActionName = "Clear Name";
        break;

      case "vanityUrl":
        updateQuery = { $unset: { "settings.vanityUrl": "" } };
        modActionName = "Clear Vanity URL";
        // Store the current vanity URL before deleting it
        const vanityUrlToDelete = await models.VanityUrl.findOne({
          userId: userIdToClear,
        }).select("url -_id");
        if (vanityUrlToDelete) {
          // Cache the deleted vanity URL -> user ID mapping for 7 days
          // This allows old links to still work temporarily
          await redis.cacheDeletedVanityUrl(
            vanityUrlToDelete.url,
            userIdToClear
          );
        }
        additionalOperations.push(
          models.VanityUrl.deleteMany({ userId: userIdToClear }).exec()
        );
        break;

      case "video":
        updateQuery = { $unset: { "settings.youtube": "" } };
        modActionName = "Clear Video";
        break;

      case "pronouns":
        updateQuery = { $set: { pronouns: "" } };
        modActionName = "Clear Pronouns";
        break;

      case "accountDisplay":
        updateQuery = {};
        modActionName = "Clear Account Display";
        break;

      case "all":
        updateQuery = {
          $set: {
            name: routeUtils.nameGen().slice(0, constants.maxUserNameLength),
            avatar: false,
            bio: "",
            customEmotes: [],
          },
        };
        modActionName = "Clear All User Content";
        additionalOperations.push(
          models.CustomEmote.updateMany(
            { creator: user._id },
            { $set: { deleted: true } }
          ).exec(),
          models.Setup.updateMany(
            { creator: user._id },
            { $set: { name: "Unnamed setup" } }
          ).exec(),
          models.ForumThread.updateMany(
            { author: user._id },
            { $set: { deleted: true } }
          ).exec(),
          models.ForumReply.updateMany(
            { author: user._id },
            { $set: { deleted: true } }
          ).exec(),
          models.Comment.updateMany(
            { author: user._id },
            { $set: { deleted: true } }
          ).exec(),
          models.ChatMessage.deleteMany({ senderId: userIdToClear }).exec()
        );
        break;

      default:
        res.status(400);
        res.send("Invalid content type.");
        return;
    }

    // Execute the main update query
    if (Object.keys(updateQuery).length > 0) {
      await models.User.updateOne({ id: userIdToClear }, updateQuery).exec();
    }

    // Execute any additional operations
    await Promise.all(additionalOperations);

    await redis.cacheUserInfo(userIdToClear, true);

    routeUtils.createModAction(userId, "Clear Bio", [userIdToClear]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error clearing bio.");
  }
});

router.post("/restoreDeletedUser", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const requesterId = await routeUtils.verifyLoggedIn(req);

    if (!(await routeUtils.verifyPermission(res, requesterId, null, Infinity)))
      return;

    const rawEmail = String(req.body.email || "").trim();

    if (!rawEmail) {
      res.status(400);
      res.send("Email is required.");
      return;
    }

    const emailPattern = new RegExp(
      `^${rawEmail.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}$`,
      "i"
    );

    const existingActiveUser = await models.User.findOne({
      email: { $elemMatch: { $regex: emailPattern } },
      deleted: false,
    })
      .select("id")
      .lean();

    if (existingActiveUser) {
      res.status(409);
      res.send("A non-deleted account already exists for this email.");
      return;
    }

    const userDoc = await models.User.findOne({
      email: { $elemMatch: { $regex: emailPattern } },
      deleted: true,
    });

    if (!userDoc) {
      res.status(404);
      res.send("No deleted account found for that email.");
      return;
    }

    if (userDoc.deleted === false) {
      res.status(409);
      res.send("Account is already active.");
      return;
    }

    let firebaseUser = null;
    let temporaryPassword = null;
    let passwordResetLink = null;

    try {
      firebaseUser = await fbAdmin.auth().getUserByEmail(rawEmail);
      if (firebaseUser.disabled) {
        firebaseUser = await fbAdmin
          .auth()
          .updateUser(firebaseUser.uid, { disabled: false });
      }
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        temporaryPassword = crypto
          .randomBytes(18)
          .toString("base64")
          .replace(/[^a-zA-Z0-9]/g, "")
          .slice(0, 24);

        firebaseUser = await fbAdmin.auth().createUser({
          email: rawEmail,
          password: temporaryPassword,
          emailVerified: true,
          disabled: false,
        });

        try {
          passwordResetLink = await fbAdmin
            .auth()
            .generatePasswordResetLink(rawEmail);
        } catch (linkErr) {
          logger.warn(
            `Unable to generate password reset link for ${rawEmail}: ${linkErr}`
          );
        }
      } else {
        throw err;
      }
    }

    if (!firebaseUser) {
      res.status(500);
      res.send("Unable to provision Firebase account.");
      return;
    }

    const defaultBio =
      "Click to edit your bio (ex. age, gender, location, interests, experience playing mafia)";
    const defaultItemsOwned = {
      customProfile: 0,
      avatarShape: 0,
      iconFilter: 0,
      customPrimaryColor: 0,
      nameChange: 1,
      emotes: 0,
      threeCharName: 0,
      twoCharName: 0,
      oneCharName: 0,
      textColors: 0,
      deathMessageEnabled: 0,
      deathMessageChange: 0,
      anonymousDeck: 0,
      customEmotes: 0,
      customEmotesExtra: 0,
      archivedGames: 0,
      archivedGamesMax: 0,
      bonusRedHearts: 0,
      vanityUrl: 0,
    };

    userDoc.deleted = false;
    userDoc.fbUid = firebaseUser.uid;
    userDoc.lastActive = Date.now();
    userDoc.bio = userDoc.bio || defaultBio;
    userDoc.pronouns = userDoc.pronouns || "";
    if (!Array.isArray(userDoc.email) || userDoc.email.length === 0) {
      userDoc.email = [rawEmail.toLowerCase()];
    } else if (
      !userDoc.email.some((value) => emailPattern.test(String(value || "")))
    ) {
      userDoc.email.push(rawEmail.toLowerCase());
    }
    userDoc.avatar = false;
    userDoc.banner = false;
    userDoc.settings = userDoc.settings || {};
    userDoc.permissions = userDoc.permissions || [];
    userDoc.rank = userDoc.rank || 0;
    userDoc.numFriends = userDoc.numFriends || 0;
    userDoc.coins = userDoc.coins || 0;
    userDoc.points = userDoc.points || 0;
    userDoc.pointsNegative = userDoc.pointsNegative || 0;
    userDoc.itemsOwned = {
      ...defaultItemsOwned,
      ...(userDoc.itemsOwned || {}),
    };
    userDoc.stats = userDoc.stats || {};
    userDoc.achievements = userDoc.achievements || [];
    userDoc.dailyChallenges = userDoc.dailyChallenges || [];
    userDoc.dailyChallengesCompleted = userDoc.dailyChallengesCompleted || 0;
    userDoc.globalNotifs = userDoc.globalNotifs || [];
    userDoc.games = userDoc.games || [];
    userDoc.setups = userDoc.setups || [];
    userDoc.favSetups = userDoc.favSetups || [];
    userDoc.blockedUsers = userDoc.blockedUsers || [];

    await userDoc.save();

    const rankedPlayerGroup = await models.Group.findOne({
      name: "Ranked Player",
    })
      .select("_id")
      .lean();

    if (rankedPlayerGroup) {
      await models.InGroup.updateOne(
        { user: userDoc._id, group: rankedPlayerGroup._id },
        { user: userDoc._id, group: rankedPlayerGroup._id },
        { upsert: true }
      ).exec();
    }

    await models.Ban.deleteMany({ userId: userDoc.id }).exec();

    await redis.deleteUserInfo(userDoc.id);
    await redis.cacheUserPermissions(userDoc.id);
    await redis.cacheUserInfo(userDoc.id, true);

    res.send({
      message: "User restored.",
      userId: userDoc.id,
      fbUid: firebaseUser.uid,
      temporaryPassword,
      passwordResetLink,
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error restoring deleted user.");
  }
});

router.post("/awardTrophy", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var perm = "awardTrophy";

    if (!(await routeUtils.verifyPermission(res, requesterId, null, Infinity)))
      return;

    var userIdToAward = String(req.body.userId || "").trim();
    var trophyName = String(req.body.name || "").trim();

    if (!userIdToAward) {
      res.status(400);
      res.send("User is required.");
      return;
    }

    if (!trophyName) {
      res.status(400);
      res.send("Trophy name is required.");
      return;
    }

    if (trophyName.length > constants.maxTrophyNameLength) {
      res.status(400);
      res.send(
        `Trophy name must be ${constants.maxTrophyNameLength} characters or fewer.`
      );
      return;
    }

    const userToAward = await models.User.findOne({
      id: userIdToAward,
      deleted: false,
    }).select("_id id name");

    if (!userToAward) {
      res.status(404);
      res.send("User does not exist.");
      return;
    }

    const trophy = new models.Trophy({
      id: shortid.generate(),
      name: trophyName,
      ownerId: userIdToAward,
      owner: userToAward._id,
      createdBy: userId,
    });
    await trophy.save();

    await routeUtils.createNotification(
      {
        content: `You have been awarded the "${trophyName}" trophy!`,
        icon: "fas fa-trophy",
        link: `/user/${userIdToAward}`,
      },
      [userIdToAward]
    );

    routeUtils.createModAction(userId, "Award Trophy", [
      userIdToAward,
      trophyName,
    ]);

    res.send({
      id: trophy.id,
      name: trophy.name,
      ownerId: trophy.ownerId,
      createdAt: trophy.createdAt,
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error awarding trophy.");
  }
});

router.post("/breakGame", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var gameToClear = String(req.body.gameId);
    var perm = "breakGame";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    await redis.breakGame(gameToClear);

    routeUtils.createModAction(userId, "Break Game", [gameToClear]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error clearing username.");
  }
});

router.post("/kick", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToKick = String(req.body.userId);
    var perm = "kick";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    try {
      await gameLoadBalancer.leaveGame(userIdToKick);
    } catch (e) {
      await redis.leaveGame(userIdToKick);
    }

    routeUtils.createModAction(userId, "Kick Player", [userIdToKick]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error kicking user.");
  }
});

router.post("/clearAllIPs", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var perm = "clearAllIPs";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    await models.User.updateMany({}, { $unset: { ip: "" } }).exec();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error clearing IPs.");
  }
});

router.post("/refundGame", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var gameId = String(req.body.gameId);
    var perm = "refundGame";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    // Fetch the game from the database
    var game = await models.Game.findOne({ id: gameId })
      .populate("users")
      .exec();

    if (!game) {
      res.status(404);
      res.send("Game not found.");
      return;
    }

    if (!game.endTime) {
      res.status(400);
      res.send("Cannot refund a game that hasn't ended.");
      return;
    }

    if (!game.ranked && !game.competitive) {
      res.status(400);
      res.send("Cannot refund a game that was not ranked or competitive.");
      return;
    }

    // Parse player maps
    const playerIdMap = JSON.parse(game.playerIdMap || "{}");
    const playerAlignmentMap = JSON.parse(game.playerAlignmentMap || "{}");

    // Get all user IDs from the game
    const userIds = Object.keys(playerIdMap);

    if (userIds.length === 0) {
      res.status(400);
      res.send("No players found in this game.");
      return;
    }

    // Load game-specific data for calculations
    const dbStats = require("../db/stats");
    const gameAchievements = require("../data/Achievements");

    // Helper function to get achievement reward
    function getAchievementReward(gameType, achievementId) {
      for (let achievement of Object.entries(
        gameAchievements[gameType] || {}
      ).filter((achievementData) => achievementId == achievementData[1].ID)) {
        return achievement[1].reward || 0;
      }
      return 0;
    }

    // Helper function to revert stats
    function revertStats(
      stats,
      gameType,
      setupId,
      role,
      alignment,
      won,
      abandoned
    ) {
      if (!stats[gameType]) return;

      const gameStats = stats[gameType];

      // Helper to update a stats object
      function updateStatsObj(statsObj, stat, inc) {
        if (stat !== "totalGames") {
          if (statsObj[stat]) {
            statsObj[stat].total = Math.max(0, statsObj[stat].total - 1);
            if (inc && statsObj[stat].count > 0) {
              statsObj[stat].count = Math.max(0, statsObj[stat].count - 1);
            }
          }
        } else if (statsObj.totalGames) {
          statsObj.totalGames = Math.max(0, statsObj.totalGames - 1);
        }
      }

      // Revert all stats
      if (gameStats.all) {
        if (won) updateStatsObj(gameStats.all, "wins", true);
        else updateStatsObj(gameStats.all, "wins", false);

        if (abandoned) updateStatsObj(gameStats.all, "abandons", true);
      }

      // Revert bySetup stats
      if (gameStats.bySetup && gameStats.bySetup[setupId]) {
        if (won) updateStatsObj(gameStats.bySetup[setupId], "wins", true);
        else updateStatsObj(gameStats.bySetup[setupId], "wins", false);

        if (abandoned)
          updateStatsObj(gameStats.bySetup[setupId], "abandons", true);
      }

      // Revert byRole stats
      if (role && gameStats.byRole && gameStats.byRole[role]) {
        if (won) updateStatsObj(gameStats.byRole[role], "wins", true);
        else updateStatsObj(gameStats.byRole[role], "wins", false);

        if (abandoned) updateStatsObj(gameStats.byRole[role], "abandons", true);
      }

      // Revert byAlignment stats
      if (
        alignment &&
        gameStats.byAlignment &&
        gameStats.byAlignment[alignment]
      ) {
        if (won) updateStatsObj(gameStats.byAlignment[alignment], "wins", true);
        else updateStatsObj(gameStats.byAlignment[alignment], "wins", false);

        if (abandoned)
          updateStatsObj(gameStats.byAlignment[alignment], "abandons", true);
      }

      return stats;
    }

    // Process each player
    for (let userIdToRefund of userIds) {
      try {
        const playerId = playerIdMap[userIdToRefund];
        const alignment = playerAlignmentMap[userIdToRefund];

        // Fetch user data
        var user = await models.User.findOne({ id: userIdToRefund }).exec();

        if (!user) continue;

        // Determine if player won
        const won =
          game.winners.includes(playerId) ||
          (game.winnersInfo &&
            game.winnersInfo.players &&
            game.winnersInfo.players.includes(playerId));

        // Determine if player abandoned
        const abandoned = game.left && game.left.includes(playerId);

        // Determine if player got kudos
        const gotKudos = game.kudosReceiver === playerId;

        // Calculate coins to revert
        let coinsToRevert = 0;

        // Revert win coins (only for ranked games)
        if (game.ranked && won) {
          coinsToRevert += 1;
        }

        // Calculate fortune/misfortune to revert
        // We need to recalculate the same way the game did
        let pointsToRevert = 0;
        let pointsNegativeToRevert = 0;

        if (game.history) {
          try {
            const history = JSON.parse(game.history);

            // Extract role information from history
            // History structure varies, but we can get it from the playerAlignmentMap and originalRoles
            const roleFromHistory = null; // We'll extract this if needed

            // Recalculate fortune/misfortune using the same algorithm as adjustSkillRatings
            // This requires the setup's faction ratings AT THE TIME of the game
            const setup = await models.Setup.findOne({
              _id: game.setup,
            }).select("id factionRatings");

            if (setup && setup.factionRatings) {
              const factionRatingsRaw = setup.factionRatings || [];
              const factionRatings = new Map(
                factionRatingsRaw.map((factionRating) => [
                  factionRating.factionName,
                  factionRating.skillRating,
                ])
              );

              // Rebuild the faction structure from the game data
              const factionWinnerFractions = {};
              const memberFactions = {};

              // Parse history to get originalRoles
              let originalRoles = {};
              if (history.originalRoles) {
                originalRoles = history.originalRoles;
              }

              // Build faction membership
              for (let userId in playerIdMap) {
                const playerId = playerIdMap[userId];
                if (originalRoles[playerId]) {
                  const roleName = originalRoles[playerId].split(":")[0];
                  const alignment = playerAlignmentMap[userId] || "";

                  // Determine faction name (same logic as in adjustSkillRatings)
                  const alignmentIsFaction =
                    alignment === "Village" ||
                    alignment === "Mafia" ||
                    alignment === "Cult";
                  const factionName = alignmentIsFaction ? alignment : roleName;
                  memberFactions[playerId] = factionName;

                  if (factionWinnerFractions[factionName] === undefined) {
                    factionWinnerFractions[factionName] = {
                      originalCount: 0,
                      winnerCount: 0,
                    };
                  }

                  factionWinnerFractions[factionName].originalCount++;
                  if (won) {
                    factionWinnerFractions[factionName].winnerCount++;
                  }
                }
              }

              const factionNames = Object.keys(factionWinnerFractions);

              // Calculate faction ratings
              const factionsToBeRated = factionNames.map((factionName) => {
                if (factionRatings.has(factionName)) {
                  const factionRating = factionRatings.get(factionName);
                  return [
                    rating({
                      mu: factionRating.mu,
                      sigma: factionRating.sigma,
                    }),
                  ];
                } else {
                  return [
                    rating({
                      mu: constants.defaultSkillRatingMu,
                      sigma: constants.defaultSkillRatingSigma,
                    }),
                  ];
                }
              });

              const factionScores = factionNames.map((factionName) => {
                const factionWinnerFraction =
                  factionWinnerFractions[factionName];
                return (
                  factionWinnerFraction.winnerCount /
                  factionWinnerFraction.originalCount
                );
              });

              const predictions = predictWin(factionsToBeRated);

              const pointsWonByFactions = {};
              const pointsLostByFactions = {};

              for (let i = 0; i < factionNames.length; i++) {
                const factionName = factionNames[i];
                const winPredictionPercent = predictions[i];

                pointsWonByFactions[factionName] = Math.round(
                  constants.pointsNominalAmount / 2 / winPredictionPercent
                );
                pointsLostByFactions[factionName] = Math.round(
                  constants.pointsNominalAmount / 2 / (1 - winPredictionPercent)
                );
              }

              // Calculate points for this specific player
              const playerFaction = memberFactions[playerId];
              if (playerFaction) {
                const maxEarnedPoints = constants.pointsNominalAmount * 20;
                let pointsEarned = won
                  ? pointsWonByFactions[playerFaction]
                  : pointsLostByFactions[playerFaction];

                if (pointsEarned > maxEarnedPoints) {
                  pointsEarned = maxEarnedPoints;
                }

                if (won) {
                  pointsToRevert = pointsEarned;
                } else {
                  pointsNegativeToRevert = pointsEarned;
                }
              }
            }
          } catch (e) {
            logger.error(
              `Error calculating fortune/misfortune for game ${gameId}:`,
              e
            );
            // Continue without reverting points if calculation fails
          }
        }

        // Extract role from history for stats reversion
        const roleFromHistory = null; // Simplified - would need more complex parsing

        const setupId = game.setup ? String(game.setup) : null;

        // Update user stats (for ranked/competitive games only)
        user.stats = revertStats(
          user.stats,
          game.type,
          setupId,
          roleFromHistory,
          alignment,
          won,
          abandoned
        );

        // Build update operations
        const updateOps = {
          $pull: { games: game._id },
          $set: {
            stats: user.stats,
          },
        };

        const incOps = {};

        // Revert kudos
        if (gotKudos) {
          incOps.kudos = -1;
        }

        // Revert coins
        if (coinsToRevert > 0) {
          incOps.coins = -coinsToRevert;
        }

        // Revert hearts
        if (game.ranked) {
          var itemsOwned = await redis.getUserItemsOwned(userIdToRefund);
          const redHeartCapacity =
            constants.initialRedHeartCapacity +
            (itemsOwned?.bonusRedHearts || 0);
          updateOps.$set.redHearts = redHeartCapacity;
        }

        if (game.competitive) {
          updateOps.$set.goldHearts = constants.initialGoldHeartCapacity;
        }

        // Revert fortune/misfortune points
        if (pointsToRevert > 0) {
          incOps.points = -pointsToRevert;
        }
        if (pointsNegativeToRevert > 0) {
          incOps.pointsNegative = -pointsNegativeToRevert;
        }

        if (Object.keys(incOps).length > 0) {
          updateOps.$inc = incOps;
        }

        // Calculate new win rate
        const newWinRate =
          (user.stats[game.type]?.all?.wins?.count || 0) /
          (user.stats[game.type]?.all?.wins?.total || 1);
        updateOps.$set.winRate = newWinRate;

        // Apply the update
        await models.User.updateOne({ id: userIdToRefund }, updateOps).exec();

        // Clear user cache
        await redis.cacheUserInfo(userIdToRefund, true);
      } catch (e) {
        logger.error(`Error refunding game for user ${userIdToRefund}:`, e);
        // Continue processing other users
      }
    }

    // Log the mod action
    await routeUtils.createModAction(userId, "Refund Game", [gameId]);

    res.send(
      `Successfully refunded game for ${userIds.length} player(s). ` +
        `Reverted: win/loss/abandonment statistics, kudos, coins from wins, ${
          game.ranked ? "red" : "gold"
        } hearts, and fortune/misfortune points.`
    );
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error refunding Red Hearts.");
  }
});

router.post("/changeName", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToChange = String(req.body.userId);
    var name = String(req.body.name);
    var perm = "changeUsersName";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    await models.User.updateOne(
      { id: userIdToChange },
      { $set: { name: name } }
    ).exec();

    await redis.cacheUserInfo(userIdToChange, true);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error changing name.");
  }
});

router.get("/actions", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var last = Number(req.query.last);
    var first = Number(req.query.first);

    var actions = await routeUtils.modelPageQuery(
      models.ModAction,
      {},
      "date",
      last,
      first,
      "id modId mod name args reason date -_id",
      constants.modActionPageSize,
      ["mod", "id name avatar -_id"]
    );

    res.send(actions);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading mod actions.");
  }
});

router.get("/announcements", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var last = Number(req.query.last);
    var first = Number(req.query.first);

    var announcements = await routeUtils.modelPageQuery(
      models.Announcement,
      {},
      "date",
      last,
      first,
      "id modId mod content date -_id",
      5,
      ["mod", "id name avatar -_id"]
    );

    res.send(announcements);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading announcements.");
  }
});

router.post("/announcement", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var content = String(req.body.content);
    var perm = "announce";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    if (content.length > constants.maxAnnouncementLength) {
      res.status(500);
      res.send("Announcement is too long.");
      return;
    }

    var announcement = new models.Announcement({
      id: shortid.generate(),
      modId: userId,
      content,
      date: Date.now(),
    });
    await announcement.save();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error creating announcements.");
  }
});

router.post("/rankedApprove", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToApprove = String(req.body.userId);
    var perm = "approveRanked";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var userToApprove = await models.User.findOne({
      id: userIdToApprove,
      deleted: false,
    }).select("_id");

    if (!userToApprove) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    var group = await models.Group.findOne({ name: "Ranked Player" }).select(
      "_id"
    );
    var inGroup = await models.InGroup.findOne({
      user: userToApprove._id,
      group: group._id,
    });

    if (inGroup) {
      res.status(500);
      res.send("User is already approved for ranked.");
      return;
    }

    inGroup = new models.InGroup({
      user: userToApprove._id,
      group: group._id,
    });
    await inGroup.save();
    await redis.cacheUserInfo(userIdToApprove, true);
    await redis.cacheUserPermissions(userIdToApprove);

    routeUtils.createModAction(userId, "Ranked Approve", [userIdToApprove]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error approving user.");
  }
});

router.post("/competitiveApprove", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToApprove = String(req.body.userId);
    var perm = "approveCompetitive";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var userToApprove = await models.User.findOne({
      id: userIdToApprove,
      deleted: false,
    }).select("_id");

    if (!userToApprove) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    var group = await models.Group.findOne({
      name: "Competitive Player",
    }).select("_id");
    var inGroup = await models.InGroup.findOne({
      user: userToApprove._id,
      group: group._id,
    });

    if (inGroup) {
      res.status(500);
      res.send("User is already approved for Competitive.");
      return;
    }

    inGroup = new models.InGroup({
      user: userToApprove._id,
      group: group._id,
    });
    await inGroup.save();
    await redis.cacheUserInfo(userIdToApprove, true);
    await redis.cacheUserPermissions(userIdToApprove);

    routeUtils.createModAction(userId, "Competitive Approve", [
      userIdToApprove,
    ]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error approving user.");
  }
});

module.exports = router;
