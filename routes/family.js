const express = require("express");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const models = require("../db/models");
const logger = require("../modules/logging")(".");
const router = express.Router();
const shortid = require("shortid");
const bluebird = require("bluebird");
const formidable = bluebird.promisifyAll(require("formidable"), {
  multiArgs: true,
});
const sharp = require("sharp");
const fs = require("fs");

router.get("/user/family", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    
    if (!userId) {
      res.send({ family: null });
      return;
    }

    var user = await models.User.findOne({ id: userId });
    if (!user) {
      res.send({ family: null });
      return;
    }

    const inFamily = await models.InFamily.findOne({
      user: user._id,
    }).populate("family", "id name avatar leader members");

    if (!inFamily || !inFamily.family) {
      res.send({ family: null });
      return;
    }

    const family = inFamily.family;
    const isLeader = family.leader && family.leader.toString() === user._id.toString();
    const memberCount = family.members ? family.members.length : 0;

    res.send({
      family: {
        id: family.id,
        name: family.name,
        avatar: family.avatar,
        background: family.background || false,
        backgroundRepeatMode: family.backgroundRepeatMode || "checker",
        isLeader: isLeader,
        memberCount: memberCount,
      },
    });
  } catch (e) {
    logger.error(e);
    res.send({ family: null });
  }
});

router.post("/create", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var user = await models.User.findOne({ id: userId }).select(
      "itemsOwned"
    );

    if (!user.itemsOwned.createFamily) {
      res.status(500);
      res.send("You must purchase 'Create Family' from the Shop.");
      return;
    }

    // Check if user already has a family
    const existingFamily = await models.InFamily.findOne({
      user: user._id,
    });

    if (existingFamily) {
      res.status(500);
      res.send("You already belong to a family.");
      return;
    }

    const { name } = req.body;

    if (!name || !name.trim()) {
      res.status(500);
      res.send("Family name is required.");
      return;
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 20) {
      res.status(500);
      res.send("Family name must be 20 characters or less.");
      return;
    }

    const familyId = shortid.generate();
    
    // Check if user has a pending avatar upload
    const pendingAvatarPath = `${process.env.UPLOAD_PATH}/pending_${userId}_family_avatar.webp`;
    let hasAvatar = false;
    
    if (fs.existsSync(pendingAvatarPath)) {
      // Move the pending avatar to the family ID
      const familyAvatarPath = `${process.env.UPLOAD_PATH}/${familyId}_family_avatar.webp`;
      fs.renameSync(pendingAvatarPath, familyAvatarPath);
      hasAvatar = true;
    }

    const family = new models.Family({
      id: familyId,
      name: trimmedName,
      founder: user._id,
      leader: user._id,
      members: [user._id],
      avatar: hasAvatar,
      createdAt: Date.now(),
    });

    await family.save();

    // Add user to family
    const inFamily = new models.InFamily({
      user: user._id,
      family: family._id,
    });
    await inFamily.save();

    res.send({ familyId: familyId });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error creating family.");
  }
});

