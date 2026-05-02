const express = require("express");
const mongoose = require("mongoose");
const models = require("../db/models");
const routeUtils = require("./utils");
const logger = require("../modules/logging")(".");
const errors = require("../lib/errors");
const constants = require("../data/constants");

const router = express.Router();

const {
  rankUpPlays: RANK_UP_PLAYS,
  graduatePlays: GRADUATE_PLAYS,
  poolTenureDays: POOL_TENURE_DAYS,
  submissionMaxPlays: SUBMISSION_MAX_PLAYS,
  challengeId: LAB_CHALLENGE_ID,
} = constants.lab;

const POOL_SELECT =
  "id name gameType total roles featured ranked competitive labStatus labApprovedAt labPlaysCount creator";

function poolEntryView(setup) {
  const obj = setup.toJSON ? setup.toJSON() : setup;
  const approvedAt = obj.labApprovedAt
    ? new Date(obj.labApprovedAt).getTime()
    : null;
  const expiresAt = approvedAt
    ? approvedAt + POOL_TENURE_DAYS * 24 * 60 * 60 * 1000
    : null;
  return {
    ...obj,
    labPlaysToRank: Math.max(0, RANK_UP_PLAYS - (obj.labPlaysCount || 0)),
    labPlaysToGraduate: Math.max(0, GRADUATE_PLAYS - (obj.labPlaysCount || 0)),
    labExpiresAt: expiresAt,
  };
}

router.get("/constants", function (req, res) {
  res.setHeader("Content-Type", "application/json");
  res.send(constants.lab);
});

router.get("/pool", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const pageSize = 12;
    const page = Math.max(1, Number(req.query.page) || 1);
    const sortBy = (req.query.sortBy || "newest").toLowerCase();

    const sort = {};
    switch (sortBy) {
      case "oldest":
        sort.labApprovedAt = 1;
        break;
      case "mostPlays":
        sort.labPlaysCount = -1;
        break;
      case "fewestPlays":
        sort.labPlaysCount = 1;
        break;
      case "newest":
      default:
        sort.labApprovedAt = -1;
        break;
    }

    const filter = { labStatus: "IN_POOL" };
    const total = await models.Setup.countDocuments(filter);
    const setups = await models.Setup.find(filter)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select(POOL_SELECT)
      .populate("creator", "id name avatar");

    res.send({
      setups: setups.map(poolEntryView),
      page,
      pages: Math.max(1, Math.ceil(total / pageSize)),
      total,
    });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Failed to load The Lab pool. Please try again.");
  }
});

router.get("/featured-today", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    // The periodic refresh sets every user's dailyChallenges to the same
    // value, so peek at any user with challenges and look for an active
    // Lab challenge in their tier-2 slot.
    const sampleUser = await models.User.findOne({
      deleted: false,
      dailyChallenges: { $exists: true, $ne: [] },
    })
      .select("dailyChallenges")
      .lean();

    if (!sampleUser || !sampleUser.dailyChallenges) {
      res.send({ setup: null });
      return;
    }

    const labChallenge = sampleUser.dailyChallenges
      .map((c) => c.split(":"))
      .find((c) => c[0] === LAB_CHALLENGE_ID);

    if (!labChallenge || !labChallenge[2]) {
      res.send({ setup: null });
      return;
    }

    let setup = null;
    try {
      setup = await models.Setup.findOne({
        _id: new mongoose.Types.ObjectId(labChallenge[2]),
        labStatus: "IN_POOL",
      })
        .select(POOL_SELECT)
        .populate("creator", "id name avatar");
    } catch (e) {
      // Invalid ObjectId — treat as no featured setup
    }

    res.send({ setup: setup ? poolEntryView(setup) : null });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Failed to load today's Lab setup. Please try again.");
  }
});

