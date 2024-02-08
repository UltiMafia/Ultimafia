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
////TESTING THIS IN PROD, DO NOT TOUCH
const DiscordStrategy = require("passport-discord").Strategy;
////TESTING THIS IN PROD, DO NOT TOUCH

////TESTING THIS IN PROD, DO NOT TOUCH
const attachDiscordProfile = (req, res, next) => {
  console.log("HIT ATTACH DISCORD PROFILE MIDDLEWARE.");
  if (req.isAuthenticated() && req.user && req.user.discordProfile) {
    req.discordProfile = req.user.discordProfile;
  }
  next();
}

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: "https://ultimafia.com/auth/discord/redirect",
  scope: ["identify", "email"]
}, async (accessToken, refreshToken, profile, done) => {
  try {
    if (profile) {
      if (profile.email) {
        const discordProfile = {
          id: profile.id,
          username: profile.username,
          global_name: profile.global_name
        };
        return done(null, profile, { discordProfile });
      }
    }
    let user = await models.User.findOne({ discordId: profile.id });
      if (user) {
        console.log("User exists");
        await user.updateOne({ discordUsername: `${profile.username}`, discordName: `${profile.global_name}`, email: `${profile.email}` });
        done(null, user);
        return done(null, user, { discordProfile });
      }
      user = await models.User.findOne({ email: profile.email });
      if (user) {
        await user.updateOne({ discordId: `${profile.id}`, discordUsername: `${profile.username}`, discordName: `${profile.global_name}` });
        done(null, user);
        return done(null, user, { discordProfile });
      }
      else {
        const newUser = await models.User.create({
          discordId: profile.id,
          username: profile.username,
          global_name: profile.global_name,
          email: profile.email
        });
        const savedUser = await newUser.save();
        done(null, savedUser);
        return done(null, savedUser, { discordProfile });
      }
  }
  catch (err) {
    console.log(err);
    done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  console.log("Serializing");
  done(null, user.id);
});

passport.deserializeUser(async(id, done) => {
  console.log("Deserializing");
  const user = await models.User.findOne({ discordId: id});
  if (user) {
    done(null, user);
  }
});
////TESTING THIS IN PROD, DO NOT TOUCH


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
        await authSuccess(req, userData.uid, userData.email);
        res.sendStatus(200);
      } else {
        res.status(403);
        res.send(
          "Please verify your email address before logging in. Be sure to check your spam folder."
        );
      }
    }
    else {
      console.log("Req body: " + req.body);
      if (req.body.discordProfile) {
        await authSuccess(req, null, req.body.email, req.body.discordProfile);
        res.sendStatus(200);
      }
      else {
        res.sendStatus(403);
      }
    }
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error authenticating.");
  }
});

////TESTING THIS IN PROD, DO NOT TOUCH
router.get("/discord", passport.authenticate("discord"));

router.get("/discord/redirect", passport.authenticate("discord"),
(req, res) => {
  res.redirect("/auth/success");
});

router.get('/auth/success', attachDiscordProfile, async(req, res) => {
  const { email } = req.user;
  const { discordProfile } = req;
  console.log("HIT AUTH SUCCESS MIDDLEWARE.");
  await authSuccess(req, null, email, discordProfile);
  res.redirect("https://ultimafia.com/");
});
////TESTING THIS IN PROD, DO NOT TOUCH

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
    var user = await models.User.findOne({ email, deleted: false }).select(
      "id"
    );
    var bannedUser = await models.User.findOne({ email, banned: true }).select(
      "id"
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
      
      id = shortid.generate();
      user = new models.User({
        id: id,
        name: routeUtils.nameGen().slice(0, constants.maxUserNameLength),
        email: email,
        fbUid: uid,
        joined: Date.now(),
        lastActive: Date.now(),
        ip: [ip],
        ////TESTING THIS IN PROD, DO NOT TOUCH
        discordId: discordProfile?.id,
        discordUsername: discordProfile?.username,
        discordName: discordProfile?.global_name,
        ////TESTING THIS IN PROD, DO NOT TOUCH
      });

      if (process.env.NODE_ENV.includes("development")) {
        user.dev = true;
      }

      await user.save();

      if (process.env.NODE_ENV.includes("development")) { 
        var group = await models.Group.findOne({
          name: "Owner"
        }).select("rank");

        var inGroup = new models.InGroup({
          user: user._id,
          group: group._id
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
    } else {
      //Link or refresh account (1) (2) (7)
      id = user.id;

      if (!(await routeUtils.verifyPermission(id, "signIn"))) {
        return;
      }

      await models.User.updateOne({ id: id }, { $addToSet: { ip: ip } });

      ////TESTING THIS IN PROD, DO NOT TOUCH
      // Link Discord profile if logging in with Discord.
      if (discordProfile) {
        await models.User.updateOne({ id: id }, { $set: 
          {
            discordId: discordProfile.id,
            discordUsername: discordProfile.username,
            discordName: discordProfile.global_name
          } });
      }
      ////TESTING THIS IN PROD, DO NOT TOUCH

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
