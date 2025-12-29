const express = require("express");
const shortid = require("shortid");
const constants = require("../data/constants");
const trophyData = require("../data/trophies");
const DailyChallengeData = require("../data/DailyChallenge");
const roleData = require("../data/roles");
const Random = require("../lib/Random");
const fbAdmin = require("firebase-admin");
const crypto = require("crypto");
const fs = require("fs");
const models = require("../db/models");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const { getBasicUserInfo } = require("../modules/redis");
const gameLoadBalancer = require("../modules/gameLoadBalancer");
const logger = require("../modules/logging")(".");
const { rating, rate, ordinal, predictWin } = require("openskill");
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

router.post("/assignCredit", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToCredit = String(req.body.userId);
    var contributorTypes = req.body.contributorTypes || [];
    var perm = "changeUsersName";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    if (!Array.isArray(contributorTypes)) {
      res.status(500);
      res.send("contributorTypes must be an array.");
      return;
    }

    if (contributorTypes.length === 0) {
      res.status(500);
      res.send("At least one contributor type must be assigned.");
      return;
    }

    // Validate contributor types
    const validTypes = ["code", "art", "music", "design"];
    for (let type of contributorTypes) {
      if (!validTypes.includes(type)) {
        res.status(500);
        res.send(
          `"${type}" is not a valid contributor type. Valid types: ${validTypes.join(
            ", "
          )}`
        );
        return;
      }
    }

    var userToUpdate = await models.User.findOne({
      id: userIdToCredit,
      deleted: false,
    });

    if (!userToUpdate) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    // Update contributor types
    userToUpdate.contributorTypes = contributorTypes;
    await userToUpdate.save();

    await redis.cacheUserInfo(userIdToCredit, true);

    var typesStr = contributorTypes.join(", ");

    routeUtils.createModAction(userId, "Assign Credit", [
      userIdToCredit,
      userToUpdate.name,
      typesStr,
    ]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error assigning credit.");
  }
});

// Unified ban endpoint
router.post("/ban", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToBan = String(req.body.userId);
    var lengthStr = String(req.body.length);
    var banType = String(req.body.banType);
    var perm = "ban";
    var banRank = await redis.getUserRank(userIdToBan);

    if (banRank == null && banType !== "site") {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    if (banType === "site") {
      banRank = banRank || 0;
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

    const banExpires = new Date(Date.now() + length);
    const banTypeLabels = {
      forum: "forum",
      chat: "chat",
      game: "game",
      ranked: "ranked",
      competitive: "competitive",
      site: "site",
    };

    const banPermissions = {
      forum: ["vote", "createThread", "postReply", "deleteOwnPost", "editPost"],
      chat: ["publicChat", "privateChat"],
      game: ["playGame"],
      ranked: ["playRanked"],
      competitive: ["playCompetitive"],
      site: ["signIn"],
    };

    const banDbTypes = {
      forum: "forum",
      chat: "chat",
      game: "game",
      ranked: "playRanked",
      competitive: "playCompetitive",
      site: "site",
    };

    if (!banPermissions[banType]) {
      res.status(400);
      res.send("Invalid ban type.");
      return;
    }

    // Get all alt account IDs (accounts sharing IPs)
    const altAccountIds = await routeUtils.getAltAccountIds(userIdToBan);

    // Apply ban to all alt accounts
    const banPromises = altAccountIds.map((altUserId) =>
      routeUtils.banUser(
        altUserId,
        length,
        banPermissions[banType],
        banDbTypes[banType],
        userId
      )
    );
    await Promise.all(banPromises);

    if (banType === "site") {
      await models.User.updateMany(
        { id: { $in: altAccountIds } },
        { $set: { banned: true } }
      ).exec();
      await models.Session.deleteMany({
        "session.user.id": { $in: altAccountIds },
      }).exec();
    }

    await routeUtils.createNotification(
      {
        content: `You have received a violation. Your ${
          banTypeLabels[banType]
        } ban expires on ${banExpires.toLocaleString()}.`,
        icon: "ban",
      },
      altAccountIds // Notify all alt accounts
    );

    const modActionNames = {
      forum: "Forum Ban",
      chat: "Chat Ban",
      game: "Game Ban",
      ranked: "Ranked Ban",
      competitive: "Competitive Ban",
      site: "Site Ban",
    };

    routeUtils.createModAction(userId, modActionNames[banType], [
      userIdToBan,
      lengthStr,
    ]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error banning user.");
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

//Clear Leave Penalty
router.post("/clearleavepenalty", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToActOn = String(req.body.userId);
    var perm = "unban";
    var rank = await redis.getUserRank(userIdToActOn);

    if (rank == null) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, rank + 1)))
      return;

    await models.LeavePenalty.deleteMany({
      userId: userIdToActOn,
    }).exec();

    await redis.cacheUserPermissions(userIdToActOn);

    routeUtils.createModAction(userId, "Clear Leave Penalty", [userIdToActOn]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error removing leave penalty user.");
  }
});

