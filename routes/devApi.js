const express = require("express");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const gameLoadBalancer = require("../modules/gameLoadBalancer");
const keys = require("../modules/devApi/keys");
const testAccounts = require("../modules/devApi/testAccounts");
const { isTestingGame } = require("../modules/devApi/policy");
const logger = require("../modules/logging")(".");
const errors = require("../modules/devApi/errors");
const models = require("../db/models");
const constants = require("../data/constants");
const router = express.Router();

function handle(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (e) {
      if (e instanceof errors.ApiError) errors.fail(res, e.status, e.message, e.code);
      else if (e instanceof RangeError) errors.badRequest(res, e.message);
      else {
        logger.error(e);
        errors.serverError(res, e.message || "Developer API error.");
      }
    }
  };
}

async function requireDeveloper(req, res) {
  const userId = await routeUtils.verifyLoggedIn(req, true);
  if (!userId) {
    errors.unauthorized(res, "You must be logged in or use a developer token.");
    return null;
  }
  if (!(await keys.isActiveDeveloper(userId))) {
    errors.forbidden(res, "Only developers can use the developer API.");
    return null;
  }
  return userId;
}

async function requireOwner(req, res) {
  const userId = await routeUtils.verifyLoggedIn(req, true);
  if (!userId) {
    errors.unauthorized(res, "You must be logged in.");
    return null;
  }
  if (!(await routeUtils.verifyPermission(userId, "giveGroup", Infinity))) {
    errors.forbidden(res, "Only an Owner can do this.");
    return null;
  }
  return userId;
}


router.post(
  "/token",
  handle(async (req, res) => {
    const clientId = String(req.body.clientId || "");
    if (!(await redis.rateLimit(`devapi:${clientId}`, "devApiToken"))) {
      errors.tooManyRequests(res, "Too many token requests.");
      return;
    }
    const token = await keys.exchange(clientId, String(req.body.clientSecret || ""));
    if (!token) {
      errors.unauthorized(res, "Invalid client credentials.");
      return;
    }
    res.send(token);
  })
);

router.get(
  "/me",
  handle(async (req, res) => {
    const userId = await requireDeveloper(req, res);
    if (!userId) return;
    res.send({
      userId,
      viaToken: Boolean(req.devApi),
      canUsePublicLobbies: await routeUtils.verifyPermission(userId, "devTestPublic"),
    });
  })
);

router.get(
  "/keys",
  handle(async (req, res) => {
    const userId = await requireDeveloper(req, res);
    if (!userId) return;
    res.send(await keys.listKeys({ userId }));
  })
);

router.post(
  "/keys",
  handle(async (req, res) => {
    if (req.devApi) {
      errors.forbidden(res, "Create keys from the website, not with a token.");
      return;
    }
    const userId = await requireDeveloper(req, res);
    if (!userId) return;
    res.send(await keys.createKey(userId, req.body.name));
  })
);

router.post(
  "/keys/:clientId/revoke",
  handle(async (req, res) => {
    const userId = await routeUtils.verifyLoggedIn(req, true);
    if (!userId) {
      errors.unauthorized(res, "You must be logged in.");
      return;
    }
    const isOwner = await routeUtils.verifyPermission(userId, "giveGroup", Infinity);
    const filter = { clientId: String(req.params.clientId) };
    if (!isOwner) filter.userId = userId;
    const revoked = await keys.revokeKeys(filter, userId);
    if (!revoked) {
      errors.notFound(res, "Key not found.");
      return;
    }
    res.send({ revoked });
  })
);

router.get(
  "/owner/keys",
  handle(async (req, res) => {
    if (!(await requireOwner(req, res))) return;
    res.send(await keys.listKeys({}));
  })
);

router.get(
  "/accounts",
  handle(async (req, res) => {
    const userId = await requireDeveloper(req, res);
    if (!userId) return;
    res.send(await testAccounts.listWithDropped(userId));
  })
);

router.post(
  "/accounts",
  handle(async (req, res) => {
    const userId = await requireDeveloper(req, res);
    if (!userId) return;
    const count = Math.max(1, Math.min(50, Number(req.body.count) || 1));
    const canUsePublic = await routeUtils.verifyPermission(userId, "devTestPublic");
    res.send(await testAccounts.spawn(userId, String(req.body.gameId), count, canUsePublic));
  })
);

async function ownedAccount(req, res) {
  const userId = await requireDeveloper(req, res);
  if (!userId) return null;
  const account = testAccounts.owned(userId, req.params.accountId);
  if (!account) errors.notFound(res, "Test account not found.");
  return account;
}

router.post(
  "/accounts/:accountId/send",
  handle(async (req, res) => {
    const account = await ownedAccount(req, res);
    if (!account) return;
    testAccounts.send(account, String(req.body.event), req.body.data);
    res.send({ ok: true, account: testAccounts.publicView(account) });
  })
);

router.post(
  "/accounts/burst",
  handle(async (req, res) => {
    const userId = await requireDeveloper(req, res);
    if (!userId) return;
    res.send(
      await testAccounts.burst(userId, {
        accountIds: [].concat(req.body.accountIds || []).map(String),
        messages: Number(req.body.messages) || 1,
        content: req.body.content && String(req.body.content).slice(0, 200),
        meetingId: req.body.meetingId && String(req.body.meetingId),
      })
    );
  })
);

