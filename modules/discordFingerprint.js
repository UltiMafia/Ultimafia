// The Discord OAuth flow leaves the site, so the page's JavaScript state cannot
// carry the device fingerprint back to the callback. The client puts the
// fingerprint in the query string of the request that starts the flow; this
// module keeps it in the session until the strategy callback consumes it.
//
// The value is client-supplied either way (the POST body is no different), so
// this only has to be bounded and shaped like a fingerprint. Anything else is
// dropped, and the callback falls back to the old no-fingerprint behaviour.
const MAX_LENGTH = 2048;
const KEY = "discordFingerprint";

function stash(req, raw) {
  if (!req || !req.session) return false;
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_LENGTH) {
    return false;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return false;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
  if (typeof parsed.platform !== "string" || typeof parsed.stable !== "string") {
    return false;
  }

  req.session[KEY] = parsed;
  return true;
}

// Single use: a second call returns null even inside the same session.
function take(req) {
  if (!req || !req.session) return null;
  const fingerprint = req.session[KEY] || null;
  delete req.session[KEY];
  return fingerprint;
}

module.exports = { stash, take, MAX_LENGTH };
