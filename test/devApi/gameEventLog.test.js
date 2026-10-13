const chai = require("chai");
const expect = chai.expect;
const models = require("../../db/models");
const gameEventLog = require("../../modules/gameEventLog");

describe("gameEventLog", function () {
  let created, realCreate, realEnv;

  beforeEach(function () {
    created = [];
    realCreate = models.GameEventLogChunk.create;
    models.GameEventLogChunk.create = (doc) => {
      created.push(doc);
      return Promise.resolve(doc);
    };
    realEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
  });

  afterEach(function () {
    models.GameEventLogChunk.create = realCreate;
    process.env.NODE_ENV = realEnv;
  });

  it("writes in/out/server lines with the documented fields and retention", function () {
    const game = { id: "g1", lobby: "Testing", hostId: "h1" };
    const socket = { logId: "s1", logUserId: "u1" };
    gameEventLog.frame(game, { socket, direction: "in", seq: 1, t: 5, event: "vote", data: { a: 1 } });
    gameEventLog.frame(game, { socket, direction: "out", seq: 2, t: 6, event: "p", data: null });
    gameEventLog.server(game, "phase", { name: "Day" });
    const before = Date.now();
    gameEventLog.close(game);

    expect(created).to.have.length(1);
    const lines = created[0].lines.map((l) => JSON.parse(l));
    expect(lines.map((l) => l.event)).to.deep.equal(["vote", "phase"]);
    expect(lines[0]).to.deep.equal({ t_server_ms: 5, seq: 1, socketId: "s1", userId: "u1", direction: "in", event: "vote", payload: { a: 1 } });
    expect(lines[1].direction).to.equal("server");
    expect(created[0].expireAt.getTime() - before).to.be.closeTo(24 * 3600 * 1000, 5000);
    expect(gameEventLog.ttlFor("Main")).to.equal(7 * 24 * 3600 * 1000);
  });

  it("logs only Testing games when GAME_EVENT_LOG=testing", function () {
    process.env.GAME_EVENT_LOG = "testing";
    gameEventLog.server({ id: "m1", lobby: "Main" }, "phase", {});
    gameEventLog.server({ id: "t1", lobby: "Testing" }, "phase", {});
    gameEventLog.close({ id: "m1" });
    gameEventLog.close({ id: "t1" });
    delete process.env.GAME_EVENT_LOG;
    expect(created.map((c) => c.gameId)).to.deep.equal(["t1"]);
  });

  it("truncates huge payloads and skips test games", function () {
    const game = { id: "g2", lobby: "Main", hostId: "h" };
    gameEventLog.server(game, "big", "x".repeat(50000));
    gameEventLog.server({ id: "g3", isTest: true }, "phase", {});
    gameEventLog.close(game);
    gameEventLog.close({ id: "g3" });
    expect(created).to.have.length(1);
    expect(JSON.parse(created[0].lines[0]).payload).to.deep.equal({ truncated: true, bytes: 50002 });
  });
});
