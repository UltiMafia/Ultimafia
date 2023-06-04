const shortid = require("shortid");
const constants = require("../data/constants");
const models = require("../db/models");
const redis = require("./redis");

module.exports = async function () {
  await redis.clearPermissionCache();

  for (let groupName in constants.defaultGroups) {
    let groupInfo = constants.defaultGroups[groupName];
    let group = await models.Group.findOne({
      name: new RegExp(`^${groupName}$`, "i"),
    }).select("_id");
    let permissions = [];

    if (Array.isArray(groupInfo.perms)) permissions = groupInfo.perms;
    else if (groupInfo.perms == "*")
      permissions = Object.keys(constants.allPerms);

    if (!group) {
      group = new models.Group({
        id: shortid.generate(),
        name: groupName,
        rank: groupInfo.rank,
        permissions: permissions,
        visible: groupInfo.visible,
      });
      await group.save();
    } else
      await models.Group.updateOne(
        { _id: group._id },
        { $addToSet: { permissions: { $each: permissions } } }
      ).exec();
  }
};
