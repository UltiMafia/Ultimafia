const webpush = require("web-push");
const logger = require("./logging")("games");

/**
 * Out-of-band push notifications for players who are not looking at the page.
 *
 * Subscriptions live in memory, deliberately. A push is only ever needed while a
 * player is sitting in pregame waiting for a game to fill, which is a span of
 * minutes inside a single game server process, so there is nothing worth
 * persisting and no schema change to make. Anything that has to outlive the
 * process (an account-wide "notify me about X" preference, say) would need a
 * real store and should not be bolted onto this.
 *
 * Transports are pluggable so that the native apps can be added without
 * reworking the callers: a target is `{ type, ... }`, every type is looked up in
 * TRANSPORTS, and `notifyUser` fans out across whatever a user has registered.
 * Adding APNs or FCM means adding an entry to TRANSPORTS and teaching
 * `normalizeSubscription` to recognise its payload shape -- nothing else.
 */

const SUBSCRIPTION_TTL = 6 * 60 * 60 * 1000; // 6h; a pregame lobby never lives this long
const MAX_TARGETS_PER_USER = 5; // one per device/browser, generously
const SWEEP_INTERVAL = 30 * 60 * 1000;

// userId -> Map<targetKey, target>
const subscriptions = new Map();

let vapidConfigured = false;

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject =
  process.env.VAPID_SUBJECT || process.env.BASE_URL || "https://ultimafia.com";

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    vapidConfigured = true;
  } catch (e) {
    logger.error(`Invalid VAPID configuration, web push disabled: ${e.message}`);
  }
}

/**
 * Each transport knows how to recognise its own subscription payload, how to key
 * it for de-duplication, and how to deliver one notification. `send` resolves to
 * "sent" | "gone" | "failed"; "gone" prunes the target.
 */
const TRANSPORTS = {
  webpush: {
    isConfigured: () => vapidConfigured,

    normalize(raw) {
      const endpoint = String(raw.endpoint || "");
      const p256dh = String(raw.keys?.p256dh || "");
      const auth = String(raw.keys?.auth || "");

      if (!endpoint.startsWith("https://")) return null;
      if (endpoint.length > 1024 || !p256dh || !auth) return null;

      return {
        type: "webpush",
        key: endpoint,
        endpoint,
        keys: { p256dh, auth },
      };
    },

    async send(target, payload) {
      try {
        await webpush.sendNotification(
          { endpoint: target.endpoint, keys: target.keys },
          JSON.stringify(payload),
          { TTL: 300, urgency: "high" }
        );
        return "sent";
      } catch (e) {
        // 404/410 mean the browser threw the subscription away; anything else is
        // transient (rate limits, push service hiccups) and the target is kept.
        if (e.statusCode === 404 || e.statusCode === 410) return "gone";
        logger.error(
          `Web push delivery failed (${e.statusCode || "no status"}): ${e.message}`
        );
        return "failed";
      }
    },
  },

  // Native transports slot in here. Each needs isConfigured/normalize/send with
  // the same contract; notifyUser and the socket handlers need no changes.
  //
  // apns: { ... }   // iOS app, device token + APNs key
  // fcm:  { ... }   // Android app, registration token
};

function isEnabled() {
  return Object.values(TRANSPORTS).some((t) => t.isConfigured());
}

// Reported at startup rather than on first use: when push is unconfigured the
// client never gets as far as subscribing (it checks /api/site/push-config
// first), so anything logged from the request path would never be reached --
// which is exactly the case an operator needs told about.
if (isEnabled()) {
  logger.info("Push notifications enabled (web push).");
} else {
  logger.info(
    "Push notifications are DISABLED: VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are unset. " +
      "Players will not be offered notifications. See docs/setup-prod-instructions.md."
  );
}

function getPublicKey() {
  return vapidConfigured ? vapidPublicKey : "";
}

/**
 * Accepts whatever the client sent and returns a normalized target, or null if
 * it is unusable. The `type` defaults to webpush so existing browser clients do
 * not have to send it.
 */
function normalizeSubscription(raw) {
  if (!raw || typeof raw !== "object") return null;

  const type = String(raw.type || "webpush");
  const transport = TRANSPORTS[type];

  if (!transport || !transport.isConfigured()) return null;

  return transport.normalize(raw);
}

function register(userId, raw) {
  if (!userId) return false;

  const target = normalizeSubscription(raw);
  if (!target) return false;

  let targets = subscriptions.get(userId);
  if (!targets) {
    targets = new Map();
    subscriptions.set(userId, targets);
  }

  // Re-registering the same endpoint refreshes it rather than duplicating.
  targets.delete(target.key);
  targets.set(target.key, { ...target, addedAt: Date.now() });

  // Oldest out first, so a user cycling browsers cannot grow this without bound.
  while (targets.size > MAX_TARGETS_PER_USER) {
    const oldest = targets.keys().next().value;
    targets.delete(oldest);
  }

  return true;
}

function unregister(userId, key) {
  const targets = subscriptions.get(userId);
  if (!targets) return false;

  const removed = key ? targets.delete(String(key)) : false;

  if (!key || targets.size === 0) {
    subscriptions.delete(userId);
    return true;
  }

  return removed;
}

function unregisterUser(userId) {
  return subscriptions.delete(userId);
}

function hasSubscription(userId) {
  const targets = subscriptions.get(userId);
  return Boolean(targets && targets.size > 0);
}

/**
 * Fan out one notification to every target a user has registered. Never throws:
 * a push failing must not take down a game state transition.
 */
async function notifyUser(userId, payload) {
  const targets = subscriptions.get(userId);
  if (!targets || targets.size === 0) return 0;

  const results = await Promise.all(
    [...targets.values()].map(async (target) => {
      const transport = TRANSPORTS[target.type];
      if (!transport) return "failed";

      try {
        return await transport.send(target, payload);
      } catch (e) {
        logger.error(`Push transport ${target.type} threw: ${e.message}`);
        return "failed";
      }
    })
  );

  let sent = 0;
  [...targets.keys()].forEach((key, i) => {
    if (results[i] === "sent") sent++;
    else if (results[i] === "gone") targets.delete(key);
  });

  if (targets.size === 0) subscriptions.delete(userId);

  return sent;
}

async function notifyUsers(userIds, payload) {
  const counts = await Promise.all(
    [...new Set(userIds)].map((userId) => notifyUser(userId, payload))
  );
  return counts.reduce((sum, n) => sum + n, 0);
}

function sweepExpired(now = Date.now()) {
  let removed = 0;

  for (const [userId, targets] of subscriptions) {
    for (const [key, target] of targets) {
      if (now - target.addedAt > SUBSCRIPTION_TTL) {
        targets.delete(key);
        removed++;
      }
    }
    if (targets.size === 0) subscriptions.delete(userId);
  }

  return removed;
}

const sweepTimer = setInterval(() => {
  try {
    sweepExpired();
  } catch (e) {
    logger.error(e);
  }
}, SWEEP_INTERVAL);

// Do not hold the process open just to sweep an in-memory map.
if (sweepTimer.unref) sweepTimer.unref();

module.exports = {
  isEnabled,
  getPublicKey,
  register,
  unregister,
  unregisterUser,
  hasSubscription,
  notifyUser,
  notifyUsers,
  // exported for tests
  normalizeSubscription,
  sweepExpired,
  SUBSCRIPTION_TTL,
  MAX_TARGETS_PER_USER,
};
