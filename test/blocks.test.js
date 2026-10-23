const dotenv = require("dotenv").config();
const chai = require("chai"),
  should = chai.should(),
  expect = chai.expect;
const db = require("../db/db");
const redis = require("../modules/redis");
const models = require("../db/models");
const routeUtils = require("../routes/utils");
const blocks = require("../modules/blocks");
const constants = require("../data/constants");

const userRouter = require("../routes/user");
const commentRouter = require("../routes/comment");
const modRouter = require("../routes/mod");
const gameRouter = require("../routes/game");

function handler(router, method, path) {
  const layer = router.stack.find(
    (l) => l.route && l.route.path === path && l.route.methods[method]
  );
  if (!layer) throw new Error(`no ${method} ${path}`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

function res() {
  return {
    statusCode: 200,
    body: undefined,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
    sendStatus(code) {
      this.statusCode = code;
      return this;
    },
  };
}

async function call(router, method, path, userId, extra) {
  const r = res();
  await handler(router, method, path)(
    {
      session: { user: userId ? { id: userId } : {} },
      body: {},
      query: {},
      params: {},
      headers: {},
      ...(extra || {}),
    },
    r
  );
  return r;
}

let seq = 0;
async function makeUser(name) {
  seq += 1;
  const id = `blk${Date.now().toString(36)}${seq}`;
  const user = new models.User({ id, name: name || id, deleted: false });
  await user.save();
  return user.toJSON();
}

const block = (blockerId, blockedId) =>
  call(userRouter, "post", "/block", blockerId, {
    body: { user: blockedId },
  });

describe("blocks", function () {
  this.timeout(20000);
  const stubs = [];
  function stub(obj, key, fn) {
    stubs.push([obj, key, obj[key]]);
    obj[key] = fn;
  }

  before(async function () {
    await db.promise;
  });

  beforeEach(async function () {
    await redis.client.flushdbAsync();
    await models.BlockRequest.deleteMany({});
    // Permission and rate limit checks are covered elsewhere.
    stub(routeUtils, "verifyPermission", async () => true);
    stub(routeUtils, "rateLimit", async () => true);
  });

  afterEach(function () {
    while (stubs.length) {
      const [obj, key, orig] = stubs.pop();
      obj[key] = orig;
    }
  });

  describe("blocking", function () {
    it("blocks communication at once and files a pending game-block request", async function () {
      const a = await makeUser("alice");
      const b = await makeUser("bob");

      const r = await block(a.id, b.id);
      r.body.should.deep.equal({ blocked: true });

      const saved = await models.User.findOne({ id: a.id }).lean();
      saved.blockedUsers.should.deep.equal([b.id]);
      (await blocks.usersBlockEachOther(a.id, b.id)).should.equal(true);
      (await blocks.usersBlockEachOther(b.id, a.id)).should.equal(true);

      const requests = await models.BlockRequest.find({}).lean();
      requests.should.have.lengthOf(1);
      requests[0].blockerId.should.equal(a.id);
      requests[0].blockedId.should.equal(b.id);
      requests[0].status.should.equal("pending");
      requests[0].date.should.be.a("number");

      (await blocks.gameBlockedWithAny(a.id, [b.id])).should.equal(false);
      (await blocks.gameBlockedWithAny(b.id, [a.id])).should.equal(false);
    });

    it("unblocking removes the block and an approved game block", async function () {
      const a = await makeUser();
      const b = await makeUser();
      await block(a.id, b.id);
      const request = await models.BlockRequest.findOne({ blockerId: a.id });
      (await blocks.approveRequest(request.id, "mod")).should.have.property(
        "request"
      );
      (await blocks.gameBlockedWithAny(b.id, [a.id])).should.equal(true);

      const r = await block(a.id, b.id);
      r.body.should.deep.equal({ blocked: false });

      (await models.BlockRequest.countDocuments({})).should.equal(0);
      (await blocks.usersBlockEachOther(a.id, b.id)).should.equal(false);
      (await blocks.gameBlockedWithAny(a.id, [b.id])).should.equal(false);
      (await blocks.gameBlockedWithAny(b.id, [a.id])).should.equal(false);
    });

    it("one user unblocking leaves the other's approved block in place", async function () {
      const a = await makeUser();
      const b = await makeUser();
      await block(a.id, b.id);
      await block(b.id, a.id);
      const fromB = await models.BlockRequest.findOne({ blockerId: b.id });
      await blocks.approveRequest(fromB.id, "mod");

      await block(a.id, b.id); // a unblocks
      (await blocks.gameBlockedWithAny(a.id, [b.id])).should.equal(true);
      (await blocks.usersBlockEachOther(a.id, b.id)).should.equal(true);
    });
  });

  describe("DMs", function () {
    it("are refused both ways, ahead of the friends-only setting", function () {
      expect(
        blocks.dmBlockMessage("s", [], {
          id: "m",
          blockedUsers: ["s"],
          settings: { onlyFriendDMs: true },
        })
      ).to.equal("Unable to send message, a member of this DM has blocked you.");
      expect(
        blocks.dmBlockMessage("s", ["m"], { id: "m", blockedUsers: [] })
      ).to.equal("You cannot send a message to someone you have blocked.");
      expect(
        blocks.dmBlockMessage("s", [], { id: "m", blockedUsers: [] })
      ).to.equal(null);
    });
  });

  describe("profile comments", function () {
    async function comment(authorId, location) {
      const author = await models.User.findOne({ id: authorId }).select("_id");
      return call(commentRouter, "post", "/", authorId, {
        session: { user: { id: authorId, _id: author._id } },
        body: { content: "hello", location },
      });
    }

    it("are refused both ways once either user blocks", async function () {
      const a = await makeUser();
      const b = await makeUser();
      const c = await makeUser();

      (await comment(b.id, a.id)).statusCode.should.equal(200);
      await block(a.id, b.id);

      const fromBlocked = await comment(b.id, a.id);
      fromBlocked.statusCode.should.equal(403);
      fromBlocked.body.should.equal("You can't comment on this profile.");
      (await comment(a.id, b.id)).statusCode.should.equal(403);

      // Others, and the owner on their own wall, are unaffected.
      (await comment(c.id, a.id)).statusCode.should.equal(200);
      (await comment(a.id, a.id)).statusCode.should.equal(200);

      // Earlier comments stay (the owner can delete them as before).
      (await models.Comment.countDocuments({
        location: a.id,
        deleted: false,
      })).should.equal(3);

      await block(a.id, b.id); // unblock
      (await comment(b.id, a.id)).statusCode.should.equal(200);
    });
  });

  describe("game joins", function () {
    let gameInfo;
    beforeEach(function () {
      gameInfo = null;
      stub(redis, "getGameInfo", async () => gameInfo);
      stub(redis, "inGame", async () => false);
    });

    async function connect(userId, gameId) {
      return call(gameRouter, "get", "/:id/connect", userId, {
        params: { id: gameId },
        query: {},
      });
    }

    const BLOCK_MSG =
      "You can't join this game because of a block between you and a player in it.";

    it("are allowed before approval and refused both ways after", async function () {
      const host = await makeUser("host");
      const other = await makeUser("other");
      await block(host.id, other.id);

      gameInfo = { id: "g1", hostId: host.id, players: [host.id], settings: {}, type: "Mafia", port: "3010" };
      (await connect(other.id, "g1")).body.should.not.equal(BLOCK_MSG);

      const request = await models.BlockRequest.findOne({ blockerId: host.id });
      await blocks.approveRequest(request.id, "mod");

      const refused = await connect(other.id, "g1");
      refused.statusCode.should.equal(403);
      refused.body.should.equal(BLOCK_MSG);

      // The other way round: the blocker cannot join a game the blocked user
      // hosts or is seated in.
      gameInfo = { id: "g2", hostId: "someoneElse", players: [other.id], settings: {}, type: "Mafia", port: "3010" };
      (await connect(host.id, "g2")).body.should.equal(BLOCK_MSG);

      // Already in that game (reconnect): not refused.
      redis.inGame = async () => "g2";
      (await connect(host.id, "g2")).body.should.not.equal(BLOCK_MSG);
    });

    it("hides lobbies only for approved game blocks", async function () {
      const a = await makeUser();
      const b = await makeUser();
      await block(a.id, b.id);
      (await blocks.gameBlockedIds(b.id)).size.should.equal(0);

      const request = await models.BlockRequest.findOne({ blockerId: a.id });
      await blocks.approveRequest(request.id, "mod");
      [...(await blocks.gameBlockedIds(b.id))].should.deep.equal([a.id]);
      [...(await blocks.gameBlockedIds(a.id))].should.deep.equal([b.id]);
    });
  });

  describe("staff review", function () {
    it("lists requests involving the user and approving is logged", async function () {
      const a = await makeUser("ann");
      const b = await makeUser("ben");
      const c = await makeUser("cat");
      const mod = await makeUser("mod");
      await block(a.id, b.id);
      await block(c.id, a.id);

      const list = await call(modRouter, "get", "/blockRequests", mod.id, {
        query: { userId: a.id },
      });
      list.body.user.name.should.equal("ann");
      list.body.requests.should.have.lengthOf(2);
      list.body.requests
        .map((r) => `${r.blocker.name}>${r.blocked.name}:${r.status}`)
        .sort()
        .should.deep.equal(["ann>ben:pending", "cat>ann:pending"]);

      const target = list.body.requests.find((r) => r.blocker.id == c.id);
      const approved = await call(modRouter, "post", "/blockRequests/approve", mod.id, {
        body: { requestId: target.id },
      });
      approved.statusCode.should.equal(200);
      approved.body.request.status.should.equal("approved");
      approved.body.request.approvedBy.should.equal(mod.id);

      const action = await models.ModAction.findOne({
        modId: mod.id,
        name: "Approve Game Block",
      }).lean();
      action.args.should.deep.equal([c.id, a.id]);

      const again = await call(modRouter, "post", "/blockRequests/approve", mod.id, {
        body: { requestId: target.id },
      });
      again.statusCode.should.equal(409);

      const after = await call(modRouter, "get", "/blockRequests", mod.id, {
        query: { userId: a.id },
      });
      const shown = after.body.requests.find((r) => r.id == target.id);
      shown.status.should.equal("approved");
      shown.approvedBy.name.should.equal("mod");
    });

    it("does not approve a request whose block was removed", async function () {
      const a = await makeUser();
      const b = await makeUser();
      await block(a.id, b.id);
      const request = await models.BlockRequest.findOne({ blockerId: a.id });
      await models.User.updateOne({ id: a.id }, { $pull: { blockedUsers: b.id } });

      const r = await call(modRouter, "post", "/blockRequests/approve", "mod", {
        body: { requestId: request.id },
      });
      r.statusCode.should.equal(409);
      (await models.BlockRequest.countDocuments({})).should.equal(0);
      (await blocks.gameBlockedWithAny(b.id, [a.id])).should.equal(false);
    });

    it("needs approveGameBlocks, given to Admin (and Owner) only", async function () {
      routeUtils.verifyPermission = async (res, userId, perm) => {
        res.status(403);
        res.send("You do not have the required permissions.");
        return false;
      };
      const r = await call(modRouter, "get", "/blockRequests", "x", {
        query: { userId: "y" },
      });
      r.statusCode.should.equal(403);

      constants.allPerms.approveGameBlocks.should.equal(true);
      constants.defaultGroups.Admin.perms.should.include("approveGameBlocks");
      constants.defaultGroups.Owner.perms.should.equal("*");
      constants.defaultGroups.Mod.perms.should.not.include("approveGameBlocks");
      constants.defaultGroups.Liaison.perms.should.not.include("approveGameBlocks");
    });
  });
});
