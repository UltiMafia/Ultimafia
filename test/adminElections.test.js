const assert = require("node:assert/strict");
const { DAY, countRankedBallots, electionPhase } = require("../modules/adminElections");

describe("Admin elections", function () {
  it("elects the candidate who gains a majority through transfers", function () {
    assert.deepEqual(countRankedBallots(["A", "B", "C"], [
      ["A"], ["A"], ["A"], ["B"], ["B"], ["B"], ["C", "B"],
    ]), { outcome: "elected", winnerId: "B" });
  });

  it("counts majorities among continuing ballots, including partial rankings", function () {
    assert.deepEqual(countRankedBallots(["A", "B", "C"], [
      ["A"], ["A"], ["A"], ["B"], ["B"], ["C"],
    ]), { outcome: "elected", winnerId: "A" });
  });

  it("does not award a seat without a vote or resolve an outcome-changing tie by order", function () {
    assert.deepEqual(countRankedBallots(["A"], [["Deleted"]]), { outcome: "noVotes" });
    const ballots = [["A"], ["A"], ["B", "C"], ["C", "B"]];
    assert.deepEqual(countRankedBallots(["A", "B", "C"], ballots), { outcome: "tie" });
    assert.deepEqual(countRankedBallots(["C", "B", "A"], ballots), { outcome: "tie" });
  });

  it("can eliminate tied candidates who cannot collectively catch the next candidate", function () {
    assert.deepEqual(countRankedBallots(["A", "B", "C", "D"], [
      ["A"], ["A"], ["A"], ["B"], ["B"], ["B"], ["C", "B"], ["D", "B"],
    ]), { outcome: "elected", winnerId: "B" });
  });

  it("opens voting at the start and closes exactly at the deadline", function () {
    const election = { votingStartsAt: 100, votingEndsAt: 200 };
    assert.equal(electionPhase(election, 99), "nominations");
    assert.equal(electionPhase(election, 100), "voting");
    assert.equal(electionPhase(election, 200), "awaitingCertification");
    assert.equal(electionPhase({ ...election, certifiedAt: 201 }, 201), "certified");
  });
});

