const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const db = require("../db/db");
const models = require("../db/models");
const stockMarket = require("../lib/StockMarket");

async function main() {
  await db.promise;
  console.log("Connected to database.");

  // Clear existing family stocks/shareholders/transactions for a clean run
  await models.FamilyStock.deleteMany({ familyId: "test-fam" });
  await models.FamilyShareholder.deleteMany({ familyId: "test-fam" });
  await models.FamilyStockTransaction.deleteMany({ familyId: "test-fam" });

  const bessy = await models.User.findOne({ id: "cCtkSgtqM" }).exec();
  const matronna = await models.User.findOne({ id: "wd8wCtGy2" }).exec();

  console.log("Initial Coins:");
  console.log(`- Bessy: ${bessy.coins}`);
  console.log(`- Matronna: ${matronna.coins}`);

  // 1. Simulate Bessy launching IPO (200 coins)
  console.log("\n--- STEP 1: Launching Family ETF IPO ---");
  await models.User.updateOne({ id: bessy.id }, { $inc: { coins: -200 } });
  await models.FamilyStock.create({ familyId: "test-fam", isIpoed: true, shareSupply: 1 });
  await models.FamilyShareholder.create({ familyId: "test-fam", holderId: bessy.id, sharesOwned: 1 });
  await models.FamilyStockTransaction.create({
    userId: bessy.id,
    familyId: "test-fam",
    type: "buy",
    shares: 1,
    price: 200,
    fee: 0
  });
  console.log("IPO launched! Supply = 1, Bessy holds 1 share.");

  // 2. Simulate Matronna buying 10 shares
  console.log("\n--- STEP 2: Matronna buys 10 shares ---");
  const stock = await models.FamilyStock.findOne({ familyId: "test-fam" }).exec();
  const buyCalc = stockMarket.getBuyPrice(stock.shareSupply, 10);
  console.log("Buy cost estimate:", buyCalc);

  await models.User.updateOne({ id: matronna.id }, { $inc: { coins: -buyCalc.total } });
  await models.FamilyStock.updateOne(
    { familyId: "test-fam" },
    { $inc: { treasuryCoins: buyCalc.creatorFee, shareSupply: 10 } }
  );
  await models.FamilyShareholder.findOneAndUpdate(
    { familyId: "test-fam", holderId: matronna.id },
    { $inc: { sharesOwned: 10 } },
    { upsert: true }
  );
  await models.FamilyStockTransaction.create({
    userId: matronna.id,
    familyId: "test-fam",
    type: "buy",
    shares: 10,
    price: buyCalc.price,
    fee: buyCalc.creatorFee + buyCalc.systemFee
  });
  console.log(`Matronna bought 10 shares. Family Stock supply is now 11.`);

  // 3. Simulate snapshotting and dividend distribution on game complete
  console.log("\n--- STEP 3: Simulating game completed win with 20 coins ---");
  // Snapshot taken at game start
  const activeStock = await models.FamilyStock.findOne({ familyId: "test-fam" }).lean().exec();
  const holders = await models.FamilyShareholder.find({ familyId: "test-fam" }).lean().exec();
  
  const startSnapshot = {
    shareSupply: activeStock.shareSupply,
    holders: holders.map(h => ({
      holderId: h.holderId,
      sharesOwned: h.sharesOwned
    }))
  };
  console.log("Start Snapshot:", startSnapshot);

  // Distribute dividends for Bessy's win (20 coins won)
  console.log("Distributing family dividends...");
  const payouts = await stockMarket.distributeFamilyDividends("test-fam", 20, startSnapshot);
  console.log("Payouts:", payouts);

  // 4. Fetch and display final state
  console.log("\n--- FINAL EVALUATION ---");
  const finalBessy = await models.User.findOne({ id: bessy.id }).exec();
  const finalMatronna = await models.User.findOne({ id: matronna.id }).exec();
  const finalStock = await models.FamilyStock.findOne({ familyId: "test-fam" }).exec();
  const finalShareholders = await models.FamilyShareholder.find({ familyId: "test-fam" }).exec();

  console.log(`Bessy Final Coins: ${finalBessy.coins} (Diff: ${finalBessy.coins - bessy.coins})`);
  console.log(`Matronna Final Coins: ${finalMatronna.coins} (Diff: ${finalMatronna.coins - matronna.coins})`);
  console.log("Family Stock Metadata:", finalStock.toJSON());
  console.log("Shareholders:");
  console.dir(finalShareholders.map(s => s.toJSON()));

  process.exit(0);
}

main().catch(err => {
  console.error("Error running Family ETF lifecycle simulation:", err);
  process.exit(1);
});
