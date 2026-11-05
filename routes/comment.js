const express = require("express");
const bluebird = require("bluebird");
const formidable = bluebird.promisifyAll(require("formidable"), {
  multiArgs: true,
});
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const shortid = require("shortid");
const constants = require("../data/constants");
const models = require("../db/models");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const {
  getReactionSummaries,
  attachReactionSummaries,
} = require("../modules/reactions");
const blocks = require("../modules/blocks");
const logger = require("../modules/logging")(".");
const errors = require("../lib/errors");
const router = express.Router();

router.get("/", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req, true);
    var pageSize = constants.commentsPerPage;
    var page = Math.max(1, Number(req.query.page) || 1);
    var commentFilter = {};

    if (req.query.locations) {
      var locations = String(req.query.locations)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      commentFilter.location = { $in: locations };
    } else {
      commentFilter.location = String(req.query.location);
    }

    if (!(await routeUtils.verifyPermission(userId, "viewDeleted")))
      commentFilter.deleted = false;

    var total = await models.Comment.countDocuments(commentFilter);
    var maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (page > maxPage) page = maxPage;

    var commentDocs = await models.Comment.find(commentFilter)
      .select("id author content date voteCount deleted location -_id")
      .sort("-date")
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("author", "id -_id");

    var comments = [];
    for (var i = 0; i < commentDocs.length; i++) {
      let comment = commentDocs[i].toJSON();
      const authorId = comment.author?.id;

      if (authorId) {
        comment.author = await redis.getBasicUserInfo(authorId, true);
      } else {
        comment.author = {
          id: "",
          name: "[deleted]",
          avatar: false,
          groups: [],
          settings: {},
        };
      }

      comments.push(comment);
    }

    var votes = {};
    var commentIds = comments.map((comment) => comment.id);

    if (userId) {
      var voteList = await models.ForumVote.find({
        voter: userId,
        item: { $in: commentIds },
      }).select("item direction");

      for (let vote of voteList) votes[vote.item] = vote.direction;

      comments = comments.map((comment) => {
        comment.vote = votes[comment.id] || 0;
        return comment;
      });
    }

    let reactionSummaries = {};
    try {
      reactionSummaries = await getReactionSummaries(
        commentIds.filter(Boolean),
        userId
      );
    } catch (reactionErr) {
      logger.error("Failed to load comment reactions:", reactionErr);
    }

    comments = attachReactionSummaries(comments, reactionSummaries);

    comments = comments.map((comment) => ({
      ...comment,
      vote: comment.vote ?? 0,
    }));

    res.send({ comments, maxPage, page });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not load comments. Please refresh and try again.");
  }
});

// Pasted images upload on paste. The editor embeds the returned path as
// ordinary markdown, so the post itself stays plain text.
router.post("/image", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);

    if (!(await routeUtils.verifyPermission(res, userId, "postReply"))) return;
    if (!(await routeUtils.rateLimit(userId, "postPastedImage", res))) return;

    var form = new formidable();
    form.maxFileSize = 5 * 1024 * 1024;
    form.maxFields = 1;
    form.maxFieldsSize = 8192;
    const temporaryPaths = [];
    form.on("file", (name, file) => temporaryPaths.push(file.path));
    let parsed = false;

    const uploadDir = process.env.UPLOAD_PATH;
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    const fileName = `pasted_${shortid.generate()}.webp`;

    try {
      var [fields, files] = await form.parseAsync(req);
      parsed = true;

      const image = sharp(files.image.path, { limitInputPixels: 16 * 1000 * 1000 });
      const metadata = await image.metadata();
      if (!["png", "jpeg", "webp"].includes(metadata.format))
        throw new Error("Unsupported pasted image format.");

      await image
        .rotate()
        .webp({ quality: 85 })
        .resize({
          width: 1024,
          height: 1024,
          fit: sharp.fit.inside,
          withoutEnlargement: true,
          kernel: sharp.kernel.lanczos3,
        })
        .toFile(path.join(uploadDir, fileName));
    } catch (e) {
      logger.warn(e);
      errors.unprocessable(res, "Images must be readable PNG, JPEG or WebP and up to 5 MiB.");
      return;
    } finally {
      // Formidable owns cleanup while a failed parse may still have open files.
      if (parsed) {
        for (const temporaryPath of temporaryPaths) {
          try {
            await fs.promises.unlink(temporaryPath);
          } catch (e) {
            if (e.code !== "ENOENT")
              logger.warn("Could not remove temporary pasted image:", e);
          }
        }
      }
    }

    res.send(`/uploads/${fileName}`);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Error uploading image. Please try again.");
  }
});