router.post(
  "/accounts/:accountId/leave",
  handle(async (req, res) => {
    const account = await ownedAccount(req, res);
    if (!account) return;
    testAccounts.leave(account);
    res.send(testAccounts.publicView(account));
  })
);

router.get(
  "/accounts/:accountId/events",
  handle(async (req, res) => {
    const account = await ownedAccount(req, res);
    if (!account) return;
    res.send(testAccounts.eventsSince(account, Number(req.query.since) || 0));
  })
);

router.get(
  "/stream",
  handle(async (req, res) => {
    const userId = await requireDeveloper(req, res);
    if (!userId) return;
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    const write = (text) => {
      res.write(text);
      if (res.flush) res.flush();
    };
    const unsubscribe = testAccounts.subscribe(userId, (entry) =>
      write(`event: game\ndata: ${JSON.stringify(entry)}\n\n`)
    );
    const dropped = await testAccounts.droppedAccounts(userId);
    if (dropped.length)
      write(`event: accounts_dropped\ndata: ${JSON.stringify({ accounts: dropped })}\n\n`);
    const keepAlive = setInterval(() => write(": keep-alive\n\n"), 15000);
    req.on("close", () => {
      clearInterval(keepAlive);
      unsubscribe();
    });
  })
);

router.post(
  "/games/:gameId/control",
  handle(async (req, res) => {
    const userId = await requireDeveloper(req, res);
    if (!userId) return;
    const game = await redis.getGameInfo(String(req.params.gameId));
    if (!isTestingGame(game)) {
      errors.badRequest(res, "Developer controls only work in Testing lobby games.");
      return;
    }
    const creatorId = await redis.client.getAsync(`devapi:game:${game.id}:creator`);
    if ((creatorId || game.hostId) != userId) {
      errors.forbidden(res, "Only the developer who created this game can control it.");
      return;
    }
    try {
      res.send(
        await gameLoadBalancer.devControl(game.id, String(req.body.command), req.body.args)
      );
    } catch (e) {
      errors.badRequest(res, e.message);
    }
  })
);

async function requireGameLogAccess(req, res, gameId) {
  const userId = await routeUtils.verifyLoggedIn(req, true);
  if (!userId) {
    errors.unauthorized(res, "You must be logged in or use a developer token.");
    return null;
  }
  const isOwner = await routeUtils.verifyPermission(userId, "giveGroup", Infinity);
  if (!isOwner && !(await keys.isActiveDeveloper(userId))) {
    errors.forbidden(res, "Only developers or Owners can read game logs.");
    return null;
  }

  const first = await models.GameEventLogChunk.findOne({ gameId }).select("lobby").lean();
  if (!first) {
    errors.notFound(res, "No event log for this game.");
    return null;
  }
  if (isOwner || first.lobby === constants.testingLobby)
    return { mode: "full", userId };

  const game = await models.Game.findOne({ id: gameId }).select("endTime").lean();
  if (game && Number.isFinite(game.endTime) && game.endTime > 0)
    return { mode: "full", userId };

  // The server records this marker at game end, before saving the postgame record.
  const cursor = models.GameEventLogChunk.find({ gameId }).select("lines -_id").lean().cursor();
  try {
    for await (const chunk of cursor) {
      if (parseLines(chunk).some((entry) =>
        entry.direction === "server" && entry.userId === null && entry.event === "end"
      )) return { mode: "full", userId };
    }
  } finally {
    await cursor.close();
  }
  // A missing end marker is not proof that a game has ended.
  return { mode: "filtered", userId };
}

const logChunksPerPage = 20;

function parseLines(chunk) {
  return chunk.lines.map((line) => JSON.parse(line));
}

async function* visibleLogChunks(gameId, access, from = 0) {
  const cursor = models.GameEventLogChunk.find({ gameId, n: { $gte: from } })
    .select("n lines -_id")
    .sort("n")
    .lean()
    .cursor();
  try {
    for await (const chunk of cursor) {
      const lines = access.mode === "full" ? chunk.lines : chunk.lines.filter((line) =>
        JSON.parse(line).userId === access.userId
      );
      if (lines.length) yield { n: chunk.n, lines };
    }
  } finally {
    await cursor.close();
  }
}

router.get(
  "/games/:gameId/log",
  handle(async (req, res) => {
    const gameId = String(req.params.gameId);
    const access = await requireGameLogAccess(req, res, gameId);
    if (!access) return;
    const from = Math.max(0, Number(req.query.fromChunk) || 0);
    const chunks = [];
    for await (const chunk of visibleLogChunks(gameId, access, from)) {
      chunks.push(chunk);
      if (chunks.length === logChunksPerPage) break;
    }
    res.send({
      gameId,
      events: chunks.flatMap(parseLines),
      nextChunk: chunks.length == logChunksPerPage ? chunks[chunks.length - 1].n + 1 : null,
    });
  })
);

router.get(
  "/games/:gameId/log.jsonl",
  handle(async (req, res) => {
    const gameId = String(req.params.gameId);
    const access = await requireGameLogAccess(req, res, gameId);
    if (!access) return;
    res.set("Content-Type", "application/x-ndjson");
    res.set("Content-Disposition", `attachment; filename="game-${gameId}.jsonl"`);
    for await (const chunk of visibleLogChunks(gameId, access)) {
      for (const line of chunk.lines) res.write(line + "\n");
    }
    res.end();
  })
);

module.exports = router;
