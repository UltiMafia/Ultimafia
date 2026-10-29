// A site-banned user who signs in gets a ban page session
// (req.session.siteBan, no req.session.user; see routes/auth.js). It may only
// reach what the ban page needs: the ban page endpoints (ban info, the appeal,
// sign out), GET /api/user/info (which tells the client to show /banned) and
// the sign-in routes, which replace it with a normal session. Every other API
// answers 403, so the session can't open the lobby, games, chat or DMs, and
// it can't get a chat or game socket token.
function isBanSession(req) {
  const session = req.session;
  return !!(session && session.siteBan && !session.user && !req.devApi);
}

function allowedForBanSession(req) {
  const path = req.path;
  if (path === "/user/info") return req.method === "GET";
  // /auth/ban/* is the ban page; the rest of /auth signs in (to this or
  // another account) and checks the captcha before it.
  return path === "/auth" || path.startsWith("/auth/");
}

function banSessionGate(req, res, next) {
  if (!isBanSession(req) || allowedForBanSession(req)) return next();
  res.status(403);
  res.send({ siteBanned: true, banPage: "/banned" });
}

module.exports = { banSessionGate, isBanSession, allowedForBanSession };
