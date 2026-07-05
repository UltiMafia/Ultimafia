const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Override MONGO_URL to run locally on the host
process.env.MONGO_URL = "127.0.0.1";

const db = require("../db/db");
const models = require("../db/models");

async function main() {
  try {
    await db.promise;
    console.log("Connected to MongoDB. Starting IPO transaction backfill...");

    // 1. Backfill Player Stock IPOs
    const playerStocks = await models.PlayerStock.find({ isIpoed: true }).exec();
    console.log(`Found ${playerStocks.length} IPOed player stocks.`);

    let playerIpoBackfilled = 0;
    let playerIpoUpdated = 0;

    for (const ps of playerStocks) {
      // Find if an IPO transaction already exists.
      // Legacy was missing, new code wrote it as price: 100, fee: 0, new Option B writes it as price: 1, fee: 0.
      const existingIpo = await models.StockTransaction.findOne({
        userId: ps.userId,
        subjectId: ps.userId,
        type: "buy",
        shares: 1,
        fee: 0,
        price: { $in: [1, 100] }
      }).exec();

      if (existingIpo) {
        if (existingIpo.price === 100) {
          // Update to price: 1 to be consistent with Option B
          existingIpo.price = 1;
          await existingIpo.save();
          console.log(`Updated existing IPO transaction for player stock ${ps.userId} from price 100 to 1.`);
          playerIpoUpdated++;
        }
      } else {
        // Backfill a new IPO transaction record
        const earliestTx = await models.StockTransaction.findOne({ subjectId: ps.userId })
          .sort({ createdAt: 1 })
          .exec();

        let ipoTime = new Date();
        if (earliestTx) {
          ipoTime = new Date(earliestTx.createdAt.getTime() - 60 * 1000);
        } else {
          ipoTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        }

        await models.StockTransaction.create({
          userId: ps.userId,
          subjectId: ps.userId,
          type: "buy",
          shares: 1,
          price: 1,
          fee: 0,
          createdAt: ipoTime
        });

        console.log(`Backfilled IPO transaction for player stock ${ps.userId} at ${ipoTime.toISOString()}`);
        playerIpoBackfilled++;
      }
    }
    console.log(`Player Stocks: ${playerIpoBackfilled} backfilled, ${playerIpoUpdated} updated.`);

    // 2. Backfill Family Stock IPOs
    const familyStocks = await models.FamilyStock.find({ isIpoed: true }).exec();
    console.log(`Found ${familyStocks.length} IPOed family stocks.`);

    let familyIpoBackfilled = 0;
    let familyIpoUpdated = 0;

    for (const fs of familyStocks) {
      const existingIpo = await models.FamilyStockTransaction.findOne({
        familyId: fs.familyId,
        type: "buy",
        shares: 1,
        fee: 0,
        price: { $in: [1, 200] }
      }).exec();

      if (existingIpo) {
        if (existingIpo.price === 200) {
          existingIpo.price = 1;
          await existingIpo.save();
          console.log(`Updated existing IPO transaction for family ETF ${fs.familyId} from price 200 to 1.`);
          familyIpoUpdated++;
        }
      } else {
        const family = await models.Family.findOne({ id: fs.familyId }).exec();
        if (!family) {
          console.warn(`Warning: Family document not found for ETF ${fs.familyId}. Skipping.`);
          continue;
        }

        // Find the creator/leader's User document to get their string ID
        const leaderUser = await models.User.findOne({ _id: family.leader }).exec();
        if (!leaderUser) {
          console.warn(`Warning: Leader user not found for family ${fs.familyId}. Skipping.`);
          continue;
        }
        const creatorUserId = leaderUser.id;

        const earliestTx = await models.FamilyStockTransaction.findOne({ familyId: fs.familyId })
          .sort({ createdAt: 1 })
          .exec();

        let ipoTime = new Date();
        if (earliestTx) {
          ipoTime = new Date(earliestTx.createdAt.getTime() - 60 * 1000);
        } else {
          ipoTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        }

        await models.FamilyStockTransaction.create({
          userId: creatorUserId,
          familyId: fs.familyId,
          type: "buy",
          shares: 1,
          price: 1,
          fee: 0,
          createdAt: ipoTime
        });

        console.log(`Backfilled IPO transaction for family ETF ${fs.familyId} (Creator: ${creatorUserId}) at ${ipoTime.toISOString()}`);
        familyIpoBackfilled++;
      }
    }
    console.log(`Family ETFs: ${familyIpoBackfilled} backfilled, ${familyIpoUpdated} updated.`);

    console.log("Backfill operation completed successfully!");
  } catch (err) {
    console.error("Error in backfill script:", err);
  } finally {
    process.exit(0);
  }
}

main();