// Unified unban endpoint
router.post("/unban", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToActOn = String(req.body.userId);
    var banType = String(req.body.banType);
    var perm = "unban";
    var rank = await redis.getUserRank(userIdToActOn);

    if (rank == null) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, rank + 1)))
      return;

    const banDbTypes = {
      forum: "forum",
      chat: "chat",
      game: "game",
      ranked: "playRanked",
      competitive: "playCompetitive",
      site: "site",
    };

    if (!banDbTypes[banType]) {
      res.status(400);
      res.send("Invalid ban type.");
      return;
    }

    await models.Ban.deleteMany({
      userId: userIdToActOn,
      type: banDbTypes[banType],
      auto: false,
    }).exec();

    if (banType === "site") {
      await models.User.updateOne(
        { id: userIdToActOn },
        { $set: { banned: false } }
      ).exec();
    }

    await redis.cacheUserPermissions(userIdToActOn);

    const modActionNames = {
      forum: "Forum Unban",
      chat: "Chat Unban",
      game: "Game Unban",
      ranked: "Ranked Unban",
      competitive: "Competitive Unban",
      site: "Site Unban",
    };

    routeUtils.createModAction(userId, modActionNames[banType], [
      userIdToActOn,
    ]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error unbanning user.");
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
        // Get current user to record previous name
        const currentUserForClear = await models.User.findOne({
          id: userIdToClear,
        }).select("name");
        const oldNameForClear = currentUserForClear
          ? currentUserForClear.name
          : null;
        const newGeneratedName = routeUtils
          .nameGen()
          .slice(0, constants.maxUserNameLength);

        updateQuery = {
          $set: {
            name: newGeneratedName,
          },
        };

        // Add previous name to history if it exists and is different
        if (oldNameForClear && oldNameForClear !== newGeneratedName) {
          updateQuery.$push = {
            previousNames: {
              name: oldNameForClear,
              changedAt: Date.now(),
            },
          };
        }

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

      case "profileBackground":
        updateQuery = { $set: { profileBackground: false } };
        modActionName = "Clear Profile Background";
        // Delete the profile background file if it exists
        const profileBackgroundPath = `${process.env.UPLOAD_PATH}/${userIdToClear}_profileBackground.webp`;
        if (fs.existsSync(profileBackgroundPath)) {
          additionalOperations.push(
            new Promise((resolve, reject) => {
              fs.unlink(profileBackgroundPath, (err) => {
                if (err) reject(err);
                else resolve();
              });
            })
          );
        }
        break;

      case "all":
        updateQuery = {
          $set: {
            name: routeUtils.nameGen().slice(0, constants.maxUserNameLength),
            avatar: false,
            bio: "",
            customEmotes: [],
            profileBackground: false,
          },
        };
        modActionName = "Clear All User Content";
        // Delete the profile background file if it exists when clearing all
        const profileBackgroundPathAll = `${process.env.UPLOAD_PATH}/${userIdToClear}_profileBackground.webp`;
        if (fs.existsSync(profileBackgroundPathAll)) {
          additionalOperations.push(
            new Promise((resolve, reject) => {
              fs.unlink(profileBackgroundPathAll, (err) => {
                if (err) reject(err);
                else resolve();
              });
            })
          );
        }
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

    routeUtils.createModAction(userId, modActionName, [userIdToClear]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error clearing user content.");
  }
});

