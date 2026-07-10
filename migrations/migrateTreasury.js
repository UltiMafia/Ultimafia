require("dotenv").config();
const mongoose = require("mongoose");
const models = require("../db/models");
const bluebird = require("bluebird");
const db = require("../db/db");

async function run() {
  await db.promise;
  
  // Find all FamilyStocks using lean to get old fields even if removed from schema
  const stocks = await mongoose.connection.collection("familystocks").find({}).toArray();
  console.log(`Found ${stocks.length} family stocks to migrate.`);

  let migratedCount = 0;
  
  await bluebird.map(
    stocks,
    async (stock) => {
      let treasury = Number(stock.treasuryCoins || 0);
      if (treasury > 0) {
        // Move to Family.treasury
        await models.Family.updateOne(
          { id: stock.familyId },
          { $inc: { treasury: treasury } }
        );
        
        // Remove treasuryCoins from FamilyStock and set creatorFeesEarned
        await mongoose.connection.collection("familystocks").updateOne(
          { familyId: stock.familyId },
          { 
            $unset: { treasuryCoins: "" }, 
            $set: { creatorFeesEarned: treasury }
          }
        );
        
        migratedCount++;
      }
    },
    { concurrency: 10 }
  );

  console.log(`Successfully migrated ${migratedCount} family treasuries.`);
  process.exit(0);
}

run().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
