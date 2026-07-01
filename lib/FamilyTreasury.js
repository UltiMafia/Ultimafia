const models = require("../db/models");

/**
 * Family treasury coins live on FamilyStock.treasuryCoins so member deposits,
 * ETF trading fees, and dividends share one balance.
 */
async function getTreasuryCoins(familyId) {
  const stock = await models.FamilyStock.findOne({ familyId })
    .select("treasuryCoins")
    .lean();
  return Number(stock?.treasuryCoins || 0);
}

async function getTreasuryCoinsByFamilyIds(familyIds) {
  if (!familyIds.length) return new Map();

  const stocks = await models.FamilyStock.find({
    familyId: { $in: familyIds },
  })
    .select("familyId treasuryCoins")
    .lean();

  return new Map(
    stocks.map((stock) => [stock.familyId, Number(stock.treasuryCoins || 0)])
  );
}

async function depositTreasuryCoins(familyId, amount) {
  const stock = await models.FamilyStock.findOneAndUpdate(
    { familyId },
    { $inc: { treasuryCoins: amount } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
    .select("treasuryCoins")
    .lean();

  return Number(stock?.treasuryCoins || 0);
}

async function withdrawTreasuryCoins(familyId, amount) {
  const result = await models.FamilyStock.updateOne(
    { familyId, treasuryCoins: { $gte: amount } },
    { $inc: { treasuryCoins: -amount } }
  );

  return result.modifiedCount > 0 || result.nModified > 0;
}

module.exports = {
  getTreasuryCoins,
  getTreasuryCoinsByFamilyIds,
  depositTreasuryCoins,
  withdrawTreasuryCoins,
};
