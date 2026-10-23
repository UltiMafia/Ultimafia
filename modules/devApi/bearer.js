const keys = require("./keys");
const errors = require("./errors");

const bearerRoutes = [
  /^\/api\/dev\//,
  /^\/api\/game\/(host|leave|cancel)$/,
  /^\/api\/game\/[^/]+\/(info|review\/data)$/,
  /^\/api\/game\/list$/,
  /^\/api\/setup\//,
  /^\/api\/roles\//,
];

function bearerToken(req) {
  const header = req.get("authorization") || "";
  const match = header.match(/^Bearer\s+(\S+)$/i);
  return match && match[1];
}

module.exports = async function devApiBearer(req, res, next) {
  const token = bearerToken(req);
  if (!token) return next();

  try {
    const path = req.originalUrl.split("?")[0];
    if (!bearerRoutes.some((route) => route.test(path))) {
      errors.forbidden(res, "This route is not available with a developer token.");
      return;
    }
    const session = await keys.authenticate(token);
    if (!session) {
      errors.unauthorized(res, "Invalid or expired developer token.");
      return;
    }
    req.devApi = session;
    next();
  } catch (e) {
    next(e);
  }
};
