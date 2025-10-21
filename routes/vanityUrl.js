const express = require("express");
const routeUtils = require("./utils");
const models = require("../db/models");
const redis = require("../modules/redis");
const logger = require("../modules/logging")(".");
const router = express.Router();

// Get user by vanity URL or ID
router.get("/:identifier", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const identifier = String(req.params.identifier);

    // First try to find user by ID
    let user = await models.User.findOne({
      id: identifier,
      deleted: false,
    }).select("id -_id");

    // If not found by ID, try to find by vanity URL
    if (!user) {
      const vanityUrl = await models.VanityUrl.findOne({
        url: identifier,
      }).select("userId -_id");

      if (!vanityUrl) {
        res.status(404);
        res.send("User not found.");
        return;
      }

      user = await models.User.findOne({
        id: vanityUrl.userId,
        deleted: false,
      }).select("id -_id");

      if (!user) {
        res.status(404);
        res.send("User not found.");
        return;
      }
    }

    res.send({ userId: user.id });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error finding user.");
  }
});

// Create or update vanity URL
router.post("/", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const itemsOwned = await redis.getUserItemsOwned(userId);
    const vanityUrl = String(req.body.vanityUrl).trim();

    if (!itemsOwned.vanityUrl) {
      res.status(500);
      res.send("You must purchase Vanity URL from the Shop.");
      return;
    }

    // Validate vanity URL
    if (vanityUrl.length < 1 || vanityUrl.length > 20) {
      res.status(500);
      res.send("Vanity URL must be between 1 and 20 characters.");
      return;
    }

    // Only allow letters, numbers, and hyphens
    if (!/^[a-zA-Z0-9-]+$/.test(vanityUrl)) {
      res.status(500);
      res.send("Vanity URL can only contain letters, numbers, and hyphens.");
      return;
    }

    // Check if user already has a vanity URL
    const existingVanityUrl = await models.VanityUrl.findOne({
      userId: userId,
    });

    if (existingVanityUrl) {
      // Update existing vanity URL
      existingVanityUrl.url = vanityUrl;
      await existingVanityUrl.save();
    } else {
      // Create new vanity URL
      await models.VanityUrl.create({
        url: vanityUrl,
        userId: userId,
      });
    }

    res.send("Vanity URL updated successfully");
  } catch (e) {
    if (e.code === 11000) {
      // Duplicate key error
      res.status(500);
      res.send("This vanity URL is already taken.");
    } else {
      logger.error(e);
      res.status(500);
      res.send("Error updating vanity URL.");
    }
  }
});

// Delete vanity URL
router.delete("/", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = await routeUtils.verifyLoggedIn(req);

    await models.VanityUrl.deleteOne({
      userId: userId,
    });

    res.send("Vanity URL deleted successfully");
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error deleting vanity URL.");
  }
});

// Get user's current vanity URL
router.get("/user/:userId", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const userId = String(req.params.userId);

    const vanityUrl = await models.VanityUrl.findOne({
      userId: userId,
    }).select("url -_id");

    if (vanityUrl) {
      res.send({ vanityUrl: vanityUrl.url });
    } else {
      res.send({ vanityUrl: null });
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error getting vanity URL.");
  }
});

module.exports = router;
