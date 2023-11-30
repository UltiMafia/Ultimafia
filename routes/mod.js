const express = require("express");
const shortid = require("shortid");
const constants = require("../data/constants");
const models = require("../db/models");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const gameLoadBalancer = require("../modules/gameLoadBalancer");
const logger = require("../modules/logging")(".");
const router = express.Router();

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
      group.members = group.members.map((member) => member.toJSON().user);

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
    var perm = "gameBan";
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

    await routeUtils.banUser(userIdToBan, length, ["playGame"], "game", userId);

    await routeUtils.createNotification(
      {
        content: `You have been banned from games for ${routeUtils.timeDisplay(
          length
        )}.`,
        icon: "ban",
      },
      [userIdToBan]
    );

    routeUtils.createModAction(userId, "Game Ban", [userIdToBan, lengthStr]);
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

    routeUtils.createModAction(userId, "Competitive Ban", [userIdToBan, lengthStr]);
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
    var perm = "siteBan";
    var banRank = (await redis.getUserRank(userIdToBan)) || 0;

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

    await routeUtils.banUser(userIdToBan, length, ["signIn"], "site", userId);

    await models.User.updateOne(
      { id: userIdToBan },
      { $set: { banned: true } }
    ).exec();
    await models.Session.deleteMany({ "session.user.id": userIdToBan }).exec();

    routeUtils.createModAction(userId, "Site Ban", [userIdToBan, lengthStr]);
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

router.post("/clearBio", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToClear = String(req.body.userId);
    var perm = "clearBio";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    await models.User.updateOne(
      { id: userIdToClear },
      { $set: { bio: "" } }
    ).exec();

    await redis.cacheUserInfo(userIdToClear, true);

    routeUtils.createModAction(userId, "Clear Bio", [userIdToClear]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error clearing bio.");
  }
});

router.post("/clearVideo", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToClear = String(req.body.userId);
    var perm = "clearBio";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    await models.User.updateOne(
      { id: userIdToClear },
      { $set: { settings: { youtube: "" } } }
    ).exec();

    await redis.cacheUserInfo(userIdToClear, true);

    routeUtils.createModAction(userId, "Clear Video", [userIdToClear]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error clearing video.");
  }
});

router.post("/clearBirthday", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToClear = String(req.body.userId);
    var perm = "clearBio";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    await models.User.updateOne(
      { id: userIdToClear },
      {
        $unset: { birthday: "" },
        $set: { bdayChanged: false },
      }
    ).exec();

    await redis.cacheUserInfo(userIdToClear, true);

    routeUtils.createModAction(userId, "Clear Birthday", [userIdToClear]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error clearing birthday.");
  }
});

router.post("/clearAvi", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToClear = String(req.body.userId);
    var perm = "clearAvi";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    await models.User.updateOne(
      { id: userIdToClear },
      { $set: { avatar: false } }
    ).exec();

    await redis.cacheUserInfo(userIdToClear, true);

    routeUtils.createModAction(userId, "Clear Avatar", [userIdToClear]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error clearing avatar.");
  }
});

router.post("/clearAccountDisplay", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToClear = String(req.body.userId);
    var perm = "clearAccountDisplay";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    await models.User.updateOne(
      { id: userIdToClear },
      {
        $set: {
          "settings.showDiscord": false,
          "settings.showTwitch": false,
          "settings.showGoogle": false,
          "settings.showSteam": false,
        },
      }
    ).exec();

    await redis.cacheUserInfo(userIdToClear, true);

    routeUtils.createModAction(userId, "Clear Accounts Display", [
      userIdToClear,
    ]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error clearing account display.");
  }
});

router.post("/clearName", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToClear = String(req.body.userId);
    var perm = "clearName";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    await models.User.updateOne(
      { id: userIdToClear },
      {
        $set: {
          name: routeUtils.nameGen().slice(0, constants.maxUserNameLength),
        },
      }
    ).exec();

    await redis.cacheUserInfo(userIdToClear, true);

    routeUtils.createModAction(userId, "Clear Name", [userIdToClear]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error clearing username.");
  }
});

router.post("/clearAllContent", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToClear = String(req.body.userId);
    var perm = "clearAllUserContent";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var user = await models.User.findOne({ id: userIdToClear }).select("_id");

    if (!user) {
      res.status(500);
      res.send("User not found.");
      return;
    }

    await models.User.updateOne(
      { id: userIdToClear },
      {
        $set: {
          name: routeUtils.nameGen().slice(0, constants.maxUserNameLength),
          avatar: false,
          bio: "",
          "settings.showDiscord": false,
          "settings.showTwitch": false,
          "settings.showGoogle": false,
          "settings.showSteam": false,
        },
      }
    ).exec();

    await models.Setup.updateMany(
      { creator: user._id },
      { $set: { name: "Unnamed setup" } }
    ).exec();

    await models.ForumThread.updateMany(
      { author: user._id },
      { $set: { deleted: true } }
    ).exec();

    await models.ForumReply.updateMany(
      { author: user._id },
      { $set: { deleted: true } }
    ).exec();

    await models.Comment.updateMany(
      { author: user._id },
      { $set: { deleted: true } }
    ).exec();

    await models.ChatMessage.deleteMany({ senderId: userIdToClear }).exec();
    await redis.cacheUserInfo(userIdToClear, true);

    routeUtils.createModAction(userId, "Clear All User Content", [
      userIdToClear,
    ]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error clearing user's content.");
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

router.post("/breakPortGames", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var port = String(req.body.port);
    var perm = "breakPortGames";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var games = await redis.getAllGames();

    for (let game of games) {
      if (game.port != port) continue;

      if (game.status == "Open") await redis.deleteGame(game.id);
      else await redis.breakGame(game.id);
    }

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

router.post("/giveCoins", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToGiveTo = String(req.body.userId);
    var amount = Number(req.body.amount);
    var perm = "giveCoins";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    await models.User.updateOne(
      { id: userIdToGiveTo },
      { $inc: { coins: amount } }
    ).exec();

    await redis.cacheUserInfo(userIdToGiveTo, true);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error giving coins.");
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

router.post("/scheduleRestart", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var when = routeUtils.parseTime(String(req.body.when)) + Date.now();
    var perm = "scheduleRestart";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    if (when <= Date.now()) {
      res.status(500);
      res.send("Restarts must be scheduled for the future.");
      return;
    }

    var restart = new models.Restart({ when });
    await restart.save();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error scheduling restart.");
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
      constants.announcementsPageSize,
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

router.post("/blockName", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var name = String(req.body.name);
    var perm = "blockName";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    if (name.length > constants.maxUserNameLength) {
      res.status(500);
      res.send("Name is too long.");
      return;
    }

    var blockedName = new models.BlockedName({ name });
    await blockedName.save();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error blocking name.");
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

    var group = await models.Group.findOne({ name: "Competitive Player" }).select(
      "_id"
    );
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

    routeUtils.createModAction(userId, "Competitive Approve", [userIdToApprove]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error approving user.");
  }
});

module.exports = router;
