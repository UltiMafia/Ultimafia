const express = require("express");
const models = require("../db/models");
const routeUtils = require("./utils");
const errors = require("../lib/errors");
const logger = require("../modules/logging")(".");
const stockMarket = require("../lib/StockMarket");
const redis = require("../modules/redis");

const router = express.Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// In-memory mutex to serialize trades per stock within a single process.
// The optimistic lock on shareSupply serves as the multi-process safety net.
const tradeLocks = new Map();

async function acquireTradeLock(key) {
  const prev = tradeLocks.get(key) || Promise.resolve();
  let resolveLock;
  const lockPromise = new Promise((resolve) => {
    resolveLock = resolve;
  });
  tradeLocks.set(key, lockPromise);
  await prev;
  return () => {
    if (tradeLocks.get(key) === lockPromise) tradeLocks.delete(key);
    resolveLock();
  };
}

function isPositiveInteger(val) {
  const num = Number(val);
  return Number.isInteger(num) && num > 0;
}

/** Returns true if a MongoDB updateOne/findOneAndUpdate actually modified a document. */
function wasModified(result) {
  return (result.modifiedCount || 0) > 0 || (result.nModified || 0) > 0;
}

/**
 * Reconstructs a recent price trendline by walking the last N transactions
 * backwards from the current supply.
 */
function buildPriceHistory(stocks, txsMap, idField) {
  const historyMap = {};
  for (const stock of stocks) {
    const entityId = stock[idField];
    const txs = txsMap[entityId] || [];
    let supply = stock.shareSupply;
    const prices = [];
    for (const tx of txs) {
      prices.push(stockMarket.calculatePrice(supply));
      if (tx.type === "buy") {
        supply = Math.max(1, supply - (tx.shares || 0));
      } else if (tx.type === "sell") {
        supply += (tx.shares || 0);
      }
    }
    prices.push(stockMarket.calculatePrice(supply));
    prices.reverse();
    historyMap[entityId] = prices;
  }
  return historyMap;
}


// ---------------------------------------------------------------------------
// Trade configuration — defines the differences between player and family
// ---------------------------------------------------------------------------

const PLAYER_TRADE_CONFIG = {
  stockModel: models.PlayerStock,
  shareholderModel: models.Shareholder,
  transactionModel: models.StockTransaction,
  // Field name for the entity ID in request body / params
  requestIdField: "subjectId",
  // How to build a MongoDB filter to find the stock document
  getStockFilter: (entityId) => ({ userId: entityId }),
  // How to build a MongoDB filter to find a shareholder document
  getShareholderFilter: (entityId, holderId) => ({ subjectId: entityId, holderId }),
  // How to build the transaction log document
  getTxData: (userId, entityId, type, shares, price, fee) => ({
    userId, subjectId: entityId, type, shares, price, fee,
  }),
  // Field name in the stock document that accumulates trade fees
  feeField: "creatorFeesEarned",
  // Lock key prefix
  lockPrefix: "player",
  // Whether to credit the trade fee to the entity's user wallet
  // (true for players, false for families where it goes to treasury via feeField)
  creditFeeToUser: true,
  // Whether to invalidate the entity user's cache after a trade
  cacheEntityUser: true,
  // Entity label for log messages
  entityLabel: "player",
  notFoundBuyMsg: "This player has not IPO'd.",
  notFoundSellMsg: "Stock metadata not found.",
  authBuyMsg: "You must be logged in to buy shares.",
  authSellMsg: "You must be logged in to sell shares.",
};

const FAMILY_TRADE_CONFIG = {
  stockModel: models.FamilyStock,
  shareholderModel: models.FamilyShareholder,
  transactionModel: models.FamilyStockTransaction,
  requestIdField: "familyId",
  getStockFilter: (entityId) => ({ familyId: entityId }),
  getShareholderFilter: (entityId, holderId) => ({ familyId: entityId, holderId }),
  getTxData: (userId, entityId, type, shares, price, fee) => ({
    userId, familyId: entityId, type, shares, price, fee,
  }),
  feeField: "treasuryCoins",
  lockPrefix: "family",
  creditFeeToUser: false,
  cacheEntityUser: false,
  entityLabel: "family",
  notFoundBuyMsg: "This Family ETF has not been launched.",
  notFoundSellMsg: "Family stock metadata not found.",
  authBuyMsg: "You must be logged in to buy family shares.",
  authSellMsg: "You must be logged in to sell family shares.",
};

