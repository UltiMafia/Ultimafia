const express = require("express");
const models = require("../db/models");
const routeUtils = require("./utils");
const errors = require("../lib/errors");
const logger = require("../modules/logging")(".");
const stockMarket = require("../lib/StockMarket");
const redis = require("../modules/redis");

const router = express.Router();

// Helper to check positive integers
function isPositiveInteger(val) {
  const num = Number(val);
  return Number.isInteger(num) && num > 0;
}

/**
 * GET /api/stocks
 * Lists all active IPOed players, their prices, and stats.
 */
router.get("/", async function (req, res) {
  try {
    const stocks = await models.PlayerStock.find({ isIpoed: true }).lean().exec();
    const userIds = stocks.map(s => s.userId);

    const [users, transactions] = await Promise.all([
      models.User.find({ id: { $in: userIds } })
        .select("id name avatar settings.nameColor settings.vanityUrl")
        .lean()
        .exec(),
      models.StockTransaction.find({ subjectId: { $in: userIds } })
        .sort({ createdAt: 1 })
        .select("subjectId price")
        .lean()
        .exec()
    ]);

    const userMap = {};
    for (const u of users) {
      userMap[u.id] = u;
    }

    const historyMap = {};
    for (const userId of userIds) {
      historyMap[userId] = [1];
    }
    for (const tx of transactions) {
      if (historyMap[tx.subjectId]) {
        historyMap[tx.subjectId].push(tx.price);
      }
    }
    for (const userId of userIds) {
      if (historyMap[userId].length > 10) {
        historyMap[userId] = historyMap[userId].slice(-10);
      }
    }

    const result = stocks.map(stock => {
      const u = userMap[stock.userId] || { name: "Unknown" };
      const buyPrice = stockMarket.getBuyPrice(stock.shareSupply, 1);
      const sellPrice = stockMarket.getSellPrice(stock.shareSupply, 1);

      return {
        userId: stock.userId,
        username: u.name,
        avatar: u.avatar,
        vanityUrl: u.settings?.vanityUrl || "",
        nameColor: u.settings?.nameColor || "",
        shareSupply: stock.shareSupply,
        buyPrice: buyPrice.total,
        sellPrice: sellPrice.total,
        creatorFeesEarned: stock.creatorFeesEarned,
        dividendsPaidOut: stock.dividendsPaidOut,
        priceHistory: historyMap[stock.userId]
      };
    });

    res.send(result);
  } catch (e) {
    logger.error(e);
    errors.serverError(res);
  }
});

/**
 * GET /api/stocks/portfolio
 * Gets the logged-in user's stock holdings.
 */
router.get("/portfolio", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);

    const holdings = await models.Shareholder.find({ holderId: userId, sharesOwned: { $gt: 0 } }).lean().exec();
    const subjectIds = holdings.map(h => h.subjectId);

    const [stocks, users, transactions] = await Promise.all([
      models.PlayerStock.find({ userId: { $in: subjectIds } }).lean().exec(),
      models.User.find({ id: { $in: subjectIds } })
        .select("id name avatar settings.nameColor settings.vanityUrl")
        .lean()
        .exec(),
      // Fetch all buy/sell transactions this user made for these stocks
      models.StockTransaction.find({ userId, subjectId: { $in: subjectIds } })
        .select("subjectId type price fee shares")
        .lean()
        .exec()
    ]);

    const stockMap = {};
    for (const s of stocks) stockMap[s.userId] = s;

    const userMap = {};
    for (const u of users) userMap[u.id] = u;

    const holdingMap = {};
    for (const h of holdings) holdingMap[h.subjectId] = h;

    // Compute net cost basis per stock from transaction history:
    // costBasis = sum of coins spent on buys - sum of coins received from sells
    const costBasisMap = {};
    for (const tx of transactions) {
      if (!costBasisMap[tx.subjectId]) costBasisMap[tx.subjectId] = 0;
      if (tx.type === "buy") {
        costBasisMap[tx.subjectId] += tx.price + tx.fee;
      } else {
        costBasisMap[tx.subjectId] -= (tx.price - tx.fee);
      }
    }

    const result = subjectIds.map(subjectId => {
      const h = holdingMap[subjectId];
      const stock = stockMap[subjectId] || { shareSupply: 0 };
      const u = userMap[subjectId] || { name: "Unknown" };
      const sellPrice = stockMarket.getSellPrice(stock.shareSupply, h.sharesOwned);
      const costBasis = parseFloat((costBasisMap[subjectId] || 0).toFixed(2));
      const liquidValue = sellPrice.total;
      const unrealizedPnL = parseFloat((liquidValue - costBasis).toFixed(2));

      return {
        subjectId,
        username: u.name,
        avatar: u.avatar,
        vanityUrl: u.settings?.vanityUrl || "",
        nameColor: u.settings?.nameColor || "",
        sharesOwned: h.sharesOwned,
        averageSellValue: liquidValue,
        currentSingleSellPrice: stockMarket.getSellPrice(stock.shareSupply, 1).total,
        costBasis,
        unrealizedPnL,
        dividendsReceived: parseFloat(h.dividendsReceived.toFixed(2))
      };
    });

    res.send(result);
  } catch (e) {
    if (e.message === "Not logged in") {
      return errors.unauthorized(res, "You must be logged in to view your portfolio.");
    }
    logger.error(e);
    errors.serverError(res);
  }
});

