// Requiring Games/core/Player pulls in modules/redis; stub the client so the
// test needs no running Redis (same pattern as userSettingsCosmetics.test.js).
const bluebird = require("bluebird");
const mockRedisClient = { on: () => {}, select: () => {}, existsAsync: async () => false, set: () => {} };
const mockRedis = { createClient: () => mockRedisClient };
bluebird.promisifyAll(mockRedis);
const Module = require("module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function (name) {
  if (name === "redis") return mockRedis;
  return originalRequire.apply(this, arguments);
};

const chai = require("chai");
const fs = require("fs");
const path = require("path");
const should = chai.should();
const dateOnly = require("../lib/dateOnly");

describe("Birthday privacy", function () {
  describe("dateOnly.isBirthdayOn (UTC calendar day)", function () {
    it("is true only on the UTC month/day", function () {
      dateOnly.isBirthdayOn("1999-10-13", new Date("2026-10-13T00:00:00Z")).should.equal(true);
      dateOnly.isBirthdayOn("1999-10-13", new Date("2026-10-13T23:59:59Z")).should.equal(true);
      dateOnly.isBirthdayOn("1999-10-13", new Date("2026-10-12T23:59:59Z")).should.equal(false);
      dateOnly.isBirthdayOn("1999-10-13", new Date("2026-10-14T00:00:00Z")).should.equal(false);
    });
    it("handles missing or invalid birthdays", function () {
      dateOnly.isBirthdayOn(undefined).should.equal(false);
      dateOnly.isBirthdayOn("").should.equal(false);
      dateOnly.isBirthdayOn("garbage").should.equal(false);
    });
    it("accepts legacy UTC-midnight Date values", function () {
      dateOnly.isBirthdayOn(new Date("2000-05-01T00:00:00Z"), new Date("2026-05-01T12:00:00Z")).should.equal(true);
    });
    it("celebrates Feb 29 on Feb 28 in non-leap years only", function () {
      dateOnly.isBirthdayOn("2000-02-29", new Date("2027-02-28T12:00:00Z")).should.equal(true);
      dateOnly.isBirthdayOn("2000-02-29", new Date("2028-02-28T12:00:00Z")).should.equal(false);
      dateOnly.isBirthdayOn("2000-02-29", new Date("2028-02-29T12:00:00Z")).should.equal(true);
    });
  });

  describe("Player.getPlayerInfo", function () {
    it("sends isBirthday and never the birthday date", function () {
      const Player = require("../Games/core/Player");
      const today = new Date().toISOString().slice(0, 10).replace(/^\d{4}/, "1990");
      const fake = {
        id: "p1",
        name: "Alice",
        items: [],
        user: { id: "u1", birthday: today, email: ["a@example.com"], ip: ["1.2.3.4"], fbUid: "x" },
        game: { players: [] },
      };
      const info = Player.prototype.getPlayerInfo.call(fake, { id: "p2" });
      should.not.exist(info.birthday);
      should.not.exist(info.email);
      should.not.exist(info.ip);
      should.not.exist(info.fbUid);
      info.isBirthday.should.equal(true);
      fake.user.birthday = "1990-01-01";
      if (today.slice(5) !== "01-01") {
        Player.prototype.getPlayerInfo.call(fake, { id: "p2" }).isBirthday.should.equal(false);
      }
    });
  });

  describe("GET /api/user/:id/info", function () {
    const src = fs.readFileSync(path.join(__dirname, "../routes/user.js"), "utf8");
    const listSrc = src.match(/const PUBLIC_USER_INFO_FIELDS = (\[[\s\S]*?\]);/)[1];
    const fields = JSON.parse(listSrc.replace(/,\s*\]/, "]"));
    const fnSrc = src.match(/function publicUserInfo[\s\S]*?\n}\n/)[0];
    // eslint-disable-next-line no-new-func
    const publicUserInfo = new Function("PUBLIC_USER_INFO_FIELDS", fnSrc + "return publicUserInfo;")(fields);

    it("uses an allowlist without private fields", function () {
      fields.should.have.members(["id", "name", "avatar", "pronouns", "joined", "vanityUrl", "isBirthday"]);
    });
    it("strips private fields for non-owners", function () {
      const full = {
        id: "u1", name: "A", avatar: true, pronouns: "", joined: 1, vanityUrl: "a", isBirthday: true,
        birthday: "1990-10-13", bdayChanged: true, blockedUsers: ["x"], settings: { a: 1 },
        dailyChallenges: [1], itemsOwned: { a: 1 }, redHearts: "5", goldHearts: "1", points: "9",
        redHeartRefreshTimestamp: "1", goldHeartRefreshTimestamp: "1", nameChanged: false,
        gamesPlayed: "3", achievements: "[]", groups: [], perms: {}, rank: "0", inGame: "g", csrf: "c",
      };
      const out = publicUserInfo(full, { status: "online", lastActive: 5 });
      Object.keys(out).sort().should.deep.equal(
        ["avatar", "id", "isBirthday", "joined", "lastActive", "name", "pronouns", "status", "vanityUrl"]
      );
    });
    it("only the owner gets the full record", function () {
      const route = src.slice(src.indexOf('router.get("/:id/info"'));
      route.should.match(/const isOwner = reqUserId === user\.id;[\s\S]*if \(!isOwner\) \{[\s\S]*res\.send\(publicUserInfo\(/);
    });
    it("redis.getUserInfo exposes isBirthday", function () {
      const r = fs.readFileSync(path.join(__dirname, "../modules/redis.js"), "utf8");
      r.should.include("info.isBirthday = dateOnly.isBirthdayOn(info.birthday);");
    });
  });

  describe("birthday change limit", function () {
    const src = fs.readFileSync(path.join(__dirname, "../routes/user.js"), "utf8");
    const post = src.slice(src.indexOf('router.post("/birthday"'), src.indexOf('router.delete("/birthday"'));
    const del = src.slice(src.indexOf('router.delete("/birthday"'));
    it("reads bdayChanged from the database, not an un-awaited cache call", function () {
      post.should.not.include("redis.getUserInfo(userId).nameChanged");
      post.should.match(/models\.User\.findOne\(\{ id: userId \}\)[\s\S]*bdayChanged/);
    });
    it("uses a conditional update and recaches", function () {
      post.should.include("{ id: userId, bdayChanged: { $ne: true } }");
      post.should.include("redis.cacheUserInfo(userId, true)");
    });
    it("clearing does not reset the limit", function () {
      del.slice(0, 600).should.not.match(/bdayChanged: false/);
    });
    it("admin reset route exists, is permission-gated and logged", function () {
      const mod = fs.readFileSync(path.join(__dirname, "../routes/mod.js"), "utf8");
      const r = mod.slice(mod.indexOf('router.post("/resetBirthdayLimit"'));
      r.should.include('var perm = "resetBirthdayLimit";');
      r.should.include("$set: { bdayChanged: false }");
      r.should.include('createModAction(userId, "Reset Birthday Limit"');
      r.should.include("redis.cacheUserInfo(userIdToActOn, true)");
    });
    it("Admin has the perm and Owner gets it via '*'", function () {
      const constants = require("../data/constants");
      constants.allPerms.resetBirthdayLimit.should.equal(true);
      constants.defaultGroups.Admin.perms.should.include("resetBirthdayLimit");
      constants.defaultGroups.Owner.perms.should.equal("*");
    });
    it("moderation UI has the command", function () {
      const c = fs.readFileSync(path.join(__dirname, "../react_main/src/pages/Policy/Moderation/commands.js"), "utf8");
      c.should.include('"Reset Birthday Limit"');
      c.should.include("/api/mod/resetBirthdayLimit");
    });
  });

  describe("frontend", function () {
    it("Game.jsx uses isBirthday, not the raw birthday", function () {
      const src = fs.readFileSync(path.join(__dirname, "../react_main/src/pages/Game/Game.jsx"), "utf8");
      src.should.include("player.isBirthday === true");
      src.should.not.match(/player\.birthday/);
    });
  });
});
