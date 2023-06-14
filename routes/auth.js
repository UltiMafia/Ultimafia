const express = require("express");
const fbAdmin = require("firebase-admin");
const shortid = require("shortid");
const axios = require("axios");
const crypto = require("crypto");
const constants = require("../data/constants");
const routeUtils = require("./utils");
const models = require("../db/models");

const fbServiceAccount = require(`../${process.env.FIREBASE_JSON_FILE}`);
const logger = require("../modules/logging")(".");

const router = express.Router();

const allowedEmailDomans = JSON.parse(process.env.EMAIL_DOMAINS);

fbAdmin.initializeApp({
  credential: fbAdmin.credential.cert(fbServiceAccount),
});

router.post("/", async (req, res) => {
  try {
    const idToken = String(req.body.idToken);
    const userData = await fbAdmin.auth().verifyIdToken(idToken);
    const verified = userData.email_verified;

    if (verified) {
      await authSuccess(req, userData.uid, userData.email);
      res.sendStatus(200);
    } else {
      res.status(403);
      res.send(
        "Please verify your email address before logging in. Be sure to check your spam folder."
      );
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error authenticating.");
  }
});

router.post("/verifyCaptcha", async (req, res) => {
  try {
    const token = String(req.body.token);
    let capRes;

    if (process.env.NODE_ENV == "production")
      capRes = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_KEY}&response=${token}`
      );

    if (
      process.env.NODE_ENV == "development" ||
      (capRes.data.success &&
        capRes.data.action == "auth" &&
        capRes.data.score > constants.captchaThreshold)
    ) {
      res.sendStatus(200);
    } else {
      logger.warn(`reCAPTCHA score: ${capRes.data.score}`);
      res.status(403);
      res.send("reCAPTCHA v3 thinks you're a bot. Please try again later.");
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error verifying captcha.");
  }
});

async function authSuccess(req, uid, email) {
  try {
    /* *** Scenarios ***
            - Signed in
                - Linking new account (1)
                - Signing in to account (2)
                - Signing in to banned account (3)
            - Not signed in
                - Making new account
                    - IP not suspicious (5)
                    - IP suspicous (6)
                - Signing in to account (7)
                - Signing in to banned account (8)
                - Signing in to deleted banned account (9)
        */

    let id = routeUtils.getUserId(req);
    const ip = routeUtils.getIP(req);
    let user = await models.User.findOne({ email, deleted: false }).select(
      "id"
    );
    const bannedUser = await models.User.findOne({
      email,
      banned: true,
    }).select("id");

    if (!user && !bannedUser) {
      // Create new account (5) (6)
      const bannedSameIP = await models.User.find({
        ip,
        banned: true,
      }).select("_id");

      if (bannedSameIP.length > 0) return;

      const emailDomain = email.split("@")[1] || "";

      if (allowedEmailDomans.indexOf(emailDomain) == -1) return;

      id = shortid.generate();
      user = new models.User({
        id,
        name: routeUtils.nameGen().slice(0, constants.maxUserNameLength),
        email,
        fbUid: uid,
        joined: Date.now(),
        lastActive: Date.now(),
        ip: [ip],
      });
      await user.save();

      if (req.session.ref)
        await models.User.updateOne(
          { id: req.session.ref },
          { $addToSet: { userReferrals: user._id } }
        );

      const flaggedSameIP = await models.User.find({
        ip,
        flagged: true,
      }).select("_id");
      let suspicious = flaggedSameIP.length > 0;

      if (!suspicious) {
        const flaggedSameEmail = await models.User.find({
          email,
          flagged: true,
        }).select("_id");
        suspicious = flaggedSameEmail.length > 0;
      }

      if (!suspicious && process.env.IP_API_IGNORE != "true") {
        logger.warn(`Checking IP: ${ip}`);
        const res = await axios.get(
          `${process.env.IP_API_URL}/${process.env.IP_API_KEY}/${ip}?${process.env.IP_API_PARAMS}`
        );
        suspicious =
          res.data && res.data.fraud_score >= Number(process.env.IP_API_THRESH);
      }

      if (suspicious) {
        // (6)
        await models.User.updateOne({ id }, { $set: { flagged: true } }).exec();
        await routeUtils.banUser(
          id,
          0,
          [
            "vote",
            "createThread",
            "postReply",
            "publicChat",
            "privateChat",
            "playGame",
            "editBio",
            "changeName",
          ],
          "ipFlag"
        );
        await routeUtils.createNotification(
          {
            content: `Your IP address has been flagged as suspicious. Please message an admin or moderator in the chat panel to gain full access to the site. A list of moderators can be found by clicking on this message.`,
            icon: "flag",
            link: "/community/moderation",
          },
          [id]
        );
      }
    } else if (!id && bannedUser) {
      // (8) (9)
      await models.User.updateOne(
        { id: bannedUser.id },
        {
          $addToSet: { ip },
        }
      );

      return;
    } else if (id && bannedUser) {
      // (3)
      await routeUtils.banUser(id, 0, ["signIn"], "bannedUser");

      await models.User.updateOne({ id }, { $set: { banned: true } }).exec();
      await models.Session.deleteMany({ "session.user.id": id }).exec();

      return;
    } else {
      // Link or refresh account (1) (2) (7)
      id = user.id;

      if (!(await routeUtils.verifyPermission(id, "signIn"))) {
        return;
      }

      await models.User.updateOne({ id }, { $addToSet: { ip } });
    }

    req.session.user = {
      id,
      fbUid: uid,
      _id: user._id,
      csrf: crypto.randomInt(2 ** 48 - 1),
    };
    return id;
  } catch (e) {
    logger.error(e);
  }
}

module.exports = router;