/**
 * GET /api/stocks/prices/:subjectId
 * Gets specific stock details and price estimations.
 */
router.get("/prices/:subjectId", async function (req, res) {
  try {
    const subjectId = String(req.params.subjectId);
    const stock = await models.PlayerStock.findOne({ userId: subjectId }).lean().exec();
    if (!stock || !stock.isIpoed) {
      return errors.notFound(res, "This player has not IPO'd or does not exist.");
    }

    const user = await models.User.findOne({ id: subjectId }).select("name settings.nameColor").lean().exec();
    const buy1 = stockMarket.getBuyPrice(stock.shareSupply, 1);
    const sell1 = stockMarket.getSellPrice(stock.shareSupply, 1);

    res.send({
      userId: stock.userId,
      username: user ? user.name : "Unknown",
      nameColor: user?.settings?.nameColor || "",
      shareSupply: stock.shareSupply,
      buyPrice1: buy1.total,
      sellPrice1: sell1.total,
      creatorFeesEarned: stock.creatorFeesEarned,
      dividendsPaidOut: stock.dividendsPaidOut
    });
  } catch (e) {
    logger.error(e);
    errors.serverError(res);
  }
});

/**
 * POST /api/stocks/ipo
 * Initiates an IPO for the logged-in user. Costs 100 coins.
 */
router.post("/ipo", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);

    // 1. Check existing IPO
    const stock = await models.PlayerStock.findOne({ userId }).exec();
    if (stock && stock.isIpoed) {
      return errors.conflict(res, "You are already IPO'd.");
    }

    // 2. Check balance (needs 100 coins)
    const user = await models.User.findOne({ id: userId }).select("coins").exec();
    if (!user || user.coins < 100) {
      return errors.forbidden(res, "Insufficient coins. Starting an IPO costs 100 coins.");
    }

    // 3. Deduct coins atomically
    const debit = await models.User.updateOne(
      { id: userId, coins: { $gte: 100 } },
      { $inc: { coins: -100 } }
    ).exec();

    if (debit.modifiedCount === 0 && debit.nModified === 0) {
      return errors.forbidden(res, "Insufficient coins.");
    }

    // 4. Create/update PlayerStock
    await models.PlayerStock.findOneAndUpdate(
      { userId },
      { isIpoed: true, shareSupply: 1 },
      { upsert: true, new: true }
    ).exec();

    // 5. Grant the first share to the creator
    await models.Shareholder.findOneAndUpdate(
      { subjectId: userId, holderId: userId },
      { $inc: { sharesOwned: 1 } },
      { upsert: true }
    ).exec();

    // Note: the IPO fee is a listing cost, not an open-market purchase,
    // so we intentionally do not log a StockTransaction here. Cost basis
    // in portfolio analytics should only reflect market trades.

    await redis.cacheUserInfo(userId, true);

    res.send({ success: true, message: "IPO completed successfully! You purchased your first share for 100 coins." });
  } catch (e) {
    if (e.message === "Not logged in") {
      return errors.unauthorized(res, "You must be logged in to start an IPO.");
    }
    logger.error(e);
    errors.serverError(res);
  }
});