router.post("/avatar", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var user = await models.User.findOne({ id: userId }).select("itemsOwned");

    // Check if user has purchased createFamily
    if (!user.itemsOwned.createFamily) {
      res.status(500);
      res.send("You must purchase 'Create Family' from the Shop.");
      return;
    }

    // Check if user already has a family
    const inFamily = await models.InFamily.findOne({
      user: user._id,
    }).populate("family");

    let familyId;
    let isExistingFamily = false;

    if (inFamily && inFamily.family) {
      // User has an existing family, check if they're the leader
      const family = inFamily.family;
      if (family.leader.toString() !== user._id.toString()) {
        res.status(500);
        res.send("Only the family leader can upload an avatar.");
        return;
      }
      familyId = family.id;
      isExistingFamily = true;
    } else {
      // User doesn't have a family yet, store avatar temporarily with user ID
      familyId = `pending_${userId}`;
    }

    var form = new formidable();
    form.maxFileSize = 1024 * 1024;
    form.maxFields = 1;

    var [fields, files] = await form.parseAsync(req);

    if (!fs.existsSync(`${process.env.UPLOAD_PATH}`))
      fs.mkdirSync(`${process.env.UPLOAD_PATH}`);

    await sharp(files.image.path)
      .webp({ quality: 100 })
      .resize(100, 100, {
        kernel: sharp.kernel.lanczos3,
        fit: "cover",
        position: "center",
      })
      .toFile(`${process.env.UPLOAD_PATH}/${familyId}_family_avatar.webp`);

    // If it's an existing family, update the database
    if (isExistingFamily) {
      await models.Family.updateOne(
        { id: familyId },
        { $set: { avatar: true } }
      );
    }

    res.sendStatus(200);
  } catch (e) {
    res.status(500);

    if (e.message && e.message.indexOf("maxFileSize exceeded") === 0)
      res.send("Image is too large, avatar must be less than 1 MB.");
    else {
      logger.error(e);
      res.send("Error uploading family avatar image.");
    }
  }
});

router.get("/:familyId/profile", async function (req, res) {
  try {
    var familyId = req.params.familyId;
    var userId = await routeUtils.verifyLoggedIn(req, true);

    var family = await models.Family.findOne({ id: familyId })
      .populate("founder", "id name avatar vanityUrl")
      .populate("leader", "id name avatar vanityUrl")
      .populate("members", "id name avatar vanityUrl");

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    // Check if leader is populated (required)
    if (!family.leader) {
      logger.error("Family leader not populated", { familyId });
      res.status(500);
      res.send("Error loading family profile: missing leader data.");
      return;
    }

    // If founder doesn't exist (for old families), use leader as founder
    if (!family.founder) {
      family.founder = family.leader;
      // Optionally update the database to set founder
      await models.Family.updateOne(
        { id: familyId },
        { $set: { founder: family.leader._id } }
      );
    }

    var user = userId ? await models.User.findOne({ id: userId }) : null;
    var isLeader = user && family.leader._id.toString() === user._id.toString();
    var leaderId = family.leader.id;
    var founderId = family.founder.id;

    // Get member info with leader/founder flags
    var members = (family.members || []).map((member) => ({
      id: member.id,
      name: member.name,
      avatar: member.avatar,
      vanityUrl: member.vanityUrl,
      isLeader: member.id === leaderId,
      isFounder: member.id === founderId,
    }));

    // Get all trophies from all family members, sorted by createdAt
    var memberIds = [];
    if (family.members && family.members.length > 0) {
      memberIds = family.members
        .filter((member) => member && member.id) // Filter out any null/undefined members
        .map((member) => member.id);
    }
    
    // If no members, return empty trophies array
    var allTrophies = [];
    if (memberIds.length > 0) {
      try {
        allTrophies = await models.Trophy.find({ ownerId: { $in: memberIds } })
          .populate("owner", "id name avatar vanityUrl")
          .select("id name ownerId owner createdAt -_id")
          .sort("-createdAt")
          .lean();
      } catch (trophyError) {
        logger.error("Error fetching family trophies:", trophyError);
        allTrophies = [];
      }
    }

    var trophies = (allTrophies || []).map((trophy) => ({
      id: trophy.id,
      name: trophy.name,
      ownerId: trophy.ownerId,
      owner: trophy.owner
        ? {
            id: trophy.owner.id,
            name: trophy.owner.name,
            avatar: trophy.owner.avatar,
            vanityUrl: trophy.owner.vanityUrl,
          }
        : null,
      createdAt: trophy.createdAt,
    }));

    res.send({
      id: family.id,
      name: family.name,
      avatar: family.avatar,
      background: family.background || false,
      backgroundRepeatMode: family.backgroundRepeatMode || "checker",
      bio: family.bio,
      founder: {
        id: family.founder.id,
        name: family.founder.name,
        avatar: family.founder.avatar,
        vanityUrl: family.founder.vanityUrl,
      },
      leader: {
        id: family.leader.id,
        name: family.leader.name,
        avatar: family.leader.avatar,
        vanityUrl: family.leader.vanityUrl,
      },
      members: members,
      trophies: trophies || [],
      isLeader: isLeader,
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading family profile.");
  }
});

router.post("/:familyId/bio", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;

    var family = await models.Family.findOne({ id: familyId });

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    var user = await models.User.findOne({ id: userId });
    if (family.leader.toString() !== user._id.toString()) {
      res.status(500);
      res.send("Only the family leader can edit the bio.");
      return;
    }

    const { bio } = req.body;

    if (bio && bio.length > 20000) {
      res.status(500);
      res.send("Family bio must be 20,000 characters or less.");
      return;
    }

    await models.Family.updateOne({ id: familyId }, { $set: { bio: bio || "" } });

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error updating family bio.");
  }
});

