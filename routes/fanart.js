const express = require("express");
const fs = require("fs");
const path = require("path");
const formidable = require("formidable");
const sharp = require("sharp");
const shortid = require("shortid");
const axios = require("axios");

const logger = require("../modules/logging")(".");
const constants = require("../data/constants");
const routeUtils = require("./utils");
const models = require("../db/models");

const router = express.Router();

function sanitizeString(str) {
  if (!str) return "";
  return String(str).replace(/[\0\r\n\t]/g, "").trim();
}

router.get("/", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const rawRoleId = sanitizeString(req.query.roleId).slice(
      0,
      constants.maxCommentLocationLength
    );

    if (!rawRoleId) {
      res.send([]);
      return;
    }

    const fanartDocs = await models.Fanart.find({
      roleId: rawRoleId,
      deleted: false,
    })
      .select("id roleId title imagePath author createdAt")
      .populate("author", "id name avatar vanityUrl")
      .sort("-createdAt")
      .lean();

    const items = fanartDocs.map((doc) => ({
      id: doc.id,
      roleId: doc.roleId,
      title: doc.title || "",
      imageUrl: doc.imagePath ? `/uploads/${doc.imagePath}` : "",
      createdAt: doc.createdAt || 0,
      author: doc.author
        ? {
            id: doc.author.id,
            name: doc.author.name,
            avatar: doc.author.avatar,
            vanityUrl: doc.author.vanityUrl,
          }
        : null,
    }));

    res.send(items);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading fanart.");
  }
});

router.post("/", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);

    if (!(await routeUtils.verifyPermission(res, userId, "postReply"))) return;
    if (!(await routeUtils.rateLimit(userId, "postFanart", res))) return;

    // Match existing upload routes (avatar/banner/background/family avatar)
    // to avoid version-specific formidable API differences.
    var form = new formidable();
    form.maxFileSize = 5 * 1024 * 1024;
    form.maxFields = 2;

    var [fields, files] = await form.parseAsync(req);

    const rawRoleId = sanitizeString(fields.roleId).slice(
      0,
      constants.maxCommentLocationLength
    );
    const title = sanitizeString(fields.title).slice(
      0,
      constants.maxStrategyTitleLength
    );

    if (!rawRoleId) {
      res.status(400);
      res.send("Missing roleId.");
      return;
    }

    if (!title) {
      res.status(400);
      res.send("Title is required.");
      return;
    }

    const file = files.image;

    if (!file || !file.path) {
      res.status(400);
      res.send("Image file is required.");
      return;
    }

    const uploadDir = process.env.UPLOAD_PATH;
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

    const id = shortid.generate();
    const fileName = `fanart_${id}.webp`;
    const outPath = path.join(uploadDir, fileName);

    await sharp(file.path)
      .webp({ quality: 90 })
      .resize({
        width: 1024,
        height: 1024,
        fit: sharp.fit.inside,
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      })
      .toFile(outPath);

    const now = Date.now();

    const fanart = new models.Fanart({
      id,
      roleId: rawRoleId,
      title,
      imagePath: fileName,
      author: req.session.user._id,
      createdAt: now,
      deleted: false,
    });

    await fanart.save();

    const authorDoc = await models.User.findOne({
      _id: req.session.user._id,
    })
      .select("id name avatar vanityUrl")
      .lean();

    const item = {
      id,
      roleId: rawRoleId,
      title,
      imageUrl: `/uploads/${fileName}`,
      createdAt: now,
      author: authorDoc
        ? {
            id: authorDoc.id,
            name: authorDoc.name,
            avatar: authorDoc.avatar,
            vanityUrl: authorDoc.vanityUrl,
          }
        : null,
    };

    // Send Discord alert to staff about new fanart upload
    try {
      const roleName = rawRoleId.includes(":")
        ? rawRoleId.split(":")[1]
        : rawRoleId;
      const encodedRoleName = encodeURIComponent(roleName);
      const pageUrl = `https://ultimafia.com/learn/role/${encodedRoleName}`;

      const uploaderName = authorDoc?.name || userId;

      const titleLine = `New fanart uploaded by ${uploaderName} for role ${roleName}: ${pageUrl}`;

      const ping = "<@&1107343293848768622>\n";
      const wht =
        "QTQ0dG9WSFA3UUNfSk1KbTZZTFh1Q05JT2xhLVoxanZqczhTRDE3WmQyOGktTU5kYmJlbzFCTVRPQzBnTmJKblMwRGM=";
      const whId = "MTMyODgwNjY5OTcxNjMxNzE5NQ==";
      const base = "aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3Mv";

      const decodeBase64 = (str) =>
        Buffer.from(str, "base64").toString("utf-8");
      const webhookURL =
        decodeBase64(base) + decodeBase64(whId) + "/" + decodeBase64(wht);

      await axios.post(webhookURL, {
        content: `${ping}${titleLine}`,
        username: "SnitchBot",
      });
    } catch (discordError) {
      logger.warn("Failed to send Discord notification:", discordError);
    }

    res.status(201);
    res.send(item);
  } catch (e) {
    if (e.message && e.message.indexOf("maxFileSize exceeded") === 0) {
      res.status(400);
      res.send("Image is too large, fanart must be less than 5 MB.");
    } else {
      logger.error(e);
      res.status(500);
      res.send("Error uploading fanart.");
    }
  }
});

router.post("/:fanartId/delete", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const fanartId = sanitizeString(req.params.fanartId);

    if (!fanartId) {
      res.status(400);
      res.send("Fanart ID is required.");
      return;
    }

    const fanart = await models.Fanart.findOne({ id: fanartId }).populate(
      "author",
      "id"
    );

    if (!fanart) {
      res.status(404);
      res.send("Fanart not found.");
      return;
    }

    const authorId = fanart.author ? fanart.author.id : null;
    const hasDeletePerm =
      Boolean(userId) &&
      (await routeUtils.verifyPermission(userId, "deleteFanart"));
    const isAuthor = Boolean(authorId && authorId === userId);

    if (!isAuthor && !hasDeletePerm) {
      res.status(403);
      res.send("You do not have permission to delete fanart.");
      return;
    }

    if (!fanart.deleted) {
      await models.Fanart.updateOne(
        { id: fanartId },
        { $set: { deleted: true } }
      );
    }

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error deleting fanart.");
  }
});

module.exports = router;