/**
 * POST /api/stocks/buy
 * Buys N shares of a player.
 */
router.post("/buy", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const { subjectId, shares } = req.body;

    const sharesToBuy = Number(shares);
    if (!subjectId || !isPositiveInteger(sharesToBuy)) {
      return errors.badRequest(res, "Invalid buy data. Shares must be a positive integer.");
    }

    // 1. Prevent alt account trading (self-buying is allowed)
    const altIds = await routeUtils.getAltAccountIds(subjectId);
    const altsExcludingSelf = altIds.filter(id => id !== subjectId);
    if (altsExcludingSelf.includes(userId)) {
      return errors.forbidden(res, "You cannot buy shares of your alt accounts.");
    }

    // 2. Fetch stock
    const stock = await models.PlayerStock.findOne({ userId: subjectId }).exec();
    if (!stock || !stock.isIpoed) {
      return errors.notFound(res, "This player has not IPO'd.");
    }

    // 3. Calculate price and fees
    const { price, creatorFee, systemFee, total } = stockMarket.getBuyPrice(stock.shareSupply, sharesToBuy);

    // 4. Update PlayerStock stats WITH optimistic locking
    const stockUpdate = await models.PlayerStock.updateOne(
      { userId: subjectId, shareSupply: stock.shareSupply },
      { $inc: { creatorFeesEarned: creatorFee, shareSupply: sharesToBuy } }
    ).exec();

    if (stockUpdate.modifiedCount === 0 && stockUpdate.nModified === 0) {
      return errors.conflict(res, "Price changed rapidly! Your transaction was aborted to protect your coins. Please try again.");
    }

    // 5. Debit buyer
    const debit = await models.User.updateOne(
      { id: userId, coins: { $gte: total } },
      { $inc: { coins: -total } }
    ).exec();

    if (debit.modifiedCount === 0 && debit.nModified === 0) {
      // Rollback stock supply increase
      await models.PlayerStock.updateOne(
        { userId: subjectId },
        { $inc: { creatorFeesEarned: -creatorFee, shareSupply: -sharesToBuy } }
      ).exec();
      return errors.forbidden(res, `Insufficient coins. Total cost is ${total} coins.`);
    }

    // 6. Credit creator fee to subject
    await models.User.updateOne(
      { id: subjectId },
      { $inc: { coins: creatorFee } }
    ).exec();

    // 7. Update Shareholder balance
    await models.Shareholder.updateOne(
      { subjectId, holderId: userId },
      { $inc: { sharesOwned: sharesToBuy } },
      { upsert: true }
    ).exec();

    // 8. Log transaction
    await models.StockTransaction.create({
      userId,
      subjectId,
      type: "buy",
      shares: sharesToBuy,
      price,
      fee: creatorFee + systemFee
    });

    await Promise.all([
      redis.cacheUserInfo(userId, true),
      redis.cacheUserInfo(subjectId, true)
    ]);

    res.send({ success: true, price, fee: creatorFee + systemFee, total });
  } catch (e) {
    if (e.message === "Not logged in") {
      return errors.unauthorized(res, "You must be logged in to buy shares.");
    }
    logger.error(e);
    errors.serverError(res);
  }
});

/**
 * POST /api/stocks/sell
 * Sells N shares of a player.
 */
