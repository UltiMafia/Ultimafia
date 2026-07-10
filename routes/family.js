const express = require("express");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const models = require("../db/models");
const logger = require("../modules/logging")(".");
const stockMarket = require("../lib/StockMarket");
const router = express.Router();
const shortid = require("shortid");
const bluebird = require("bluebird");
const formidable = bluebird.promisifyAll(require("formidable"), {
  multiArgs: true,
});
const sharp = require("sharp");
const fs = require("fs");
const errors = require("../lib/errors");

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
    });

    if (!inFamily || !inFamily.family) {
      res.send({ family: null });
      return;
    }

    // Get family ID - handle both populated and unpopulated references
    const familyId = inFamily.family._id || inFamily.family;

    // Query family directly and populate leader properly
    const family = await models.Family.findById(familyId)
      .select("id name avatar leader members background backgroundRepeatMode")
      .populate("leader", "_id");

    if (!family) {
      res.send({ family: null });
      return;
    }

    const isLeader =
      family.leader &&
      family.leader._id &&
      family.leader._id.toString() === user._id.toString();
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
    var user = await models.User.findOne({ id: userId }).select("itemsOwned");

    if (!user.itemsOwned.createFamily) {
      errors.forbidden(res, "You must purchase 'Create Family' from the Shop.");
      return;
    }

    // Check if user already has a family
    const existingFamily = await models.InFamily.findOne({
      user: user._id,
    });

    if (existingFamily) {
      errors.conflict(res, "You already belong to a family.");
      return;
    }

    const { name } = req.body;

    if (!name || !name.trim()) {
      errors.unprocessable(res, "Family name is required.");
      return;
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 20) {
      errors.unprocessable(res, "Family name must be 20 characters or less.");
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
      role: "leader",
    });
    await inFamily.save();



    res.send({ familyId: familyId });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not create family. Please try again or contact support if this persists.");
  }
});

