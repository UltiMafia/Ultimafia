const models = require("../db/models");
const logger = require("../modules/logging")(".");

// K = 100 for the bonding curve pricing: Price = S^2 / K
const PRICE_SCALE = 100;
const CREATOR_FEE_PCT = 0.05;
const SYSTEM_FEE_PCT = 0.05;
const DIVIDEND_RATE = 0.50; // Shareholders split 50% of the value of coins earned on top

/**
 * Calculates the base price of the S-th share.
 * Supply (S) is 1-indexed.
 */
function calculatePrice(supply) {
  if (supply <= 0) return 0;
  // Price = max(1, floor(S^2 / 100))
  return Math.max(1, Math.floor((supply * supply) / PRICE_SCALE));
}

/**
 * Gets the pricing breakdown for buying N shares at current supply S.
 */
function getBuyPrice(currentSupply, sharesToBuy) {
  if (sharesToBuy <= 0) {
    return { price: 0, creatorFee: 0, systemFee: 0, total: 0 };
  }

  let price = 0;
  for (let i = 1; i <= sharesToBuy; i++) {
    // Buying N shares means buying at supplies S+1, S+2, ..., S+N
    price += calculatePrice(currentSupply + i);
  }

  const creatorFee = Math.max(1, Math.round(price * CREATOR_FEE_PCT));
  const systemFee = Math.max(1, Math.round(price * SYSTEM_FEE_PCT));
  const total = price + creatorFee + systemFee;

  return { price, creatorFee, systemFee, total };
}

/**
 * Gets the pricing breakdown for selling N shares at current supply S.
 */
function getSellPrice(currentSupply, sharesToSell) {
  if (sharesToSell <= 0 || currentSupply <= 0) {
    return { price: 0, creatorFee: 0, systemFee: 0, total: 0 };
  }

  // Cannot sell more shares than existing supply
  const actualSellCount = Math.min(sharesToSell, currentSupply);

  let price = 0;
  for (let i = 0; i < actualSellCount; i++) {
    // Selling N shares means selling at supplies S, S-1, ..., S-N+1
    price += calculatePrice(currentSupply - i);
  }

  const creatorFee = Math.max(1, Math.round(price * CREATOR_FEE_PCT));
  const systemFee = Math.max(1, Math.round(price * SYSTEM_FEE_PCT));
  const total = Math.max(0, price - creatorFee - systemFee);

  return { price, creatorFee, systemFee, total };
}

/**
 * Distributes dividends based on game completion coin earnings.
 * Uses a snapshot taken at game start.
 */
async function distributeDividends(subjectId, coinsEarned, snapshot) {
  if (!snapshot || !snapshot.holders || snapshot.holders.length === 0 || snapshot.shareSupply <= 0) {
    return [];
  }

  const dividendPool = coinsEarned * DIVIDEND_RATE;
  if (dividendPool <= 0) return [];

  const payouts = [];
  let totalDistributed = 0;

  for (const holder of snapshot.holders) {
    if (holder.sharesOwned <= 0) continue;

    const shareFraction = holder.sharesOwned / snapshot.shareSupply;
    // Round to 2 decimals for precision
    const rawPayout = dividendPool * shareFraction;
    const payout = parseFloat(rawPayout.toFixed(2));

    if (payout > 0) {
      payouts.push({
        holderId: holder.holderId,
        sharesOwned: holder.sharesOwned,
        payout
      });
      totalDistributed += payout;
    }
  }

  if (payouts.length > 0) {
    // Update user balances and increment total stats
    const bulkOps = payouts.map(p => ({
      updateOne: {
        filter: { id: p.holderId },
        update: { $inc: { coins: p.payout } }
      }
    }));

    try {
      await models.User.bulkWrite(bulkOps);
      
      // Update PlayerStock stats
      await models.PlayerStock.updateOne(
        { userId: subjectId },
        { $inc: { dividendsPaidOut: parseFloat(totalDistributed.toFixed(2)) } }
      );

      logger.info(`Distributed ${totalDistributed.toFixed(2)} coins in dividends for player ${subjectId}`);
    } catch (err) {
      logger.error(`Error writing stock dividends to DB: ${err.message}`);
    }
  }

  return payouts;
}

/**
 * Distributes dividends for Family ETFs based on game completion coin earnings.
 * Uses a snapshot taken at game start.
 */
async function distributeFamilyDividends(familyId, coinsEarned, snapshot) {
  if (!snapshot || !snapshot.holders || snapshot.holders.length === 0 || snapshot.shareSupply <= 0) {
    return [];
  }

  const FAMILY_DIVIDEND_RATE = 0.25; // 25% of win coins minted as dividends for family stock
  const dividendPool = coinsEarned * FAMILY_DIVIDEND_RATE;
  if (dividendPool <= 0) return [];

  const payouts = [];
  let totalDistributed = 0;

  for (const holder of snapshot.holders) {
    if (holder.sharesOwned <= 0) continue;

    const shareFraction = holder.sharesOwned / snapshot.shareSupply;
    const rawPayout = dividendPool * shareFraction;
    const payout = parseFloat(rawPayout.toFixed(2));

    if (payout > 0) {
      payouts.push({
        holderId: holder.holderId,
        sharesOwned: holder.sharesOwned,
        payout
      });
      totalDistributed += payout;
    }
  }

  if (payouts.length > 0) {
    const bulkOps = payouts.map(p => ({
      updateOne: {
        filter: { id: p.holderId },
        update: { $inc: { coins: p.payout } }
      }
    }));

    try {
      await models.User.bulkWrite(bulkOps);
      
      // Update FamilyStock stats
      await models.FamilyStock.updateOne(
        { familyId: familyId },
        { $inc: { dividendsPaidOut: parseFloat(totalDistributed.toFixed(2)) } }
      );

      logger.info(`Distributed ${totalDistributed.toFixed(2)} coins in family dividends for family ${familyId}`);
    } catch (err) {
      logger.error(`Error writing family dividends to DB: ${err.message}`);
    }
  }

  return payouts;
}

module.exports = {
  calculatePrice,
  getBuyPrice,
  getSellPrice,
  distributeDividends,
  distributeFamilyDividends
};
