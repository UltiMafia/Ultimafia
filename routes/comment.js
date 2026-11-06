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

// Windows can briefly retain a WebP file handle after decoding. Retry only
// EBUSY, at most four attempts with three 50 ms waits; ENOENT is already clean.
async function removeImage(file) {
  for (let attempt = 0; ; attempt++) {
    try {
      await fs.promises.unlink(file);
      return;
    } catch (e) {
      if (e.code === "ENOENT") return;
      if (e.code !== "EBUSY" || attempt === 3) throw e;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

router.post("/", async function (req, res) {
  const temporaryPaths = [];
  let outputPath;
  let saved = false;
  try {
    var userId = await routeUtils.verifyLoggedIn(req);

    if (!(await routeUtils.verifyPermission(res, userId, "postReply"))) return;

    if (!(await routeUtils.rateLimit(userId, "postComment", res))) return;

    let fields = req.body;
    let imageFile;
    if (req.is?.("multipart/form-data")) {
      if (!(await routeUtils.rateLimit(userId, "postPastedImage", res))) return;
      const form = new formidable();
      form.maxFileSize = 5 * 1024 * 1024;
      form.maxFields = 2;
      form.maxFieldsSize = 8192;
      // Include partially written files; Formidable also closes/removes these
      // on parser errors. Our cleanup tolerates files it has already removed.
      form.on("fileBegin", (name, file) => temporaryPaths.push(file.path));
      try {
        let files;
        [fields, files] = await form.parseAsync(req);
        imageFile = files.image;
        if (!imageFile?.path) throw new Error("Missing image.");
      } catch (e) {
        e.imageValidation = true;
        throw e;
      }
    }

    var content = String(fields.content || "");
    var location = String(fields.location || "").slice(
      0,
      constants.maxCommentLocationLength
    );

    let useLargeCommentLength = location.startsWith("setup");
    let maxLength = useLargeCommentLength
      ? constants.maxLargeCommentLength
      : constants.maxCommentLength;
    if ((!content.length && !imageFile) || content.length > maxLength) {
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

    let imagePath;
    if (imageFile) {
      try {
        // Decode bytes rather than a filename so Sharp's input cache cannot
        // retain the parser's Windows file handle between WebP uploads.
        const image = sharp(await fs.promises.readFile(imageFile.path), {
          limitInputPixels: 16 * 1000 * 1000,
        });
        const metadata = await image.metadata();
        if (!["png", "jpeg", "webp"].includes(metadata.format))
          throw new Error("Unsupported pasted image format.");
        const uploadDir = process.env.UPLOAD_PATH;
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        imagePath = `pasted_${shortid.generate()}.webp`;
        outputPath = path.join(uploadDir, imagePath);
        await image.rotate().webp({ quality: 85 }).resize({
          width: 1024, height: 1024, fit: sharp.fit.inside,
          withoutEnlargement: true, kernel: sharp.kernel.lanczos3,
        }).toFile(outputPath);
        content += `${content ? "\n\n" : ""}![image](/uploads/${imagePath})`;
      } catch (e) {
        e.imageValidation = true;
        throw e;
      }
      if (content.length > maxLength) {
        errors.unprocessable(res, `Content must be between 1 and ${maxLength} characters.`);
        return;
      }
    }

    var comment = new models.Comment({
      id: shortid.generate(),
      author: req.session.user._id,
      date: Date.now(),
      location,
      content,
      imagePath,
    });
    await comment.save();
    saved = true;

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    if (e.imageValidation)
      errors.unprocessable(res, "Images must be readable PNG, JPEG or WebP and up to 5 MiB.");
    else
      errors.serverError(res, "Error posting comment. Please try again.");
  } finally {
    for (const file of [...temporaryPaths, ...(!saved && outputPath ? [outputPath] : [])]) {
      try {
        await removeImage(file);
      } catch (e) {
        logger.error("Could not remove comment image:", e);
      }
    }
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
    })
      .select("author location imagePath deleted")
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

    // Remove the picture before marking the comment deleted: if removal fails,
    // the comment stays visible with its Delete button, so deleting it again
    // retries. Never accept a path supplied by the request.
    if (comment.imagePath)
      await removeImage(path.join(process.env.UPLOAD_PATH, comment.imagePath));

    await models.Comment.updateOne(
      { id: commentId },
      { $set: { deleted: true } }
    ).exec();

    // Log the moderator action once, not again for an already deleted comment.
    if (isNotOwnPost && !comment.deleted)
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