router.post("/clearFamilyContent", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = String(req.body.familyId);
    var perm = "clearFamilyContent";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var family = await models.Family.findOne({ id: familyId }).populate(
      "leader",
      "id name"
    );

    if (!family) {
      res.status(500);
      res.send("Family not found.");
      return;
    }

    // Get leader name for default family name
    var leaderName = family.leader ? family.leader.name : "Unknown";
    var defaultName = `${leaderName}'s Family`;

    // Delete avatar file if it exists
    const avatarPath = `${process.env.UPLOAD_PATH}/${familyId}_family_avatar.webp`;
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }

    // Delete background file if it exists
    const backgroundPath = `${process.env.UPLOAD_PATH}/${familyId}_familyBackground.webp`;
    if (fs.existsSync(backgroundPath)) {
      fs.unlinkSync(backgroundPath);
    }

    // Update family: clear name, bio, and avatar
    await models.Family.updateOne(
      { id: familyId },
      {
        $set: {
          name: defaultName,
          bio: "",
          avatar: false,
          background: false,
        },
      }
    );

    routeUtils.createModAction(userId, "Clear Family Content", [familyId]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error clearing family content.");
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

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var userIdToAward = String(req.body.userId || "").trim();
    var trophyName = String(req.body.name || "").trim();
    var trophyType = String(req.body.type || trophyData.defaultTrophyType)
      .trim()
      .toLowerCase();

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

    if (!trophyData.trophyTypes.includes(trophyType)) {
      res.status(400);
      res.send(
        `Invalid trophy type. Must be one of: ${trophyData.trophyTypes.join(
          ", "
        )}`
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
      type: trophyType,
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
      type: trophy.type,
      createdAt: trophy.createdAt,
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error awarding trophy.");
  }
});

router.post("/revokeTrophy", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var perm = "awardTrophy"; // Use same permission as awarding

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    var trophyId = String(req.body.trophyId || "").trim();

    if (!trophyId) {
      res.status(400);
      res.send("Trophy ID is required.");
      return;
    }

    const trophy = await models.Trophy.findOne({
      id: trophyId,
      revoked: { $ne: true },
    });

    if (!trophy) {
      res.status(404);
      res.send("Trophy not found or already revoked.");
      return;
    }

    await models.Trophy.updateOne(
      { id: trophyId },
      {
        $set: {
          revoked: true,
          revokedAt: new Date(),
          revokedBy: userId,
        },
      }
    );

    await routeUtils.createNotification(
      {
        content: `Your "${trophy.name}" trophy has been revoked.`,
        icon: "fas fa-trophy",
        link: `/user/${trophy.ownerId}`,
      },
      [trophy.ownerId]
    );

    routeUtils.createModAction(userId, "Revoke Trophy", [
      trophy.ownerId,
      trophy.name,
      trophyId,
    ]);

    res.send({
      id: trophy.id,
      name: trophy.name,
      ownerId: trophy.ownerId,
      revoked: true,
      revokedAt: new Date(),
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error revoking trophy.");
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
    res.send("Error refunding game: " + e.message);
  }
});

router.post("/changeName", async (req, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var userIdToChange = String(req.body.userId);
    var name = String(req.body.name);
    var perm = "changeUsersName";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    // Get current user to record previous name
    const currentUser = await models.User.findOne({
      id: userIdToChange,
    }).select("name");
    const oldName = currentUser ? currentUser.name : null;

    // Update name and record previous name
    const updateQuery = { $set: { name: name } };

    // Add previous name to history if it exists and is different
    if (oldName && oldName !== name) {
      updateQuery.$push = {
        previousNames: {
          name: oldName,
          changedAt: Date.now(),
        },
      };
    }

    await models.User.updateOne({ id: userIdToChange }, updateQuery).exec();

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

// Report Management Routes

router.get("/reports", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "seeModPanel")))
      return;

    const status = req.query.status;
    const assignee = req.query.assignee;
    const reportedUser = req.query.reportedUser;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    let filter = {};
    if (status && ["open", "in-progress", "complete"].includes(status)) {
      filter.status = status;
    }
    if (assignee) {
      filter.assignees = { $in: [assignee] };
    }
    if (reportedUser) {
      filter.reportedUserId = reportedUser;
    }

    const reports = await models.Report.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await models.Report.countDocuments(filter);

    // Populate user information for reporter, reported user, and assignees
    for (const report of reports) {
      try {
        // Get reporter info
        const reporterInfo = await getBasicUserInfo(report.reporterId);
        if (reporterInfo) {
          report.reporterName = reporterInfo.name;
          report.reporterAvatar = reporterInfo.avatar;
        }

        // Get reported user info
        const reportedUserInfo = await getBasicUserInfo(report.reportedUserId);
        if (reportedUserInfo) {
          report.reportedUserName = reportedUserInfo.name;
          report.reportedUserAvatar = reportedUserInfo.avatar;
        }

        // Get assignee info
        if (report.assignees && report.assignees.length > 0) {
          report.assigneeInfo = [];
          for (const assigneeId of report.assignees) {
            const assigneeInfo = await getBasicUserInfo(assigneeId);
            if (assigneeInfo) {
              report.assigneeInfo.push({
                id: assigneeId,
                name: assigneeInfo.name,
                avatar: assigneeInfo.avatar,
              });
            } else {
              report.assigneeInfo.push({
                id: assigneeId,
                name: assigneeId,
                avatar: false,
              });
            }
          }
        }
      } catch (e) {
        logger.warn(`Error populating user info for report ${report.id}:`, e);
      }
    }

    res.send({
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error loading reports.");
  }
});