router.post("/avatar", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var user = await models.User.findOne({ id: userId }).select("itemsOwned");

    // Check if user has purchased createFamily
    if (!user.itemsOwned.createFamily) {
      errors.forbidden(res, "You must purchase 'Create Family' from the Shop.");
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
        errors.forbidden(res, "Only the family leader can upload an avatar.");
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
    if (e.message && e.message.indexOf("maxFileSize exceeded") === 0) {
      errors.payloadTooLarge(res, "Image is too large, avatar must be less than 1 MB.");
    } else {
      logger.error(e);
      errors.serverError(res, "Could not upload family avatar image. Please try again.");
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
      .populate("members", "id name avatar vanityUrl")
      .select("id name avatar background backgroundRepeatMode applicationsOpen joinFee pendingJoinFees treasury perks bio founder leader members trophies createdAt");

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    // Check if leader is populated (required)
    if (!family.leader) {
      logger.error("Family leader not populated", { familyId });
      errors.serverError(res, "Could not load family profile: missing leader data.");
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
        allTrophies = await models.Trophy.find({
          ownerId: { $in: memberIds },
          revoked: { $ne: true },
        })
          .populate("owner", "id name avatar vanityUrl")
          .select("id name ownerId owner type createdAt -_id")
          .sort("-createdAt")
          .lean();
      } catch (trophyError) {
        logger.error("Error fetching family trophies:", trophyError);
        allTrophies = [];
      }
    }
    
    var trophyCount = allTrophies.length;

    var trophies = (allTrophies || []).map((trophy) => ({
      id: trophy.id,
      name: trophy.name,
      ownerId: trophy.ownerId,
      type: trophy.type || "silver", // Default to silver for backward compatibility
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

    var canManageApplications = isLeader;
    if (!canManageApplications && user) {
      var inFam = await models.InFamily.findOne({
        user: user._id,
        family: family._id,
      });
      if (inFam && inFam.role === "officer") {
        canManageApplications = true;
      }
    }

    var userRole = null;
    if (user) {
      if (family.founder.id === user.id) userRole = "founder";
      else if (family.leader.id === user.id) userRole = "leader";
      else if (members.some((m) => m.id === user.id)) userRole = "member";
    }

    var treasuryCoins = family.treasury || 0;

    res.send({
      id: family.id,
      name: family.name,
      avatar: family.avatar,
      background: family.background || false,
      backgroundRepeatMode: family.backgroundRepeatMode || "checker",
      applicationsOpen: family.applicationsOpen,
      joinFee: family.joinFee,
      pendingJoinFees: family.pendingJoinFees || 0,
      treasury: treasuryCoins,
      perks: getFamilyPerks(family),
      memberLimit: getFamilyMemberLimit(family),
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
      quests: buildFamilyQuests(family, trophyCount, treasuryCoins),
      trophies: trophies || [],
      isLeader: isLeader,
      canManageApplications: canManageApplications,
      userRole: userRole,
      stockInfo: await buildFamilyStockInfo(familyId, userId),
    });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Failed to load family profile. Please refresh and try again.");
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
      errors.forbidden(res, "Only the family leader can edit the bio.");
      return;
    }

    const { bio } = req.body;

    if (bio && bio.length > 20000) {
      errors.unprocessable(res, "Family bio must be 20,000 characters or less.");
      return;
    }

    await models.Family.updateOne(
      { id: familyId },
      { $set: { bio: bio || "" } }
    );

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not update family bio. Please try again.");
  }
});

router.post("/:familyId/transferLeadership", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;
    var { newLeaderId } = req.body;

    if (!newLeaderId) {
      errors.unprocessable(res, "New leader ID is required.");
      return;
    }

    var family = await models.Family.findOne({ id: familyId }).populate(
      "members",
      "id"
    );

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    var user = await models.User.findOne({ id: userId });
    if (family.leader.toString() !== user._id.toString()) {
      errors.forbidden(res, "Only the current leader can transfer leadership.");
      return;
    }

    var newLeader = await models.User.findOne({ id: newLeaderId });
    if (!newLeader) {
      res.status(404);
      res.send("New leader not found.");
      return;
    }

    // Check if new leader is a member of the family
    var isMember = family.members.some((member) => member.id === newLeaderId);
    if (!isMember) {
      errors.forbidden(res, "The new leader must be a member of the family.");
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
    errors.serverError(res, "Could not transfer leadership. Please try again.");
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
      errors.forbidden(res, "Only the family leader can remove members.");
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
      errors.conflict(res, "User is not a member of this family.");
      return;
    }

    // Cannot remove the leader
    if (family.leader.toString() === memberToRemove._id.toString()) {
      errors.forbidden(res, "Cannot remove the family leader. Transfer leadership first.");
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
    errors.serverError(res, "Could not remove member from family. Please try again.");
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
      errors.forbidden(res, "Only the family leader can delete the family.");
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
    errors.serverError(res, "Could not delete family. Please try again.");
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
      errors.forbidden(res, "Only the family leader can send join requests.");
      return;
    }

    // Check if family is at member limit (20 members)
    const currentMemberCount = family.members.length;
    if (currentMemberCount >= 20) {
      errors.conflict(res, "This family has reached the maximum of 20 members.");
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
      errors.conflict(res, "User is already a member of this family.");
      return;
    }

    // Check if target user already belongs to another family
    var existingFamily = await models.InFamily.findOne({
      user: targetUser._id,
    });

    if (existingFamily) {
      errors.conflict(res, "User already belongs to a family.");
      return;
    }

    // Check if there's already a pending request
    var existingRequest = await models.FamilyJoinRequest.findOne({
      familyId: familyId,
      requesterId: targetUserId,
    });

    if (existingRequest) {
      errors.conflict(res, "A join request has already been sent to this user.");
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
    errors.serverError(res, "Could not send join request. Please try again.");
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
      errors.conflict(res, "This family has reached the maximum of 20 members.");
      return;
    }

    // Check if user already belongs to another family
    var existingFamily = await models.InFamily.findOne({
      user: user._id,
    });

    if (existingFamily) {
      errors.conflict(res, "You already belong to a family.");
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
    errors.serverError(res, "Could not accept join request. Please try again.");
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
      errors.conflict(res, "You are not a member of this family.");
      return;
    }

    // Cannot leave if you are the leader
    if (family.leader.toString() === user._id.toString()) {
      errors.forbidden(
        res,
        "The family leader cannot leave. Transfer leadership or delete the family instead."
      );
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
    errors.serverError(res, "Could not leave family. Please try again.");
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
    errors.serverError(res, "Could not reject join request. Please try again.");
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
    errors.serverError(res, "Failed to check pending invite. Please refresh and try again.");
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
      errors.forbidden(res, "Only the family leader can upload a background.");
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

    if (e.message && e.message.indexOf("maxFileSize exceeded") == 0) {
      errors.payloadTooLarge(res, "Image is too large, background must be less than 5 MB.");
    } else {
      errors.serverError(res, "Could not upload family background. Please try again.");
    }
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
      errors.forbidden(res, "Only the family leader can remove the background.");
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
    errors.serverError(res, "Could not remove family background. Please try again.");
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
      errors.forbidden(
        res,
        "Only the family leader can change the background display mode."
      );
      return;
    }

    if (
      backgroundRepeatMode !== "checker" &&
      backgroundRepeatMode !== "stretch"
    ) {
      errors.badRequest(
        res,
        "Invalid background repeat mode. Must be 'checker' or 'stretch'."
      );
      return;
    }

    await models.Family.updateOne(
      { id: familyId },
      { $set: { backgroundRepeatMode: backgroundRepeatMode } }
    );

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not update background repeat mode. Please try again.");
  }
});

