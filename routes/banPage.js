// Endpoints for the site-ban page. They read only req.session.siteBan, the
// restricted session a site-banned user gets on sign-in, so a banned user can
// see why they are banned, appeal once, and sign out, and nothing else.
const express = require("express");
const logger = require("../modules/logging")(".");
const errors = require("../lib/errors");
const banAppeals = require("../modules/banAppeals");

const router = express.Router();

function banSession(req) {
  const siteBan = req.session && req.session.siteBan;
  return siteBan && siteBan.userId ? siteBan : null;
}

function verifyBanCsrf(req, siteBan) {
  return req.get("x-csrf") === siteBan.csrf;
}

router.get("/", async function (req, res) {
  try {
    const siteBan = banSession(req);
    if (!siteBan) {
      res.send({ banned: false });
      return;
    }

    const info = await banAppeals.getBanPageInfo(siteBan.userId);
    if (!info) {
      // The ban ended or was lifted: they can sign in normally now.
      delete req.session.siteBan;
      res.send({ banned: false, banEnded: true });
      return;
    }

    res.send({ ...info, csrf: siteBan.csrf });
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not load your ban. Please try again.");
  }
});

router.post("/appeal", async function (req, res) {
  try {
    const siteBan = banSession(req);
    if (!siteBan) {
      res.status(401).send("You are not signed in to a banned account.");
      return;
    }
    if (!verifyBanCsrf(req, siteBan)) {
      res.sendStatus(403);
      return;
    }

    const appeal = await banAppeals.submitAppeal(
      siteBan.userId,
      req.body && req.body.appeal,
    );
    res.send({ appeal });
  } catch (e) {
    if (e instanceof banAppeals.AppealError) {
      res.status(e.status).send(e.message);
      return;
    }
    logger.error(e);
    errors.serverError(res, "Could not send your appeal. Please try again.");
  }
});

router.post("/logout", async function (req, res) {
  try {
    const siteBan = banSession(req);
    if (siteBan && !verifyBanCsrf(req, siteBan)) {
      res.sendStatus(403);
      return;
    }
    if (req.session) delete req.session.siteBan;
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    errors.serverError(res, "Could not sign out. Please try again.");
  }
});

module.exports = router;
