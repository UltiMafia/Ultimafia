const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const db = require("../db/db");
const models = require("../db/models");
const stockMarket = require("../lib/StockMarket");
const redis = require("../modules/redis");

async function main() {
  await db.promise;
  console.log("Connected to database.");

  const bessy = await models.User.findOne({ id: "cCtkSgtqM" }).exec();
  const matronna = await models.User.findOne({ id: "wd8wCtGy2" }).exec();

  if (!bessy || !matronna) {
    console.error("Test users BessyDale71 and MatronnaCchaddie25 must exist.");
    process.exit(1);
  }

  // 1. Ensure Player Stock is IPOed
  let playerStock = await models.PlayerStock.findOne({ userId: bessy.id }).exec();
  if (!playerStock || !playerStock.isIpoed) {
    console.log("IPOing BessyDale71 first...");
    playerStock = await models.PlayerStock.findOneAndUpdate(
      { userId: bessy.id },
      { isIpoed: true, shareSupply: 1 },
      { upsert: true, new: true }
    );
    await models.Shareholder.findOneAndUpdate(
      { subjectId: bessy.id, holderId: bessy.id },
      { $inc: { sharesOwned: 1 } },
      { upsert: true }
    );
  }

  // 2. Ensure Family Stock is IPOed
  let familyStock = await models.FamilyStock.findOne({ familyId: "test-fam" }).exec();
  if (!familyStock || !familyStock.isIpoed) {
    console.log("IPOing family test-fam first...");
    familyStock = await models.FamilyStock.findOneAndUpdate(
      { familyId: "test-fam" },
      { isIpoed: true, shareSupply: 1 },
      { upsert: true, new: true }
    );
    await models.FamilyShareholder.findOneAndUpdate(
      { familyId: "test-fam", holderId: bessy.id },
      { $inc: { sharesOwned: 1 } },
      { upsert: true }
    );
  }

  // Give Matronna 3000 coins to make sure they can afford all trades
  await models.User.updateOne({ id: matronna.id }, { $set: { coins: 3000 } });
  console.log("Set Matronna's coins to 3000 for trading.");

  // Helper to execute player buy
  async function playerBuy(shares, dateOffsetMin) {
    const stock = await models.PlayerStock.findOne({ userId: bessy.id }).exec();
    const buyCalc = stockMarket.getBuyPrice(stock.shareSupply, shares);
    
    await models.User.updateOne({ id: matronna.id }, { $inc: { coins: -buyCalc.total } });
    await models.User.updateOne({ id: bessy.id }, { $inc: { coins: buyCalc.creatorFee } });
    await models.PlayerStock.updateOne(
      { userId: bessy.id },
      { $inc: { creatorFeesEarned: buyCalc.creatorFee, shareSupply: shares } }
    );
    await models.Shareholder.findOneAndUpdate(
      { subjectId: bessy.id, holderId: matronna.id },
      { $inc: { sharesOwned: shares } },
      { upsert: true }
    );
    await models.StockTransaction.create({
      userId: matronna.id,
      subjectId: bessy.id,
      type: "buy",
      shares,
      price: buyCalc.price,
      fee: buyCalc.creatorFee + buyCalc.systemFee,
      createdAt: new Date(Date.now() + dateOffsetMin * 60 * 1000)
    });
    console.log(`[Player Buy] Matronna bought ${shares} shares of Bessy. New supply: ${stock.shareSupply + shares}. Base Price: ${buyCalc.price}`);
  }

  // Helper to execute player sell
  async function playerSell(shares, dateOffsetMin) {
    const stock = await models.PlayerStock.findOne({ userId: bessy.id }).exec();
    const sellCalc = stockMarket.getSellPrice(stock.shareSupply, shares);
    
    await models.User.updateOne({ id: matronna.id }, { $inc: { coins: sellCalc.total } });
    await models.PlayerStock.updateOne(
      { userId: bessy.id },
      { $inc: { creatorFeesEarned: sellCalc.creatorFee, shareSupply: -shares } }
    );
    await models.Shareholder.findOneAndUpdate(
      { subjectId: bessy.id, holderId: matronna.id },
      { $inc: { sharesOwned: -shares } }
    );
    await models.StockTransaction.create({
      userId: matronna.id,
      subjectId: bessy.id,
      type: "sell",
      shares,
      price: sellCalc.price,
      fee: sellCalc.creatorFee + sellCalc.systemFee,
      createdAt: new Date(Date.now() + dateOffsetMin * 60 * 1000)
    });
    console.log(`[Player Sell] Matronna sold ${shares} shares of Bessy. New supply: ${stock.shareSupply - shares}. Base Price: ${sellCalc.price}`);
  }

  // Helper to execute family buy
  async function familyBuy(shares, dateOffsetMin) {
    const stock = await models.FamilyStock.findOne({ familyId: "test-fam" }).exec();
    const buyCalc = stockMarket.getBuyPrice(stock.shareSupply, shares);
    
    await models.User.updateOne({ id: matronna.id }, { $inc: { coins: -buyCalc.total } });
    await models.FamilyStock.updateOne(
      { familyId: "test-fam" },
      { $inc: { treasuryCoins: buyCalc.creatorFee, shareSupply: shares } }
    );
    await models.FamilyShareholder.findOneAndUpdate(
      { familyId: "test-fam", holderId: matronna.id },
      { $inc: { sharesOwned: shares } },
      { upsert: true }
    );
    await models.FamilyStockTransaction.create({
      userId: matronna.id,
      familyId: "test-fam",
      type: "buy",
      shares,
      price: buyCalc.price,
      fee: buyCalc.creatorFee + buyCalc.systemFee,
      createdAt: new Date(Date.now() + dateOffsetMin * 60 * 1000)
    });
    console.log(`[Family Buy] Matronna bought ${shares} shares of test-fam. New supply: ${stock.shareSupply + shares}. Base Price: ${buyCalc.price}`);
  }

  // Helper to execute family sell
  async function familySell(shares, dateOffsetMin) {
    const stock = await models.FamilyStock.findOne({ familyId: "test-fam" }).exec();
    const sellCalc = stockMarket.getSellPrice(stock.shareSupply, shares);
    
    await models.User.updateOne({ id: matronna.id }, { $inc: { coins: sellCalc.total } });
    await models.FamilyStock.updateOne(
      { familyId: "test-fam" },
      { $inc: { treasuryCoins: sellCalc.creatorFee, shareSupply: -shares } }
    );
    await models.FamilyShareholder.findOneAndUpdate(
      { familyId: "test-fam", holderId: matronna.id },
      { $inc: { sharesOwned: -shares } }
    );
    await models.FamilyStockTransaction.create({
      userId: matronna.id,
      familyId: "test-fam",
      type: "sell",
      shares,
      price: sellCalc.price,
      fee: sellCalc.creatorFee + sellCalc.systemFee,
      createdAt: new Date(Date.now() + dateOffsetMin * 60 * 1000)
    });
    console.log(`[Family Sell] Matronna sold ${shares} shares of test-fam. New supply: ${stock.shareSupply - shares}. Base Price: ${sellCalc.price}`);
  }

  console.log("\nSimulating trading waves...");
  // Clear previous transaction history to make the new wave perfectly clean
  await models.StockTransaction.deleteMany({ subjectId: bessy.id });
  await models.FamilyStockTransaction.deleteMany({ familyId: "test-fam" });
  
  // Re-create initial IPO buy
  await models.StockTransaction.create({
    userId: bessy.id,
    subjectId: bessy.id,
    type: "buy",
    shares: 1,
    price: 50,
    fee: 0,
    createdAt: new Date(Date.now() - 60 * 60 * 1000)
  });
  await models.FamilyStockTransaction.create({
    userId: bessy.id,
    familyId: "test-fam",
    type: "buy",
    shares: 1,
    price: 200,
    fee: 0,
    createdAt: new Date(Date.now() - 60 * 60 * 1000)
  });

  // Run wave for Bessy (Player Stock)
  await playerBuy(3, 5);
  await playerBuy(6, 10);
  await playerBuy(10, 15);
  await playerSell(5, 20);
  await playerBuy(12, 25);
  await playerSell(8, 30);
  await playerBuy(15, 35);
  await playerSell(4, 40);

  // Run wave for Family ETF
  await familyBuy(2, 5);
  await familyBuy(5, 10);
  await familyBuy(8, 15);
  await familySell(3, 20);
  await familyBuy(10, 25);
  await familySell(6, 30);
  await familyBuy(12, 35);
  await familySell(5, 40);

  // Refresh cache
  await redis.cacheUserInfo(bessy.id, true);
  await redis.cacheUserInfo(matronna.id, true);
  console.log("\nTrading simulation complete! Cache refreshed.");
  process.exit(0);
}

main().catch(err => {
  console.error("Error running trading activity generator:", err);
  process.exit(1);
});