router.post("/:familyId/transferLeadership", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;
    var { newLeaderId } = req.body;

    if (!newLeaderId) {
      res.status(500);
      res.send("New leader ID is required.");
      return;
    }

    var family = await models.Family.findOne({ id: familyId })
      .populate("members", "id");

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    var user = await models.User.findOne({ id: userId });
    if (family.leader.toString() !== user._id.toString()) {
      res.status(500);
      res.send("Only the current leader can transfer leadership.");
      return;
    }

    var newLeader = await models.User.findOne({ id: newLeaderId });
    if (!newLeader) {
      res.status(404);
      res.send("New leader not found.");
      return;
    }

    // Check if new leader is a member of the family
    var isMember = family.members.some(
      (member) => member.id === newLeaderId
    );
    if (!isMember) {
      res.status(500);
      res.send("The new leader must be a member of the family.");
      return;
    }

    // Transfer leadership
    await models.Family.updateOne(
      { id: familyId },
      { $set: { leader: newLeader._id } }
    );

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error transferring leadership.");
  }
});

router.delete("/:familyId/member/:memberId", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;
    var memberId = req.params.memberId;

    var user = await models.User.findOne({ id: userId });
    var family = await models.Family.findOne({ id: familyId });

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    // Check if user is the leader
    if (family.leader.toString() !== user._id.toString()) {
      res.status(500);
      res.send("Only the family leader can remove members.");
      return;
    }

    // Find the member to remove
    var memberToRemove = await models.User.findOne({ id: memberId });
    if (!memberToRemove) {
      res.status(404);
      res.send("Member not found.");
      return;
    }

    // Check if member is actually in the family
    var inFamily = await models.InFamily.findOne({
      user: memberToRemove._id,
      family: family._id,
    });

    if (!inFamily) {
      res.status(500);
      res.send("User is not a member of this family.");
      return;
    }

    // Cannot remove the leader
    if (family.leader.toString() === memberToRemove._id.toString()) {
      res.status(500);
      res.send("Cannot remove the family leader. Transfer leadership first.");
      return;
    }

    // Remove member from family
    await models.InFamily.deleteOne({
      user: memberToRemove._id,
      family: family._id,
    });

    // Remove from members array
    await models.Family.updateOne(
      { id: familyId },
      { $pull: { members: memberToRemove._id } }
    );

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error removing member from family.");
  }
});

router.delete("/:familyId", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;

    var user = await models.User.findOne({ id: userId });
    var family = await models.Family.findOne({ id: familyId });

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    if (family.leader.toString() !== user._id.toString()) {
      res.status(500);
      res.send("Only the family leader can delete the family.");
      return;
    }

    // Remove all members from the family
    await models.InFamily.deleteMany({ family: family._id });

    // Delete all pending join requests
    await models.FamilyJoinRequest.deleteMany({ family: family._id });

    // Delete the family avatar if it exists
    const avatarPath = `${process.env.UPLOAD_PATH}/${familyId}_family_avatar.webp`;
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }

    // Delete the family
    await models.Family.deleteOne({ id: familyId });

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error deleting family.");
  }
});

