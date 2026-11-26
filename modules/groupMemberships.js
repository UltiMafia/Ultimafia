const models = require("../db/models");

// Older memberships have no election. An elected membership only becomes
// effective when the certified election references that exact membership.
function electedMemberships(filter) {
  return models.InGroup.aggregate([
    { $match: { ...filter, election: { $ne: null }, revokedAt: null } },
    { $lookup: {
      from: models.AdminElection.collection.name,
      localField: "election",
      foreignField: "_id",
      as: "result",
      pipeline: [{ $project: { adminMembership: 1, termEndsAt: 1 } }],
    } },
    { $unwind: "$result" },
    { $match: { $expr: { $and: [
      { $eq: ["$result.adminMembership", "$_id"] },
      { $gt: ["$result.termEndsAt", "$$NOW"] },
    ] } } },
    { $project: { result: 0 } },
  ]);
}

async function activeMemberships(filter, { includeElected = true } = {}) {
  const [permanent, elected] = await Promise.all([
    models.InGroup.find({ ...filter, election: null }).lean(),
    includeElected ? electedMemberships(filter) : [],
  ]);
  return [...permanent, ...elected];
}

function stageElectionMembership(election, user, group) {
  return models.InGroup.findOneAndUpdate(
    { election, user },
    { $setOnInsert: { group } },
    { new: true, upsert: true }
  ).select("_id").lean();
}

async function removeMemberships(user, group, removedBy) {
  const filter = { user, group };
  const elected = await electedMemberships(filter);
  if (elected.length) {
    await models.InGroup.updateMany({
      _id: { $in: elected.map(({ _id }) => _id) }, revokedAt: null,
    }, { $currentDate: { revokedAt: true }, $set: { revokedBy: removedBy } });
  }
  await models.InGroup.deleteMany({ ...filter, election: null });
}

module.exports = { activeMemberships, electedMemberships, stageElectionMembership, removeMemberships };
