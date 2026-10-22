// Sign in with Apple server-to-server notifications.
// Apple POSTs {"payload": "<JWS>"} signed with a key from APPLE_JWKS_URL.
// Docs: https://developer.apple.com/documentation/signinwithapple/processing-changes-for-sign-in-with-apple-accounts
const crypto = require("crypto");
const axios = require("axios");

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";
const JWKS_TTL_MS = 60 * 60 * 1000;
const CLOCK_SKEW_SEC = 60;
const EVENT_TYPES = ["email-disabled", "email-enabled", "consent-revoked", "account-delete"];

let jwksCache = { keys: null, fetchedAt: 0 };

async function getAppleKeys(force) {
  if (!force && jwksCache.keys && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS)
    return jwksCache.keys;
  const res = await axios.get(APPLE_JWKS_URL, { timeout: 5000 });
  jwksCache = { keys: res.data.keys || [], fetchedAt: Date.now() };
  return jwksCache.keys;
}

function allowedAudiences() {
  return String(process.env.APPLE_SIWA_AUDIENCE || "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

function b64json(part) {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

// Verifies signature, iss, aud, exp. Returns { claims, event } or throws.
async function verifyAppleNotification(token, opts = {}) {
  if (typeof token != "string") throw new Error("missing payload");
  const parts = token.split(".");
  if (parts.length != 3) throw new Error("malformed JWS");

  const header = b64json(parts[0]);
  if (header.alg != "RS256") throw new Error(`unsupported alg ${header.alg}`);

  const getKeys = opts.getKeys || getAppleKeys;
  let jwk = (await getKeys(false)).find((k) => k.kid == header.kid);
  if (!jwk && !opts.getKeys) jwk = (await getKeys(true)).find((k) => k.kid == header.kid);
  if (!jwk) throw new Error("unknown kid");

  const key = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const valid = crypto.verify(
    "RSA-SHA256",
    Buffer.from(`${parts[0]}.${parts[1]}`),
    key,
    Buffer.from(parts[2], "base64url")
  );
  if (!valid) throw new Error("bad signature");

  const claims = b64json(parts[1]);
  const now = Math.floor((opts.now || Date.now()) / 1000);
  if (claims.iss != APPLE_ISSUER) throw new Error("bad iss");
  const audiences = opts.audiences || allowedAudiences();
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.length || !aud.some((a) => audiences.includes(a)))
    throw new Error("bad aud");
  if (typeof claims.exp != "number" || claims.exp + CLOCK_SKEW_SEC < now)
    throw new Error("expired");

  const event = typeof claims.events == "string" ? JSON.parse(claims.events) : claims.events;
  if (!event || !EVENT_TYPES.includes(event.type) || !event.sub)
    throw new Error("bad events claim");

  return { claims, event };
}

module.exports = { verifyAppleNotification, EVENT_TYPES, APPLE_ISSUER };