const BASE_FAMILY_MEMBER_LIMIT = 20;
const EXPANDED_FAMILY_MEMBER_LIMIT = 25;
const MAX_FAMILY_JOIN_FEE = 1000000;
const FAMILY_PERKS = [
  {
    key: "expandedRoster",
    name: "Expanded Roster",
    description: "Raises the family member limit from 20 to 25.",
    cost: 1000,
  },
  {
    key: "trophySpotlight",
    name: "Trophy Spotlight",
    description: "Adds a cosmetic trophy spotlight perk to the family profile.",
    cost: 750,
  },
];

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getFamilyMemberLimit(family) {
  return family?.perks?.includes("expandedRoster")
    ? EXPANDED_FAMILY_MEMBER_LIMIT
    : BASE_FAMILY_MEMBER_LIMIT;
}

function normalizeFamilyJoinFee(value) {
  const fee = Math.floor(Number(value || 0));
  if (!Number.isFinite(fee) || fee < 0) return null;
  if (fee > MAX_FAMILY_JOIN_FEE) return null;
  return fee;
}

function getPendingJoinFees(family) {
  return Math.max(0, Number(family?.pendingJoinFees || 0));
}

function getAvailableFamilyTreasury(family, treasuryCoins) {
  return Math.max(0, Number(treasuryCoins || 0) - getPendingJoinFees(family));
}

function getMembershipRole(inFamily, family, user) {
  if (!inFamily || !family || !user) return null;
  const leaderId = family.leader?._id || family.leader;
  if (leaderId?.toString() === user._id.toString()) return "leader";
  return inFamily.role || "member";
}

function canManageFamilyApplications(role) {
  return role === "leader" || role === "officer";
}

async function buildFamilyStockInfo(familyId, requestingUserId) {
  const familyStock = await models.FamilyStock.findOne({ familyId, isIpoed: true })
    .select("shareSupply dividendsPaidOut")
    .lean()
    .exec();

  if (!familyStock) return null;

  const buyPrice = stockMarket.getBuyPrice(familyStock.shareSupply, 1).total;
  const sellPrice = stockMarket.getSellPrice(familyStock.shareSupply, 1).total;
  const marketCap = familyStock.shareSupply * stockMarket.calculatePrice(familyStock.shareSupply);

  // Build sparkline from last 10 transactions
  const transactions = await models.FamilyStockTransaction.find({ familyId })
    .sort("-createdAt")
    .limit(10)
    .select("price shares type")
    .lean()
    .exec();

  let supply = familyStock.shareSupply;
  const priceHistory = [];
  for (const tx of transactions) {
    priceHistory.push(stockMarket.calculatePrice(supply));
    if (tx.type === "buy") {
      supply = Math.max(1, supply - (tx.shares || 0));
    } else if (tx.type === "sell") {
      supply += tx.shares || 0;
    }
  }
  priceHistory.push(stockMarket.calculatePrice(supply));
  priceHistory.reverse();

  let sharesOwned = 0;
  if (requestingUserId) {
    const holding = await models.FamilyShareholder.findOne({
      familyId,
      holderId: requestingUserId,
    })
      .select("sharesOwned")
      .lean()
      .exec();
    sharesOwned = holding ? holding.sharesOwned : 0;
  }

  return {
    isIpoed: true,
    shareSupply: familyStock.shareSupply,
    marketCap,
    buyPrice,
    sellPrice,
    priceHistory,
    sharesOwned,
    dividendsPaidOut: familyStock.dividendsPaidOut || 0,
  };
}

async function getFamilyMembership(family, user) {
  if (!family || !user) return null;
  return models.InFamily.findOne({
    family: family._id,
    user: user._id,
  });
}

function buildFamilyQuests(family, trophyCount, treasuryCoins) {
  const memberCount = family.members ? family.members.length : 0;
  const memberLimit = getFamilyMemberLimit(family);
  const treasury = Number(treasuryCoins || 0);
  const perkCount = family.perks ? family.perks.length : 0;

  return [
    {
      id: "firstFive",
      name: "First Five",
      description: "Reach 5 family members.",
      current: Math.min(memberCount, 5),
      target: 5,
      completed: memberCount >= 5,
    },
    {
      id: "fullHouse",
      name: "Full House",
      description: `Reach the current member limit of ${memberLimit}.`,
      current: Math.min(memberCount, memberLimit),
      target: memberLimit,
      completed: memberCount >= memberLimit,
    },
    {
      id: "trophyCase",
      name: "Trophy Case",
      description: "Collect 5 trophies across all family members.",
      current: Math.min(trophyCount, 5),
      target: 5,
      completed: trophyCount >= 5,
    },
    {
      id: "communityChest",
      name: "Community Chest",
      description: "Deposit 1,000 coins into the family treasury.",
      current: Math.floor(Math.min(treasury, 1000)),
      target: 1000,
      completed: treasury >= 1000,
    },
    {
      id: "perkCollector",
      name: "Perk Collector",
      description: "Buy all family perks.",
      current: Math.min(perkCount, FAMILY_PERKS.length),
      target: FAMILY_PERKS.length,
      completed: perkCount >= FAMILY_PERKS.length,
    },
  ];
}