router.get("/eligible-setups", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const user = await models.User.findOne({ id: userId, deleted: false }).select("_id");
    if (!user) {
      res.send({ setups: [] });
      return;
    }

    const setups = await models.Setup.find({
      creator: user._id,
      gameType: "Mafia",
      labStatus: "NOT_JOINED",
      closed: { $ne: true },
    })
      .select("id name gameType total ranked competitive featured roles")
      .sort({ _id: -1 })
      .lean();

    if (setups.length === 0) {
      res.send({ setups: [] });
      return;
    }

    const setupIds = setups.map((s) => s._id);
    const playCounts = await models.Game.aggregate([
      {
        $match: {
          setup: { $in: setupIds },
          endTime: { $gt: 0 },
          $or: [{ left: [] }, { left: { $exists: false } }],
          hadVeg: { $ne: true },
        },
      },
      { $group: { _id: "$setup", count: { $sum: 1 } } },
    ]);
    const countBySetup = {};
    for (const row of playCounts) {
      countBySetup[String(row._id)] = row.count;
    }

    const eligible = setups
      .map((s) => ({ ...s, playedCount: countBySetup[String(s._id)] || 0 }))
      .filter((s) => s.playedCount < SUBMISSION_MAX_PLAYS);

    res.send({ setups: eligible });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Failed to load your eligible setups. Please try again.");
  }
});

router.get("/my-submission", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const user = await models.User.findOne({ id: userId, deleted: false }).select("_id");
    if (!user) {
      res.send({ setup: null });
      return;
    }

    const setup = await models.Setup.findOne({
      creator: user._id,
      labStatus: { $in: ["PENDING_APPROVAL", "IN_POOL"] },
    })
      .select(POOL_SELECT + " labSubmittedAt labRankedAt labRejectionReason")
      .populate("creator", "id name avatar");

    res.send({ setup: setup ? poolEntryView(setup) : null });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Failed to load your Lab submission. Please try again.");
  }
});

router.post("/submit", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const setupId = String(req.body.setupId);

    const user = await models.User.findOne({ id: userId, deleted: false }).select("_id");
    if (!user) {
      errors.unauthorized(res, "You must be logged in to submit a setup.");
      return;
    }

    const setup = await models.Setup.findOne({ id: setupId }).populate(
      "creator",
      "_id id"
    );
    if (!setup || !setup.creator) {
      errors.notFound(res, "That setup does not exist.");
      return;
    }

    if (String(setup.creator._id) !== String(user._id)) {
      errors.forbidden(res, "You can only submit setups you created.");
      return;
    }
    if (setup.labStatus !== "NOT_JOINED") {
      errors.conflict(
        res,
        "This setup has already been submitted to The Lab and cannot be submitted again."
      );
      return;
    }
    if (setup.closed) {
      errors.conflict(res, "Closed setups cannot be submitted to The Lab.");
      return;
    }
    if (setup.gameType !== "Mafia") {
      errors.conflict(res, "Only Mafia setups can be submitted to The Lab.");
      return;
    }
    // Setup.played is not maintained at write time; count clean games live.
    const cleanGames = await models.Game.countDocuments({
      setup: setup._id,
      endTime: { $gt: 0 },
      $or: [{ left: [] }, { left: { $exists: false } }],
      hadVeg: { $ne: true },
    });
    if (cleanGames >= SUBMISSION_MAX_PLAYS) {
      errors.conflict(
        res,
        `Setups with ${SUBMISSION_MAX_PLAYS} or more clean plays don't need The Lab.`
      );
      return;
    }

    const existing = await models.Setup.findOne({
      creator: user._id,
      labStatus: { $in: ["PENDING_APPROVAL", "IN_POOL"] },
    }).select("_id");
    if (existing) {
      errors.conflict(
        res,
        "You already have a setup pending or in The Lab. Wait for it to graduate or expire before submitting another."
      );
      return;
    }

    await models.Setup.updateOne(
      { _id: setup._id },
      {
        $set: {
          labStatus: "PENDING_APPROVAL",
          labSubmittedAt: new Date(),
        },
      }
    );

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not submit setup to The Lab. Please try again.");
  }
});

router.get("/queue", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "manageLab"))) return;

    const setups = await models.Setup.find({ labStatus: "PENDING_APPROVAL" })
      .sort({ labSubmittedAt: 1 })
      .select(POOL_SELECT + " labSubmittedAt description")
      .populate("creator", "id name avatar");

    res.send({ setups: setups.map(poolEntryView) });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Failed to load The Lab queue. Please try again.");
  }
});