router.post("/sell", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const { subjectId, shares } = req.body;

    const sharesToSell = Number(shares);
    if (!subjectId || !isPositiveInteger(sharesToSell)) {
      return errors.badRequest(res, "Invalid sell data. Shares must be a positive integer.");
    }

    // 1. Check holding
    const holding = await models.Shareholder.findOne({ subjectId, holderId: userId }).exec();
    if (!holding || holding.sharesOwned < sharesToSell) {
      return errors.forbidden(res, "Insufficient shares owned.");
    }

    // 2. Fetch stock
    const stock = await models.PlayerStock.findOne({ userId: subjectId }).exec();
    if (!stock) {
      return errors.notFound(res, "Stock metadata not found.");
    }

    // 3. Guard: at least 1 share must remain in circulation at all times
    if (stock.shareSupply - sharesToSell < 1) {
      return errors.forbidden(res, "Cannot sell — at least 1 share must remain in circulation.");
    }
    const { price, creatorFee, systemFee, total } = stockMarket.getSellPrice(stock.shareSupply, sharesToSell);

    // 5. Debit shareholder shares
    const debitHolding = await models.Shareholder.updateOne(
      { subjectId, holderId: userId, sharesOwned: { $gte: sharesToSell } },
      { $inc: { sharesOwned: -sharesToSell } }
    ).exec();

    if (debitHolding.modifiedCount === 0 && debitHolding.nModified === 0) {
      return errors.forbidden(res, "Insufficient shares owned.");
    }

    // 6. Update PlayerStock stats WITH optimistic locking
    const stockUpdate = await models.PlayerStock.updateOne(
      { userId: subjectId, shareSupply: stock.shareSupply },
      { $inc: { creatorFeesEarned: creatorFee, shareSupply: -sharesToSell } }
    ).exec();

    if (stockUpdate.modifiedCount === 0 && stockUpdate.nModified === 0) {
      // Rollback shareholder debit
      await models.Shareholder.updateOne(
        { subjectId, holderId: userId },
        { $inc: { sharesOwned: sharesToSell } }
      ).exec();
      return errors.conflict(res, "Price changed rapidly! Your transaction was aborted. Please try again.");
    }

    // 7. Credit seller
    await models.User.updateOne(
      { id: userId },
      { $inc: { coins: total } }
    ).exec();

    // 8. Credit creator fee to subject
    await models.User.updateOne(
      { id: subjectId },
      { $inc: { coins: creatorFee } }
    ).exec();

    // 8. Log transaction
    await models.StockTransaction.create({
      userId,
      subjectId,
      type: "sell",
      shares: sharesToSell,
      price,
      fee: creatorFee + systemFee
    });

    await Promise.all([
      redis.cacheUserInfo(userId, true),
      redis.cacheUserInfo(subjectId, true)
    ]);

    res.send({ success: true, price, fee: creatorFee + systemFee, totalPayout: total });
  } catch (e) {
    if (e.message === "Not logged in") {
      return errors.unauthorized(res, "You must be logged in to sell shares.");
    }
    logger.error(e);
    errors.serverError(res);
  }
});

/**
 * GET /api/stocks/families
 * Lists all active Family ETFs, their prices, and stats.
 */
router.get("/families", async function (req, res) {
  try {
    const stocks = await models.FamilyStock.find({ isIpoed: true }).lean().exec();
    const familyIds = stocks.map(s => s.familyId);

    const [families, transactions] = await Promise.all([
      models.Family.find({ id: { $in: familyIds } })
        .select("id name avatar background")
        .lean()
        .exec(),
      models.FamilyStockTransaction.find({ familyId: { $in: familyIds } })
        .sort({ createdAt: 1 })
        .select("familyId price")
        .lean()
        .exec()
    ]);

    const familyMap = {};
    for (const f of families) {
      familyMap[f.id] = f;
    }

    const historyMap = {};
    for (const familyId of familyIds) {
      historyMap[familyId] = [1];
    }
    for (const tx of transactions) {
      if (historyMap[tx.familyId]) {
        historyMap[tx.familyId].push(tx.price);
      }
    }
    for (const familyId of familyIds) {
      if (historyMap[familyId].length > 10) {
        historyMap[familyId] = historyMap[familyId].slice(-10);
      }
    }

    const result = stocks.map(stock => {
      const f = familyMap[stock.familyId] || { name: "Unknown" };
      const buyPrice = stockMarket.getBuyPrice(stock.shareSupply, 1);
      const sellPrice = stockMarket.getSellPrice(stock.shareSupply, 1);

      return {
        familyId: stock.familyId,
        familyName: f.name,
        avatar: f.avatar,
        background: f.background,
        shareSupply: stock.shareSupply,
        buyPrice: buyPrice.total,
        sellPrice: sellPrice.total,
        treasuryCoins: stock.treasuryCoins,
        dividendsPaidOut: stock.dividendsPaidOut,
        priceHistory: historyMap[stock.familyId]
      };
    });

    res.send(result);
  } catch (e) {
    logger.error(e);
    errors.serverError(res);
  }
});

/**
 * GET /api/stocks/families/eligible
 * Gets the list of families the user leads/founded that have NOT IPOed yet.
 */