router.get("/reports/:id", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "seeModPanel")))
      return;

    const report = await models.Report.findOne({ id: req.params.id }).lean();

    if (!report) {
      res.status(404).send("Report not found.");
      return;
    }

    // Populate linked violation ticket if exists
    if (report.linkedViolationTicketId) {
      report.violationTicket = await models.ViolationTicket.findOne({
        id: report.linkedViolationTicketId,
      }).lean();
    }

    // Populate user information for reporter, reported user, and assignees
    try {
      // Get reporter info
      const reporterInfo = await getBasicUserInfo(report.reporterId);
      if (reporterInfo) {
        report.reporterName = reporterInfo.name;
        report.reporterAvatar = reporterInfo.avatar;
      }

      // Get reported user info
      const reportedUserInfo = await getBasicUserInfo(report.reportedUserId);
      if (reportedUserInfo) {
        report.reportedUserName = reportedUserInfo.name;
        report.reportedUserAvatar = reportedUserInfo.avatar;
      }

      // Get assignee info
      if (report.assignees && report.assignees.length > 0) {
        report.assigneeInfo = [];
        for (const assigneeId of report.assignees) {
          const assigneeInfo = await getBasicUserInfo(assigneeId);
          if (assigneeInfo) {
            report.assigneeInfo.push({
              id: assigneeId,
              name: assigneeInfo.name,
              avatar: assigneeInfo.avatar,
            });
          } else {
            report.assigneeInfo.push({
              id: assigneeId,
              name: assigneeId,
              avatar: false,
            });
          }
        }
      }
    } catch (e) {
      logger.warn(`Error populating user info for report ${report.id}:`, e);
    }

    res.send(report);
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error loading report.");
  }
});

router.post("/reports/:id/assign", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "seeModPanel")))
      return;

    const reportId = req.params.id;
    const { assignees } = req.body;

    if (!Array.isArray(assignees)) {
      res.status(400).send("Assignees must be an array.");
      return;
    }

    const report = await models.Report.findOne({ id: reportId });
    if (!report) {
      res.status(404).send("Report not found.");
      return;
    }

    // Validate all assignees exist and have seeModPanel permission
    const currentRank = await redis.getUserRank(userId);

    for (const assigneeId of assignees) {
      const assigneeExists = await models.User.findOne({
        id: assigneeId,
        deleted: false,
      }).select("id");

      if (!assigneeExists) {
        res.status(400).send(`User ${assigneeId} does not exist.`);
        return;
      }

      // Check if assigner can assign to this user (must have higher or equal rank)
      if (assigneeId !== userId) {
        const assigneeRank = await redis.getUserRank(assigneeId);
        if (
          assigneeRank === null ||
          currentRank === null ||
          currentRank < assigneeRank
        ) {
          res
            .status(403)
            .send(
              `You cannot assign users with rank ${
                assigneeRank || 0
              } or higher.`
            );
          return;
        }
      }

      // Verify assignee has seeModPanel permission
      const hasPermission = await routeUtils.verifyPermission(
        assigneeId,
        "seeModPanel"
      );
      if (!hasPermission) {
        res
          .status(400)
          .send(`User ${assigneeId} does not have permission to view reports.`);
        return;
      }
    }

    // Track changes
    const added = assignees.filter((a) => !report.assignees.includes(a));
    const removed = report.assignees.filter((a) => !assignees.includes(a));

    // Update assignees
    report.assignees = [...new Set(assignees)];
    report.updatedAt = Date.now();

    // Update status if needed
    if (report.status === "open" && assignees.length > 0) {
      report.status = "in-progress";
    }

    // Add history entry
    report.history.push({
      status: report.status,
      changedBy: userId,
      timestamp: Date.now(),
      action: "assignment",
      assigneesAdded: added,
      assigneesRemoved: removed,
    });

    await report.save();

    // Send notifications to new assignees
    for (const assigneeId of added) {
      await routeUtils.createNotification(
        {
          content: `You have been assigned to report #${report.id}`,
          icon: "flag",
          link: `/mod/reports/${report.id}`,
        },
        [assigneeId]
      );
    }

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error assigning report.");
  }
});

