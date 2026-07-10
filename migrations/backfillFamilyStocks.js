require("dotenv").config();
const mongoose = require("mongoose");
const models = require("../db/models");
const bluebird = require("bluebird");
const db = require("../db/db");

async function run() {
  await db.promise;
  
  const families = await models.Family.find({}).select("id").lean().exec();
  console.log(`Found ${families.length} families.`);

  let createdCount = 0;
  
  await bluebird.map(
    families,
    async (family) => {
      const existingStock = await models.FamilyStock.findOne({ familyId: family.id }).lean().exec();
      
      if (!existingStock) {
        await models.FamilyStock.create({
          familyId: family.id,
          isIpoed: false,
          shareSupply: 0,
          treasuryCoins: 0,
          dividendsPaidOut: 0
        });
        createdCount++;
      }
    },
    { concurrency: 10 }
  );

  console.log(`Successfully backfilled ${createdCount} missing FamilyStocks.`);
  process.exit(0);
}

run().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
