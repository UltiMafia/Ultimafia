const chai = require("chai");
const should = chai.should();
const {
  AspectSkillRating,
  aspectSkillTwoTeams,
  expectedScoreTwoTeams,
  getTier,
} = require("../modules/skillRating");

describe("modules/skillRating", function () {
  describe("AspectSkillRating", function () {
    it("should initialize with default parameters", function () {
      const rating = new AspectSkillRating();
      rating.rating.should.equal(25.0);
      rating.uncertainty.should.equal(25.0 / 3.0);
    });

    it("should correctly compute conservative rank", function () {
      const rating = new AspectSkillRating(25.0, 8.333333333333334);
      rating.getRank().should.be.closeTo(0.0, 0.0001);
    });
  });

  describe("expectedScoreTwoTeams", function () {
    it("should return 0.5 probability for equal teams", function () {
      const team1 = [new AspectSkillRating(25.0, 8.333333333333334)];
      const team2 = [new AspectSkillRating(25.0, 8.333333333333334)];
      const [prob1, prob2] = expectedScoreTwoTeams(team1, team2, { beta: 6.0, dynamicsFactor: 0.02 });
      prob1.should.be.closeTo(0.5, 0.0001);
      prob2.should.be.closeTo(0.5, 0.0001);
    });

    it("should give higher win probability to stronger team", function () {
      const team1 = [new AspectSkillRating(30.0, 5.0)];
      const team2 = [new AspectSkillRating(20.0, 5.0)];
      const [prob1, prob2] = expectedScoreTwoTeams(team1, team2, { beta: 6.0, dynamicsFactor: 0.02 });
      prob1.should.be.above(0.5);
      prob2.should.be.below(0.5);
      (prob1 + prob2).should.be.closeTo(1.0, 0.0001);
    });
  });

  describe("aspectSkillTwoTeams", function () {
    it("should shift ratings appropriately on outcome", function () {
      const winners = [new AspectSkillRating(25.0, 8.333333333333334)];
      const losers = [new AspectSkillRating(25.0, 8.333333333333334)];
      const [newWinners, newLosers] = aspectSkillTwoTeams(winners, losers, { beta: 6.0, dynamicsFactor: 0.02 });

      newWinners[0].rating.should.be.above(25.0);
      newWinners[0].uncertainty.should.be.below(25.0 / 3.0);

      newLosers[0].rating.should.be.below(25.0);
      newLosers[0].uncertainty.should.be.below(25.0 / 3.0);
    });

    it("should return empty arrays unchanged", function () {
      const [newWinners, newLosers] = aspectSkillTwoTeams([], [], { beta: 6.0, dynamicsFactor: 0.02 });
      newWinners.length.should.equal(0);
      newLosers.length.should.equal(0);
    });
  });

  describe("getTier", function () {
    it("should return Unranked if no ranks are available", function () {
      getTier(10.0, []).should.equal("Unranked");
    });

    it("should return Unranked if rank is not in sorted ranks", function () {
      getTier(10.0, [1.0, 2.0, 3.0]).should.equal("Unranked");
    });

    it("should assign correct tiers based on percentile distribution", function () {
      const sortedRanks = [];
      for (let i = 0; i < 100; i++) {
        sortedRanks.push(i * 0.25); // conservative ranks from 0 to 24.75
      }

      // 99th index (percentile 100) -> Master
      getTier(sortedRanks[99], sortedRanks).should.equal("Master");
      // 98th index (percentile ~98.9) -> Master
      getTier(sortedRanks[98], sortedRanks).should.equal("Master");
      // 97th index (percentile ~97.9) -> Diamond (percentile >= 90)
      getTier(sortedRanks[97], sortedRanks).should.equal("Diamond");
      // 80th index (percentile ~80.8) -> Platinum (percentile >= 75)
      getTier(sortedRanks[80], sortedRanks).should.equal("Platinum");
      // 60th index (percentile ~60.6) -> Gold (percentile >= 50)
      getTier(sortedRanks[60], sortedRanks).should.equal("Gold");
      // 30th index (percentile ~30.3) -> Silver (percentile >= 20)
      getTier(sortedRanks[30], sortedRanks).should.equal("Silver");
      // 5th index (percentile ~5.0) -> Bronze (percentile < 20)
      getTier(sortedRanks[5], sortedRanks).should.equal("Bronze");
    });
  });
});
