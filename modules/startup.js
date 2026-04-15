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
        badge: groupInfo.badge,
        badgeColor: groupInfo.badgeColor,
      });
      await group.save();
    } else {
      const update = {
        $addToSet: { permissions: { $each: permissions } },
      };
      if (groupInfo.badge !== undefined || groupInfo.badgeColor !== undefined) {
        update.$set = {};
        if (groupInfo.badge !== undefined)
          update.$set.badge = groupInfo.badge;
        if (groupInfo.badgeColor !== undefined)
          update.$set.badgeColor = groupInfo.badgeColor;
      }
      await models.Group.updateOne({ _id: group._id }, update).exec();
    }
  }
};
