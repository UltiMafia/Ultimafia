const express = require("express");
const fbAdmin = require("firebase-admin");
const shortid = require("shortid");
const axios = require("axios");
const crypto = require("crypto");
const constants = require("../data/constants");
const routeUtils = require("../routes/utils");
const models = require("../db/models");
const fbServiceAccount = require("../" + process.env.FIREBASE_JSON_FILE);
const logger = require("../modules/logging")(".");
const router = express.Router();
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

let callbackUrl;

if (process.env.NODE_ENV.includes("development")) {
  callbackUrl = "http://127.0.0.1:3000/auth/discord/redirect";
} else {
  callbackUrl = process.env.BASE_URL + "/auth/discord/redirect";
}

passport.use(
  new DiscordStrategy(
    {
      passReqToCallback: true,
      clientID: process.env.DISCORD_CLIENT_ID ?? "disabled hehe",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "disabled hehe",
      callbackURL: callbackUrl,
      scope: ["identify", "email"],
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        if (profile) {
          if (profile.email) {
            await authSuccess(req, null, profile.email, profile);
            done(null, profile);
          }
        }
      } catch (err) {
        console.log(err);
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing");
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log("Deserializing");
  const user = await models.User.findOne({ discordId: id });
  if (user) {
    done(null, user);
  }
});

const allowedEmailDomans = JSON.parse(process.env.EMAIL_DOMAINS);

fbAdmin.initializeApp({
  credential: fbAdmin.credential.cert(fbServiceAccount),
});

router.post("/", async function (req, res) {
  try {
    var idToken = String(req.body.idToken);
    if (idToken) {
      var userData = await fbAdmin.auth().verifyIdToken(idToken);
      var verified = userData.email_verified;

      if (verified) {
        const authResult = await authSuccess(req, userData.uid, userData.email);
        // Check if authSuccess actually created a session
        if (req.session.user) {
          res.sendStatus(200);
        } else {
          // authSuccess silently failed (banned IP, invalid domain, etc.)
          res.status(403);
          res.send("Authentication failed.");
        }
      } else {
        res.status(403);
        res.send("Authentication failed.");
      }
    } else {
      console.log("Req body: " + req.body);
      if (req.body.discordProfile) {
        const authResult = await authSuccess(
          req,
          null,
          req.body.email,
          req.body.discordProfile
        );
        // Check if authSuccess actually created a session
        if (req.session.user) {
          res.sendStatus(200);
        } else {
          // authSuccess silently failed (banned IP, invalid domain, etc.)
          res.status(403);
          res.send("Authentication failed.");
        }
      } else {
        res.status(403);
        res.send("Authentication failed.");
      }
    }
  } catch (e) {
    if (e.siteBanned) {
      res.status(403);
      res.send(
        JSON.stringify({
          siteBanned: true,
          banExpires: e.banExpires,
        })
      );
    }
    else if (e.deleted) {
      res.status(403);
      res.send(
        JSON.stringify({
          deleted: true,
        })
      );
    }
    else {
      logger.error(e);
      res.status(500);
      res.send("5Authentication failed.");
    }
  }
});

router.get("/discord", passport.authenticate("discord"));

router.get("/discord/redirect", (req, res, next) => {
  passport.authenticate("discord", { session: false, successRedirect: "/" })(
    req,
    res,
    next
  );
});

router.post("/verifyCaptcha", async function (req, res) {
  try {
    var token = String(req.body.token);
    var capRes;

    if (process.env.NODE_ENV === "production")
      capRes = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_KEY}&response=${token}`
      );

    if (
      process.env.NODE_ENV.includes("development") ||
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

async function authSuccess(req, uid, email, discordProfile) {
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

    var id = routeUtils.getUserId(req);
    var ip = routeUtils.getIP(req);
    var user = await models.User.findOne({ email }).select(
      "id deleted discordId"
    );
    var bannedUser = await models.User.findOne({ email, banned: true }).select(
      "id discordId"
    );

    if (!user && !bannedUser) {
      //Create new account (5) (6)
      var bannedSameIP = await models.User.find({
        ip: ip,
        banned: true,
      }).select("_id");

      if (bannedSameIP.length > 0) return;

      var emailDomain = email.split("@")[1] || "";

      if (allowedEmailDomans.indexOf(emailDomain) == -1) return;

      var name = null;
      if (discordProfile) {
        name = discordProfile.global_name;
        doesItExist = await models.User.findOne({ name: name }).select("id");
        if (doesItExist.id) {
          name = routeUtils.nameGen().slice(0, constants.maxUserNameLength);
        }
      } else {
        name = routeUtils.nameGen().slice(0, constants.maxUserNameLength);
      }

      id = shortid.generate();
      user = new models.User({
        id: id,
        name: name,
        email: email,
        fbUid: uid,
        joined: Date.now(),
        lastActive: Date.now(),
        ip: [ip],
        discordId: discordProfile?.id,
        discordUsername: discordProfile?.username,
        discordName: discordProfile?.global_name,
        redHearts: constants.initialRedHeartCapacity,
        goldHearts: constants.initialGoldHeartCapacity,
      });

      if (process.env.NODE_ENV.includes("development")) {
        user.dev = true;
      }

      await user.save();

      if (process.env.NODE_ENV.includes("development")) {
        var group = await models.Group.findOne({
          name: "Owner",
        }).select("rank");

        var inGroup = new models.InGroup({
          user: user._id,
          group: group._id,
        });
        await inGroup.save();
      }

      if (req.session.ref) {
        await models.User.updateOne(
          { id: req.session.ref },
          { $addToSet: { userReferrals: user._id } }
        );
      }

      var flaggedSameIP = await models.User.find({
        ip: ip,
        flagged: true,
      }).select("_id");
      var suspicious = flaggedSameIP.length > 0;

      if (!suspicious) {
        var flaggedSameEmail = await models.User.find({
          email,
          flagged: true,
        }).select("_id");
        suspicious = flaggedSameEmail.length > 0;
      }

      if (!suspicious && process.env.IP_API_IGNORE != "true") {
        logger.warn(`Checking IP: ${ip}`);
        var res = await axios.get(
          `${process.env.IP_API_URL}/${process.env.IP_API_KEY}/${ip}?${process.env.IP_API_PARAMS}`
        );
        suspicious =
          res.data && res.data.fraud_score >= Number(process.env.IP_API_THRESH);
      }

      if (suspicious) {
        //(6)
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
            "editPronouns",
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
      } else {
        var group = await models.Group.findOne({
          name: "Ranked Player",
        }).select("_id");
        var inGroup = new models.InGroup({
          user: user._id,
          group: group._id,
        });
        await inGroup.save();
      }
    } else if (!id && bannedUser) {
      //(8) (9)
      await models.User.updateOne(
        { id: bannedUser.id },
        {
          $addToSet: { ip: ip },
        }
      );

      // Get site ban information to return to frontend
      var siteBan = await models.Ban.findOne({
        userId: bannedUser.id,
        type: "site",
      }).select("expires");

      if (siteBan) {
        throw {
          siteBanned: true,
          banExpires: siteBan.expires,
        };
      }

      return;
    } else if (id && bannedUser) {
      //(3)
      await routeUtils.banUser(id, 0, ["signIn"], "bannedUser");

      await models.User.updateOne(
        { id: id },
        { $set: { banned: true } }
      ).exec();
      await models.Session.deleteMany({ "session.user.id": id }).exec();

      return;
    } else if (user.deleted) {
      throw { deleted: true, };
    } else {
      //Link or refresh account (1) (2) (7)
      id = user.id;

      if (!(await routeUtils.verifyPermission(id, "signIn"))) {
        return;
      }

      await models.User.updateOne({ id: id }, { $addToSet: { ip: ip } });

      // Link Discord profile if logging in with Discord.
      if (discordProfile && !user.discordId) {
        await models.User.updateOne(
          { id: id },
          {
            $set: {
              discordId: discordProfile.id,
              discordUsername: discordProfile.username,
              discordName: discordProfile.global_name,
            },
          }
        );
      }
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
    throw e;
  }
}

module.exports = router;