router.get("/families/eligible", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const userObj = await models.User.findOne({ id: userId }).select("_id").lean().exec();
    if (!userObj) {
      return errors.notFound(res, "User not found.");
    }

    const families = await models.Family.find({
      $or: [{ leader: userObj._id }, { founder: userObj._id }]
    })
      .select("id name avatar")
      .lean()
      .exec();

    const familyIds = families.map(f => f.id);
    const ipoedStocks = await models.FamilyStock.find({ familyId: { $in: familyIds }, isIpoed: true }).select("familyId").lean().exec();
    const ipoedIds = ipoedStocks.map(s => s.familyId);

    const eligible = families.filter(f => !ipoedIds.includes(f.id));
    res.send(eligible);
  } catch (e) {
    if (e.message === "Not logged in") {
      return errors.unauthorized(res, "You must be logged in to see eligible families.");
    }
    logger.error(e);
    errors.serverError(res);
  }
});

/**
 * GET /api/stocks/families/portfolio
 * Gets the logged-in user's family ETF holdings.
 */
router.get("/families/portfolio", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);

    const holdings = await models.FamilyShareholder.find({ holderId: userId, sharesOwned: { $gt: 0 } }).lean().exec();
    const familyIds = holdings.map(h => h.familyId);

    const [stocks, families] = await Promise.all([
      models.FamilyStock.find({ familyId: { $in: familyIds } }).lean().exec(),
      models.Family.find({ id: { $in: familyIds } }).select("id name avatar background").lean().exec()
    ]);

    const stockMap = {};
    for (const s of stocks) {
      stockMap[s.familyId] = s;
    }

    const familyMap = {};
    for (const f of families) {
      familyMap[f.id] = f;
    }

    const transactions = await models.FamilyStockTransaction.find({
      userId,
      familyId: { $in: familyIds }
    }).lean().exec();

    const costBasisMap = {};
    for (const tx of transactions) {
      if (!costBasisMap[tx.familyId]) costBasisMap[tx.familyId] = 0;
      if (tx.type === "buy") {
        costBasisMap[tx.familyId] += tx.price + tx.fee;
      } else {
        costBasisMap[tx.familyId] -= (tx.price - tx.fee);
      }
    }

    const result = holdings.map(h => {
      const stock = stockMap[h.familyId] || { shareSupply: 0 };
      const f = familyMap[h.familyId] || { name: "Unknown" };
      const sellPrice = stockMarket.getSellPrice(stock.shareSupply, h.sharesOwned);
      const costBasis = parseFloat((costBasisMap[h.familyId] || 0).toFixed(2));
      const liquidValue = sellPrice.total;
      const unrealizedPnL = parseFloat((liquidValue - costBasis).toFixed(2));

      return {
        familyId: h.familyId,
        familyName: f.name,
        avatar: f.avatar,
        background: f.background,
        sharesOwned: h.sharesOwned,
        averageSellValue: liquidValue,
        currentSingleSellPrice: stockMarket.getSellPrice(stock.shareSupply, 1).total,
        costBasis,
        unrealizedPnL,
        dividendsReceived: parseFloat(h.dividendsReceived.toFixed(2))
      };
    });

    res.send(result);
  } catch (e) {
    if (e.message === "Not logged in") {
      return errors.unauthorized(res, "You must be logged in to view your family portfolio.");
    }
    logger.error(e);
    errors.serverError(res);
  }
});

/**
 * GET /api/stocks/families/prices/:familyId
 * Gets specific family stock details and price estimations.
 */
router.get("/families/prices/:familyId", async function (req, res) {
  try {
    const familyId = String(req.params.familyId);
    const stock = await models.FamilyStock.findOne({ familyId }).lean().exec();
    if (!stock || !stock.isIpoed) {
      return errors.notFound(res, "This family has not launched an ETF or does not exist.");
    }

    const family = await models.Family.findOne({ id: familyId }).select("name avatar background").lean().exec();
    const buy1 = stockMarket.getBuyPrice(stock.shareSupply, 1);
    const sell1 = stockMarket.getSellPrice(stock.shareSupply, 1);

    res.send({
      familyId: stock.familyId,
      familyName: family ? family.name : "Unknown",
      avatar: family?.avatar,
      background: family?.background,
      shareSupply: stock.shareSupply,
      buyPrice1: buy1.total,
      sellPrice1: sell1.total,
      treasuryCoins: stock.treasuryCoins,
      dividendsPaidOut: stock.dividendsPaidOut
    });
  } catch (e) {
    logger.error(e);
    errors.serverError(res);
  }
});

