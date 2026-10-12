// POST /api/auth/apple/notifications — Sign in with Apple server-to-server events.
// No session/CSRF: Apple sends no cookies, and the payload is verified by signature.
const express = require("express");
const fbAdmin = require("firebase-admin");
const models = require("../db/models");
const logger = require("../modules/logging")(".");
const { verifyAppleNotification } = require("../modules/appleNotifications");
const router = express.Router();

async function findUsers(event) {
  let fbUser = null;
  try {
    fbUser = await fbAdmin.auth().getUserByProviderUid("apple.com", event.sub);
  } catch (e) {
    if (e.code != "auth/user-not-found") logger.error(e);
  }

  let user = null;
  if (fbUser)
    user = await models.User.findOne({ fbUid: fbUser.uid, deleted: false }).select("id fbUid");
  if (!user && event.email)
    user = await models.User.findOne({ email: event.email, deleted: false }).select("id fbUid");
  return { fbUser, user };
}

async function handleEvent(event) {
  const { fbUser, user } = await findUsers(event);
  const when = event.event_time ? new Date(Number(event.event_time)) : new Date();
  const tag = `[apple-siwa] ${event.type} sub=${event.sub} user=${user ? user.id : "none"}`;

  if (!fbUser && !user) {
    logger.warn(`${tag}: no matching account`);
    return;
  }

  switch (event.type) {
    case "email-enabled":
    case "email-disabled":
      if (user)
        await models.User.updateOne(
          { id: user.id },
          {
            $set: {
              appleEmailForwarding: event.type == "email-enabled",
              appleEmailForwardingUpdated: when,
            },
          }
        ).exec();
      break;

    case "consent-revoked":
    case "account-delete":
      if (fbUser) await fbAdmin.auth().revokeRefreshTokens(fbUser.uid);
      if (user) {
        await models.Session.deleteMany({ "session.user.id": user.id }).exec();
        const field = event.type == "account-delete" ? "appleAccountDeleted" : "appleConsentRevoked";
        await models.User.updateOne({ id: user.id }, { $set: { [field]: when } }).exec();
      }
      // Data is kept on purpose; account-delete needs moderator follow-up.
      if (event.type == "account-delete")
        logger.warn(`${tag}: Apple account deleted — sessions revoked, data kept for moderator review`);
      break;
  }
  logger.info(`${tag}: processed`);
}

router.post("/notifications", async function (req, res) {
  let event;
  try {
    ({ event } = await verifyAppleNotification(req.body && req.body.payload));
  } catch (e) {
    logger.warn(`[apple-siwa] rejected notification: ${e.message}`);
    res.sendStatus(400);
    return;
  }

  res.sendStatus(200);
  handleEvent(event).catch((e) => logger.error(e));
});

module.exports = router;
