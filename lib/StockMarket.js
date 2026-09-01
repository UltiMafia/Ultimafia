const models = require("../db/models");
const logger = require("../modules/logging")(".");

// K = 100 for the bonding curve pricing: Price = S^2 / K
const PRICE_SCALE = 100;
const CREATOR_FEE_PCT = 0.015;
const SYSTEM_FEE_PCT = 0.01;
const DIVIDEND_RATE = 0.50; // Shareholders split 50% of the value of coins earned on top

// Upper bound on a single trade. The buy-side pricing walk is O(shares), so an
// unbounded count from a request body would block the event loop. The largest
// trade ever recorded is 61 shares, so this leaves plenty of headroom.
const MAX_SHARES_PER_TRADE = 1000;

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

  // Backstop: callers are expected to validate first, but never let an
  // out-of-range count reach the pricing walk below.
  if (sharesToBuy > MAX_SHARES_PER_TRADE) {
    throw new RangeError(`sharesToBuy exceeds MAX_SHARES_PER_TRADE (${MAX_SHARES_PER_TRADE})`);
  }

  let price = 0;
  for (let i = 1; i <= sharesToBuy; i++) {
    // Buying N shares means buying at supplies S+1, S+2, ..., S+N
    price += calculatePrice(currentSupply + i);
  }

  const creatorFee = parseFloat((price * CREATOR_FEE_PCT).toFixed(2));
  const systemFee = parseFloat((price * SYSTEM_FEE_PCT).toFixed(2));
  const total = parseFloat((price + creatorFee + systemFee).toFixed(2));

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

  const creatorFee = parseFloat((price * CREATOR_FEE_PCT).toFixed(2));
  const systemFee = parseFloat((price * SYSTEM_FEE_PCT).toFixed(2));
  const total = Math.max(0, parseFloat((price - creatorFee - systemFee).toFixed(2)));

  return { price, creatorFee, systemFee, total };
}

/**
 * Reads current share counts for the holders named in a snapshot.
 * Returns a Map of holderId -> sharesOwned (absent holders are treated as 0).
 */
async function getCurrentShares(model, filter, holderIds) {
  if (holderIds.length === 0) return new Map();

  const current = await model
    .find({ ...filter, holderId: { $in: holderIds } })
    .select("holderId sharesOwned")
    .lean()
    .exec();

  const shares = new Map();
  for (const h of current) {
    shares.set(h.holderId, h.sharesOwned || 0);
  }
  return shares;
}

/**
 * Distributes dividends based on game completion coin earnings.
 *
 * Payout is based on min(shares at game start, shares at payout time). The
 * snapshot half stops someone buying in once they can see the game is won —
 * spectators are not in participantIds, so without it they could front-run the
 * payout. The current-holdings half stops the reverse: selling out after the
 * snapshot is taken and collecting anyway, which handed the seller the dividend
 * while the buyer got a silently dividend-stripped share.
 *
 * The denominator stays snapshot.shareSupply so the pool can only shrink, never
 * be inflated by supply moving during the game.
 */
async function distributeDividends(subjectId, coinsEarned, snapshot, participantIds = []) {
  if (!snapshot || !snapshot.holders || snapshot.holders.length === 0 || snapshot.shareSupply <= 0) {
    return [];
  }

  const dividendPool = coinsEarned * DIVIDEND_RATE;
  if (dividendPool <= 0) return [];

  const participantSet = new Set(participantIds);
  const eligible = snapshot.holders.filter(
    (h) => h.sharesOwned > 0 && !(participantSet.has(h.holderId) && h.holderId !== subjectId)
  );

  const currentShares = await getCurrentShares(
    models.Shareholder,
    { subjectId },
    eligible.map((h) => h.holderId)
  );

  const payouts = [];
  let totalDistributed = 0;

  for (const holder of eligible) {
    const heldThroughout = Math.min(
      holder.sharesOwned,
      currentShares.get(holder.holderId) || 0
    );
    if (heldThroughout <= 0) continue;

    const shareFraction = heldThroughout / snapshot.shareSupply;
    // Round to 2 decimals for precision
    const rawPayout = dividendPool * shareFraction;
    const payout = parseFloat(rawPayout.toFixed(2));

    if (payout > 0) {
      payouts.push({
        holderId: holder.holderId,
        sharesOwned: heldThroughout,
        payout
      });
      totalDistributed += payout;
    }
  }

  if (payouts.length > 0) {
    // Update user coin balances
    const userBulkOps = payouts.map(p => ({
      updateOne: {
        filter: { id: p.holderId },
        update: { $inc: { coins: p.payout } }
      }
    }));

    // Track dividends received per shareholder for portfolio analytics
    const shareholderBulkOps = payouts.map(p => ({
      updateOne: {
        filter: { subjectId, holderId: p.holderId },
        update: { $inc: { dividendsReceived: p.payout } }
      }
    }));

    try {
      await models.User.bulkWrite(userBulkOps);
      await models.Shareholder.bulkWrite(shareholderBulkOps);

      // Update PlayerStock lifetime stats
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
 * Payout is based on min(shares at game start, shares at payout time) — see
 * distributeDividends for why both halves are needed.
 */
async function distributeFamilyDividends(familyId, coinsEarned, snapshot, participantIds = [], winnerId) {
  if (!snapshot || !snapshot.holders || snapshot.holders.length === 0 || snapshot.shareSupply <= 0) {
    return [];
  }

  const FAMILY_DIVIDEND_RATE = 0.25; // 25% of win coins minted as dividends for family stock
  const dividendPool = coinsEarned * FAMILY_DIVIDEND_RATE;
  if (dividendPool <= 0) return [];

  const participantSet = new Set(participantIds);
  const eligible = snapshot.holders.filter(
    (h) => h.sharesOwned > 0 && !(participantSet.has(h.holderId) && h.holderId !== winnerId)
  );

  const currentShares = await getCurrentShares(
    models.FamilyShareholder,
    { familyId },
    eligible.map((h) => h.holderId)
  );

  const payouts = [];
  let totalDistributed = 0;

  for (const holder of eligible) {
    const heldThroughout = Math.min(
      holder.sharesOwned,
      currentShares.get(holder.holderId) || 0
    );
    if (heldThroughout <= 0) continue;

    const shareFraction = heldThroughout / snapshot.shareSupply;
    const rawPayout = dividendPool * shareFraction;
    const payout = parseFloat(rawPayout.toFixed(2));

    if (payout > 0) {
      payouts.push({
        holderId: holder.holderId,
        sharesOwned: heldThroughout,
        payout
      });
      totalDistributed += payout;
    }
  }

  if (payouts.length > 0) {
    // Update user coin balances
    const userBulkOps = payouts.map(p => ({
      updateOne: {
        filter: { id: p.holderId },
        update: { $inc: { coins: p.payout } }
      }
    }));

    // Track dividends received per shareholder for portfolio analytics
    const shareholderBulkOps = payouts.map(p => ({
      updateOne: {
        filter: { familyId, holderId: p.holderId },
        update: { $inc: { dividendsReceived: p.payout } }
      }
    }));

    try {
      await models.User.bulkWrite(userBulkOps);
      await models.FamilyShareholder.bulkWrite(shareholderBulkOps);

      // Update FamilyStock lifetime stats
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
  CREATOR_FEE_PCT,
  SYSTEM_FEE_PCT,
  MAX_SHARES_PER_TRADE,
  calculatePrice,
  getBuyPrice,
  getSellPrice,
  distributeDividends,
  distributeFamilyDividends
};