// ---------------------------------------------------------------------------
// Trade handler factories
// ---------------------------------------------------------------------------

function createBuyHandler(config) {
  return async function (req, res) {
    try {
      const userId = await routeUtils.verifyLoggedIn(req);
      const entityId = req.body[config.requestIdField];
      const sharesToBuy = Number(req.body.shares);

      if (!entityId || !isPositiveInteger(sharesToBuy)) {
        return errors.badRequest(res, "Invalid buy data. Shares must be a positive integer.");
      }

      const releaseLock = await acquireTradeLock(`${config.lockPrefix}:${entityId}`);
      try {
        // 1. Fetch stock
        const stock = await config.stockModel.findOne(config.getStockFilter(entityId)).exec();
        if (!stock || !stock.isIpoed) {
          return errors.notFound(res, config.notFoundBuyMsg);
        }

        // 2. Calculate price and fees
        const { price, creatorFee, systemFee, total } = stockMarket.getBuyPrice(stock.shareSupply, sharesToBuy);

        // 3. Debit buyer FIRST to guarantee funds before any state changes
        const debit = await models.User.updateOne(
          { id: userId, coins: { $gte: total } },
          { $inc: { coins: -total } }
        ).exec();

        if (!wasModified(debit)) {
          return errors.forbidden(res, `Insufficient coins. Total cost is ${total} coins.`);
        }

        // 4. Update stock stats (optimistic lock on shareSupply as multi-process safety net)
        const stockUpdate = await config.stockModel.updateOne(
          { ...config.getStockFilter(entityId), shareSupply: stock.shareSupply },
          { $inc: { [config.feeField]: creatorFee, shareSupply: sharesToBuy } }
        ).exec();

        if (!wasModified(stockUpdate)) {
          // Supply changed between read and write — refund buyer
          try {
            await models.User.updateOne({ id: userId }, { $inc: { coins: total } }).exec();
          } catch (refundErr) {
            logger.error(`CRITICAL: Failed to refund ${total} coins to ${userId} after buy conflict on ${config.entityLabel} ${entityId}: ${refundErr.message}`);
          }
          return errors.conflict(res, "Price changed. Your coins have been refunded. Please try again.");
        }

        // 5. Credit creator fee to entity's user wallet (player stocks only)
        if (config.creditFeeToUser) {
          await models.User.updateOne(
            { id: entityId },
            { $inc: { coins: creatorFee } }
          ).exec();
        }

        // 6. Update shareholder balance
        const currentHolding = await config.shareholderModel.findOne(
          config.getShareholderFilter(entityId, userId)
        ).lean().exec();
        const needsReset = !currentHolding || currentHolding.sharesOwned === 0;

        const currentShares = currentHolding ? (currentHolding.sharesOwned || 0) : 0;
        const currentCostBasis = currentHolding ? (currentHolding.costBasis || 0) : 0;
        const newShares = currentShares + sharesToBuy;
        const newCostBasis = currentCostBasis + total;
        const newAvgBuyPrice = newShares > 0 ? newCostBasis / newShares : 0;

        await config.shareholderModel.updateOne(
          config.getShareholderFilter(entityId, userId),
          {
            $inc: { sharesOwned: sharesToBuy },
            $set: {
              costBasis: newCostBasis,
              averageBuyPrice: newAvgBuyPrice,
              ...(needsReset ? { dividendsReceived: 0 } : {})
            }
          },
          { upsert: true }
        ).exec();

        // 7. Log transaction
        await config.transactionModel.create(
          config.getTxData(userId, entityId, "buy", sharesToBuy, price, creatorFee + systemFee)
        );

        // 8. Invalidate caches
        const cacheOps = [redis.cacheUserInfo(userId, true)];
        if (config.cacheEntityUser) {
          cacheOps.push(redis.cacheUserInfo(entityId, true));
        }
        await Promise.all(cacheOps);

        res.send({ success: true, price, fee: creatorFee + systemFee, total });
      } finally {
        releaseLock();
      }
    } catch (e) {
      if (e.message === "Not logged in") {
        return errors.unauthorized(res, config.authBuyMsg);
      }
      logger.error(e);
      errors.serverError(res);
    }
  };
}