function getFamilyPerks(family) {
  const owned = new Set(family?.perks || []);
  return FAMILY_PERKS.map((perk) => ({
    ...perk,
    owned: owned.has(perk.key),
  }));
}

router.get("/discover", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req, true);
    const search = String(req.query.search || "").trim();
    const sort = String(req.query.sort || "members");
    const openOnly = String(req.query.openOnly || "") === "true";
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(48, Math.max(6, Number(req.query.limit) || 12));
    const query = {};
    let viewerFamilyId = null;
    let viewerCanSubmitApplication = false;
    let pendingApplicationFamilyIds = new Set();

    if (userId) {
      const user = await models.User.findOne({ id: userId }).select("_id").lean();

      if (user) {
        viewerCanSubmitApplication = true;
        const viewerFamily = await models.InFamily.findOne({
          user: user._id,
        })
          .populate("family", "id")
          .lean();

        viewerFamilyId = viewerFamily?.family?.id || null;

        const pendingApplications = await models.FamilyApplication.find({
          applicantId: userId,
          status: "pending",
        })
          .select("familyId -_id")
          .lean();

        pendingApplicationFamilyIds = new Set(
          pendingApplications.map((application) => application.familyId)
        );
      }
    }

    if (search) {
      query.name = { $regex: escapeRegex(search), $options: "i" };
    }

    if (openOnly) {
      query.applicationsOpen = { $ne: false };
    }

    const families = await models.Family.find(query)
      .select(
        "id name avatar avatarUrl leader members treasury pendingJoinFees perks applicationsOpen joinFee createdAt bio"
      )
      .populate("leader", "id name avatar vanityUrl")
      .populate("members", "id")
      .lean();

    const memberIds = [];
    for (const family of families) {
      for (const member of family.members || []) {
        if (member?.id) memberIds.push(member.id);
      }
    }

    const trophyCounts = memberIds.length
      ? await models.Trophy.aggregate([
          {
            $match: {
              ownerId: { $in: memberIds },
            },
          },
          {
            $group: {
              _id: "$ownerId",
              count: { $sum: 1 },
            },
          },
        ])
      : [];

    const trophyCountByUser = new Map(
      trophyCounts.map((entry) => [entry._id, entry.count])
    );



    const discoveredFamilies = families.map((family) => {
      const members = family.members || [];
      const trophyCount = members.reduce(
        (total, member) => total + (trophyCountByUser.get(member.id) || 0),
        0
      );
      const treasury = family.treasury || 0;
      const perks = family.perks || [];
      const memberLimit = getFamilyMemberLimit(family);
      const applicationsOpen = family.applicationsOpen !== false;
      const isFull = members.length >= memberLimit;
      const hasPendingApplication = pendingApplicationFamilyIds.has(family.id);

      return {
        id: family.id,
        name: family.name,
        avatar: family.avatarUrl || family.avatar,
        leader: family.leader
          ? {
              id: family.leader.id,
              name: family.leader.name,
              avatar: family.leader.avatar,
              vanityUrl: family.leader.vanityUrl,
            }
          : null,
        memberCount: members.length,
        memberLimit,
        applicationsOpen,
        joinFee: Number(family.joinFee || 0),
        treasury,
        availableTreasury: getAvailableFamilyTreasury(family, treasury),
        perkCount: perks.length,
        trophyCount,
        createdAt: family.createdAt,
        bioPreview: String(family.bio || "").replace(/\s+/g, " ").slice(0, 160),
        userIsMember: viewerFamilyId === family.id,
        hasPendingApplication,
        canRequestJoin:
          viewerCanSubmitApplication &&
          !viewerFamilyId &&
          applicationsOpen &&
          !isFull &&
          !hasPendingApplication,
      };
    });

    discoveredFamilies.sort((a, b) => {
      if (sort === "newest") return Number(b.createdAt) - Number(a.createdAt);
      if (sort === "members") return b.memberCount - a.memberCount;
      if (sort === "treasury") return b.treasury - a.treasury;
      if (sort === "open") {
        return (
          Number(b.applicationsOpen) - Number(a.applicationsOpen) ||
          b.memberCount - a.memberCount
        );
      }

      return b.memberCount - a.memberCount;
    });

    const total = discoveredFamilies.length;
    const start = (page - 1) * limit;

    res.send({
      families: discoveredFamilies.slice(start, start + limit),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error discovering families.");
  }
});

router.post("/:familyId/applicationsOpen", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;
    var { applicationsOpen } = req.body;

    var user = await models.User.findOne({ id: userId });
    var family = await models.Family.findOne({ id: familyId });

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    if (family.leader.toString() !== user._id.toString()) {
      res.status(500);
      res.send("Only the family leader can change application settings.");
      return;
    }

    await models.Family.updateOne(
      { id: familyId },
      { $set: { applicationsOpen: Boolean(applicationsOpen) } }
    );

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error updating application settings.");
  }
});