/**
 * POST /api/stocks/families/ipo
 * Initiates an IPO for a family. Only founder/leader can do this. Costs 200 coins.
 */
router.post("/families/ipo", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const { familyId } = req.body;

    if (!familyId) {
      return errors.badRequest(res, "Missing familyId.");
    }

    // 1. Fetch user ObjectId
    const userObj = await models.User.findOne({ id: userId }).select("_id coins").exec();
    if (!userObj) {
      return errors.notFound(res, "User not found.");
    }

    // 2. Fetch family and verify leader/founder status
    const family = await models.Family.findOne({ id: familyId }).exec();
    if (!family) {
      return errors.notFound(res, "Family not found.");
    }

    if (family.leader.toString() !== userObj._id.toString() && family.founder.toString() !== userObj._id.toString()) {
      return errors.forbidden(res, "Only the Family Leader or Founder can launch the Family ETF.");
    }

    // 3. Check existing IPO
    const stock = await models.FamilyStock.findOne({ familyId }).exec();
    if (stock && stock.isIpoed) {
      return errors.conflict(res, "This Family ETF has already been launched.");
    }

    // 4. Check coin balance (costs 200 coins)
    if (userObj.coins < 200) {
      return errors.forbidden(res, "Insufficient coins. Launching a Family ETF costs 200 coins.");
    }

    // 5. Deduct coins atomically
    const debit = await models.User.updateOne(
      { id: userId, coins: { $gte: 200 } },
      { $inc: { coins: -200 } }
    ).exec();

    if (debit.modifiedCount === 0 && debit.nModified === 0) {
      return errors.forbidden(res, "Insufficient coins.");
    }

    // 6. Create/update FamilyStock
    await models.FamilyStock.findOneAndUpdate(
      { familyId },
      { isIpoed: true, shareSupply: 1 },
      { upsert: true, new: true }
    ).exec();

    // 7. Grant the first share to the leader/founder who paid
    await models.FamilyShareholder.findOneAndUpdate(
      { familyId, holderId: userId },
      { $inc: { sharesOwned: 1 } },
      { upsert: true }
    ).exec();

    // 8. Log transaction
    await models.FamilyStockTransaction.create({
      userId,
      familyId,
      type: "buy",
      shares: 1,
      price: 200,
      fee: 0
    });

    await redis.cacheUserInfo(userId, true);

    res.send({ success: true, message: "Family ETF launched successfully! First share purchased for 200 coins." });
  } catch (e) {
    if (e.message === "Not logged in") {
      return errors.unauthorized(res, "You must be logged in to launch a Family ETF.");
    }
    logger.error(e);
    errors.serverError(res);
  }
});

/**
 * POST /api/stocks/families/buy
 * Buys N shares of a Family ETF.
 */
