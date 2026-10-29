const express = require("express");
const fbAdmin = require("firebase-admin");
const shortid = require("shortid");
const axios = require("axios");
const crypto = require("crypto");
const constants = require("../data/constants");
const routeUtils = require("../routes/utils");
const models = require("../db/models");
const redis = require("../modules/redis");
const fbServiceAccount = require("../" + process.env.FIREBASE_JSON_FILE);
const logger = require("../modules/logging")(".");
const {
  syncRankedCompetitiveAccess,
} = require("../modules/userEligibility");
const { sendFlaggedUserDiscordAlert } = require("./report");
const { normalizeFingerprint, checkFingerprintBan } = require("../modules/fingerprintBan");
const { recordLoginFingerprint } = require("../modules/fingerprintLogin");
const {
  isArmored,
  sharesSignupEvidenceWithArmor,
} = require("../modules/plotArmor");
const router = express.Router();
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const errors = require("../lib/errors");
const { findAliasAccount } = require("../modules/emailAlias");
const {
  signInProvider,
  isAllowedSignupEmail,
} = require("../modules/authProviders");
const { planEmailSync } = require("../modules/accountEmail");

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
            await authSuccess(req, null, profile.email, profile, null);
            // Verify that authSuccess actually created a session
            if (req.session.user) {
              done(null, profile);
            } else {
              // authSuccess silently failed (banned IP, invalid domain, etc.)
              done(new Error("Authentication failed"), null);
            }
          } else {
            done(new Error("No email in Discord profile"), null);
          }
        } else {
          done(new Error("No Discord profile"), null);
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
    // Validate idToken is present and not empty
    var idToken = req.body.idToken;
    if (!idToken || typeof idToken !== 'string' || idToken.trim().length === 0) {
      res.status(403);
      res.send("Authentication failed.");
      return;
    }

    // Verify Firebase ID token - this will throw if invalid
    var userData = await fbAdmin.auth().verifyIdToken(idToken);
    // Google and Apple (apple.com) sign-ins carry a provider-verified email;
    // email/password accounts must verify theirs first. A token without an
    // email is refused: accounts are matched by email.
    var verified = userData.email_verified;

    if (verified && userData.email) {
      await authSuccess(
        req,
        userData.uid,
        userData.email,
        null,
        req.body.fingerprint,
        signInProvider(userData)
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
  } catch (e) {
    if (e.siteBanned) {
      res.status(403);
      res.send(
        JSON.stringify({
          siteBanned: true,
          banExpires: e.banExpires,
          banPage: "/banned",
        })
      );
    } else if (e.banEvasion) {
      res.status(403);
      // Deliberately method-agnostic: never tell the client which signal matched.
      res.send(JSON.stringify({ signupBlocked: true }));
    } else if (e.deleted) {
      res.status(403);
      res.send(
        JSON.stringify({
          deleted: true,
        })
      );
    } else if (e.emailAliasInUse) {
      res.status(403);
      res.send(JSON.stringify({ emailAliasInUse: true }));
    } else {
      logger.error(e);
      res.status(403);
      res.send("Authentication failed.");
    }
  }
});

router.get("/discord", passport.authenticate("discord"));

router.get("/discord/redirect", (req, res, next) => {
  passport.authenticate("discord", { session: false }, (err, user, info) => {
    if (err && err.siteBanned && req.session.siteBan) {
      res.redirect("/banned");
      return;
    }
    if (err) {
      logger.warn(`Discord authentication error: ${err.message}`);
      res.status(403);
      res.send("Authentication failed.");
      return;
    }
    if (!req.session.user) {
      // authSuccess failed silently - session was not created
      logger.warn("Discord authentication succeeded but no session was created");
      res.status(403);
      res.send("Authentication failed.");
      return;
    }
    // Authentication succeeded and session was created
    res.redirect("/");
  })(req, res, next);
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
    errors.serverError(res, "Error verifying captcha. Please try again.");
  }
});

