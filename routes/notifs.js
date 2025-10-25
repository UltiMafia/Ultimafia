const express = require("express");
const constants = require("../data/constants");
const logger = require("../modules/logging")(".");
const routeUtils = require("./utils");
const { models } = require("mongoose");
const router = express.Router();

// Legacy endpoint for bell icon - returns only unread notifications
router.get("/", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req, true);

    if (!userId) {
      res.send([]);
      return;
    }

    var globalNotifs = await models.User.findOne({ id: userId })
      .select("globalNotifs")
      .populate("globalNotifs", "-_id -_v");
    globalNotifs = globalNotifs.globalNotifs.filter((notif) => !notif.read);

    var userNotifs = await models.Notification.find({
      user: userId,
      isChat: false,
      read: false,
    }).select("-_id -_v");

    var notifs = globalNotifs
      .concat(userNotifs)
      .sort((a, b) => b.date - a.date);
    notifs.unshift(constants.restart);
    res.send(notifs);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

// New endpoint for inbox page - returns all notifications with pagination
router.get("/inbox", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);

    const page = parseInt(req.query.page) || 1;
    const limit = 25;
    const skip = (page - 1) * limit;

    var globalNotifs = await models.User.findOne({ id: userId })
      .select("globalNotifs")
      .populate("globalNotifs", "-_id -_v");
    globalNotifs = globalNotifs.globalNotifs || [];

    var userNotifs = await models.Notification.find({
      user: userId,
      isChat: false,
    }).select("-_id -_v");

    var allNotifs = globalNotifs
      .concat(userNotifs)
      .sort((a, b) => b.date - a.date);

    const totalNotifs = allNotifs.length;
    const totalPages = Math.ceil(totalNotifs / limit);
    const notifs = allNotifs.slice(skip, skip + limit);

    const unreadCount = allNotifs.filter((notif) => !notif.read).length;

    res.send({
      notifications: notifs,
      currentPage: page,
      totalPages: totalPages,
      totalNotifications: totalNotifs,
      unreadCount: unreadCount,
    });
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error fetching notifications");
  }
});

// Mark all notifications as read
router.post("/viewed", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req, true);

    if (!userId) {
      res.sendStatus(200);
      return;
    }

    // Mark global notifications as read
    var user = await models.User.findOne({ id: userId }).populate(
      "globalNotifs"
    );
    if (user && user.globalNotifs) {
      for (let notif of user.globalNotifs) {
        if (notif && !notif.read) {
          await models.Notification.updateOne(
            { _id: notif._id },
            { $set: { read: true } }
          ).exec();
        }
      }
    }

    // Mark user notifications as read
    await models.Notification.updateMany(
      { user: userId, isChat: false, read: false },
      { $set: { read: true } }
    ).exec();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

// Mark a single notification as read
router.post("/read/:notifId", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const notifId = req.params.notifId;

    // Find and update the notification
    const notif = await models.Notification.findOne({ id: notifId });

    if (!notif) {
      res.status(404).send("Notification not found");
      return;
    }

    // Verify the notification belongs to this user
    if (notif.user !== userId && !notif.global) {
      res.status(403).send("Unauthorized");
      return;
    }

    await models.Notification.updateOne(
      { id: notifId },
      { $set: { read: true } }
    ).exec();

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error marking notification as read");
  }
});

// Delete a single notification
router.delete("/:notifId", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const notifId = req.params.notifId;

    // Find the notification
    const notif = await models.Notification.findOne({ id: notifId });

    if (!notif) {
      res.status(404).send("Notification not found");
      return;
    }

    // Verify the notification belongs to this user
    if (notif.user !== userId && !notif.global) {
      res.status(403).send("Unauthorized");
      return;
    }

    // If it's a global notification, remove it from user's globalNotifs array
    if (notif.global) {
      await models.User.updateOne(
        { id: userId },
        { $pull: { globalNotifs: notif._id } }
      ).exec();
    } else {
      // Delete the notification
      await models.Notification.deleteOne({ id: notifId }).exec();
    }

    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error deleting notification");
  }
});

module.exports = router;
