const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const db = require("../db/db");
const models = require("../db/models");

async function main() {
  await db.promise;
  console.log("=== EVALUATION OF STOCK MARKET DATABASE ===");

  const stocks = await models.PlayerStock.find({}).lean().exec();
  console.log(`\n1. Active Player Stocks (${stocks.length}):`);
  console.dir(stocks, { depth: null });

  const shareholders = await models.Shareholder.find({}).lean().exec();
  console.log(`\n2. Shareholder Holdings (${shareholders.length}):`);
  console.dir(shareholders, { depth: null });

  const transactions = await models.StockTransaction.find({}).sort({ createdAt: -1 }).lean().exec();
  console.log(`\n3. Stock Transactions Log (${transactions.length}):`);
  console.dir(transactions, { depth: null });

  const users = await models.User.find({}).select("id name coins").lean().exec();
  console.log("\n4. Current User Balances:");
  console.dir(users, { depth: null });

  process.exit(0);
}

main().catch((err) => {
  console.error("Error running evaluation script:", err);
  process.exit(1);
});
