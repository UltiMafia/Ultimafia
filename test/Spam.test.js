const chai = require("chai");
const should = chai.should();
const Spam = require("../Games/core/Spam");

const WPM = 130;
const AVG = 3.9914985005289525;
const GRACE = 180;
const MAX_IV = 2500;

const opts = { pasteGraceChars: GRACE, maxIntervalMs: MAX_IV };

describe("Games/core/Spam typing speed (ranked/competitive)", function () {
  it("does not block the first message", function () {
    Spam.getTypingSpeedCooldownRemainingMs(
      [],
      "hello world",
      WPM,
      AVG,
      Date.now(),
      opts
    ).should.equal(0);
  });

  it("allows a long paste immediately after a one-word line (paste grace)", function () {
    const now = 1_000_000;
    const past = [now - 200]; // 200ms after a short send
    // Typical night write-up paste after saying "N1" or "vote"
    const longLine =
      "I was town last night and checked Bob. He is suspicious because he claimed wrong. " +
      "Please vote him with me. I have receipts from night actions. Also watch Alice. " +
      "She pushed too hard on me D1 without evidence and refused to claim properly.";
    const len = Spam.getMessageCharCountExcludingWhitespace(longLine);
    len.should.be.above(150);

    const remaining = Spam.getTypingSpeedCooldownRemainingMs(
      past,
      longLine,
      WPM,
      AVG,
      now,
      opts
    );
    // Uncapped old formula would demand many seconds
    const uncapped = Spam.getRankedCompetitiveMinIntervalMs(longLine, WPM, AVG, {
      pasteGraceChars: 0,
      maxIntervalMs: Infinity,
    });
    uncapped.should.be.above(5000);
    remaining.should.be.at.most(MAX_IV);
    if (len <= GRACE) {
      remaining.should.equal(0);
    } else {
      remaining.should.be.below(MAX_IV);
    }
  });

  it("daystart: two prepared lines back-to-back are not multi-second blocked", function () {
    const t0 = 10_000_000;
    const line1 = "a".repeat(160);
    const line2 = "b".repeat(160);
    Spam.getTypingSpeedCooldownRemainingMs(
      [],
      line1,
      WPM,
      AVG,
      t0,
      opts
    ).should.equal(0);
    const past = [t0];
    const remaining = Spam.getTypingSpeedCooldownRemainingMs(
      past,
      line2,
      WPM,
      AVG,
      t0 + 400,
      opts
    );
    remaining.should.equal(0);
  });

  it("allows a full max-length message after a short gap when within paste grace", function () {
    const now = 2_000_000;
    const past = [now - 100];
    const content = "a".repeat(GRACE);
    Spam.getTypingSpeedCooldownRemainingMs(
      past,
      content,
      WPM,
      AVG,
      now,
      opts
    ).should.equal(0);
  });

  it("still applies a (capped) delay for content far beyond paste grace", function () {
    const now = 3_000_000;
    const past = [now]; // just sent
    const content = "a".repeat(GRACE + 200);
    const remaining = Spam.getTypingSpeedCooldownRemainingMs(
      past,
      content,
      WPM,
      AVG,
      now,
      opts
    );
    remaining.should.equal(MAX_IV);
  });

  it("clears after max interval has elapsed", function () {
    const now = 4_000_000;
    const past = [now - MAX_IV - 1];
    const content = "a".repeat(GRACE + 200);
    Spam.getTypingSpeedCooldownRemainingMs(
      past,
      content,
      WPM,
      AVG,
      now,
      opts
    ).should.equal(0);
  });

  it("old uncapped formula would have blocked short-then-long (regression guard)", function () {
    const now = 5_000_000;
    const past = [now - 200];
    const longLine = "x".repeat(200);
    const uncapped = Spam.getRankedCompetitiveMinIntervalMs(longLine, WPM, AVG, {
      pasteGraceChars: 0,
      maxIntervalMs: Infinity,
    });
    uncapped.should.be.above(10_000);

    const cappedMin = Spam.getRankedCompetitiveMinIntervalMs(
      longLine,
      WPM,
      AVG,
      opts
    );
    cappedMin.should.be.at.most(MAX_IV);
    const remaining = Spam.getTypingSpeedCooldownRemainingMs(
      past,
      longLine,
      WPM,
      AVG,
      now,
      opts
    );
    remaining.should.be.at.most(MAX_IV - 200);
  });
});