// Run against isolated services with ELECTION_TEST_MONGO_URI and REDIS_URL.
describe("Admin elections API and permissions", function () {
  it("keeps ballots private and grants Admin only for the certified term", async function () {
    if (!process.env.ELECTION_TEST_MONGO_URI) this.skip();
    this.timeout(15000);
    const express = require("express");
    const mongoose = require("mongoose");
    const { randomUUID } = require("node:crypto");
    const models = require("../db/models");
    const redis = require("../modules/redis");
    const logPath = require.resolve("../modules/logging");
    const originalLog = require.cache[logPath];
    require.cache[logPath] = { exports: () => ({ error: console.error }) };
    let router;
    try {
      router = require("../routes/adminElections");
    } finally {
      if (originalLog) require.cache[logPath] = originalLog;
      else delete require.cache[logPath];
    }
    const fixtureId = randomUUID().replace(/-/g, "");
    await mongoose.connect(process.env.ELECTION_TEST_MONGO_URI, {
      dbName: `admin_elections_${fixtureId}`,
    });
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.session = { user: { id: req.get("x-fixture-user") } };
      next();
    });
    app.use(router);
    const server = await new Promise((resolve) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });
    const users = [];
    try {
      users.push(...await models.User.create(
        ["Admin", "A", "B", "C", "D", "E", "F", "G", "Alt", "Device1", "Device2", "Late1", "Late2"].map((name) => ({
          id: `${fixtureId}_${name}`, name, deleted: false,
        }))
      ));
      const [admin, a, b, c, d, e, f, g, alt, device1, device2, late1, late2] =
        users.map((user) => user.id);
      const group = await models.Group.create({
        name: "Admin", rank: 10, permissions: ["seeModPanel", "giveGroup"],
      });
      await models.InGroup.create({ user: users[0]._id, group: group._id });

      async function request(path, user, method = "GET", payload) {
        return fetch(`http://127.0.0.1:${server.address().port}${path}`, {
          method,
          headers: { "content-type": "application/json", ...(user && { "x-fixture-user": user }) },
          body: payload && JSON.stringify(payload),
        });
      }
      async function expectStatus(status, ...args) {
        const response = await request(...args);
        const text = await response.text();
        assert.equal(response.status, status, text);
        assert.equal(response.headers.get("cache-control"), "private, no-store");
        return response.headers.get("content-type")?.includes("application/json")
          ? JSON.parse(text)
          : text;
      }
      async function listing(user) {
        return expectStatus(200, "/", user);
      }

      const options = {
        title: "Community admin",
        votingStartsAt: new Date(Date.now() + DAY),
        votingEndsAt: new Date(Date.now() + 2 * DAY),
        termDays: 90,
      };
      await expectStatus(401, "/", null, "POST", options);
      await expectStatus(403, "/", a, "POST", options);
      const { id } = await expectStatus(201, "/", admin, "POST", options);
      const path = `/${id}`;
      const nominate = (status, userId, staff = admin) =>
        expectStatus(status, `${path}/nominate`, staff, "POST", { userId });
      const vote = (status, voter, ranking) =>
        expectStatus(status, `${path}/ballot`, voter, "PUT", { ranking });
      const certify = (status, staff) =>
        expectStatus(status, `${path}/certify`, staff, "POST");
      const editSettings = (status, payload, staff = admin) =>
        expectStatus(status, `${path}/settings`, staff, "PUT", payload);
      const editClosingTime = (status, payload, staff = admin) =>
        expectStatus(status, `${path}/voting-close`, staff, "PATCH", payload);

      assert.equal((await listing()).elections[0].phase, "nominations");
      const updatedSettings = {
        ...options,
        title: "$Community admin election",
        votingStartsAt: new Date(Date.now() + 2 * DAY),
        votingEndsAt: new Date(Date.now() + 3 * DAY),
        termDays: 120,
      };
      await editSettings(403, updatedSettings, a);
      await editSettings(400, { ...updatedSettings, termDays: 0 });
      await editClosingTime(409, { closeNow: true });
      await editSettings(204, updatedSettings);
      const revised = (await listing()).elections[0];
      assert.equal(revised.title, updatedSettings.title);
      assert.equal(revised.votingStartsAt, updatedSettings.votingStartsAt.toISOString());
      assert.equal(revised.votingEndsAt, updatedSettings.votingEndsAt.toISOString());
      assert.equal(revised.termDays, 120);
      await nominate(403, a, b);
      for (const candidate of [a, b, c]) await nominate(204, candidate);
      await models.User.updateOne({ id: b }, { $set: { avatar: true } });
      assert.deepEqual((await listing()).elections[0].nominees, [
        { id: a, name: "A", avatar: false },
        { id: b, name: "B", avatar: true },
        { id: c, name: "C", avatar: false },
      ]);
      await nominate(409, a);
      await vote(409, a, [a]);
      await certify(409, admin);

      await editSettings(204, { ...updatedSettings, votingStartsAt: new Date(Date.now() - DAY) });
      assert.equal((await listing()).elections[0].phase, "voting");
      await editSettings(409, updatedSettings);
      await editClosingTime(403, { closeNow: true }, b);
      await editClosingTime(409, { votingEndsAt: new Date(Date.now() - DAY) });
      const laterDeadline = new Date(Date.now() + 4 * DAY);
      await editClosingTime(204, { votingEndsAt: laterDeadline });
      assert.equal((await listing()).elections[0].votingEndsAt, laterDeadline.toISOString());
      await nominate(409, d);
      await vote(401, null, [a]);
      await vote(400, a, [a, a]);
      await vote(409, a, [d]);
      const linkedIp = "192.0.2.10";
      await models.User.updateMany({ id: { $in: [g, alt] } }, { $set: { ip: [linkedIp] } });
      await vote(204, g, [a]);
      assert.match(await vote(409, alt, [a]), /one ballot is allowed across linked accounts/);
      assert.equal((await listing(alt)).elections[0].myBallot, undefined);

      const fingerprint = { platform: "web", stable: "same-device", unstable: "" };
      await models.User.updateMany({ id: { $in: [device1, device2] } }, {
        $set: { fingerprints: [fingerprint] },
      });
      const simultaneousVotes = await Promise.all([device1, device2].map(async (voter) => {
        const response = await request(`${path}/ballot`, voter, "PUT", { ranking: [b] });
        await response.text();
        return response.status;
      }));
      assert.deepEqual(simultaneousVotes.sort(), [204, 409]);

      await Promise.all([[a, [a]], [b, [b]], [c, [a]], [d, [a]], [e, [b]], [f, [b]],
        [late1, [a]], [late2, [a]]]
        .map(([voter, ranking]) => vote(204, voter, ranking)));
      // The links are discovered after both duplicate ballots were filed. The
      // first account can still edit without losing its priority in the tally.
      await models.User.updateMany({ id: { $in: [late1, late2] } }, {
        $set: { ip: [linkedIp] },
      });
      await vote(204, g, [c, b]);
      assert.deepEqual((await listing(g)).elections[0].myBallot, [c, b]);
      for (const viewer of [null, admin]) {
        const election = (await listing(viewer)).elections[0];
        assert.equal(election.myBallot, undefined);
        assert.equal(election.ballots, undefined);
        assert.equal(election.ballotOrder, undefined);
        assert.equal(election.winnerId, undefined);
      }

      assert.equal(await redis.hasPermission(b, "seeModPanel"), false);
      await editClosingTime(204, { closeNow: true });
      assert.equal((await listing()).elections[0].phase, "awaitingCertification");
      await editClosingTime(409, { votingEndsAt: laterDeadline });
      await editSettings(409, updatedSettings);
      await vote(409, g, [a]);
      await certify(403, b);
      const results = await Promise.all([admin, admin].map(async (staff) => {
        const response = await request(`${path}/certify`, staff, "POST");
        await response.text();
        return response.status;
      }));
      assert.deepEqual(results.sort(), [204, 409]);
      const result = (await listing(b)).elections[0];
      assert.equal(result.winnerId, b);
      assert.equal(result.phase, "certified");
      assert.equal(Date.parse(result.termEndsAt) - Date.parse(result.certifiedAt), 120 * DAY);
      await editClosingTime(409, { votingEndsAt: laterDeadline });
      const certified = await models.AdminElection.findById(id).select("+ballots +ballotOrder").lean();
      assert.equal(certified.ballots, undefined);
      assert.equal(certified.ballotOrder, undefined);
      assert.equal((await listing(b)).canManage, true);
      assert.equal(await redis.hasPermission(b, "seeModPanel", 10), true);
      assert.equal(await redis.hasPermission(b, "giveGroup"), false);
      assert.equal(await redis.hasPermission(admin, "giveGroup", 10), true);
      assert.equal(JSON.parse(await redis.client.getAsync(`user:${b}:perms`)).seeModPanel, undefined);

      await models.AdminElection.updateOne(
        { _id: id }, { $set: { termEndsAt: new Date(Date.now() - 1000) } }
      );
      assert.equal((await listing(b)).canManage, false);
      assert.equal(await redis.hasPermission(b, "seeModPanel", 10), false);
      assert.equal(await redis.hasPermission(admin, "seeModPanel", 10), true);
    } finally {
      await new Promise((resolve) => server.close(resolve));
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
      const keys = users.flatMap(({ id }) => [`user:${id}:perms`, `user:${id}:rank`]);
      if (keys.length) await redis.client.delAsync(...keys);
      await redis.client.quitAsync();
    }
  });
});