router.post("/:familyId/joinFee", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;
    var joinFee = normalizeFamilyJoinFee(req.body.joinFee);

    if (joinFee === null) {
      res.status(500);
      res.send(`Join fee must be between 0 and ${MAX_FAMILY_JOIN_FEE} coins.`);
      return;
    }

    var user = await models.User.findOne({ id: userId });
    var family = await models.Family.findOne({ id: familyId });

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    if (family.leader.toString() !== user._id.toString()) {
      res.status(500);
      res.send("Only the family leader can change the join fee.");
      return;
    }

    await models.Family.updateOne(
      { id: familyId },
      { $set: { joinFee: joinFee } }
    );

    res.send({ joinFee });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error updating join fee.");
  }
});

router.post("/:familyId/apply", async function (req, res) {
  let paidJoinFee = 0;
  let paidUserObjectId = null;
  let paidUserId = null;
  let paidFamilyObjectId = null;
  let familyJoinFeeAdded = false;
  let paymentCommitted = false;

  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;
    var message = String(req.body.message || "").trim();

    if (message.length > 500) {
      res.status(500);
      res.send("Application message must be 500 characters or less.");
      return;
    }

    var user = await models.User.findOne({ id: userId });
    var family = await models.Family.findOne({ id: familyId });

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    if (family.applicationsOpen === false) {
      res.status(500);
      res.send("This family is not accepting applications.");
      return;
    }

    if ((family.members || []).length >= getFamilyMemberLimit(family)) {
      res.status(500);
      res.send("This family has reached its member limit.");
      return;
    }

    var existingFamily = await models.InFamily.findOne({
      user: user._id,
    });

    if (existingFamily) {
      res.status(500);
      res.send("You already belong to a family.");
      return;
    }

    var existingApplication = await models.FamilyApplication.findOne({
      familyId: familyId,
      applicantId: userId,
      status: "pending",
    });

    if (existingApplication) {
      res.status(500);
      res.send("You already have a pending application for this family.");
      return;
    }

    var joinFee = Math.max(0, Math.floor(Number(family.joinFee || 0)));
    var debit = null;

    if (joinFee > 0) {
      debit = await models.User.findOneAndUpdate(
        { id: userId, coins: { $gte: joinFee } },
        { $inc: { coins: -joinFee } },
        { new: true }
      )
        .select("coins balanceDollar")
        .lean();

      if (!debit) {
        res.status(500);
        res.send(`This family requires a ${joinFee} coin join fee.`);
        return;
      }

      paidJoinFee = joinFee;
      paidUserObjectId = user._id;
      paidUserId = userId;
      paidFamilyObjectId = family._id;

      await models.Family.updateOne(
        { id: familyId },
        { $inc: { treasury: joinFee } }
      );
      await models.Family.updateOne(
        { id: familyId },
        {
          $inc: {
            pendingJoinFees: joinFee,
          },
        }
      );
      familyJoinFeeAdded = true;
    }

    await new models.FamilyApplication({
      familyId: familyId,
      family: family._id,
      applicantId: userId,
      applicant: user._id,
      message: message,
      joinFee: joinFee,
      createdAt: Date.now(),
    }).save();

    paymentCommitted = true;

    if (joinFee > 0) {
      try {
        await new models.FamilyLedger({
          familyId: familyId,
          family: family._id,
          userId: userId,
          user: user._id,
          type: "joinFee",
          amount: joinFee,
          description: `Join fee paid by ${user.name}`,
          createdAt: Date.now(),
        }).save();
      } catch (ledgerError) {
        logger.error("Error recording family join fee ledger:", ledgerError);
      }

      try {
        await redis.cacheUserInfo(userId, true);
      } catch (cacheError) {
        logger.error("Error refreshing user cache after join fee:", cacheError);
      }
    }

    res.send({
      joinFee,
      coins: debit ? Number(debit.coins || 0) : undefined,
      balanceDollar: debit ? Number(debit.balanceDollar || 0) : undefined,
    });
  } catch (e) {
    if (paidJoinFee > 0 && !paymentCommitted) {
      try {
        await models.User.updateOne(
          { _id: paidUserObjectId },
          { $inc: { coins: paidJoinFee } }
        );
        if (familyJoinFeeAdded) {
          await models.Family.updateOne(
            { _id: paidFamilyObjectId },
            {
              $inc: {
                pendingJoinFees: -paidJoinFee,
              },
            }
          );
          await models.Family.updateOne(
            { id: familyId },
            {
              $inc: {
                treasury: -paidJoinFee,
              },
            }
          );
        }
        await redis.cacheUserInfo(paidUserId, true);
      } catch (rollbackError) {
        logger.error("Error rolling back family join fee:", rollbackError);
      }
    }

    logger.error(e);
    res.status(500);
    res.send("Error submitting family application.");
  }
});

