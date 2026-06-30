const express = require("express");
const models = require("../db/models");
const routeUtils = require("./utils");
const errors = require("../lib/errors");
const logger = require("../modules/logging")(".");
const stockMarket = require("../lib/StockMarket");
const shortid = require("shortid");

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

    const users = await models.User.find({ id: { $in: userIds } })
      .select("id name avatar settings.nameColor settings.vanityUrl")
      .lean()
      .exec();

    const userMap = {};
    for (const u of users) {
      userMap[u.id] = u;
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
        dividendsPaidOut: stock.dividendsPaidOut
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

    const [stocks, users] = await Promise.all([
      models.PlayerStock.find({ userId: { $in: subjectIds } }).lean().exec(),
      models.User.find({ id: { $in: subjectIds } })
        .select("id name avatar settings.nameColor settings.vanityUrl")
        .lean()
        .exec()
    ]);

    const stockMap = {};
    for (const s of stocks) {
      stockMap[s.userId] = s;
    }

    const userMap = {};
    for (const u of users) {
      userMap[u.id] = u;
    }

    const result = holdings.map(h => {
      const stock = stockMap[h.subjectId] || { shareSupply: 0 };
      const u = userMap[h.subjectId] || { name: "Unknown" };
      const sellPrice = stockMarket.getSellPrice(stock.shareSupply, h.sharesOwned);

      return {
        subjectId: h.subjectId,
        username: u.name,
        avatar: u.avatar,
        vanityUrl: u.settings?.vanityUrl || "",
        nameColor: u.settings?.nameColor || "",
        sharesOwned: h.sharesOwned,
        averageSellValue: sellPrice.total,
        currentSingleSellPrice: stockMarket.getSellPrice(stock.shareSupply, 1).total
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
 * Initiates an IPO for the logged-in user. Costs 50 coins.
 */
router.post("/ipo", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);

    // 1. Check existing IPO
    const stock = await models.PlayerStock.findOne({ userId }).exec();
    if (stock && stock.isIpoed) {
      return errors.conflict(res, "You are already IPO'd.");
    }

    // 2. Check balance (needs 50 coins)
    const user = await models.User.findOne({ id: userId }).select("coins").exec();
    if (!user || user.coins < 50) {
      return errors.forbidden(res, "Insufficient coins. Starting an IPO costs 50 coins.");
    }

    // 3. Deduct coins atomically
    const debit = await models.User.updateOne(
      { id: userId, coins: { $gte: 50 } },
      { $inc: { coins: -50 } }
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

    // 6. Log transaction
    await models.StockTransaction.create({
      userId,
      subjectId: userId,
      type: "buy",
      shares: 1,
      price: 50,
      fee: 0
    });

    res.send({ success: true, message: "IPO completed successfully! You purchased your first share for 50 coins." });
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

    // 1. Prevent alt account trading / self trading
    const altIds = await routeUtils.getAltAccountIds(subjectId);
    if (altIds.includes(userId)) {
      return errors.forbidden(res, "You cannot buy shares of yourself or your alt accounts.");
    }

    // 2. Fetch stock
    const stock = await models.PlayerStock.findOne({ userId: subjectId }).exec();
    if (!stock || !stock.isIpoed) {
      return errors.notFound(res, "This player has not IPO'd.");
    }

    // 3. Calculate price and fees
    const { price, creatorFee, systemFee, total } = stockMarket.getBuyPrice(stock.shareSupply, sharesToBuy);

    // 4. Debit buyer
    const debit = await models.User.updateOne(
      { id: userId, coins: { $gte: total } },
      { $inc: { coins: -total } }
    ).exec();

    if (debit.modifiedCount === 0 && debit.nModified === 0) {
      return errors.forbidden(res, `Insufficient coins. Total cost is ${total} coins.`);
    }

    // 5. Credit creator fee to subject
    await models.User.updateOne(
      { id: subjectId },
      { $inc: { coins: creatorFee } }
    ).exec();

    // 6. Update PlayerStock stats
    await models.PlayerStock.updateOne(
      { userId: subjectId },
      { $inc: { creatorFeesEarned: creatorFee, shareSupply: sharesToBuy } }
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

    // 3. Calculate sell price and fees
    const { price, creatorFee, systemFee, total } = stockMarket.getSellPrice(stock.shareSupply, sharesToSell);

    // 4. Debit shareholder shares
    const debitHolding = await models.Shareholder.updateOne(
      { subjectId, holderId: userId, sharesOwned: { $gte: sharesToSell } },
      { $inc: { sharesOwned: -sharesToSell } }
    ).exec();

    if (debitHolding.modifiedCount === 0 && debitHolding.nModified === 0) {
      return errors.forbidden(res, "Insufficient shares owned.");
    }

    // 5. Credit seller
    await models.User.updateOne(
      { id: userId },
      { $inc: { coins: total } }
    ).exec();

    // 6. Credit creator fee to subject
    await models.User.updateOne(
      { id: subjectId },
      { $inc: { coins: creatorFee } }
    ).exec();

    // 7. Update PlayerStock stats
    await models.PlayerStock.updateOne(
      { userId: subjectId },
      { $inc: { creatorFeesEarned: creatorFee, shareSupply: -sharesToSell } }
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

    res.send({ success: true, price, fee: creatorFee + systemFee, totalPayout: total });
  } catch (e) {
    if (e.message === "Not logged in") {
      return errors.unauthorized(res, "You must be logged in to sell shares.");
    }
    logger.error(e);
    errors.serverError(res);
  }
});

module.exports = router;