router.post("/families/buy", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const { familyId, shares } = req.body;

    const sharesToBuy = Number(shares);
    if (!familyId || !isPositiveInteger(sharesToBuy)) {
      return errors.badRequest(res, "Invalid buy data. Shares must be a positive integer.");
    }

    // Fetch stock
    const stock = await models.FamilyStock.findOne({ familyId }).exec();
    if (!stock || !stock.isIpoed) {
      return errors.notFound(res, "This Family ETF has not been launched.");
    }

    // Calculate price and fees
    const { price, creatorFee, systemFee, total } = stockMarket.getBuyPrice(stock.shareSupply, sharesToBuy);

    // Update FamilyStock stats WITH optimistic locking
    const stockUpdate = await models.FamilyStock.updateOne(
      { familyId, shareSupply: stock.shareSupply },
      { $inc: { treasuryCoins: creatorFee, shareSupply: sharesToBuy } }
    ).exec();

    if (stockUpdate.modifiedCount === 0 && stockUpdate.nModified === 0) {
      return errors.conflict(res, "Price changed rapidly! Your transaction was aborted. Please try again.");
    }

    // Debit buyer
    const debit = await models.User.updateOne(
      { id: userId, coins: { $gte: total } },
      { $inc: { coins: -total } }
    ).exec();

    if (debit.modifiedCount === 0 && debit.nModified === 0) {
      // Rollback FamilyStock
      await models.FamilyStock.updateOne(
        { familyId },
        { $inc: { treasuryCoins: -creatorFee, shareSupply: -sharesToBuy } }
      ).exec();
      return errors.forbidden(res, `Insufficient coins. Total cost is ${total} coins.`);
    }

    // Update FamilyShareholder balance
    await models.FamilyShareholder.updateOne(
      { familyId, holderId: userId },
      { $inc: { sharesOwned: sharesToBuy } },
      { upsert: true }
    ).exec();

    // Log transaction
    await models.FamilyStockTransaction.create({
      userId,
      familyId,
      type: "buy",
      shares: sharesToBuy,
      price,
      fee: creatorFee + systemFee
    });

    await redis.cacheUserInfo(userId, true);

    res.send({ success: true, price, fee: creatorFee + systemFee, total });
  } catch (e) {
    if (e.message === "Not logged in") {
      return errors.unauthorized(res, "You must be logged in to buy family shares.");
    }
    logger.error(e);
    errors.serverError(res);
  }
});

/**
 * POST /api/stocks/families/sell
 * Sells N shares of a Family ETF.
 */
router.post("/families/sell", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);
    const { familyId, shares } = req.body;

    const sharesToSell = Number(shares);
    if (!familyId || !isPositiveInteger(sharesToSell)) {
      return errors.badRequest(res, "Invalid sell data. Shares must be a positive integer.");
    }

    // Check holding
    const holding = await models.FamilyShareholder.findOne({ familyId, holderId: userId }).exec();
    if (!holding || holding.sharesOwned < sharesToSell) {
      return errors.forbidden(res, "Insufficient shares owned.");
    }

    // Fetch stock
    const stock = await models.FamilyStock.findOne({ familyId }).exec();
    if (!stock) {
      return errors.notFound(res, "Family stock metadata not found.");
    }

    // Guard: at least 1 share must remain in circulation at all times
    if (stock.shareSupply - sharesToSell < 1) {
      return errors.forbidden(res, "Cannot sell — at least 1 share must remain in circulation.");
    }

    // Calculate sell price and fees
    const { price, creatorFee, systemFee, total } = stockMarket.getSellPrice(stock.shareSupply, sharesToSell);

    // Debit shareholder shares
    const debitHolding = await models.FamilyShareholder.updateOne(
      { familyId, holderId: userId, sharesOwned: { $gte: sharesToSell } },
      { $inc: { sharesOwned: -sharesToSell } }
    ).exec();

    if (debitHolding.modifiedCount === 0 && debitHolding.nModified === 0) {
      return errors.forbidden(res, "Insufficient shares owned.");
    }

    // Update FamilyStock stats WITH optimistic locking
    const stockUpdate = await models.FamilyStock.updateOne(
      { familyId, shareSupply: stock.shareSupply },
      { $inc: { treasuryCoins: creatorFee, shareSupply: -sharesToSell } }
    ).exec();

    if (stockUpdate.modifiedCount === 0 && stockUpdate.nModified === 0) {
      // Rollback shareholder debit
      await models.FamilyShareholder.updateOne(
        { familyId, holderId: userId },
        { $inc: { sharesOwned: sharesToSell } }
      ).exec();
      return errors.conflict(res, "Price changed rapidly! Your transaction was aborted. Please try again.");
    }

    // Credit seller
    await models.User.updateOne(
      { id: userId },
      { $inc: { coins: total } }
    ).exec();

    // Log transaction
    await models.FamilyStockTransaction.create({
      userId,
      familyId,
      type: "sell",
      shares: sharesToSell,
      price,
      fee: creatorFee + systemFee
    });

    await redis.cacheUserInfo(userId, true);

    res.send({ success: true, price, fee: creatorFee + systemFee, totalPayout: total });
  } catch (e) {
    if (e.message === "Not logged in") {
      return errors.unauthorized(res, "You must be logged in to sell family shares.");
    }
    logger.error(e);
    errors.serverError(res);
  }
});

module.exports = router;