router.post("/resendVerification", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      res.status(400);
      res.send(JSON.stringify({ error: "Email is required." }));
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400);
      res.send(JSON.stringify({ error: "Invalid email format." }));
      return;
    }

    // Check if user exists in our database
    const user = await models.User.findOne({
      email: {
        $elemMatch: {
          $regex: new RegExp(
            `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            "i"
          ),
        },
      },
      deleted: false,
    })
      .select("id fbUid")
      .lean();

    if (!user) {
      // Don't reveal if email exists or not for security
      res.status(200);
      res.send(
        JSON.stringify({
          message:
            "If an account exists with this email and it is not verified, a verification email will be sent when you attempt to sign in.",
        })
      );
      return;
    }

    // Get Firebase user
    let firebaseUser;
    try {
      if (user.fbUid) {
        firebaseUser = await fbAdmin.auth().getUser(user.fbUid);
      } else {
        firebaseUser = await fbAdmin.auth().getUserByEmail(email);
      }
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        // Don't reveal if email exists or not for security
        res.status(200);
        res.send(
          JSON.stringify({
            message:
              "If an account exists with this email and it is not verified, a verification email will be sent when you attempt to sign in.",
          })
        );
        return;
      }
      throw err;
    }

    // Check if email is already verified
    if (firebaseUser.emailVerified) {
      res.status(200);
      res.send(JSON.stringify({ message: "This email is already verified." }));
      return;
    }

    // User exists and email is not verified - frontend will handle sending
    res.status(200);
    res.send(
      JSON.stringify({
        message:
          "Please sign in with your email and password to resend the verification email.",
        requiresSignIn: true,
      })
    );
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send(JSON.stringify({ error: "Could not process verification request. Please try again." }));
  }
});

// Bans still running: permanent (expires 0) or expiring later.
function activeBanQuery(userId, extra = {}, now = Date.now()) {
  return {
    userId,
    ...extra,
    $or: [{ expires: 0 }, { expires: { $gt: now } }],
  };
}

async function authSuccess(req, uid, email, discordProfile, fingerprint, provider) {
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
      "id deleted discordId fbUid"
    );
    var bannedUser = await models.User.findOne({ email, banned: true }).select(
      "id discordId fbUid"
    );
    var deletedUser = await models.User.findOne({
      email,
      deleted: true,
    }).select("id discordId");
    const fingerprintMatch = normalizeFingerprint(fingerprint);

    // The Firebase account changed its email (verified): sign in to the same
    // site account and store the new address instead of making a new account.
    if (!user && uid) {
      var uidUser = await models.User.findOne({ fbUid: uid, deleted: false }).select(
        "id deleted discordId fbUid email"
      );
      if (uidUser) {
        var emailPlan = planEmailSync({
          user: uidUser,
          claims: { uid, email, email_verified: true },
          allowedDomains: allowedEmailDomans,
          takenByOther: !!(bannedUser || deletedUser),
        });
        if (!emailPlan.ok) {
          logger.warn(`Email change for user ${uidUser.id} not stored: ${emailPlan.error}`);
          return;
        }
        if (emailPlan.changed)
          await models.User.updateOne(
            { id: uidUser.id },
            { $set: { email: emailPlan.emails } }
          );
        user = uidUser;
      }
    }

    if (!id) {
      // Signing in to an account with a running site ban (8) (9): the user
      // gets the ban page session and nothing else. Decided by the account's
      // Ban rows, not only by users.banned, which can be cleared while a
      // later site ban is still running (expireBans clears it when any one
      // site ban ends) or still be set after the last one ended.
      var banAccount = bannedUser || user;
      var activeSiteBan = banAccount
        ? await models.Ban.findOne(activeBanQuery(banAccount.id, { type: "site" }))
            .sort({ expires: -1 })
            .select("expires")
        : null;
      if (activeSiteBan) {
        // The same Firebase account check as a normal sign-in (7).
        if (uid && banAccount.fbUid && banAccount.fbUid !== uid) {
          logger.warn(`Firebase UID mismatch for banned user ${banAccount.id}: stored=${banAccount.fbUid}, provided=${uid}`);
          return;
        }
        // Unchanged from before the ban page: the attempt is recorded on the
        // banned account only (it blocks sign-ups from this network and
        // device); no other account is touched or banned.
        await models.User.updateOne(
          { id: banAccount.id },
          { $addToSet: { ip: ip } }
        );
        await recordLoginFingerprint(banAccount.id, fingerprint);
        // A restricted session that only the ban page endpoints read
        // (routes/banPage.js, gated in app.js by modules/banSessionGate.js);
        // the user is still signed out everywhere else.
        delete req.session.user;
        req.session.siteBan = {
          userId: banAccount.id,
          csrf: crypto.randomBytes(24).toString("hex"),
        };
        throw {
          siteBanned: true,
          banExpires: activeSiteBan.expires,
        };
      }

      // users.banned is set but the site ban has ended and the periodic
      // cleanup has not run yet: sign in normally, as the cleanup would let
      // them. Any other running ban that takes signIn away still refuses.
      if (
        bannedUser &&
        user &&
        user.id === bannedUser.id &&
        (await models.Ban.exists({ userId: bannedUser.id, type: "site" })) &&
        !(await models.Ban.exists(
          activeBanQuery(bannedUser.id, { permissions: "signIn" })
        ))
      ) {
        await models.User.updateOne(
          { id: bannedUser.id },
          { $set: { banned: false } }
        ).exec();
        await redis.cacheUserPermissions(bannedUser.id);
        bannedUser = null;
      }
    }

    if (!user && !bannedUser && !deletedUser) {
      //Create new account (5) (6)
      var bannedSameIP = await models.User.find({
        ip: ip,
        banned: true,
      }).select("_id");

      // Plot Armor (dev/QA): a sign-up from the armored accounts' own network
      // or device skips the ban-evasion checks below. Looked up once, only
      // when one of them matches.
      var armorShared = null;
      var signupSharesArmor = async () => {
        if (armorShared === null)
          armorShared = await sharesSignupEvidenceWithArmor({
            ip,
            fingerprint: fingerprintMatch,
          });
        return armorShared;
      };

      if (bannedSameIP.length > 0) {
        if (!(await signupSharesArmor())) return;
        logger.warn(
          `Plot Armor: allowed a sign-up from an IP shared with ${bannedSameIP.length} banned user(s), because it shares an IP or device with an armored account.`
        );
      }

      var aliasAccount = await findAliasAccount(email);
      if (aliasAccount) throw { emailAliasInUse: true };

      var fingerprintBan = fingerprintMatch ? await checkFingerprintBan(fingerprintMatch) : null;
      if (fingerprintBan && (await signupSharesArmor())) {
        logger.warn(
          `Plot Armor: allowed a sign-up whose device fingerprint ${
            fingerprintBan === "block" ? "exactly matches" : "partly matches"
          } a banned user's, because it shares an IP or device with an armored account.`
        );
        fingerprintBan = null;
      }
      if (fingerprintBan === "block") throw { banEvasion: true };

      // Apple's private relay addresses are allowed for Apple sign-ins.
      if (!isAllowedSignupEmail(email, provider || "", allowedEmailDomans))
        return;

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
        fingerprints: fingerprintMatch ? [fingerprintMatch] : [],
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

      var fingerprintRestricted = fingerprintBan === "restrict";
      var suspicious = fingerprintRestricted;
      var flagReason = fingerprintRestricted ? "Device fingerprint matches a banned user" : null;
      var flaggedSameIP = await models.User.find({
        ip: ip,
        flagged: true,
      }).select("_id");
      if (!suspicious) {
        suspicious = flaggedSameIP.length > 0;
        if (suspicious) flagReason = "Shared IP with flagged user";
      }

      if (!suspicious) {
        var flaggedSameEmail = await models.User.find({
          email,
          flagged: true,
        }).select("_id");
        suspicious = flaggedSameEmail.length > 0;
        if (suspicious) flagReason = "Shared email with flagged user";
      }

      if (!suspicious && process.env.IP_API_IGNORE != "true") {
        logger.warn(`Checking IP: ${ip}`);
        var res = await axios.get(
          `${process.env.IP_API_URL}/${process.env.IP_API_KEY}/${ip}?${process.env.IP_API_PARAMS}`
        );
        suspicious =
          res.data && res.data.fraud_score >= Number(process.env.IP_API_THRESH);
        if (suspicious) flagReason = `High fraud score (${res.data.fraud_score})`;
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
            // Deliberately vague: a restricted user is never told which signal matched, even when the
            // real cause was the device fingerprint. The true reason goes to the staff-only Discord alert
            // below via flagReason.
            content: `Your IP address has been flagged as suspicious. Please message an admin or moderator in the chat panel to gain full access to the site. A list of moderators can be found by clicking on this message.`,
            icon: "flag",
            link: "/policy/moderation",
          },
          [id]
        );

        sendFlaggedUserDiscordAlert(name, id, flagReason || "Suspicious IP");
      } else {
        await syncRankedCompetitiveAccess(id);
      }
    } else if (!id && bannedUser) {
      //(8) (9) with no running site ban (that case is handled above): another
      // ban takes sign-in away, so the sign-in is refused as before.
      await models.User.updateOne(
        { id: bannedUser.id },
        {
          $addToSet: { ip: ip },
        }
      );

      await recordLoginFingerprint(bannedUser.id, fingerprint);

      return;
    } else if (id && bannedUser) {
      //(3)
      // Plot Armor (dev/QA): an armored account that signs in to a banned
      // account's email is not banned for it; it just stays signed in as
      // itself.
      if (isArmored(id)) {
        logger.warn(
          `Plot Armor: did not ban ${id} for signing in to banned account ${bannedUser.id}.`
        );
        return;
      }
      await routeUtils.banUser(id, 0, ["signIn"], "bannedUser");

      await models.User.updateOne(
        { id: id },
        { $set: { banned: true } }
      ).exec();
      await models.Session.deleteMany({ "session.user.id": id }).exec();

      return;
    } else if (!user && deletedUser) {
      throw { deleted: true };
    } else {
      //Link or refresh account (1) (2) (7)
      id = user.id;

      // CRITICAL SECURITY: Verify Firebase UID matches stored fbUid to prevent privilege escalation
      if (uid) {
        if (user.fbUid && user.fbUid !== uid) {
          // User exists with different Firebase UID - reject authentication
          logger.warn(`Firebase UID mismatch for user ${id}: stored=${user.fbUid}, provided=${uid}`);
          return;
        } else if (!user.fbUid) {
          // User exists but no Firebase UID yet - link it for legacy accounts
          await models.User.updateOne({ id: id }, { $set: { fbUid: uid } });
        }
      }

      if (!(await routeUtils.verifyPermission(id, "signIn"))) {
        return;
      }

      await models.User.updateOne({ id: id }, { $addToSet: { ip: ip } });
      await recordLoginFingerprint(id, fingerprint);

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

      await syncRankedCompetitiveAccess(id);
    }

    delete req.session.siteBan;
    req.session.user = {
      id,
      fbUid: uid,
      _id: user._id,
      csrf: crypto.randomInt(2 ** 48 - 1),
    };

    // Fire-and-forget: record the login in SiteActivity. A failure here must
    // not break the auth flow.
    models.SiteActivity.create({
      id: shortid.generate(),
      type: "login",
      actorId: id,
      date: Date.now(),
    }).catch(() => {});

    return id;
  } catch (e) {
    logger.error(e);
    throw e;
  }
}

module.exports = router;