function createSellHandler(config) {
  return async function (req, res) {
    try {
      const userId = await routeUtils.verifyLoggedIn(req);
      const entityId = req.body[config.requestIdField];
      const sharesToSell = Number(req.body.shares);

      if (!entityId || !isPositiveInteger(sharesToSell)) {
        return errors.badRequest(res, "Invalid sell data. Shares must be a positive integer.");
      }

      const releaseLock = await acquireTradeLock(`${config.lockPrefix}:${entityId}`);
      try {
        // 1. Check holding
        const holding = await config.shareholderModel.findOne(
          config.getShareholderFilter(entityId, userId)
        ).exec();
        if (!holding || holding.sharesOwned < sharesToSell) {
          return errors.forbidden(res, "Insufficient shares owned.");
        }

        // 2. Fetch stock
        const stock = await config.stockModel.findOne(config.getStockFilter(entityId)).exec();
        if (!stock) {
          return errors.notFound(res, config.notFoundSellMsg);
        }

        // 3. Guard: at least 1 share must remain in circulation
        if (stock.shareSupply - sharesToSell < 1) {
          return errors.forbidden(res, "Cannot sell — at least 1 share must remain in circulation.");
        }

        // 4. Calculate sell price and fees
        const { price, creatorFee, systemFee, total } = stockMarket.getSellPrice(stock.shareSupply, sharesToSell);

        // 5. Debit shareholder shares FIRST
        const currentShares = holding.sharesOwned || 0;
        const currentCostBasis = holding.costBasis || 0;
        const currentAvgBuyPrice = holding.averageBuyPrice || 0;
        const avgPrice = currentShares > 0 ? currentCostBasis / currentShares : 0;
        const newShares = Math.max(0, currentShares - sharesToSell);
        const newCostBasis = newShares * avgPrice;

        const debitHolding = await config.shareholderModel.updateOne(
          { ...config.getShareholderFilter(entityId, userId), sharesOwned: { $gte: sharesToSell } },
          { 
            $inc: { sharesOwned: -sharesToSell },
            $set: { 
              costBasis: newCostBasis,
              averageBuyPrice: avgPrice
            }
          }
        ).exec();

        if (!wasModified(debitHolding)) {
          return errors.forbidden(res, "Insufficient shares owned.");
        }

        // 6. Update stock stats (optimistic lock on shareSupply as multi-process safety net)
        const stockUpdate = await config.stockModel.updateOne(
          { ...config.getStockFilter(entityId), shareSupply: stock.shareSupply },
          { $inc: { [config.feeField]: creatorFee, shareSupply: -sharesToSell } }
        ).exec();

        if (!wasModified(stockUpdate)) {
          // Supply changed between read and write — refund shares
          try {
            await config.shareholderModel.updateOne(
              config.getShareholderFilter(entityId, userId),
              { 
                $inc: { sharesOwned: sharesToSell },
                $set: { 
                  costBasis: holding.costBasis || 0,
                  averageBuyPrice: holding.averageBuyPrice || 0
                }
              }
            ).exec();
          } catch (refundErr) {
            logger.error(`CRITICAL: Failed to refund ${sharesToSell} shares to ${userId} after sell conflict on ${config.entityLabel} ${entityId}: ${refundErr.message}`);
          }
          return errors.conflict(res, "Price changed. Your shares have been refunded. Please try again.");
        }

        // 7. Credit seller
        await models.User.updateOne(
          { id: userId },
          { $inc: { coins: total } }
        ).exec();

        // 8. Credit creator fee to entity's user wallet (player stocks only)
        if (config.creditFeeToUser) {
          await models.User.updateOne(
            { id: entityId },
            { $inc: { coins: creatorFee } }
          ).exec();
        }

        // 9. Log transaction
        await config.transactionModel.create(
          config.getTxData(userId, entityId, "sell", sharesToSell, price, creatorFee + systemFee)
        );

        // 10. Invalidate caches
        const cacheOps = [redis.cacheUserInfo(userId, true)];
        if (config.cacheEntityUser) {
          cacheOps.push(redis.cacheUserInfo(entityId, true));
        }
        await Promise.all(cacheOps);

        res.send({ success: true, price, fee: creatorFee + systemFee, totalPayout: total });
      } finally {
        releaseLock();
      }
    } catch (e) {
      if (e.message === "Not logged in") {
        return errors.unauthorized(res, config.authSellMsg);
      }
      logger.error(e);
      errors.serverError(res);
    }
  };
}