router.post("/:familyId/requestJoin", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;
    var targetUserId = String(req.body.targetUserId);

    var family = await models.Family.findOne({ id: familyId })
      .populate("leader", "id name")
      .populate("members");

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    // Check if requester is the leader
    var requester = await models.User.findOne({ id: userId });
    if (family.leader._id.toString() !== requester._id.toString()) {
      res.status(500);
      res.send("Only the family leader can send join requests.");
      return;
    }

    // Check if family is at member limit (20 members)
    const currentMemberCount = family.members.length;
    if (currentMemberCount >= 20) {
      res.status(500);
      res.send("This family has reached the maximum of 20 members.");
      return;
    }

    // Check if target user is already a member
    var targetUser = await models.User.findOne({ id: targetUserId });
    if (!targetUser) {
      res.status(404);
      res.send("Target user not found.");
      return;
    }

    var isMember = await models.InFamily.findOne({
      user: targetUser._id,
      family: family._id,
    });

    if (isMember) {
      res.status(500);
      res.send("User is already a member of this family.");
      return;
    }

    // Check if there's already a pending request
    var existingRequest = await models.FamilyJoinRequest.findOne({
      familyId: familyId,
      requesterId: targetUserId,
    });

    if (existingRequest) {
      res.status(500);
      res.send("A join request has already been sent to this user.");
      return;
    }

    // Create join request
    var joinRequest = new models.FamilyJoinRequest({
      familyId: familyId,
      family: family._id,
      requesterId: targetUserId,
      requester: targetUser._id,
      createdAt: Date.now(),
    });
    await joinRequest.save();

    // Create notification
    var requesterName = await redis.getUserName(userId);
    await routeUtils.createNotification(
      {
        content: `${requesterName} invited you to join ${family.name}!`,
        icon: "fas fa-users",
        link: `/user/family/${familyId}`,
      },
      [targetUserId]
    );

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error sending join request.");
  }
});

router.post("/:familyId/acceptJoin", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;

    var family = await models.Family.findOne({ id: familyId });

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    var user = await models.User.findOne({ id: userId });

    // Check if there's a pending request for this user
    var joinRequest = await models.FamilyJoinRequest.findOne({
      familyId: familyId,
      requesterId: userId,
    });

    if (!joinRequest) {
      res.status(404);
      res.send("No pending join request found.");
      return;
    }

    // Check if family is at member limit (20 members)
    const currentMemberCount = family.members.length;
    if (currentMemberCount >= 20) {
      res.status(500);
      res.send("This family has reached the maximum of 20 members.");
      return;
    }

    // Add user to family
    var inFamily = new models.InFamily({
      user: user._id,
      family: family._id,
    });
    await inFamily.save();

    // Update family members array
    await models.Family.updateOne(
      { id: familyId },
      { $push: { members: user._id } }
    );

    // Delete the join request
    await models.FamilyJoinRequest.deleteOne({ _id: joinRequest._id });

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error accepting join request.");
  }
});

router.post("/:familyId/leave", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;

    var user = await models.User.findOne({ id: userId });
    var family = await models.Family.findOne({ id: familyId });

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    // Check if user is a member
    var inFamily = await models.InFamily.findOne({
      user: user._id,
      family: family._id,
    });

    if (!inFamily) {
      res.status(500);
      res.send("You are not a member of this family.");
      return;
    }

    // Cannot leave if you are the leader
    if (family.leader.toString() === user._id.toString()) {
      res.status(500);
      res.send("The family leader cannot leave. Transfer leadership or delete the family instead.");
      return;
    }

    // Remove member from family
    await models.InFamily.deleteOne({
      user: user._id,
      family: family._id,
    });

    // Remove from members array
    await models.Family.updateOne(
      { id: familyId },
      { $pull: { members: user._id } }
    );

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error leaving family.");
  }
});

