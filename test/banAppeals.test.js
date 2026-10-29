const chai = require("chai");
const crypto = require("crypto");
const mongoose = require("mongoose");
const schemas = require("../db/schemas");

const should = chai.should();

function connectionUri() {
  if (process.env.FINGERPRINT_TEST_MONGO_URI)
    return process.env.FINGERPRINT_TEST_MONGO_URI;
  const configured = process.env.MONGO_URL;
  if (!configured) throw new Error("Mongo test configuration is required.");
  if (/^mongodb(\+srv)?:\/\//.test(configured)) return configured;
  const user = encodeURIComponent(process.env.MONGO_USER || "");
  const password = encodeURIComponent(process.env.MONGO_PW || "");
  const credentials = user || password ? `${user}:${password}@` : "";
  return `mongodb://${credentials}${configured}/?authSource=admin`;
}

// Real routers and the real banAppeals module over an isolated database; only
// Redis, logging and the game/firebase services are replaced.
function loadRouters(models, redis) {
  const stubbed = {
    "../db/models": models,
    "../modules/redis": redis,
    "../modules/logging": () => ({ error() {}, warn() {}, info() {} }),
    "../modules/gameLoadBalancer": { leaveGame: async () => {} },
    "../modules/roleIconCreditUtils": {},
    "../modules/fortunePoints": {},
    "../modules/skillRating": {},
    "firebase-admin": {},
  };
  const reloaded = [
    "../modules/accountLinkage",
    "../routes/utils",
    "../modules/banAppeals",
    "../routes/mod",
    "../routes/banPage",
  ];
  const paths = [...Object.keys(stubbed), ...reloaded].map(require.resolve);
  const previous = new Map(paths.map((path) => [path, require.cache[path]]));
  for (const [request, exports] of Object.entries(stubbed)) {
    const path = require.resolve(request);
    require.cache[path] = { id: path, filename: path, loaded: true, exports };
  }
  for (const request of reloaded)
    delete require.cache[require.resolve(request)];
  const modRouter = require("../routes/mod");
  const banPageRouter = require("../routes/banPage");
  const banAppeals = require("../modules/banAppeals");
  return {
    modRouter,
    banPageRouter,
    banAppeals,
    restore() {
      for (const path of paths) {
        if (previous.get(path)) require.cache[path] = previous.get(path);
        else delete require.cache[path];
      }
    },
  };
}

function findHandler(router, method, path) {
  const layer = router.stack.find(
    (entry) =>
      entry.route && entry.route.path === path && entry.route.methods[method],
  );
  if (!layer) throw new Error(`Missing ${method.toUpperCase()} ${path}`);
  return layer.route.stack[0].handle;
}

function response() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(value) {
      this.body = value;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
    sendStatus(code) {
      this.statusCode = code;
      this.body = String(code);
      return this;
    },
  };
}

function modRequest(userId, body = {}) {
  return {
    session: { user: { id: userId } },
    body,
    query: {},
    headers: {},
    connection: {},
  };
}

function banRequest(session, body = {}, headers = {}) {
  return {
    session,
    body,
    query: {},
    headers,
    connection: {},
    get(name) {
      return headers[name.toLowerCase()];
    },
  };
}