router.delete("/:familyId/applications/mine", async function (req, res) {
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

    var application = await models.FamilyApplication.findOne({
      familyId: familyId,
      applicantId: userId,
      status: "pending",
    });

    if (!application) {
      res.status(404);
      res.send("No pending application found.");
      return;
    }

    var joinFee = Math.max(0, Math.floor(Number(application.joinFee || 0)));

    if (joinFee > 0) {
      await models.Family.updateOne(
        { id: familyId },
        {
          $inc: {
            treasury: -joinFee,
          },
        }
      );
      await models.Family.updateOne(
        { id: familyId },
        {
          $inc: {
            pendingJoinFees: -joinFee,
          },
        }
      );

      await models.User.updateOne(
        { _id: user._id },
        { $inc: { coins: joinFee } }
      );

      try {
        await new models.FamilyLedger({
          familyId: familyId,
          family: family._id,
          userId: userId,
          user: user._id,
          type: "joinFeeRefund",
          amount: -joinFee,
          description: `Refunded join fee to ${user.name} (application cancelled)`,
          createdAt: Date.now(),
        }).save();
      } catch (ledgerError) {
        logger.error("Error recording join fee refund ledger:", ledgerError);
      }

      try {
        await redis.cacheUserInfo(userId, true);
      } catch (cacheError) {
        logger.error("Error refreshing user cache after join fee refund:", cacheError);
      }
    }

    await models.FamilyApplication.updateOne(
      { _id: application._id },
      {
        $set: {
          status: "cancelled",
          resolvedAt: Date.now(),
          resolvedBy: userId,
        },
      }
    );

    var updatedUser = await models.User.findOne({ id: userId })
      .select("coins balanceDollar")
      .lean();

    res.send({
      joinFee,
      coins: Number(updatedUser?.coins || 0),
      balanceDollar: Number(updatedUser?.balanceDollar || 0),
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error cancelling application.");
  }
});

router.get("/:familyId/applications", async function (req, res) {
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

    var membership = await getFamilyMembership(family, user);
    var role = getMembershipRole(membership, family, user);
    if (!canManageFamilyApplications(role)) {
      res.status(500);
      res.send("Only family leaders and officers can view applications.");
      return;
    }

    var applications = await models.FamilyApplication.find({
      familyId: familyId,
      status: "pending",
    })
      .populate("applicant", "id name avatar vanityUrl")
      .sort("createdAt")
      .lean();

    res.send({
      applications: applications
        .filter((application) => application.applicant)
        .map((application) => ({
          id: application._id,
          applicant: {
            id: application.applicant.id,
            name: application.applicant.name,
            avatar: application.applicant.avatar,
            vanityUrl: application.applicant.vanityUrl,
          },
          message: application.message || "",
          joinFee: Number(application.joinFee || 0),
          createdAt: application.createdAt,
        })),
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading family applications.");
  }
});

async function resolveFamilyApplication(req, res, status) {
  var userId = await routeUtils.verifyLoggedIn(req);
  var familyId = req.params.familyId;
  var applicationId = req.params.applicationId;

  var user = await models.User.findOne({ id: userId });
  var family = await models.Family.findOne({ id: familyId });

  if (!family) {
    res.status(404);
    res.send("Family not found.");
    return;
  }

  var membership = await getFamilyMembership(family, user);
  var role = getMembershipRole(membership, family, user);
  if (!canManageFamilyApplications(role)) {
    res.status(500);
    res.send("Only family leaders and officers can manage applications.");
    return;
  }

  var application = await models.FamilyApplication.findOne({
    _id: applicationId,
    familyId: familyId,
    status: "pending",
  }).populate("applicant", "id name");

  if (!application || !application.applicant) {
    res.status(404);
    res.send("Application not found.");
    return;
  }

  var joinFee = Math.max(0, Math.floor(Number(application.joinFee || 0)));

  if (status === "accepted") {
    if ((family.members || []).length >= getFamilyMemberLimit(family)) {
      res.status(500);
      res.send("This family has reached its member limit.");
      return;
    }

    var existingFamily = await models.InFamily.findOne({
      user: application.applicant._id,
    });

    if (existingFamily) {
      res.status(500);
      res.send("User already belongs to a family.");
      return;
    }

    await new models.InFamily({
      user: application.applicant._id,
      family: family._id,
      role: "member",
    }).save();

    await models.Family.updateOne(
      { id: familyId },
      {
        $push: { members: application.applicant._id },
        $inc: { pendingJoinFees: -joinFee },
      }
    );
  } else if (joinFee > 0) {
    // Credit user first — if this fails, family treasury is unchanged (safe)
    await models.User.updateOne(
      { _id: application.applicant._id },
      { $inc: { coins: joinFee } }
    );

    // Now deduct from treasury; if this fails, user has extra coins but treasury is intact
    // (preferred failure mode vs. losing applicant coins permanently)
    await models.Family.updateOne(
      { id: familyId },
      {
        $inc: {
          treasury: -joinFee,
          pendingJoinFees: -joinFee,
        },
      }
    );

    try {
      await new models.FamilyLedger({
        familyId: familyId,
        family: family._id,
        userId: application.applicant.id,
        user: application.applicant._id,
        type: "joinFeeRefund",
        amount: -joinFee,
        description: `Refunded join fee to ${application.applicant.name}`,
        createdAt: Date.now(),
      }).save();
    } catch (ledgerError) {
      logger.error("Error recording family join fee refund:", ledgerError);
    }

    try {
      await redis.cacheUserInfo(application.applicant.id, true);
    } catch (cacheError) {
      logger.error("Error refreshing user cache after join fee refund:", cacheError);
    }
  }

  await models.FamilyApplication.updateOne(
    { _id: application._id },
    {
      $set: {
        status: status,
        resolvedAt: Date.now(),
        resolvedBy: userId,
      },
    }
  );

  await routeUtils.createNotification(
    {
      content:
        status === "accepted"
          ? `Your application to join ${family.name} was accepted!`
          : joinFee > 0
            ? `Your application to join ${family.name} was rejected. Your ${joinFee} coin join fee was refunded.`
            : `Your application to join ${family.name} was rejected.`,
      icon: "fas fa-users",
      link: `/user/family/${familyId}`,
    },
    [application.applicant.id]
  );

  res.sendStatus(200);
}

router.post("/:familyId/applications/:applicationId/accept", async function (req, res) {
  try {
    await resolveFamilyApplication(req, res, "accepted");
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error accepting family application.");
  }
});

router.post("/:familyId/applications/:applicationId/reject", async function (req, res) {
  try {
    await resolveFamilyApplication(req, res, "rejected");
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error rejecting family application.");
  }
});

router.post("/:familyId/member/:memberId/role", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;
    var memberId = req.params.memberId;
    var role = String(req.body.role || "");

    if (role !== "member" && role !== "officer") {
      res.status(500);
      res.send("Invalid family role.");
      return;
    }

    var user = await models.User.findOne({ id: userId });
    var family = await models.Family.findOne({ id: familyId });

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    if (family.leader.toString() !== user._id.toString()) {
      res.status(500);
      res.send("Only the family leader can change member roles.");
      return;
    }

    var member = await models.User.findOne({ id: memberId });
    if (!member) {
      res.status(404);
      res.send("Member not found.");
      return;
    }

    if (family.leader.toString() === member._id.toString()) {
      res.status(500);
      res.send("The family leader role is changed by transferring leadership.");
      return;
    }

    var result = await models.InFamily.updateOne(
      { user: member._id, family: family._id },
      { $set: { role: role } }
    );

    if (!result.matchedCount) {
      res.status(500);
      res.send("User is not a member of this family.");
      return;
    }

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error updating family role.");
  }
});