// ---------------------------------------------------------------------------
// Player stock read routes
// ---------------------------------------------------------------------------

/**
 * GET /api/stocks
 * Lists all active IPOed players, their prices, and stats.
 */
router.get("/", async function (req, res) {
  try {
    const stocks = await models.PlayerStock.find({ isIpoed: true }).lean().exec();
    const userIds = stocks.map(s => s.userId);
    const [users, transactionsGrouped] = await Promise.all([
      models.User.find({ id: { $in: userIds } })
        .select("id name avatar settings.nameColor settings.vanityUrl")
        .lean()
        .exec(),
      models.StockTransaction.aggregate([
        { $match: { subjectId: { $in: userIds } } },
        { $sort: { createdAt: -1 } },
        { $group: {
            _id: "$subjectId",
            txs: { $push: { type: "$type", shares: "$shares" } }
        } },
        { $project: {
            txs: { $slice: ["$txs", 10] }
        } }
      ]).exec()
    ]);

    const userMap = {};
    for (const u of users) {
      userMap[u.id] = u;
    }

    const txsMap = {};
    for (const g of transactionsGrouped) {
      txsMap[g._id] = g.txs;
    }

    const historyMap = buildPriceHistory(stocks, txsMap, "userId");

    const result = stocks.map(stock => {
      const u = userMap[stock.userId] || { name: "Unknown" };
      const buyPrice = stockMarket.getBuyPrice(stock.shareSupply, 1);
      const sellPrice = stockMarket.getSellPrice(stock.shareSupply, 1);
      const marketCap = stock.shareSupply * stockMarket.calculatePrice(stock.shareSupply);

      return {
        userId: stock.userId,
        username: u.name,
        avatar: u.avatar,
        vanityUrl: u.settings?.vanityUrl || "",
        nameColor: u.settings?.nameColor || "",
        shareSupply: stock.shareSupply,
        marketCap,
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

    const [stocks, users] = await Promise.all([
      models.PlayerStock.find({ userId: { $in: subjectIds } }).lean().exec(),
      models.User.find({ id: { $in: subjectIds } })
        .select("id name avatar settings.nameColor settings.vanityUrl")
        .lean()
        .exec()
    ]);

    const stockMap = {};
    for (const s of stocks) stockMap[s.userId] = s;

    const userMap = {};
    for (const u of users) userMap[u.id] = u;

    const holdingMap = {};
    for (const h of holdings) holdingMap[h.subjectId] = h;

    const result = subjectIds.map(subjectId => {
      const h = holdingMap[subjectId];
      const stock = stockMap[subjectId] || { shareSupply: 0 };
      const u = userMap[subjectId] || { name: "Unknown" };
      const sellPrice = stockMarket.getSellPrice(stock.shareSupply, h.sharesOwned);
      
      const costBasis = parseFloat((h.costBasis || 0).toFixed(2));
      const averageBuyPrice = parseFloat((h.averageBuyPrice || 0).toFixed(2));
      
      const liquidValue = sellPrice.total;
      const totalPnL = parseFloat((liquidValue - costBasis).toFixed(2));

      return {
        subjectId,
        username: u.name,
        avatar: u.avatar,
        vanityUrl: u.settings?.vanityUrl || "",
        nameColor: u.settings?.nameColor || "",
        sharesOwned: h.sharesOwned,
        averageSellValue: liquidValue,
        currentSingleSellPrice: stockMarket.getSellPrice(stock.shareSupply, 1).total,
        netInvestment: costBasis,
        costBasis,
        averageBuyPrice,
        totalPnL,
        dividendsReceived: parseFloat((h.dividendsReceived || 0).toFixed(2))
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
    const marketCap = stock.shareSupply * stockMarket.calculatePrice(stock.shareSupply);

    res.send({
      userId: stock.userId,
      username: user ? user.name : "Unknown",
      nameColor: user?.settings?.nameColor || "",
      shareSupply: stock.shareSupply,
      marketCap,
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

// ---------------------------------------------------------------------------
// Player stock write routes
// ---------------------------------------------------------------------------

/**
 * POST /api/stocks/ipo
 * Initiates an IPO for the logged-in user. Costs 100 coins.
 */
router.post("/ipo", async function (req, res) {
  try {
    const userId = await routeUtils.verifyLoggedIn(req);

    const releaseLock = await acquireTradeLock(`player:${userId}`);
    try {
      // 1. Check existing IPO
      const stock = await models.PlayerStock.findOne({ userId }).exec();
      if (stock && stock.isIpoed) {
        return errors.conflict(res, "You are already IPO'd.");
      }

      // 2. Deduct coins atomically FIRST
      const debit = await models.User.updateOne(
        { id: userId, coins: { $gte: 100 } },
        { $inc: { coins: -100 } }
      ).exec();

      if (!wasModified(debit)) {
        return errors.forbidden(res, "Insufficient coins. Starting an IPO costs 100 coins.");
      }

      // 3. Create/update PlayerStock
      await models.PlayerStock.findOneAndUpdate(
        { userId },
        { isIpoed: true, shareSupply: 1 },
        { upsert: true, new: true }
      ).exec();

      // 4. Grant the first share to the creator
      await models.Shareholder.findOneAndUpdate(
        { subjectId: userId, holderId: userId },
        { $inc: { sharesOwned: 1 } },
        { upsert: true }
      ).exec();

      await redis.cacheUserInfo(userId, true);

      res.send({ success: true, message: "IPO completed successfully! You purchased your first share for 100 coins." });
    } finally {
      releaseLock();
    }
  } catch (e) {
    if (e.message === "Not logged in") {
      return errors.unauthorized(res, "You must be logged in to start an IPO.");
    }
    logger.error(e);
    errors.serverError(res);
  }
});

/** POST /api/stocks/buy — Buys N shares of a player. */
router.post("/buy", createBuyHandler(PLAYER_TRADE_CONFIG));

/** POST /api/stocks/sell — Sells N shares of a player. */
router.post("/sell", createSellHandler(PLAYER_TRADE_CONFIG));

// ---------------------------------------------------------------------------
// Family ETF read routes
// ---------------------------------------------------------------------------

/**
 * GET /api/stocks/families
 * Lists all active Family ETFs, their prices, and stats.
 */
router.get("/families", async function (req, res) {
  try {
    const stocks = await models.FamilyStock.find({ isIpoed: true }).lean().exec();
    const familyIds = stocks.map(s => s.familyId);

    const [families, transactionsGrouped] = await Promise.all([
      models.Family.find({ id: { $in: familyIds } })
        .select("id name avatar background")
        .lean()
        .exec(),
      models.FamilyStockTransaction.aggregate([
        { $match: { familyId: { $in: familyIds } } },
        { $sort: { createdAt: -1 } },
        { $group: {
            _id: "$familyId",
            txs: { $push: { type: "$type", shares: "$shares" } }
        } },
        { $project: {
            txs: { $slice: ["$txs", 10] }
        } }
      ]).exec()
    ]);

    const familyMap = {};
    for (const f of families) {
      familyMap[f.id] = f;
    }

    const txsMap = {};
    for (const g of transactionsGrouped) {
      txsMap[g._id] = g.txs;
    }

    const historyMap = buildPriceHistory(stocks, txsMap, "familyId");

    const result = stocks.map(stock => {
      const f = familyMap[stock.familyId] || { name: "Unknown" };
      const buyPrice = stockMarket.getBuyPrice(stock.shareSupply, 1);
      const sellPrice = stockMarket.getSellPrice(stock.shareSupply, 1);
      const marketCap = stock.shareSupply * stockMarket.calculatePrice(stock.shareSupply);

      return {
        familyId: stock.familyId,
        familyName: f.name,
        avatar: f.avatar,
        background: f.background,
        shareSupply: stock.shareSupply,
        marketCap,
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
    const ipoedIdsSet = new Set(ipoedStocks.map(s => s.familyId));

    const eligible = families.filter(f => !ipoedIdsSet.has(f.id));
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

    const result = holdings.map(h => {
      const stock = stockMap[h.familyId] || { shareSupply: 0 };
      const f = familyMap[h.familyId] || { name: "Unknown" };
      const sellPrice = stockMarket.getSellPrice(stock.shareSupply, h.sharesOwned);
      
      const costBasis = parseFloat((h.costBasis || 0).toFixed(2));
      const averageBuyPrice = parseFloat((h.averageBuyPrice || 0).toFixed(2));
      
      const liquidValue = sellPrice.total;
      const totalPnL = parseFloat((liquidValue - costBasis).toFixed(2));

      return {
        familyId: h.familyId,
        familyName: f.name,
        avatar: f.avatar,
        background: f.background,
        sharesOwned: h.sharesOwned,
        averageSellValue: liquidValue,
        currentSingleSellPrice: stockMarket.getSellPrice(stock.shareSupply, 1).total,
        netInvestment: costBasis,
        costBasis,
        averageBuyPrice,
        totalPnL,
        dividendsReceived: parseFloat((h.dividendsReceived || 0).toFixed(2))
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
    const marketCap = stock.shareSupply * stockMarket.calculatePrice(stock.shareSupply);

    res.send({
      familyId: stock.familyId,
      familyName: family ? family.name : "Unknown",
      avatar: family?.avatar,
      background: family?.background,
      shareSupply: stock.shareSupply,
      marketCap,
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

// ---------------------------------------------------------------------------
// Family ETF write routes
// ---------------------------------------------------------------------------

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

    const releaseLock = await acquireTradeLock(`family:${familyId}`);
    try {
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

      // 4. Deduct coins atomically FIRST
      const debit = await models.User.updateOne(
        { id: userId, coins: { $gte: 200 } },
        { $inc: { coins: -200 } }
      ).exec();

      if (!wasModified(debit)) {
        return errors.forbidden(res, "Insufficient coins. Launching a Family ETF costs 200 coins.");
      }

      // 5. Create/update FamilyStock
      await models.FamilyStock.findOneAndUpdate(
        { familyId },
        { isIpoed: true, shareSupply: 1 },
        { upsert: true, new: true }
      ).exec();

      // 6. Grant the first share to the leader/founder who paid
      await models.FamilyShareholder.findOneAndUpdate(
        { familyId, holderId: userId },
        { $inc: { sharesOwned: 1 } },
        { upsert: true }
      ).exec();

      await redis.cacheUserInfo(userId, true);

      res.send({ success: true, message: "Family ETF launched successfully! First share purchased for 200 coins." });
    } finally {
      releaseLock();
    }
  } catch (e) {
    if (e.message === "Not logged in") {
      return errors.unauthorized(res, "You must be logged in to launch a Family ETF.");
    }
    logger.error(e);
    errors.serverError(res);
  }
});

/** POST /api/stocks/families/buy — Buys N shares of a Family ETF. */
router.post("/families/buy", createBuyHandler(FAMILY_TRADE_CONFIG));

/** POST /api/stocks/families/sell — Sells N shares of a Family ETF. */
router.post("/families/sell", createSellHandler(FAMILY_TRADE_CONFIG));

module.exports = router;
