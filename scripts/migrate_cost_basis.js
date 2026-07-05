require("dotenv").config();
const db = require("../db/db");
const models = require("../db/models");

async function migrate() {
  await db.promise;
  console.log("Connected to MongoDB. Starting migration...");

  // Player stocks
  const playerHoldings = await models.Shareholder.find({}).exec();
  console.log(`Found ${playerHoldings.length} player holdings.`);
  for (const h of playerHoldings) {
    const txs = await models.StockTransaction.find({
      userId: h.holderId,
      subjectId: h.subjectId
    }).sort({ createdAt: 1 }).lean().exec();

    let costBasis = 0;
    let shares = 0;
    let averageBuyPrice = 0;
    for (const tx of txs) {
      if (tx.type === "buy") {
        costBasis += tx.price + tx.fee;
        shares += tx.shares;
        averageBuyPrice = shares > 0 ? costBasis / shares : 0;
      } else {
        const avgPrice = shares > 0 ? costBasis / shares : 0;
        shares = Math.max(0, shares - tx.shares);
        costBasis = shares * avgPrice;
        averageBuyPrice = avgPrice;
      }
    }
    await models.Shareholder.updateOne(
      { _id: h._id },
      { $set: { costBasis, averageBuyPrice } }
    );
  }
  console.log("Player holdings migrated.");

  // Family stocks
  const familyHoldings = await models.FamilyShareholder.find({}).exec();
  console.log(`Found ${familyHoldings.length} family holdings.`);
  for (const h of familyHoldings) {
    const txs = await models.FamilyStockTransaction.find({
      userId: h.holderId,
      familyId: h.familyId
    }).sort({ createdAt: 1 }).lean().exec();

    let costBasis = 0;
    let shares = 0;
    let averageBuyPrice = 0;
    for (const tx of txs) {
      if (tx.type === "buy") {
        costBasis += tx.price + tx.fee;
        shares += tx.shares;
        averageBuyPrice = shares > 0 ? costBasis / shares : 0;
      } else {
        const avgPrice = shares > 0 ? costBasis / shares : 0;
        shares = Math.max(0, shares - tx.shares);
        costBasis = shares * avgPrice;
        averageBuyPrice = avgPrice;
      }
    }
    await models.FamilyShareholder.updateOne(
      { _id: h._id },
      { $set: { costBasis, averageBuyPrice } }
    );
  }
  console.log("Family holdings migrated.");
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
