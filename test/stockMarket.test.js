const chai = require("chai");
const should = chai.should();
const stockMarket = require("../lib/StockMarket");
const models = require("../db/models");

describe("lib/StockMarket", function () {
  describe("calculatePrice", function () {
    it("returns 0 for supply <= 0", function () {
      stockMarket.calculatePrice(0).should.equal(0);
      stockMarket.calculatePrice(-5).should.equal(0);
    });

    it("returns at least 1 for small supplies", function () {
      // 1^2 / 100 = 0.01 -> Math.max(1, 0) = 1
      stockMarket.calculatePrice(1).should.equal(1);
      stockMarket.calculatePrice(5).should.equal(1);
      stockMarket.calculatePrice(9).should.equal(1);
    });

    it("calculates quadratic prices correctly for larger supplies", function () {
      // 10^2 / 100 = 1
      stockMarket.calculatePrice(10).should.equal(1);
      // 20^2 / 100 = 4
      stockMarket.calculatePrice(20).should.equal(4);
      // 50^2 / 100 = 25
      stockMarket.calculatePrice(50).should.equal(25);
    });
  });

  describe("getBuyPrice", function () {
    it("returns zero fields if sharesToBuy <= 0", function () {
      const result = stockMarket.getBuyPrice(10, 0);
      result.price.should.equal(0);
      result.creatorFee.should.equal(0);
      result.systemFee.should.equal(0);
      result.total.should.equal(0);
    });

    it("calculates buy price and 3% / 2% fees", function () {
      // Current supply = 9, buy 1 share.
      // 10th share base price: calculatePrice(10) = 1
      // Creator fee: 3% of 1 is 0.03.
      // System fee: 2% of 1 is 0.02.
      // total = 1 + 0.03 + 0.02 = 1.05
      const result = stockMarket.getBuyPrice(9, 1);
      result.price.should.equal(1);
      result.creatorFee.should.equal(0.03);
      result.systemFee.should.equal(0.02);
      result.total.should.equal(1.05);
    });

    it("calculates buy price for multiple shares", function () {
      // Current supply = 19, buy 2 shares (shares at supply 20, 21)
      // P(20) = Math.floor(400/100) = 4
      // P(21) = Math.floor(441/100) = 4
      // Total price = 8
      // Creator fee = 8 * 0.03 = 0.24
      // System fee = 8 * 0.02 = 0.16
      // Total cost = 8 + 0.24 + 0.16 = 8.40
      const result = stockMarket.getBuyPrice(19, 2);
      result.price.should.equal(8);
      result.creatorFee.should.equal(0.24);
      result.systemFee.should.equal(0.16);
      result.total.should.equal(8.4);
    });
  });

  describe("getSellPrice", function () {
    it("returns zero fields if sharesToSell <= 0 or currentSupply <= 0", function () {
      const res1 = stockMarket.getSellPrice(10, 0);
      res1.total.should.equal(0);
      const res2 = stockMarket.getSellPrice(0, 5);
      res2.total.should.equal(0);
    });

    it("limits sold shares to current supply", function () {
      // selling 100 shares at supply 1
      // same as selling 1 share at supply 1
      // P(1) = 1. fees: 0.03 creator, 0.02 system. Total = max(0, 1 - 0.03 - 0.02) = 0.95.
      const res = stockMarket.getSellPrice(1, 100);
      res.price.should.equal(1);
    });

    it("calculates sell price correctly with fees subtracted", function () {
      // Current supply = 50, sell 1 share.
      // S=50 base price: P(50) = 25.
      // Creator fee = 25 * 0.03 = 0.75.
      // System fee = 25 * 0.02 = 0.50.
      // Total received = 25 - 0.75 - 0.50 = 23.75.
      const result = stockMarket.getSellPrice(50, 1);
      result.price.should.equal(25);
      result.creatorFee.should.equal(0.75);
      result.systemFee.should.equal(0.5);
      result.total.should.equal(23.75);
    });
  });

  describe("distributeDividends & distributeFamilyDividends", function () {
    let originalBulkWrite;
    let originalShareholderBulkWrite;
    let originalFamilyShareholderBulkWrite;
    let originalUpdateOne;
    let originalFamilyUpdateOne;
    let bulkWriteCalls = [];
    let updateOneCalls = [];
    let familyUpdateOneCalls = [];

    before(function () {
      originalBulkWrite = models.User.bulkWrite;
      originalShareholderBulkWrite = models.Shareholder.bulkWrite;
      originalFamilyShareholderBulkWrite = models.FamilyShareholder.bulkWrite;
      originalUpdateOne = models.PlayerStock.updateOne;
      originalFamilyUpdateOne = models.FamilyStock.updateOne;

      models.User.bulkWrite = async function (ops) {
        bulkWriteCalls.push(ops);
        return { ok: 1 };
      };

      models.Shareholder.bulkWrite = async function (ops) {
        return { ok: 1 };
      };

      models.FamilyShareholder.bulkWrite = async function (ops) {
        return { ok: 1 };
      };

      models.PlayerStock.updateOne = async function (filter, update) {
        updateOneCalls.push({ filter, update });
        return { ok: 1 };
      };

      models.FamilyStock.updateOne = async function (filter, update) {
        familyUpdateOneCalls.push({ filter, update });
        return { ok: 1 };
      };
    });

    after(function () {
      models.User.bulkWrite = originalBulkWrite;
      models.Shareholder.bulkWrite = originalShareholderBulkWrite;
      models.FamilyShareholder.bulkWrite = originalFamilyShareholderBulkWrite;
      models.PlayerStock.updateOne = originalUpdateOne;
      models.FamilyStock.updateOne = originalFamilyUpdateOne;
    });

    beforeEach(function () {
      bulkWriteCalls = [];
      updateOneCalls = [];
      familyUpdateOneCalls = [];
    });

    describe("distributeDividends", function () {
      it("returns empty array and does not hit DB if no snapshot or zero supply", async function () {
        const res = await stockMarket.distributeDividends("user1", 10, null);
        res.length.should.equal(0);
        bulkWriteCalls.length.should.equal(0);

        const res2 = await stockMarket.distributeDividends("user1", 10, { shareSupply: 0, holders: [] });
        res2.length.should.equal(0);
      });

      it("distributes dividends proportionally to shareholders", async function () {
        const snapshot = {
          shareSupply: 10,
          holders: [
            { holderId: "h1", sharesOwned: 6 },
            { holderId: "h2", sharesOwned: 4 }
          ]
        };

        // coinsEarned = 20. Dividend pool = 20 * 0.5 = 10.
        // h1 (6/10 shares) -> gets 6 coins
        // h2 (4/10 shares) -> gets 4 coins
        const res = await stockMarket.distributeDividends("subject1", 20, snapshot);
        res.length.should.equal(2);

        res[0].holderId.should.equal("h1");
        res[0].payout.should.equal(6);

        res[1].holderId.should.equal("h2");
        res[1].payout.should.equal(4);

        bulkWriteCalls.length.should.equal(1);
        bulkWriteCalls[0].length.should.equal(2);
        bulkWriteCalls[0][0].updateOne.filter.id.should.equal("h1");
        bulkWriteCalls[0][0].updateOne.update.$inc.coins.should.equal(6);

        updateOneCalls.length.should.equal(1);
        updateOneCalls[0].filter.userId.should.equal("subject1");
        updateOneCalls[0].update.$inc.dividendsPaidOut.should.equal(10);
      });

      it("does not distribute dividends to game participants, except the subject user themselves", async function () {
        const snapshot = {
          shareSupply: 10,
          holders: [
            { holderId: "h1", sharesOwned: 6 },
            { holderId: "subject1", sharesOwned: 4 }
          ]
        };

        // coinsEarned = 20. Dividend pool = 20 * 0.5 = 10.
        // Participants are ["h1", "subject1"].
        // h1 (6 shares) is excluded.
        // subject1 (4 shares) is NOT excluded because they are the subject! -> gets 4 coins
        const res = await stockMarket.distributeDividends("subject1", 20, snapshot, ["h1", "subject1"]);
        res.length.should.equal(1);

        res[0].holderId.should.equal("subject1");
        res[0].payout.should.equal(4);

        bulkWriteCalls.length.should.equal(1);
        bulkWriteCalls[0].length.should.equal(1);
        bulkWriteCalls[0][0].updateOne.filter.id.should.equal("subject1");
        bulkWriteCalls[0][0].updateOne.update.$inc.coins.should.equal(4);

        updateOneCalls.length.should.equal(1);
        updateOneCalls[0].filter.userId.should.equal("subject1");
        updateOneCalls[0].update.$inc.dividendsPaidOut.should.equal(4);
      });
    });

    describe("distributeFamilyDividends", function () {
      it("returns empty array and does not hit DB if no snapshot or zero supply", async function () {
        const res = await stockMarket.distributeFamilyDividends("fam1", 10, null);
        res.length.should.equal(0);
        bulkWriteCalls.length.should.equal(0);

        const res2 = await stockMarket.distributeFamilyDividends("fam1", 10, { shareSupply: 0, holders: [] });
        res2.length.should.equal(0);
      });

      it("distributes family dividends proportionally to shareholders at 25% yield", async function () {
        const snapshot = {
          shareSupply: 10,
          holders: [
            { holderId: "h1", sharesOwned: 6 },
            { holderId: "h2", sharesOwned: 4 }
          ]
        };

        // coinsEarned = 40. Dividend pool = 40 * 0.25 = 10.
        // h1 (6/10 shares) -> gets 6 coins
        // h2 (4/10 shares) -> gets 4 coins
        const res = await stockMarket.distributeFamilyDividends("familyA", 40, snapshot);
        res.length.should.equal(2);

        res[0].holderId.should.equal("h1");
        res[0].payout.should.equal(6);

        res[1].holderId.should.equal("h2");
        res[1].payout.should.equal(4);

        bulkWriteCalls.length.should.equal(1);
        bulkWriteCalls[0].length.should.equal(2);
        bulkWriteCalls[0][0].updateOne.filter.id.should.equal("h1");
        bulkWriteCalls[0][0].updateOne.update.$inc.coins.should.equal(6);

        familyUpdateOneCalls.length.should.equal(1);
        familyUpdateOneCalls[0].filter.familyId.should.equal("familyA");
        familyUpdateOneCalls[0].update.$inc.dividendsPaidOut.should.equal(10);
      });

      it("does not distribute family dividends to game participants, except the winner themselves", async function () {
        const snapshot = {
          shareSupply: 10,
          holders: [
            { holderId: "h1", sharesOwned: 6 },
            { holderId: "winner1", sharesOwned: 4 }
          ]
        };

        // coinsEarned = 40. Dividend pool = 40 * 0.25 = 10.
        // Participants are ["h1", "winner1"], but winnerId is "winner1".
        // h1 is excluded. winner1 is NOT excluded because they are the winner! -> gets 4 coins
        const res = await stockMarket.distributeFamilyDividends("familyA", 40, snapshot, ["h1", "winner1"], "winner1");
        res.length.should.equal(1);

        res[0].holderId.should.equal("winner1");
        res[0].payout.should.equal(4);

        bulkWriteCalls.length.should.equal(1);
        bulkWriteCalls[0].length.should.equal(1);
        bulkWriteCalls[0][0].updateOne.filter.id.should.equal("winner1");
        bulkWriteCalls[0][0].updateOne.update.$inc.coins.should.equal(4);

        familyUpdateOneCalls.length.should.equal(1);
        familyUpdateOneCalls[0].filter.familyId.should.equal("familyA");
        familyUpdateOneCalls[0].update.$inc.dividendsPaidOut.should.equal(4);
      });
    });
  });
});