router.post("/reports/:id/status", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "seeModPanel")))
      return;

    const reportId = req.params.id;
    const { status } = req.body;

    if (!["open", "in-progress", "complete"].includes(status)) {
      res.status(400).send("Invalid status.");
      return;
    }

    const report = await models.Report.findOne({ id: reportId });
    if (!report) {
      res.status(404).send("Report not found.");
      return;
    }

    // Validate status transitions
    if (status === "complete" && report.status !== "complete") {
      res.status(400).send("Use /complete endpoint to mark as complete.");
      return;
    }

    const oldStatus = report.status;
    report.status = status;
    report.updatedAt = Date.now();

    if (status === "in-progress" && report.assignees.length === 0) {
      // Auto-assign to current user
      if (!report.assignees.includes(userId)) {
        report.assignees.push(userId);
      }
    }

    report.history.push({
      status: status,
      changedBy: userId,
      timestamp: Date.now(),
      action: "status_change",
      note: `Changed from ${oldStatus} to ${status}`,
    });

    await report.save();
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error updating status.");
  }
});

router.post("/reports/:id/complete", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "seeModPanel")))
      return;

    const reportId = req.params.id;
    const { finalRuling, dismissed } = req.body;

    const report = await models.Report.findOne({ id: reportId });
    if (!report) {
      res.status(404).send("Report not found.");
      return;
    }

    if (report.status === "complete") {
      res.status(400).send("Report is already complete.");
      return;
    }

    let violationTicket = null;
    let ban = null;
    let bans = null; // Array of bans for all alt accounts
    let violationId = null;
    let violationName = null;
    let banLengthStr = null;
    let violationDef = null;

    // If not dismissed, create violation ticket and ban
    if (!dismissed && finalRuling) {
      // Validate required fields
      if (!finalRuling.banType) {
        res.status(400).send("Ban type is required.");
        return;
      }

      // Get violation definition from report's rule
      const {
        violationDefinitions,
      } = require("../data/violations");
      violationDef = violationDefinitions.find((v) => v.name === report.rule);

      if (!violationDef) {
        res.status(400).send("Invalid rule - violation definition not found.");
        return;
      }

      // Get all alt account IDs (accounts sharing IPs)
      const altAccountIds = await routeUtils.getAltAccountIds(
        report.reportedUserId
      );

      // Count previous ACTIVE violations for this rule across all alt accounts
      // Only count violations that are still active (activeUntil > now)
      const now = Date.now();
      const previousViolations = await models.ViolationTicket.countDocuments({
        userId: { $in: altAccountIds },
        violationName: {
          $regex: new RegExp(
            `^${report.rule.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`
          ),
        },
        activeUntil: { $gt: now },
      });

      const offenseNumber = previousViolations + 1;

      // Generate violation name: rule name + offense number
      const ordinalSuffixes = ["th", "st", "nd", "rd"];
      const getOrdinal = (n) => {
        const v = n % 100;
        return (
          n +
          (ordinalSuffixes[(v - 20) % 10] ||
            ordinalSuffixes[v] ||
            ordinalSuffixes[0])
        );
      };
      violationName = `${report.rule} (${getOrdinal(offenseNumber)} Offense)`;

      // Generate random violation ID
      violationId = shortid.generate();

      // Get ban length from violations.js based on offense number
      const offenseIndex = Math.min(
        offenseNumber - 1,
        violationDef.offenses.length - 1
      );
      banLengthStr = violationDef.offenses[offenseIndex];

      // Parse ban length
      let banLengthMs;
      if (
        banLengthStr.toLowerCase() === "permaban" ||
        banLengthStr.toLowerCase() === "permanent" ||
        banLengthStr.toLowerCase() === "loss of privilege" ||
        banLengthStr === "-"
      ) {
        banLengthMs = Infinity;
      } else {
        banLengthMs = routeUtils.parseTime(banLengthStr);
        if (isNaN(banLengthMs)) {
          res.status(400).send(`Invalid ban length format: ${banLengthStr}`);
          return;
        }
      }

      // Handle permanent bans
      if (banLengthMs === Infinity || banLengthMs === 0) {
        banLengthMs = 0; // 0 means permanent in banUser function
      }

      // Determine permissions to ban based on banType (matching existing /ban endpoint)
      const banPermissions = {
        forum: [
          "vote",
          "createThread",
          "postReply",
          "deleteOwnPost",
          "editPost",
        ],
        chat: ["publicChat", "privateChat"],
        game: ["playGame"],
        ranked: ["playRanked"],
        competitive: ["playCompetitive"],
        site: ["signIn"],
      };

      const banDbTypes = {
        forum: "forum",
        chat: "chat",
        game: "game",
        ranked: "playRanked",
        competitive: "playCompetitive",
        site: "site",
      };

      const permissions = banPermissions[finalRuling.banType];
      const banDbType = banDbTypes[finalRuling.banType];

      if (!permissions) {
        res.status(400).send("Invalid ban type.");
        return;
      }

      // Check if admin has permission to ban this user
      const targetRank = await redis.getUserRank(report.reportedUserId);
      if (targetRank === null) {
        res.status(400).send("Reported user does not exist.");
        return;
      }

      const adminRank = await redis.getUserRank(userId);
      if (adminRank === null || adminRank <= targetRank) {
        res
          .status(403)
          .send("You do not have sufficient rank to ban this user.");
        return;
      }

      // Get all alt account IDs (accounts sharing IPs) - already fetched above
      // Create ban for all alt accounts if ban length > 0 (or permanent)
      if (banLengthMs >= 0 && permissions.length > 0) {
        // Apply ban to all alt accounts
        const banPromises = altAccountIds.map((altUserId) =>
          routeUtils.banUser(
            altUserId,
            banLengthMs,
            permissions,
            banDbType,
            userId
          )
        );
        bans = await Promise.all(banPromises);
        ban = bans[0]; // Use the first ban as the primary ban for linking

        // Update user banned flag for site bans on all alt accounts
        if (finalRuling.banType === "site") {
          await models.User.updateMany(
            { id: { $in: altAccountIds } },
            { $set: { banned: true } }
          ).exec();
          await models.Session.deleteMany({
            "session.user.id": { $in: altAccountIds },
          }).exec();
        }
      }

      // Calculate activeUntil based on violation category
      // Community violations: 6 months, Game violations: 3 months
      const category = violationDef.category || "Community";
      const activityPeriodMs =
        category === "Game"
          ? 3 * 30 * 24 * 60 * 60 * 1000 // 3 months
          : 6 * 30 * 24 * 60 * 60 * 1000; // 6 months
      const activeUntil = Date.now() + activityPeriodMs;

      // Get all alt account IDs (accounts sharing IPs) - already fetched above
      // Create violation tickets for all alt accounts (even if no ban was created)
      const violationTicketPromises = altAccountIds.map((altUserId, index) => {
        // Link to the corresponding ban if it exists
        const linkedBan = bans && index < bans.length ? bans[index] : ban;
        return routeUtils.createViolationTicket({
          userId: altUserId,
          modId: userId,
          banType: finalRuling.banType,
          violationId: violationId, // Same violation ID for all alt accounts
          violationName: violationName,
          violationCategory: category,
          notes: finalRuling.notes || "",
          length: banLengthMs === 0 ? Infinity : banLengthMs,
          expiresAt: linkedBan ? linkedBan.expires : null,
          activeUntil: activeUntil,
          linkedBanId: linkedBan ? linkedBan.id : null,
        });
      });
      const violationTickets = await Promise.all(violationTicketPromises);
      violationTicket = violationTickets[0]; // Use the first violation ticket as the primary one

      // Send notification to all alt accounts
      if (banLengthMs >= 0) {
        const banExpires =
          ban && ban.expires > 0 ? new Date(ban.expires) : null;
        const banMessage =
          banLengthMs === 0 || banLengthMs === Infinity
            ? "You have been permanently banned."
            : `Ban expires on ${
                banExpires ? banExpires.toLocaleString() : "N/A"
              }.`;

        await routeUtils.createNotification(
          {
            content: `You have received a ${violationName} violation. ${banMessage}`,
            icon: "ban",
            link: `/user/${report.reportedUserId}`,
          },
          altAccountIds // Notify all alt accounts
        );
      }

      report.finalRuling = {
        violationId: violationId,
        violationName: violationName,
        violationCategory: violationDef.category || "Community",
        banType: finalRuling.banType,
        banLength: banLengthStr,
        banLengthMs: banLengthMs === 0 ? Infinity : banLengthMs,
        notes: finalRuling.notes || "",
      };
      report.linkedViolationTicketId = violationTicket
        ? violationTicket.id
        : null;
      report.linkedBanId = ban ? ban.id : null;
    } else {
      report.finalRuling = null;
    }

    report.status = "complete";
    report.completedAt = Date.now();
    report.completedBy = userId;
    report.updatedAt = Date.now();

    report.history.push({
      status: "complete",
      changedBy: userId,
      timestamp: Date.now(),
      action: "completed",
      note: dismissed
        ? "Report dismissed - no violation"
        : `Violation: ${violationName}`,
    });

    await report.save();

    // Create mod action
    await routeUtils.createModAction(
      userId,
      dismissed ? "Complete Report (Dismissed)" : "Complete Report",
      [
        reportId,
        report.reportedUserId,
        report.finalRuling?.violationId || "dismissed",
      ]
    );

    res.send({
      report,
      violationTicket: violationTicket ? violationTicket.toJSON() : null,
      ban: ban ? ban.toJSON() : null,
    });
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error completing report.");
  }
});