router.post("/approve", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "manageLab"))) return;

    const setupId = String(req.body.setupId);
    const setup = await models.Setup.findOne({ id: setupId }).select(
      "_id labStatus"
    );
    if (!setup) {
      errors.notFound(res, "That setup does not exist.");
      return;
    }
    if (setup.labStatus !== "PENDING_APPROVAL") {
      errors.conflict(res, "That setup is not pending approval.");
      return;
    }

    const moderator = await models.User.findOne({ id: userId }).select("_id");

    await models.Setup.updateOne(
      { _id: setup._id, labStatus: "PENDING_APPROVAL" },
      {
        $set: {
          labStatus: "IN_POOL",
          labApprovedAt: new Date(),
          labApprovedBy: moderator ? moderator._id : undefined,
          labPlaysCount: 0,
          labRejectionReason: null,
        },
      }
    );

    routeUtils.createModAction(userId, "Approve Lab Setup", [setupId]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not approve setup. Please try again.");
  }
});

router.post("/reject", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "manageLab"))) return;

    const setupId = String(req.body.setupId);
    const reason = req.body.reason ? String(req.body.reason).slice(0, 500) : "";
    const setup = await models.Setup.findOne({ id: setupId }).select(
      "_id labStatus"
    );
    if (!setup) {
      errors.notFound(res, "That setup does not exist.");
      return;
    }
    if (setup.labStatus !== "PENDING_APPROVAL") {
      errors.conflict(res, "That setup is not pending approval.");
      return;
    }

    await models.Setup.updateOne(
      { _id: setup._id, labStatus: "PENDING_APPROVAL" },
      {
        $set: {
          labStatus: "DISQUALIFIED",
          labRejectionReason: reason,
        },
      }
    );

    routeUtils.createModAction(userId, "Reject Lab Setup", [setupId, reason]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not reject setup. Please try again.");
  }
});

router.post("/admit", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "manageLab"))) return;

    const setupId = String(req.body.setupId);
    const setup = await models.Setup.findOne({ id: setupId }).select(
      "_id labStatus gameType ranked closed"
    );
    if (!setup) {
      errors.notFound(res, "That setup does not exist.");
      return;
    }
    if (setup.labStatus !== "NOT_JOINED") {
      errors.conflict(
        res,
        "This setup has already been through The Lab and cannot be admitted again."
      );
      return;
    }
    if (setup.gameType !== "Mafia") {
      errors.conflict(res, "Only Mafia setups can be admitted to The Lab.");
      return;
    }
    if (setup.closed) {
      errors.conflict(res, "Closed setups cannot be admitted to The Lab.");
      return;
    }
    const cleanGames = await models.Game.countDocuments({
      setup: setup._id,
      endTime: { $gt: 0 },
      $or: [{ left: [] }, { left: { $exists: false } }],
      hadVeg: { $ne: true },
    });
    if (cleanGames >= SUBMISSION_MAX_PLAYS) {
      errors.conflict(
        res,
        `Setups with ${SUBMISSION_MAX_PLAYS} or more clean plays don't need The Lab.`
      );
      return;
    }

    const moderator = await models.User.findOne({ id: userId }).select("_id");
    const now = new Date();
    await models.Setup.updateOne(
      { _id: setup._id, labStatus: "NOT_JOINED" },
      {
        $set: {
          labStatus: "IN_POOL",
          labSubmittedAt: now,
          labApprovedAt: now,
          labApprovedBy: moderator ? moderator._id : undefined,
          labPlaysCount: 0,
          labRejectionReason: null,
        },
      }
    );

    routeUtils.createModAction(userId, "Admit Setup to Lab", [setupId]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not admit setup. Please try again.");
  }
});

router.post("/disqualify", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    if (!(await routeUtils.verifyPermission(res, userId, "manageLab"))) return;

    const setupId = String(req.body.setupId);
    const reason = req.body.reason ? String(req.body.reason).slice(0, 500) : "";
    const setup = await models.Setup.findOne({ id: setupId }).select(
      "_id labStatus"
    );
    if (!setup) {
      errors.notFound(res, "That setup does not exist.");
      return;
    }
    if (setup.labStatus !== "IN_POOL") {
      errors.conflict(res, "That setup is not currently in the pool.");
      return;
    }

    await models.Setup.updateOne(
      { _id: setup._id, labStatus: "IN_POOL" },
      {
        $set: {
          labStatus: "DISQUALIFIED",
          labRejectionReason: reason,
        },
      }
    );

    routeUtils.createModAction(userId, "Disqualify Lab Setup", [setupId, reason]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not disqualify setup. Please try again.");
  }
});

module.exports = router;
