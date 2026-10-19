// Resolve the Mongo _id of the caller for routes that store or query by
// ObjectId. Session logins carry it in req.session.user._id; developer API
// bearer tokens only set req.devApi.userId, so look the user up by id.
async function findUserObjectId(userId) {
  const models = require("../../db/models");
  const user = await models.User.findOne({ id: userId, deleted: false })
    .select("_id")
    .lean();
  return user && user._id;
}

async function requestUserObjectId(req, findUser = findUserObjectId) {
  if (req.devApi) {
    if (!req.devApi.userId) return undefined;
    return (await findUser(req.devApi.userId)) || undefined;
  }
  return req.session && req.session.user ? req.session.user._id : undefined;
}

module.exports = { requestUserObjectId };