router.post("/", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);

    if (!(await routeUtils.verifyPermission(res, userId, "postReply"))) return;

    if (!(await routeUtils.rateLimit(userId, "postComment", res))) return;

    var content = String(req.body.content);
    var location = String(req.body.location).slice(
      0,
      constants.maxCommentLocationLength
    );

    let useLargeCommentLength = location.startsWith("setup");
    let maxLength = useLargeCommentLength
      ? constants.maxLargeCommentLength
      : constants.maxCommentLength;
    if (content.length == 0 || content.length > maxLength) {
      errors.unprocessable(res, `Content must be between 1 and ${maxLength} characters.`);
      return;
    }

    // A profile wall's location is the owner's user id. Blocking works both
    // ways: neither can comment on the other's profile.
    if (location != userId) {
      const profileOwner = await models.User.findOne({
        id: location,
        deleted: false,
      })
        .select("id -_id")
        .lean();

      if (
        profileOwner &&
        (await blocks.usersBlockEachOther(userId, profileOwner.id))
      ) {
        errors.forbidden(res, "You can't comment on this profile.");
        return;
      }
    }

    var comment = new models.Comment({
      id: shortid.generate(),
      author: req.session.user._id,
      date: Date.now(),
      location,
      content,
    });
    await comment.save();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Error posting comment. Please try again.");
  }
});


async function isFamilyWallLeader(userId, location) {
  if (!location || typeof location !== "string") return false;
  if (!location.startsWith("family/")) return false;

  var familyId = location.slice("family/".length);
  if (!familyId || familyId.includes("/")) return false;

  var user = await models.User.findOne({ id: userId }).select("_id");
  if (!user) return false;

  var family = await models.Family.findOne({ id: familyId }).select("leader");
  if (!family || !family.leader) return false;

  return family.leader.toString() === user._id.toString();
}

router.post("/delete", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var commentId = String(req.body.comment);
    var perm1 = "deleteOwnPost";
    var perm2 = "deleteAnyPost";

    var comment = await models.Comment.findOne({
      id: commentId,
      deleted: false,
    })
      .select("author location")
      .populate("author", "id");

    if (!comment) {
      errors.notFound(res, "Comment not found.");
      return;
    }

    var isFamilyLeader = await isFamilyWallLeader(userId, comment.location);
    let isNotOwnPost =
      comment.author.id != userId &&
      comment.location != userId &&
      !isFamilyLeader;
    if (isNotOwnPost || !(await routeUtils.verifyPermission(userId, perm1)))
      if (!(await routeUtils.verifyPermission(res, userId, perm2))) return;

    await models.Comment.updateOne(
      { id: commentId },
      { $set: { deleted: true } }
    ).exec();

    if (isNotOwnPost)
      routeUtils.createModAction(userId, "Delete Comment", [commentId]);

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Error deleting comment. Please try again.");
  }
});

router.post("/restore", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var commentId = String(req.body.comment);
    var perm = "restoreDeleted";

    var comment = await models.Comment.findOne({ id: commentId }).select("_id");

    if (!comment) {
      errors.notFound(res, "Comment not found.");
      return;
    }

    if (!(await routeUtils.verifyPermission(res, userId, perm))) return;

    await models.Comment.updateOne(
      { id: commentId },
      { $set: { deleted: false } }
    ).exec();

    routeUtils.createModAction(userId, "Restore Comment", [commentId]);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Error restoring comment. Please try again.");
  }
});

module.exports = router;