router.get("/:familyId/ledger", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;

    var user = await models.User.findOne({ id: userId }).lean();
    var family = await models.Family.findOne({ id: familyId }).lean();

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    var membership = await getFamilyMembership(family, user);
    if (!membership) {
      res.status(403);
      res.send("Only family members can view the ledger.");
      return;
    }

    var ledger = await models.FamilyLedger.find({ familyId: familyId })
      .populate("user", "id name avatar vanityUrl")
      .sort("-createdAt")
      .limit(20)
      .lean();

    res.send({
      ledger: ledger.map((entry) => ({
        id: entry._id,
        type: entry.type,
        amount: entry.amount,
        description: entry.description,
        createdAt: entry.createdAt,
        user: entry.user
          ? {
              id: entry.user.id,
              name: entry.user.name,
              avatar: entry.user.avatar,
              vanityUrl: entry.user.vanityUrl,
            }
          : null,
      })),
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading family ledger.");
  }
});

router.post("/:familyId/treasury/deposit", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;
    var amount = Math.floor(Number(req.body.amount || 0));

    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(500);
      res.send("Deposit amount must be a positive number.");
      return;
    }

    var user = await models.User.findOne({ id: userId });
    var family = await models.Family.findOne({ id: familyId });

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    var membership = await getFamilyMembership(family, user);
    if (!membership) {
      res.status(500);
      res.send("Only family members can deposit coins.");
      return;
    }

    var debit = await models.User.findOneAndUpdate(
      { id: userId, coins: { $gte: amount } },
      { $inc: { coins: -amount } },
      { new: true }
    )
      .select("coins balanceDollar")
      .lean();

    if (!debit) {
      res.status(500);
      res.send("You do not have enough coins for this deposit.");
      return;
    }

    // Credit family treasury. If this fails, roll back the user debit.
    try {
      await models.Family.updateOne(
        { id: familyId },
        { $inc: { treasury: amount } }
      );
    } catch (familyUpdateError) {
      // Rollback: return coins to user
      await models.User.updateOne({ id: userId }, { $inc: { coins: amount } });
      await redis.cacheUserInfo(userId, true);
      throw familyUpdateError;
    }

    // Ledger write is non-financial — failure here is acceptable
    try {
      await new models.FamilyLedger({
        familyId: familyId,
        family: family._id,
        userId: userId,
        user: user._id,
        type: "deposit",
        amount: amount,
        description: `Deposited ${amount} coins`,
        createdAt: Date.now(),
      }).save();
    } catch (ledgerError) {
      logger.error("Error writing deposit ledger entry:", ledgerError);
    }

    await redis.cacheUserInfo(userId, true);

    res.send({
      coins: Number(debit.coins || 0),
      balanceDollar: Number(debit.balanceDollar || 0),
      treasury: Number(family.treasury || 0) + amount,
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error depositing into family treasury.");
  }
});