describe("site ban page and appeals", function () {
  this.timeout(20000);
  let connection;
  let models;
  let loaded;
  let ranks;
  let allowed;
  let handlers;

  before(async function () {
    const namespace = `banappeal_${process.pid}_${crypto
      .randomBytes(6)
      .toString("hex")}`;
    connection = await mongoose
      .createConnection(connectionUri(), {
        dbName: namespace,
        serverSelectionTimeoutMS: 10000,
      })
      .asPromise();
    if (connection.name !== namespace)
      throw new Error("Ban appeal tests need their own database.");
    models = {};
    for (const name of Object.keys(schemas))
      models[name] = connection.model(
        name,
        schemas[name],
        `${name.toLowerCase()}_${namespace}`,
      );
    await models.SiteBanAppeal.init();

    ranks = new Map();
    allowed = new Set();
    const redis = {
      async getUserRank(id) {
        return ranks.get(id);
      },
      async hasPermission(id, permission, rank) {
        return (
          allowed.has(`${id}:${permission || "*"}`) &&
          (rank == null || (ranks.get(id) || 0) >= rank)
        );
      },
      async hasPermissions() {
        return false;
      },
      async cacheUserPermissions() {},
      async cacheUserInfo() {},
      async getUserStatus() {
        return "offline";
      },
      async getBasicUserInfo() {
        return null;
      },
    };
    loaded = loadRouters(models, redis);
    handlers = {
      ban: findHandler(loaded.modRouter, "post", "/ban"),
      vote: findHandler(loaded.modRouter, "post", "/banAppeal/vote"),
      tally: findHandler(loaded.modRouter, "get", "/banAppeal"),
      unban: findHandler(loaded.modRouter, "post", "/unban"),
      info: findHandler(loaded.banPageRouter, "get", "/"),
      appeal: findHandler(loaded.banPageRouter, "post", "/appeal"),
      logout: findHandler(loaded.banPageRouter, "post", "/logout"),
    };
  });

  after(async function () {
    if (loaded) loaded.restore();
    if (connection) {
      await connection.dropDatabase();
      await connection.close();
    }
  });

  let session;
  const csrf = "ban-csrf-token";

  beforeEach(async function () {
    await Promise.all(
      Object.values(models).map((model) => model.deleteMany({})),
    );
    ranks.clear();
    allowed.clear();

    // banningAdmin issues the ban; otherAdmin and owner are admins too; mod is
    // in the Mod group and must not get appeals.
    const users = await models.User.create([
      { id: "banningAdmin", name: "BanningAdmin", deleted: false },
      { id: "otherAdmin", name: "OtherAdmin", deleted: false },
      { id: "owner", name: "Owner", deleted: false },
      { id: "mod", name: "JustAMod", deleted: false },
      { id: "goneAdmin", name: "GoneAdmin", deleted: true },
      { id: "target", name: "BadPlayer", deleted: false, ip: ["203.0.113.9"] },
    ]);
    const byId = Object.fromEntries(users.map((user) => [user.id, user]));
    const [adminGroup, ownerGroup, modGroup] = await models.Group.create([
      { name: "Admin", rank: 10 },
      { name: "Owner", rank: 20 },
      { name: "Mod", rank: 5 },
    ]);
    await models.InGroup.create([
      { user: byId.banningAdmin._id, group: adminGroup._id },
      { user: byId.otherAdmin._id, group: adminGroup._id },
      { user: byId.goneAdmin._id, group: adminGroup._id },
      { user: byId.owner._id, group: ownerGroup._id },
      { user: byId.owner._id, group: adminGroup._id },
      { user: byId.mod._id, group: modGroup._id },
    ]);

    ranks.set("banningAdmin", 10);
    ranks.set("otherAdmin", 10);
    ranks.set("mod", 5);
    ranks.set("target", 0);
    ["ban", "unban"].forEach((perm) => {
      allowed.add(`banningAdmin:${perm}`);
      allowed.add(`otherAdmin:${perm}`);
    });

    session = { siteBan: { userId: "target", csrf } };
  });

  async function siteBan(reason = "Repeated harassment in lobby chat") {
    const res = response();
    await handlers.ban(
      modRequest("banningAdmin", {
        userId: "target",
        banType: "site",
        length: "30 days",
        reason,
      }),
      res,
    );
    return res;
  }

  async function info() {
    const res = response();
    await handlers.info(banRequest(session), res);
    return res;
  }

  async function appeal(text, headers = { "x-csrf": csrf }) {
    const res = response();
    await handlers.appeal(banRequest(session, { appeal: text }, headers), res);
    return res;
  }

  describe("reason on site bans", function () {
    it("refuses a site ban without a reason and writes nothing", async function () {
      for (const reason of [null, "", "   "]) {
        const res = await siteBan(reason);
        res.statusCode.should.equal(400);
      }
      (await models.Ban.countDocuments({})).should.equal(0);
      (await models.User.countDocuments({ banned: true })).should.equal(0);
    });

    it("refuses a reason over the length limit", async function () {
      const res = await siteBan("x".repeat(301));
      res.statusCode.should.equal(400);
      (await models.Ban.countDocuments({})).should.equal(0);
    });

    it("stores the trimmed reason on the ban, the mod action and the notification", async function () {
      const res = await siteBan("  Repeated harassment  ");
      res.statusCode.should.equal(200);
      const ban = await models.Ban.findOne({ userId: "target" }).lean();
      ban.type.should.equal("site");
      ban.reason.should.equal("Repeated harassment");
      ban.modId.should.equal("banningAdmin");
      should.exist(ban.createdAt);
      const action = await models.ModAction.findOne({
        name: "Site Ban",
      }).lean();
      action.reason.should.equal("Repeated harassment");
      const notif = await models.Notification.findOne({
        user: "target",
      }).lean();
      notif.content.should.contain("Reason: Repeated harassment");
    });

    it("keeps the reason optional for other ban types", async function () {
      const res = response();
      await handlers.ban(
        modRequest("banningAdmin", {
          userId: "target",
          banType: "chat",
          length: "1 day",
        }),
        res,
      );
      res.statusCode.should.equal(200);
      should.not.exist(
        (await models.Ban.findOne({ type: "chat" }).lean()).reason,
      );
    });
  });

  describe("ban page data", function () {
    it("reports not banned without a ban session", async function () {
      session = {};
      const res = await info();
      res.body.should.deep.equal({ banned: false });
    });

    it("returns the reason, dates, account and NOT SUBMITTED status", async function () {
      await siteBan();
      const res = await info();
      res.statusCode.should.equal(200);
      res.body.banned.should.equal(true);
      res.body.username.should.equal("BadPlayer");
      res.body.reason.should.equal("Repeated harassment in lobby chat");
      res.body.permanent.should.equal(false);
      res.body.expires.should.be.greaterThan(Date.now());
      res.body.issuedAt.should.be.at.most(Date.now());
      res.body.appealLimit.should.equal(1);
      res.body.votesRequired.should.equal(2);
      res.body.appeal.should.deep.equal({ status: "not_submitted" });
      res.body.csrf.should.equal(csrf);
    });

    it("clears the ban session once the ban is gone", async function () {
      await siteBan();
      await models.Ban.deleteMany({}).exec();
      const res = await info();
      res.body.should.deep.equal({ banned: false, banEnded: true });
      should.not.exist(session.siteBan);
    });

    it("falls back to a placeholder for older bans with no reason", async function () {
      await models.Ban.create({
        id: "legacy",
        userId: "target",
        modId: "banningAdmin",
        type: "site",
        expires: 0,
        auto: false,
        permissions: ["signIn"],
      });
      const res = await info();
      res.body.reason.should.equal("No reason was recorded for this ban.");
      res.body.permanent.should.equal(true);
      should.exist(res.body.issuedAt);
    });
  });

  describe("appeal", function () {
    const appealText = "I was arguing, but I did not harass anyone.";

    it("rejects a request without the ban page's csrf token", async function () {
      await siteBan();
      (await appeal(appealText, {})).statusCode.should.equal(403);
      (await appeal(appealText, { "x-csrf": "wrong" })).statusCode.should.equal(
        403,
      );
      (await models.SiteBanAppeal.countDocuments({})).should.equal(0);
    });

    it("rejects a request without a ban session", async function () {
      await siteBan();
      session = {};
      (await appeal(appealText)).statusCode.should.equal(401);
    });

    it("rejects a too-short appeal", async function () {
      await siteBan();
      (await appeal("sorry")).statusCode.should.equal(400);
      (await models.SiteBanAppeal.countDocuments({})).should.equal(0);
    });

    it("sends the exact message to an admins-only group DM, including the banning admin", async function () {
      await siteBan();
      const res = await appeal(`  ${appealText}  `);
      res.statusCode.should.equal(200);
      res.body.appeal.status.should.equal("pending");

      const messages = await models.ChatMessage.find({}).lean();
      messages.length.should.equal(1);
      // Posted by the site, not by the banned user.
      messages[0].senderId.should.equal("site:ban-appeals");
      messages[0].content.should.equal(
        `BAN-APPEAL: BadPlayer - BAN REASON: Repeated harassment in lobby chat , APPEAL: ${appealText}`,
      );

      const admins = ["banningAdmin", "otherAdmin", "owner"];
      const channel = await models.ChatChannel.findOne({
        id: messages[0].channel,
      }).lean();
      channel.public.should.equal(false);
      [...channel.memberIds].sort().should.deep.equal(admins);
      channel.memberIds.should.not.include("target");
      channel.id.should.equal(loaded.banAppeals.userIdsToChannelId(admins));

      const opens = await models.ChannelOpen.find({}).lean();
      opens
        .map((open) => open.user)
        .sort()
        .should.deep.equal(admins);
      const chatNotifs = await models.Notification.find({
        isChat: true,
        channelId: channel.id,
      }).lean();
      chatNotifs
        .map((notif) => notif.user)
        .sort()
        .should.deep.equal(admins);

      const stored = await models.SiteBanAppeal.findOne({}).lean();
      stored.recipientIds.should.deep.equal(admins);
      stored.banModId.should.equal("banningAdmin");
      stored.text.should.equal(appealText);
    });

    it("puts a 'Ban appeal pending' notification in each admin's inbox", async function () {
      await siteBan();
      await appeal(appealText);
      const notifs = await models.Notification.find({
        isChat: false,
        content: /^Ban appeal pending/,
      }).lean();
      notifs
        .map((notif) => notif.user)
        .sort()
        .should.deep.equal(["banningAdmin", "otherAdmin", "owner"]);
      for (const notif of notifs) {
        notif.content.should.equal("Ban appeal pending: BadPlayer");
        notif.link.should.equal("/policy/moderation");
        notif.icon.should.equal("gavel");
        notif.read.should.equal(false);
      }
      // Nothing about the appeal goes to the banned user.
      (
        await models.Notification.countDocuments({
          user: "target",
          content: /appeal/i,
        })
      ).should.equal(0);
    });

    it("keeps a long appeal whole in one message", async function () {
      await siteBan("r".repeat(300));
      const long = "a".repeat(1000);
      (await appeal(long)).statusCode.should.equal(200);
      const message = await models.ChatMessage.findOne({}).lean();
      message.content.should.equal(
        `BAN-APPEAL: BadPlayer - BAN REASON: ${"r".repeat(300)} , APPEAL: ${long}`,
      );
      await models.SiteBanAppeal.deleteMany({}).exec();
      (await appeal("a".repeat(1001))).statusCode.should.equal(400);
    });

    it("with no admins it stores the appeal as PENDING and sends nothing", async function () {
      await siteBan();
      await models.InGroup.deleteMany({}).exec();
      const res = await appeal(appealText);
      res.statusCode.should.equal(200);
      res.body.appeal.status.should.equal("pending");
      const stored = await models.SiteBanAppeal.findOne({}).lean();
      stored.recipientIds.should.deep.equal([]);
      should.not.exist(stored.channelId);
      (await models.ChatMessage.countDocuments({})).should.equal(0);
      (await info()).body.appeal.status.should.equal("pending");
    });

    it("allows only one appeal per ban: a second submit is refused and sends nothing", async function () {
      await siteBan();
      (await appeal(appealText)).statusCode.should.equal(200);
      const second = await appeal("Please, one more look at my case.");
      second.statusCode.should.equal(409);
      (await models.SiteBanAppeal.countDocuments({})).should.equal(1);
      (await models.ChatMessage.countDocuments({})).should.equal(1);

      // Even concurrent submits produce one appeal.
      await models.SiteBanAppeal.deleteMany({}).exec();
      await models.ChatMessage.deleteMany({}).exec();
      const results = await Promise.all([
        appeal(appealText),
        appeal(appealText),
        appeal(appealText),
      ]);
      results.filter((r) => r.statusCode === 200).length.should.equal(1);
      results.filter((r) => r.statusCode === 409).length.should.equal(2);
      (await models.SiteBanAppeal.countDocuments({})).should.equal(1);
      (await models.ChatMessage.countDocuments({})).should.equal(1);
    });

    it("shows PENDING with the appeal text on the ban page", async function () {
      await siteBan();
      await appeal(appealText);
      const res = await info();
      res.body.appeal.status.should.equal("pending");
      res.body.appeal.text.should.equal(appealText);
      should.exist(res.body.appeal.submittedAt);
    });
  });

  describe("voting", function () {
    const appealText = "I was arguing, but I did not harass anyone.";

    async function vote(modId, value, notes) {
      const res = response();
      await handlers.vote(
        modRequest(modId, { userId: "target", vote: value, notes }),
        res,
      );
      return res;
    }

    async function stored() {
      return models.SiteBanAppeal.findOne({}).lean();
    }

    // Adds admins (Admin group members with the unban permission).
    async function addAdmins(ids) {
      const group = await models.Group.findOne({ name: "Admin" });
      for (const id of ids) {
        const user = await models.User.create({ id, name: id, deleted: false });
        await models.InGroup.create({ user: user._id, group: group._id });
        ranks.set(id, 10);
        allowed.add(`${id}:unban`);
      }
    }

    beforeEach(async function () {
      // owner can vote too; give it the same permissions as the admins.
      ranks.set("owner", 20);
      allowed.add("owner:unban");
      await siteBan();
    });

    // N = 3 by default: banningAdmin, otherAdmin, owner.
    async function submit() {
      (await appeal(appealText)).statusCode.should.equal(200);
    }

    it("decides by the rule: min(2, N) accepts, or denies > N - min(2, N)", function () {
      const { tallyVotes, decidedStatus } = loaded.banAppeals;
      const admins = (n) => Array.from({ length: n }, (_, i) => `a${i}`);
      const votes = (accepts, denies) => [
        ...Array.from({ length: accepts }, (_, i) => ({
          voterId: `a${i}`,
          vote: "accept",
        })),
        ...Array.from({ length: denies }, (_, i) => ({
          voterId: `a${accepts + i}`,
          vote: "deny",
        })),
      ];
      const status = (n, accepts, denies) =>
        decidedStatus(tallyVotes(votes(accepts, denies), admins(n)));
      status(5, 0, 3).should.equal("pending");
      status(5, 0, 4).should.equal("denied");
      status(5, 1, 3).should.equal("pending");
      status(3, 0, 1).should.equal("pending");
      status(3, 0, 2).should.equal("denied");
      status(3, 2, 1).should.equal("accepted");
      status(2, 0, 1).should.equal("denied");
      status(2, 1, 0).should.equal("pending");
      status(2, 2, 0).should.equal("accepted");
      status(1, 0, 0).should.equal("pending");
      status(1, 1, 0).should.equal("accepted");
      status(1, 0, 1).should.equal("denied");
      status(0, 0, 0).should.equal("pending");
      tallyVotes([], admins(1)).should.deep.equal({
        admins: 1,
        accept: 0,
        deny: 0,
        acceptAt: 1,
        denyAt: 1,
      });
      tallyVotes([], []).should.deep.equal({
        admins: 0,
        accept: 0,
        deny: 0,
        acceptAt: null,
        denyAt: null,
      });
      // Votes from someone outside the snapshot never count.
      decidedStatus(
        tallyVotes(
          [
            { voterId: "outsider", vote: "accept" },
            { voterId: "a0", vote: "accept" },
          ],
          admins(3),
        ),
      ).should.equal("pending");
    });

    it("one accept vote leaves the appeal PENDING and shows N and the tally", async function () {
      await submit();
      const res = await vote("otherAdmin", "accept", "Looks fine to me");
      res.statusCode.should.equal(200);
      res.body.should.deep.equal({
        status: "pending",
        tally: { admins: 3, accept: 1, deny: 0, acceptAt: 2, denyAt: 2 },
      });
      const doc = await stored();
      doc.status.should.equal("pending");
      doc.votes.length.should.equal(1);
      doc.votes[0].voterId.should.equal("otherAdmin");
      doc.votes[0].vote.should.equal("accept");
      should.exist(doc.votes[0].at);
      (await info()).body.appeal.status.should.equal("pending");
      should.not.exist((await info()).body.appeal.votes);
    });

    it("two distinct accept votes make it ACCEPTED without unbanning", async function () {
      await submit();
      await vote("otherAdmin", "accept");
      const res = await vote("banningAdmin", "accept");
      res.body.status.should.equal("accepted");
      res.body.tally.accept.should.equal(2);
      const doc = await stored();
      doc.status.should.equal("accepted");
      doc.reviewedBy.should.equal("banningAdmin");
      (await info()).body.appeal.status.should.equal("accepted");
      // Lifting the ban stays a separate, explicit unban.
      (await models.Ban.countDocuments({ type: "site" })).should.equal(1);
      should.exist(
        await models.ModAction.findOne({ name: "Accept Ban Appeal" }).lean(),
      );
    });

    it("an admin voting twice counts once, and the latest vote replaces the first", async function () {
      await submit();
      await vote("otherAdmin", "accept");
      const again = await vote("otherAdmin", "accept");
      again.body.status.should.equal("pending");
      again.body.tally.accept.should.equal(1);
      const doc = await stored();
      doc.votes.length.should.equal(1);
    });

    it("N = 3: 1 deny stays PENDING, 2 denies make it DENIED", async function () {
      await submit();
      (await vote("otherAdmin", "deny")).body.should.deep.equal({
        status: "pending",
        tally: { admins: 3, accept: 0, deny: 1, acceptAt: 2, denyAt: 2 },
      });
      const res = await vote("owner", "deny");
      res.body.status.should.equal("denied");
      (await info()).body.appeal.status.should.equal("denied");
      should.exist(
        await models.ModAction.findOne({ name: "Deny Ban Appeal" }).lean(),
      );
    });

    it("N = 5: 3 denies stay PENDING, the 4th makes it DENIED", async function () {
      await addAdmins(["admin4", "admin5"]);
      await submit();
      (await stored()).recipientIds.length.should.equal(5);
      for (const id of ["otherAdmin", "owner", "admin4"])
        (await vote(id, "deny")).body.status.should.equal("pending");
      const third = await vote("admin4", "deny");
      third.body.tally.should.deep.equal({
        admins: 5,
        accept: 0,
        deny: 3,
        acceptAt: 2,
        denyAt: 4,
      });
      const fourth = await vote("admin5", "deny");
      fourth.body.status.should.equal("denied");
    });

    it("changing a vote from deny to accept recalculates the result", async function () {
      await submit();
      await vote("otherAdmin", "deny");
      const changed = await vote("otherAdmin", "accept");
      changed.body.tally.should.include({ accept: 1, deny: 0 });
      // A second deny would now leave 1 deny, so still PENDING.
      (await vote("owner", "deny")).body.status.should.equal("pending");
      const res = await vote("banningAdmin", "accept");
      res.body.status.should.equal("accepted");
      res.body.tally.should.include({ accept: 2, deny: 1 });
      (await stored()).votes.length.should.equal(3);
    });

    it("uses the admins snapshotted at submission: later admins can't vote and don't change N", async function () {
      await submit();
      await addAdmins(["lateAdmin"]);
      (await vote("lateAdmin", "accept")).statusCode.should.equal(403);
      // An admin removed after submission still counts in N.
      const group = await models.Group.findOne({ name: "Admin" });
      const owner = await models.User.findOne({ id: "otherAdmin" });
      await models.InGroup.deleteMany({ user: owner._id, group: group._id });
      const res = await vote("banningAdmin", "deny");
      res.body.tally.admins.should.equal(3);
      res.body.tally.denyAt.should.equal(2);
      res.body.status.should.equal("pending");
    });

    async function onlyOneAdmin() {
      await models.InGroup.deleteMany({}).exec();
      const group = await models.Group.findOne({ name: "Admin" });
      const only = await models.User.findOne({ id: "otherAdmin" });
      await models.InGroup.create({ user: only._id, group: group._id });
    }

    it("with 1 admin, that admin's single accept makes it ACCEPTED", async function () {
      await onlyOneAdmin();
      (await info()).body.votesRequired.should.equal(1);
      await submit();
      (await stored()).recipientIds.should.deep.equal(["otherAdmin"]);
      (await info()).body.votesRequired.should.equal(1);
      const res = await vote("otherAdmin", "accept");
      res.body.should.deep.equal({
        status: "accepted",
        tally: { admins: 1, accept: 1, deny: 0, acceptAt: 1, denyAt: 1 },
      });
      (await info()).body.appeal.status.should.equal("accepted");
    });

    it("with 1 admin, that admin's single deny makes it DENIED", async function () {
      await onlyOneAdmin();
      await submit();
      const res = await vote("otherAdmin", "deny");
      res.body.status.should.equal("denied");
      const message = await models.ChatMessage.findOne({
        content: /^BAN-APPEAL VOTE/,
      }).lean();
      message.content.should.equal(
        "BAN-APPEAL VOTE: OtherAdmin voted DENY - 1 admin: accept 0/1, deny 1/1 - appeal DENIED",
      );
    });

    it("refuses votes after the appeal is decided", async function () {
      await submit();
      await vote("otherAdmin", "accept");
      await vote("owner", "accept");
      const late = await vote("banningAdmin", "deny");
      late.statusCode.should.equal(409);
      const doc = await stored();
      doc.status.should.equal("accepted");
      doc.votes.length.should.equal(2);
    });

    it("refuses non-admins, including a moderator with the unban permission", async function () {
      await submit();
      (await vote("mod", "accept")).statusCode.should.equal(403);
      allowed.add("mod:unban");
      (await vote("mod", "accept")).statusCode.should.equal(403);
      (await stored()).votes.length.should.equal(0);
    });

    it("refuses a bad vote value and a user with no appeal", async function () {
      await submit();
      (await vote("otherAdmin", "maybe")).statusCode.should.equal(400);
      await models.SiteBanAppeal.deleteMany({}).exec();
      (await vote("otherAdmin", "accept")).statusCode.should.equal(404);
    });

    it("posts each vote and the tally into the appeal's group DM", async function () {
      await submit();
      await vote("otherAdmin", "deny");
      await vote("banningAdmin", "accept");
      await vote("owner", "accept");
      const doc = await stored();
      const messages = await models.ChatMessage.find({ channel: doc.channelId })
        .sort({ date: 1 })
        .lean();
      messages
        .map((m) => m.content)
        .slice(1)
        .should.deep.equal([
          "BAN-APPEAL VOTE: OtherAdmin voted DENY - 3 admins: accept 0/2, deny 1/2 - still PENDING",
          "BAN-APPEAL VOTE: BanningAdmin voted ACCEPT - 3 admins: accept 1/2, deny 1/2 - still PENDING",
          "BAN-APPEAL VOTE: Owner voted ACCEPT - 3 admins: accept 2/2, deny 1/2 - appeal ACCEPTED",
        ]);
    });

    it("shows admins N, the tally and who voted", async function () {
      await submit();
      await vote("otherAdmin", "accept", "ok");
      const res = response();
      await handlers.tally(
        { ...modRequest("banningAdmin"), query: { userId: "target" } },
        res,
      );
      res.statusCode.should.equal(200);
      res.body.status.should.equal("pending");
      res.body.tally.should.deep.equal({
        admins: 3,
        accept: 1,
        deny: 0,
        acceptAt: 2,
        denyAt: 2,
      });
      res.body.votes
        .map((v) => `${v.voterName}:${v.vote}:${v.notes}`)
        .should.deep.equal(["OtherAdmin:accept:ok"]);
    });

    it("after ACCEPTED, a separate site unban ends the ban page", async function () {
      await submit();
      await vote("otherAdmin", "accept");
      await vote("owner", "accept");
      const res = response();
      await handlers.unban(
        modRequest("otherAdmin", { userId: "target", banType: "site" }),
        res,
      );
      res.statusCode.should.equal(200);
      (await info()).body.should.deep.equal({ banned: false, banEnded: true });
    });
  });

  describe("linked accounts (alts)", function () {
    const appealText = "I was arguing, but I did not harass anyone.";
    const fingerprint = { platform: "web", stable: "dev-1", unstable: "x" };

    function as(userId) {
      session = { siteBan: { userId, csrf } };
    }

    async function addUser(id, fields) {
      await models.User.create({ id, name: id, deleted: false, ...fields });
      ranks.set(id, 0);
    }

    it("blocks a shared-IP alt from appealing again and shows it the first appeal's status", async function () {
      await addUser("altIp", { ip: ["203.0.113.9"] });
      await siteBan();
      // The site ban already banned the alt too, with its own Ban record.
      (await models.Ban.countDocuments({ type: "site" })).should.equal(2);

      as("target");
      (await appeal(appealText)).statusCode.should.equal(200);

      as("altIp");
      const page = await info();
      page.body.appeal.should.include({
        status: "pending",
        linkedAccount: true,
      });
      should.not.exist(page.body.appeal.text);
      const second = await appeal("This is my other account appealing.");
      second.statusCode.should.equal(409);
      second.body.should.contain("linked to yours");
      (await models.SiteBanAppeal.countDocuments({})).should.equal(1);
      (
        await models.ChatMessage.countDocuments({ content: /^BAN-APPEAL:/ })
      ).should.equal(1);
    });

    it("links by device fingerprint as well, and follows the first appeal to its final status", async function () {
      await models.User.updateOne(
        { id: "target" },
        { $set: { fingerprints: [fingerprint] } },
      );
      await addUser("altDevice", {
        ip: ["198.51.100.7"],
        fingerprints: [fingerprint],
      });
      await siteBan();

      as("altDevice");
      (await appeal(appealText)).statusCode.should.equal(200);
      ranks.set("owner", 20);
      allowed.add("owner:unban");
      for (const admin of ["otherAdmin", "owner"]) {
        const res = response();
        await handlers.vote(
          modRequest(admin, { userId: "altDevice", vote: "deny" }),
          res,
        );
        res.statusCode.should.equal(200);
      }

      as("target");
      (await info()).body.appeal.should.include({
        status: "denied",
        linkedAccount: true,
      });
      (await appeal(appealText)).statusCode.should.equal(409);
    });

    it("lets an unlinked banned user appeal on their own", async function () {
      await addUser("stranger", { ip: ["192.0.2.50"] });
      await siteBan();
      as("target");
      (await appeal(appealText)).statusCode.should.equal(200);

      const res = response();
      await handlers.ban(
        modRequest("banningAdmin", {
          userId: "stranger",
          banType: "site",
          length: "30 days",
          reason: "Spamming",
        }),
        res,
      );
      as("stranger");
      (await info()).body.appeal.should.deep.equal({ status: "not_submitted" });
      (await appeal(appealText)).statusCode.should.equal(200);
      (await models.SiteBanAppeal.countDocuments({})).should.equal(2);
    });

    it("allows only one appeal when linked accounts submit at the same time", async function () {
      await addUser("altIp", { ip: ["203.0.113.9"] });
      await addUser("altIp2", { ip: ["203.0.113.9"] });
      await siteBan();
      const submit = (userId) => {
        const res = response();
        return handlers
          .appeal(
            banRequest(
              { siteBan: { userId, csrf } },
              { appeal: appealText },
              { "x-csrf": csrf },
            ),
            res,
          )
          .then(() => res);
      };
      const results = await Promise.all([
        submit("target"),
        submit("altIp"),
        submit("altIp2"),
      ]);
      results.filter((r) => r.statusCode === 200).length.should.equal(1);
      results.filter((r) => r.statusCode === 409).length.should.equal(2);
      (await models.SiteBanAppeal.countDocuments({})).should.equal(1);
      (
        await models.ChatMessage.countDocuments({ content: /^BAN-APPEAL:/ })
      ).should.equal(1);
    });

    it("doesn't count a linked appeal from a ban that ended before this one", async function () {
      await addUser("altIp", { ip: ["203.0.113.9"] });
      const longAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
      await models.Ban.create({
        id: "oldBan",
        userId: "altIp",
        modId: "banningAdmin",
        type: "site",
        expires: longAgo + 1000,
        createdAt: longAgo,
        permissions: ["signIn"],
      });
      await models.SiteBanAppeal.create({
        id: "oldAppeal",
        banId: "oldBan",
        userId: "altIp",
        text: "An old appeal.",
        status: "denied",
        recipientIds: ["otherAdmin"],
        createdAt: longAgo + 100,
      });
      await siteBan();
      as("target");
      (await info()).body.appeal.status.should.equal("not_submitted");
      (await appeal(appealText)).statusCode.should.equal(200);
    });
  });

  describe("signed out", function () {
    function signedOut(body = {}, query = {}) {
      return { session: {}, body, query, headers: {}, connection: {} };
    }

    it("returns 401, not 500, for the appeal tally and vote", async function () {
      const tally = response();
      await handlers.tally(signedOut({}, { userId: "target" }), tally);
      tally.statusCode.should.equal(401);
      const vote = response();
      await handlers.vote(
        signedOut({ userId: "target", vote: "accept" }),
        vote,
      );
      vote.statusCode.should.equal(401);
    });
  });

  describe("BAN_APPEAL_VOTER_ALLOWLIST", function () {
    const appealText = "I was arguing, but I did not harass anyone.";
    let previousEnv;
    let allowLoaded;
    let allow;

    // Reloads the real routers and banAppeals with the env value set, since it
    // is read once at load.
    function loadWith(value) {
      if (allowLoaded) allowLoaded.restore();
      if (value === undefined) delete process.env.BAN_APPEAL_VOTER_ALLOWLIST;
      else process.env.BAN_APPEAL_VOTER_ALLOWLIST = value;
      allowLoaded = loadRouters(models, {
        async getUserRank(id) {
          return ranks.get(id);
        },
        async hasPermission(id, permission, rank) {
          return (
            allowed.has(`${id}:${permission || "*"}`) &&
            (rank == null || (ranks.get(id) || 0) >= rank)
          );
        },
        async hasPermissions() {
          return false;
        },
        async cacheUserPermissions() {},
        async cacheUserInfo() {},
        async getUserStatus() {
          return "offline";
        },
        async getBasicUserInfo() {
          return null;
        },
      });
      allow = {
        vote: findHandler(allowLoaded.modRouter, "post", "/banAppeal/vote"),
        tally: findHandler(allowLoaded.modRouter, "get", "/banAppeal"),
        info: findHandler(allowLoaded.banPageRouter, "get", "/"),
        appeal: findHandler(allowLoaded.banPageRouter, "post", "/appeal"),
      };
    }

    before(function () {
      previousEnv = process.env.BAN_APPEAL_VOTER_ALLOWLIST;
    });

    after(function () {
      if (allowLoaded) allowLoaded.restore();
      if (previousEnv === undefined)
        delete process.env.BAN_APPEAL_VOTER_ALLOWLIST;
      else process.env.BAN_APPEAL_VOTER_ALLOWLIST = previousEnv;
    });

    beforeEach(async function () {
      ranks.set("owner", 20);
      allowed.add("owner:unban");
      await siteBan();
    });

    async function submitWith() {
      const res = response();
      await allow.appeal(
        banRequest(session, { appeal: appealText }, { "x-csrf": csrf }),
        res,
      );
      return res;
    }

    async function voteWith(modId, value) {
      const res = response();
      await allow.vote(modRequest(modId, { userId: "target", vote: value }), res);
      return res;
    }

    async function tallyWith(modId) {
      const res = response();
      const req = modRequest(modId);
      req.query = { userId: "target" };
      await allow.tally(req, res);
      return res;
    }

    async function notifiedUsers() {
      return (await models.Notification.distinct("user")).filter(
        (id) => id !== "target",
      );
    }

    it("unset or empty: every Owner and Admin counts, gets it and can vote", async function () {
      for (const value of [undefined, "", " , ,"]) {
        loadWith(value);
        (await allowLoaded.banAppeals.getAdminIds()).should.deep.equal([
          "banningAdmin",
          "otherAdmin",
          "owner",
        ]);
      }
      const page = response();
      await allow.info(banRequest(session), page);
      page.body.votesRequired.should.equal(2);
      (await submitWith()).statusCode.should.equal(200);
      const doc = await models.SiteBanAppeal.findOne({}).lean();
      doc.recipientIds.should.deep.equal(["banningAdmin", "otherAdmin", "owner"]);
      (await notifiedUsers())
        .sort()
        .should.deep.equal(["banningAdmin", "otherAdmin", "owner"]);
      (await voteWith("banningAdmin", "accept")).statusCode.should.equal(200);
    });

    it("set: only listed Owners/Admins count toward N, get the DM and notifications, and vote", async function () {
      // mod is listed but is not an Owner or Admin; ghost is not a user.
      loadWith(" otherAdmin , mod,ghost,,");
      (await allowLoaded.banAppeals.getAdminIds()).should.deep.equal([
        "otherAdmin",
      ]);
      const page = response();
      await allow.info(banRequest(session), page);
      page.body.votesRequired.should.equal(1);

      (await submitWith()).statusCode.should.equal(200);
      const doc = await models.SiteBanAppeal.findOne({}).lean();
      doc.recipientIds.should.deep.equal(["otherAdmin"]);
      const channel = await models.ChatChannel.findOne({
        id: doc.channelId,
      }).lean();
      channel.memberIds.should.deep.equal(["otherAdmin"]);
      (await notifiedUsers()).should.deep.equal(["otherAdmin"]);
      (await models.ChannelOpen.distinct("user")).should.deep.equal([
        "otherAdmin",
      ]);

      // Unlisted admins can't see or vote on it.
      (await tallyWith("banningAdmin")).statusCode.should.equal(403);
      (await voteWith("banningAdmin", "accept")).statusCode.should.equal(403);
      (await voteWith("owner", "deny")).statusCode.should.equal(403);

      // N = 1, so min(2, 1) = 1 accept decides it.
      (await tallyWith("otherAdmin")).statusCode.should.equal(200);
      const res = await voteWith("otherAdmin", "accept");
      res.body.should.deep.equal({
        status: "accepted",
        tally: { admins: 1, accept: 1, deny: 0, acceptAt: 1, denyAt: 1 },
      });
    });

    it("set with two admins: needs 2 accepts, and 1 deny makes it unreachable", async function () {
      loadWith("otherAdmin,owner");
      (await submitWith()).statusCode.should.equal(200);
      (await models.SiteBanAppeal.findOne({}).lean()).recipientIds.should.deep.equal(
        ["otherAdmin", "owner"],
      );
      (await voteWith("banningAdmin", "deny")).statusCode.should.equal(403);
      const res = await voteWith("owner", "deny");
      res.body.should.deep.equal({
        status: "denied",
        tally: { admins: 2, accept: 0, deny: 1, acceptAt: 2, denyAt: 1 },
      });
    });

    it("set with no Owner/Admin listed: N = 0, nobody is told, it stays pending", async function () {
      loadWith("mod,ghost");
      (await submitWith()).statusCode.should.equal(200);
      const doc = await models.SiteBanAppeal.findOne({}).lean();
      doc.status.should.equal("pending");
      doc.recipientIds.should.deep.equal([]);
      should.not.exist(doc.channelId);
      (await notifiedUsers()).should.deep.equal([]);
      (await voteWith("otherAdmin", "accept")).statusCode.should.equal(403);
    });
  });

  describe("logout", function () {
    it("ends the ban session", async function () {
      await siteBan();
      const bad = response();
      await handlers.logout(banRequest(session, {}, {}), bad);
      bad.statusCode.should.equal(403);
      const res = response();
      await handlers.logout(banRequest(session, {}, { "x-csrf": csrf }), res);
      res.statusCode.should.equal(200);
      should.not.exist(session.siteBan);
    });
  });

  it("formats the appeal message exactly", function () {
    loaded.banAppeals
      .formatAppealMessage({ username: "U", reason: "R", appeal: "A" })
      .should.equal("BAN-APPEAL: U - BAN REASON: R , APPEAL: A");
  });
});
