const chai = require("chai");

chai.should();
const {
  readyCheckFields,
  readyCheckLocalEnd,
  canApplyTimerTime,
  timerTimeAction,
  timerRemainingMs,
  formatTimerTime,
  formatSyncedTimer,
} = require("../react_main/src/utils/timerSyncMath");

const DURATION = 30000;
const serverNow = 1700000000000;

function readyPayload(now) {
  const endTime = now + DURATION;
  return readyCheckFields(endTime, now, []);
}

describe("timer sync", function () {
  describe("ready check countdown", function () {
    it("sends timeLeft as endTime minus the server clock", function () {
      readyCheckFields(
        serverNow + DURATION,
        serverNow,
        ["p1"]
      ).should.deep.equal({
        endTime: serverNow + DURATION,
        timeLeft: DURATION,
        readyPlayers: ["p1"],
      });
    });

    it("starts at 30s when the client clock is 30s fast", function () {
      const clientNow = serverNow + 30000;
      const localEnd = readyCheckLocalEnd(clientNow, readyPayload(serverNow));
      (localEnd - clientNow).should.equal(DURATION);
    });

    it("starts at 30s when the client clock is 30s slow", function () {
      const clientNow = serverNow - 30000;
      const localEnd = readyCheckLocalEnd(clientNow, readyPayload(serverNow));
      (localEnd - clientNow).should.equal(DURATION);
    });

    it("does not land on 0s or 60s from a 30s clock error", function () {
      const fields = readyPayload(serverNow);
      const fast = serverNow + 30000;
      const slow = serverNow - 30000;
      const absolute = { endTime: fields.endTime };

      (readyCheckLocalEnd(fast, fields) - fast).should.equal(30000);
      (readyCheckLocalEnd(slow, fields) - slow).should.equal(30000);
      (readyCheckLocalEnd(fast, absolute) - fast).should.equal(0);
      (readyCheckLocalEnd(slow, absolute) - slow).should.equal(60000);
    });

    it("uses absolute endTime only when timeLeft is missing", function () {
      const endTime = serverNow + DURATION;
      readyCheckLocalEnd(serverNow, { endTime }).should.equal(endTime);
      readyCheckLocalEnd(serverNow, {
        timeLeft: null,
        endTime,
      }).should.equal(endTime);
      readyCheckLocalEnd(serverNow, {
        timeLeft: undefined,
        endTime,
      }).should.equal(endTime);
    });

    it("honors a zero timeLeft instead of treating it as missing", function () {
      const now = 1000;
      readyCheckLocalEnd(now, {
        timeLeft: 0,
        endTime: now + DURATION,
      }).should.equal(now);
    });
  });

  describe("time before timerInfo", function () {
    it("ignores a time sync until delay is known", function () {
      canApplyTimerTime(undefined).should.equal(false);
      canApplyTimerTime({}).should.equal(false);
      canApplyTimerTime({ time: 1500 }).should.equal(false);
      canApplyTimerTime({ delay: undefined, time: 1500 }).should.equal(false);

      const decision = timerTimeAction({ time: 1500 }, 1500);
      decision.should.deep.equal({ apply: false, requestInfo: true });
      chai.expect(timerRemainingMs({ time: 1500 })).to.equal(null);
    });

    it("does not format a missing delay as 00:00", function () {
      formatTimerTime(NaN).should.equal("00:00");
      chai.expect(formatSyncedTimer({ time: 1500 })).to.equal(null);
      chai.expect(formatSyncedTimer(undefined)).to.equal(null);
      chai.expect(formatSyncedTimer({ delay: undefined, time: 0 })).to.equal(
        null
      );
    });

    it("applies a time sync once timerInfo has supplied delay", function () {
      const timer = { delay: DURATION, time: 1000 };
      canApplyTimerTime(timer).should.equal(true);
      timerTimeAction(timer, 1000).should.deep.equal({
        apply: true,
        requestInfo: false,
        time: 1000,
      });
      timerRemainingMs(timer).should.equal(29000);
      formatSyncedTimer(timer).should.equal("00:29");
    });

    it("shows 00:00 when a known timer has actually expired", function () {
      formatSyncedTimer({ delay: DURATION, time: DURATION }).should.equal(
        "00:00"
      );
      formatSyncedTimer({
        delay: DURATION,
        time: DURATION + 500,
      }).should.equal("00:00");
    });

    it("rejects a non-numeric time even after delay is known", function () {
      const decision = timerTimeAction({ delay: DURATION, time: 0 }, undefined);
      decision.should.deep.equal({
        apply: false,
        requestInfo: true,
      });
    });
  });
});
