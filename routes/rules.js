const express = require("express");
const router = express.Router();
const models = require("../db/models");
const redis = require("../modules/redis");
const routeUtils = require("./utils");
const ruleFilter = require("../modules/ruleFilterService");
const ruleNudge = require("../modules/ruleNudge");
const logger = require("../modules/logging")(".");

const {
  hasAbuseViolation,
  forget: forgetAbuseHistory,
} = require("../modules/ruleViolationHistory");

// OGI warnings are on unless switched off. Abuse warnings are off unless the
// account has an abuse violation on record; an explicit setting wins either way.
async function filterSettings(userId, settings) {
  const ogi = settings.ogiFilter !== false;
  const abuseHistory =
    settings.abuseFilter === undefined
      ? await hasAbuseViolation(userId)
      : false;
  const abuse =
    settings.abuseFilter === undefined ? abuseHistory : settings.abuseFilter === true;

  return { ogi, abuse, abuseHistory };
}

router.post("/check", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req, true);

    const content = String(req.body.content || "").slice(0, 2000);
    if (!content.trim()) {
      res.send({ flagged: false });
      return;
    }

    // Logged-out guests have no settings: OGI stays on, abuse stays off.
    let ogi = true;
    let abuse = false;
    if (userId) {
      const user = await redis.getUserInfo(userId);
      ({ ogi, abuse } = await filterSettings(
        userId,
        (user && user.settings) || {}
      ));
    }
    if (!ogi && !abuse) {
      res.send({ flagged: false });
      return;
    }

    const result = await ruleFilter.classify(content);
    if (!result || result.prob < ruleFilter.THRESHOLD) {
      res.send({ flagged: false });
      return;
    }

    // A token carries this verdict to the games process, which counts it only
    // if the message is actually accepted. Issued before the enabled check so
    // an abuse-flagged message still counts when the abuse prompt is off.
    let token = null;
    try {
      token = await ruleNudge.issueToken({
        userId,
        gameId: String(req.body.gameId || ""),
        category: result.category,
        prob: result.prob,
        abusePrompt: abuse,
      });
    } catch (e) {
      logger.error(e);
    }

    const enabled =
      (result.category === "outside_game_influence" && ogi) ||
      (result.category === "abuse" && abuse);
    if (!enabled) {
      res.send({ flagged: false, token });
      return;
    }

    res.send({
      flagged: true,
      category: result.category,
      prob: Math.round(result.prob * 1000) / 1000,
      token,
    });
  } catch (e) {
    logger.error(e);
    // Fail open: a classifier outage must never stop chat.
    res.send({ flagged: false });
  }
});

// Called when the author confirms sending a message the model flagged as abuse,
// so abuse warnings stay on for their next messages (they can switch it off).
router.post("/ack", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req, true);
    if (!userId) {
      res.sendStatus(401);
      return;
    }
    if (String(req.body.category) !== "abuse") {
      res.sendStatus(200);
      return;
    }

    await models.User.updateOne(
      { id: userId },
      { $set: { "settings.abuseFilter": true } }
    );
    await redis.cacheUserInfo(userId, true);
    forgetAbuseHistory(userId);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.sendStatus(500);
  }
});

module.exports = router;