router.post("/reports/:id/reopen", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "seeModPanel")))
      return;

    const reportId = req.params.id;
    const { newStatus } = req.body;

    const report = await models.Report.findOne({ id: reportId });
    if (!report) {
      res.status(404).send("Report not found.");
      return;
    }

    if (report.status !== "complete") {
      res.status(400).send("Only completed reports can be reopened.");
      return;
    }

    const targetStatus = newStatus || "in-progress";
    if (!["open", "in-progress"].includes(targetStatus)) {
      res.status(400).send("New status must be 'open' or 'in-progress'.");
      return;
    }

    report.status = targetStatus;
    report.reopenedAt = Date.now();
    report.reopenedBy = userId;
    report.reopenedCount = (report.reopenedCount || 0) + 1;
    report.updatedAt = Date.now();

    // Clear completion fields (but keep finalRuling for reference)
    // Optionally clear assignees if reopening to "open"
    if (targetStatus === "open") {
      report.assignees = [];
    } else if (report.assignees.length === 0) {
      // Auto-assign to reopening user
      report.assignees = [userId];
    }

    report.history.push({
      status: targetStatus,
      changedBy: userId,
      timestamp: Date.now(),
      action: "reopened",
      note: `Reopened from complete. Previous ruling: ${
        report.finalRuling ? report.finalRuling.violationName : "Dismissed"
      }`,
    });

    await report.save();

    // Notify previous assignees
    const previousAssignees = report.history
      .filter((h) => h.action === "assignment")
      .flatMap((h) => h.assigneesAdded || [])
      .filter((id, index, self) => self.indexOf(id) === index); // Unique

    for (const assigneeId of previousAssignees) {
      if (assigneeId !== userId) {
        await routeUtils.createNotification(
          {
            content: `Report #${report.id} has been reopened`,
            icon: "flag",
            link: `/mod/reports/${report.id}`,
          },
          [assigneeId]
        );
      }
    }

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error reopening report.");
  }
});

module.exports = router;
