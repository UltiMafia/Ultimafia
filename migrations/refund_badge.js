require("dotenv").config();
const { promise } = require("../db/db");

promise.then(async () => {
  const models = require("../db/models");
  
  // Find all families that have the 'familyBadge' perk
  const families = await models.Family.find({ perks: "familyBadge" });
  
  console.log(`Found ${families.length} families with the familyBadge perk.`);
  
  for (const family of families) {
    await models.Family.updateOne(
      { _id: family._id },
      { 
        $pull: { perks: "familyBadge" },
        $inc: { treasury: 500 }
      }
    );
    console.log(`Refunded 500 coins and removed perk from family: ${family.name}`);
  }
  
  console.log("Migration complete.");
  process.exit(0);
});