router.post("/:familyId/rejectJoin", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;

    var joinRequest = await models.FamilyJoinRequest.findOne({
      familyId: familyId,
      requesterId: userId,
    });

    if (!joinRequest) {
      res.status(404);
      res.send("No pending join request found.");
      return;
    }

    // Delete the join request
    await models.FamilyJoinRequest.deleteOne({ _id: joinRequest._id });

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error rejecting join request.");
  }
});

router.get("/:familyId/pendingInvite", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var familyId = req.params.familyId;

    if (!userId) {
      res.send({ hasPendingInvite: false });
      return;
    }

    var joinRequest = await models.FamilyJoinRequest.findOne({
      familyId: familyId,
      requesterId: userId,
    })
      .populate("family", "id name avatar")
      .populate("requester", "id name avatar");

    if (!joinRequest) {
      res.send({ hasPendingInvite: false });
      return;
    }

    res.send({
      hasPendingInvite: true,
      family: {
        id: joinRequest.family.id,
        name: joinRequest.family.name,
        avatar: joinRequest.family.avatar,
      },
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error checking pending invite.");
  }
});

router.post("/:familyId/background", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;

    var user = await models.User.findOne({ id: userId });
    var family = await models.Family.findOne({ id: familyId });

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    // Check if user is the leader
    if (family.leader.toString() !== user._id.toString()) {
      res.status(500);
      res.send("Only the family leader can upload a background.");
      return;
    }

    var form = new formidable();
    form.maxFileSize = 5 * 1024 * 1024; // 5 MB
    form.maxFields = 1;

    var [fields, files] = await form.parseAsync(req);

    if (!fs.existsSync(`${process.env.UPLOAD_PATH}`))
      fs.mkdirSync(`${process.env.UPLOAD_PATH}`);

    await sharp(files.image.path)
      .webp({ quality: 100 })
      .toFile(`${process.env.UPLOAD_PATH}/${familyId}_familyBackground.webp`);

    await models.Family.updateOne(
      { id: familyId },
      { $set: { background: true } }
    );

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);

    if (e.message.indexOf("maxFileSize exceeded") == 0)
      res.send("Image is too large, background must be less than 5 MB.");
    else res.send("Error uploading family background.");
  }
});

router.delete("/:familyId/background", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;

    var user = await models.User.findOne({ id: userId });
    var family = await models.Family.findOne({ id: familyId });

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    // Check if user is the leader
    if (family.leader.toString() !== user._id.toString()) {
      res.status(500);
      res.send("Only the family leader can remove the background.");
      return;
    }

    // Delete the background file
    const backgroundPath = `${process.env.UPLOAD_PATH}/${familyId}_familyBackground.webp`;
    if (fs.existsSync(backgroundPath)) {
      fs.unlinkSync(backgroundPath);
    }

    await models.Family.updateOne(
      { id: familyId },
      { $set: { background: false } }
    );

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error removing family background.");
  }
});

router.post("/:familyId/backgroundRepeatMode", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;
    var { backgroundRepeatMode } = req.body;

    var user = await models.User.findOne({ id: userId });
    var family = await models.Family.findOne({ id: familyId });

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    // Check if user is the leader
    if (family.leader.toString() !== user._id.toString()) {
      res.status(500);
      res.send("Only the family leader can change the background display mode.");
      return;
    }

    if (backgroundRepeatMode !== "checker" && backgroundRepeatMode !== "stretch") {
      res.status(500);
      res.send("Invalid background repeat mode. Must be 'checker' or 'stretch'.");
      return;
    }

    await models.Family.updateOne(
      { id: familyId },
      { $set: { backgroundRepeatMode: backgroundRepeatMode } }
    );

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error updating background repeat mode.");
  }
});

module.exports = router;

