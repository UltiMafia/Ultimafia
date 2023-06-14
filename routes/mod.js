const express = require("express");
const shortid = require("shortid");
const constants = require("../data/constants");
const models = require("../db/models");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const gameLoadBalancer = require("../modules/gameLoadBalancer");
const logger = require("../modules/logging")(".");

const router = express.Router();

router.get("/groups", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    let visibleGroups = await models.Group.find({ visible: true }).select(
      "name rank badge badgeColor"
    );
    visibleGroups = visibleGroups.map((group) => group.toJSON());

    for (const group of visibleGroups) {
      group.members = await models.InGroup.find({ group: group._id })
        .select("user")
        .populate("user", "id name avatar -_id");
      group.members = group.members.map((member) => member.toJSON().user);

      for (const member of group.members)
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

router.get("/groupPerms", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const perm = "viewPerms";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    const name = routeUtils.capitalizeWords(String(req.query.name));
    const group = await models.Group.findOne({ name }).select("permissions");

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

router.get("/userPerms", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const perm = "viewPerms";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    const userIdToGet = String(req.query.userId);
    const permInfo = await redis.getUserPermissions(userIdToGet);

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

router.post("/group", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const name = routeUtils.capitalizeWords(String(req.body.name));
    const rank = Number(req.body.rank);
    const badge = String(req.body.badge || "");
    const badgeColor = String(req.body.badgeColor || "");
    const perm = "createGroup";

    if (!(await routeUtils.verifyPermission(res, userId, perm, rank + 1)))
      return;

    let permissions = req.body.permissions || [];

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

    for (const perm of permissions) {
      if (!constants.allPerms[perm]) {
        res.status(500);
        res.send(`"${perm}" is not a valid permission.`);
        return;
      }
    }

    const existingGroup = await models.Group.findOne({ name }).select("_id");

    if (existingGroup) {
      res.status(500);
      res.send("A group with this name already exists.");
      return;
    }

    const group = new models.Group({
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

router.post("/group/delete", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const name = routeUtils.capitalizeWords(String(req.body.name));
    const perm = "deleteGroup";

    const group = await models.Group.findOne({ name }).select("id rank");

    if (!group) {
      res.status(500);
      res.send("Group not found.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, group.rank + 1)))
      return;

    let members = await models.InGroup.find({ group: group._id })
      .select("user")
      .populate("user", "id");
    members = members.map((m) => m.user.id);

    await models.Group.deleteOne({ id: group.id }).exec();
    await models.InGroup.deleteMany({ group: group._id }).exec();

    for (const member of members) await redis.cacheUserPermissions(member);

    routeUtils.createModAction(userId, "Delete Group", [name]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error deleting group.");
  }
});

router.post("/groupPerms", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const groupName = routeUtils.capitalizeWords(String(req.body.groupName));
    const perm = "updateGroupPerms";

    const group = await models.Group.findOne({ name: groupName }).select(
      "rank"
    );

    if (!group) {
      res.status(500);
      res.send("Group does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, group.rank + 1)))
      return;

    let addPermissions = req.body.addPermissions || [];
    let removePermissions = req.body.removePermissions || [];

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

    const userPermissionInfo = await redis.getUserPermissions(userId);
    const userPermissions = userPermissionInfo.perms;
    const userRank = userPermissionInfo.rank;

    for (const perm of addPermissions.concat(removePermissions)) {
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

router.post("/addToGroup", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const groupName = routeUtils.capitalizeWords(String(req.body.groupName));
    const userIdToAdd = String(req.body.userId);
    const perm = "giveGroup";

    const group = await models.Group.findOne({ name: groupName }).select(
      "rank"
    );

    if (!group) {
      res.status(500);
      res.send("Group does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, group.rank + 1)))
      return;

    const userToAdd = await models.User.findOne({
      id: userIdToAdd,
      deleted: false,
    }).select("_id");

    if (!userToAdd) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    let inGroup = await models.InGroup.findOne({
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

router.post("/removeFromGroup", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const groupName = routeUtils.capitalizeWords(String(req.body.groupName));
    const userIdToRemove = String(req.body.userId);
    const perm = "removeFromGroup";

    const group = await models.Group.findOne({ name: groupName }).select(
      "rank"
    );

    if (!group) {
      res.status(500);
      res.send("Group does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, group.rank + 1)))
      return;

    const userToRemove = await models.User.findOne({
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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToBan = String(req.body.userId);
    const lengthStr = String(req.body.length);
    const perm = "forumBan";
    const banRank = await redis.getUserRank(userIdToBan);

    if (banRank == null) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm, banRank + 1)))
      return;

    const length = routeUtils.parseTime(lengthStr);

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToBan = String(req.body.userId);
    const lengthStr = String(req.body.length);
    const perm = "chatBan";
    const banRank = await redis.getUserRank(userIdToBan);

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToBan = String(req.body.userId);
    const lengthStr = String(req.body.length);
    const perm = "gameBan";
    const banRank = await redis.getUserRank(userIdToBan);

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToBan = String(req.body.userId);
    const lengthStr = String(req.body.length);
    const perm = "rankedBan";
    const banRank = await redis.getUserRank(userIdToBan);

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

router.post("/siteBan", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToBan = String(req.body.userId);
    const lengthStr = String(req.body.length);
    const perm = "siteBan";
    const banRank = (await redis.getUserRank(userIdToBan)) || 0;

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToActOn = String(req.body.userId);
    const perm = "forceSignOut";
    const rank = await redis.getUserRank(userIdToActOn);

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToActOn = String(req.body.userId);
    const perm = "forumUnban";
    const rank = await redis.getUserRank(userIdToActOn);

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToActOn = String(req.body.userId);
    const perm = "chatUnban";
    const rank = await redis.getUserRank(userIdToActOn);

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToActOn = String(req.body.userId);
    const perm = "gameUnban";
    const rank = await redis.getUserRank(userIdToActOn);

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToActOn = String(req.body.userId);
    const perm = "rankedUnban";
    const rank = await redis.getUserRank(userIdToActOn);

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

router.post("/siteUnban", async (req, res) => {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToActOn = String(req.body.userId);
    const perm = "siteUnban";
    const rank = await redis.getUserRank(userIdToActOn);

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToActOn = String(req.body.userId);
    const perm = "whitelist";

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToActOn = String(req.body.userId);
    const perm = "whitelist";

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToActOn = String(req.query.userId);
    const perm = "viewAlts";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    const user = await models.User.findOne({
      id: userIdToActOn /* , deleted: false */,
    }).select("ip");

    if (!user) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    const ips = user.ip;
    const users = await models.User.find({
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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToActOn = String(req.query.userId);
    const perm = "viewBans";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    const user = await models.User.findOne({
      id: userIdToActOn,
      deleted: false,
    }).select("_id");

    if (!user) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    const bans = await models.Ban.find({
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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToActOn = String(req.query.userId);
    const perm = "viewFlagged";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    const user = await models.User.findOne({
      id: userIdToActOn /* , deleted: false */,
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
    const userId = await routeUtils.verifyLoggedIn(req);
    const setupId = String(req.body.setupId);
    const perm = "clearSetupName";

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToClear = String(req.body.userId);
    const perm = "clearBio";

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToClear = String(req.body.userId);
    const perm = "clearBio";

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToClear = String(req.body.userId);
    const perm = "clearBio";

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToClear = String(req.body.userId);
    const perm = "clearAvi";

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToClear = String(req.body.userId);
    const perm = "clearAccountDisplay";

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToClear = String(req.body.userId);
    const perm = "clearName";

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToClear = String(req.body.userId);
    const perm = "clearAllUserContent";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    const user = await models.User.findOne({ id: userIdToClear }).select("_id");

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const gameToClear = String(req.body.gameId);
    const perm = "breakGame";

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const port = String(req.body.port);
    const perm = "breakPortGames";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    const games = await redis.getAllGames();

    for (const game of games) {
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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToKick = String(req.body.userId);
    const perm = "kick";

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const perm = "clearAllIPs";

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToGiveTo = String(req.body.userId);
    const amount = Number(req.body.amount);
    const perm = "giveCoins";

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
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToChange = String(req.body.userId);
    const name = String(req.body.name);
    const perm = "changeUsersName";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    await models.User.updateOne(
      { id: userIdToChange },
      { $set: { name } }
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
    const userId = await routeUtils.verifyLoggedIn(req);
    const when = routeUtils.parseTime(String(req.body.when)) + Date.now();
    const perm = "scheduleRestart";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    if (when <= Date.now()) {
      res.status(500);
      res.send("Restarts must be scheduled for the future.");
      return;
    }

    const restart = new models.Restart({ when });
    await restart.save();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error scheduling restart.");
  }
});

router.get("/actions", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const last = Number(req.query.last);
    const first = Number(req.query.first);

    const actions = await routeUtils.modelPageQuery(
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

router.get("/announcements", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const last = Number(req.query.last);
    const first = Number(req.query.first);

    const announcements = await routeUtils.modelPageQuery(
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

router.post("/announcement", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const content = String(req.body.content);
    const perm = "announce";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    if (content.length > constants.maxAnnouncementLength) {
      res.status(500);
      res.send("Announcement is too long.");
      return;
    }

    const announcement = new models.Announcement({
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

router.post("/blockName", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const name = String(req.body.name);
    const perm = "blockName";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    if (name.length > constants.maxUserNameLength) {
      res.status(500);
      res.send("Name is too long.");
      return;
    }

    const blockedName = new models.BlockedName({ name });
    await blockedName.save();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error blocking name.");
  }
});

router.post("/rankedApprove", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const userIdToApprove = String(req.body.userId);
    const perm = "approveRanked";

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    const userToApprove = await models.User.findOne({
      id: userIdToApprove,
      deleted: false,
    }).select("_id");

    if (!userToApprove) {
      res.status(500);
      res.send("User does not exist.");
      return;
    }

    const group = await models.Group.findOne({ name: "Ranked Player" }).select(
      "_id"
    );
    let inGroup = await models.InGroup.findOne({
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

module.exports = router;