router.post("/:familyId/treasury/withdraw", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;
    var amount = Math.floor(Number(req.body.amount || 0));

    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(500);
      res.send("Withdrawal amount must be a positive number.");
      return;
    }

    var [user, family] = await Promise.all([
      models.User.findOne({ id: userId }).lean(),
      models.Family.findOne({ id: familyId }).lean(),
    ]);

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    // family.leader and family.founder are ObjectIds — compare via .toString()
    var isLeaderOrFounder =
      family.leader.toString() === user._id.toString() ||
      family.founder.toString() === user._id.toString();
    if (!isLeaderOrFounder) {
      res.status(403);
      res.send("Only the family leader or founder can withdraw from the treasury.");
      return;
    }

    // Atomically deduct from treasury, guarding against pendingJoinFees race condition
    // by embedding the constraint directly in the MongoDB query condition.
    const updatedFamily = await models.Family.findOneAndUpdate(
      {
        id: familyId,
        $expr: {
          $gte: [
            { $subtract: ["$treasury", { $ifNull: ["$pendingJoinFees", 0] }] },
            amount,
          ],
        },
      },
      { $inc: { treasury: -amount } },
      { new: true }
    );

    if (!updatedFamily) {
      res.status(500);
      res.send("The family treasury does not have enough available coins.");
      return;
    }

    // Credit user atomically and get updated balance in one query
    const updatedUser = await models.User.findOneAndUpdate(
      { id: userId },
      { $inc: { coins: amount } },
      { new: true }
    ).select("coins balanceDollar").lean();

    // Ledger write is non-financial — failure is acceptable
    try {
      await new models.FamilyLedger({
        familyId: familyId,
        family: updatedFamily._id,
        userId: userId,
        user: user._id,
        type: "withdraw",
        amount: amount,
        description: `Withdrew ${amount} coins`,
        createdAt: Date.now(),
      }).save();
    } catch (ledgerError) {
      logger.error("Error writing withdrawal ledger entry:", ledgerError);
    }

    await redis.cacheUserInfo(userId, true);

    res.send({
      coins: Number(updatedUser.coins || 0),
      balanceDollar: Number(updatedUser.balanceDollar || 0),
      treasury: Number(updatedFamily.treasury || 0),
    });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error withdrawing from family treasury.");
  }
});

router.post("/:familyId/perks/:perkKey/buy", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var familyId = req.params.familyId;
    var perkKey = req.params.perkKey;
    var perk = FAMILY_PERKS.find((item) => item.key === perkKey);

    if (!perk) {
      res.status(404);
      res.send("Family perk not found.");
      return;
    }

    var user = await models.User.findOne({ id: userId });
    var family = await models.Family.findOne({ id: familyId });

    if (!family) {
      res.status(404);
      res.send("Family not found.");
      return;
    }

    var membership = await getFamilyMembership(family, user);
    var role = getMembershipRole(membership, family, user);
    if (!canManageFamilyApplications(role)) {
      res.status(500);
      res.send("Only family leaders and officers can buy perks.");
      return;
    }

    if ((family.perks || []).includes(perk.key)) {
      res.status(500);
      res.send("This family already owns that perk.");
      return;
    }

    var result = await models.Family.updateOne(
      {
        id: familyId,
        perks: { $ne: perk.key },
        $expr: {
          $gte: [
            { $subtract: ["$treasury", { $ifNull: ["$pendingJoinFees", 0] }] },
            perk.cost,
          ],
        },
      },
      {
        $inc: { treasury: -perk.cost },
        $push: { perks: perk.key },
      }
    );

    if (!result.modifiedCount) {
      res.status(500);
      res.send("The family treasury does not have enough coins.");
      return;
    }

    await new models.FamilyLedger({
      familyId: familyId,
      family: family._id,
      userId: userId,
      user: user._id,
      type: "perk",
      amount: -perk.cost,
      description: `Bought ${perk.name}`,
      createdAt: Date.now(),
    }).save();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error buying family perk.");
  }
});module.exports = router;
