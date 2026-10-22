const WebSocket = require("ws");
const shortid = require("shortid");
const redis = require("../redis");
const constants = require("../../data/constants");
const { stringifyMessage, parseMessage, splitMeta } = require("../../lib/sockets");
const { placementError } = require("./policy");
const { ApiError } = require("./errors");

const limits = constants.devApi;
const JOIN_TIMEOUT_MS = 10000;
const serverOnlyEvents = new Set([
  "auth",
  "join",
  "enableSeq",
  "authAsServer",
  "createGame",
  "leaveGame",
  "cancelGame",
  "gameRehosted",
  "devControl",
  "deprecated",
  "pushSubscribe",
  "pushUnsubscribe",
]);

const accounts = new Map();
const streams = new Map();
const buckets = new Map();
const bootId = shortid.generate();
const recordsKey = (developerId) => `devapi:accounts:${developerId}`;
const RECORD_TTL_SECONDS = 24 * 3600;

function persist(account) {
  const key = recordsKey(account.developerId);
  redis.client.hset(
    key,
    account.id,
    JSON.stringify({ ...publicView(account), bootId })
  );
  redis.client.expire(key, RECORD_TTL_SECONDS);
}

function setStatus(account, status, error) {
  account.status = status;
  if (error !== undefined) account.error = error;
  persist(account);
}

async function droppedAccounts(developerId) {
  const records = (await redis.client.hgetallAsync(recordsKey(developerId))) || {};
  const dropped = [];
  for (const raw of Object.values(records)) {
    const record = JSON.parse(raw);
    if (record.bootId == bootId) continue;
    if (record.status == "connecting" || record.status == "joined") {
      record.status = "dropped";
      record.error = "The server restarted and this connection was lost.";
      redis.client.hset(recordsKey(developerId), record.id, JSON.stringify(record));
    }
    if (record.status == "dropped") dropped.push(record);
  }
  return dropped;
}

function takeSendToken(developerId) {
  const now = Date.now();
  const rate = limits.sendsPerSecond;
  const bucket = buckets.get(developerId) || { tokens: rate, at: now };
  bucket.tokens = Math.min(rate, bucket.tokens + ((now - bucket.at) / 1000) * rate);
  bucket.at = now;
  buckets.set(developerId, bucket);
  if (bucket.tokens < 1) return Math.ceil(((1 - bucket.tokens) / rate) * 1000);
  bucket.tokens -= 1;
  return 0;
}

function live(account) {
  return account.status == "connecting" || account.status == "joined";
}

function countLive(predicate) {
  let count = 0;
  for (const account of accounts.values()) if (live(account) && predicate(account)) count++;
  return count;
}

function publicView(account) {
  return {
    id: account.id,
    gameId: account.gameId,
    status: account.status,
    playerId: account.playerId,
    name: account.name,
    lastSeq: account.lastSeq,
    error: account.error,
  };
}

function record(account, frame) {
  const entry = { accountId: account.id, ...frame };
  account.events.push(entry);
  if (account.events.length > limits.eventBufferSize)
    account.events.splice(0, account.events.length - limits.eventBufferSize);
  account.lastSeq = frame.seq;
  for (const send of streams.get(account.developerId) || []) send(entry);
}

function handleFrame(account, raw) {
  const { seq, t, message } = splitMeta(String(raw));
  const [event, data] = parseMessage(message) || [];
  if (!event || event == "p") {
    if (event == "p") account.ws.send("p");
    return;
  }
  if (event == "self") account.playerId = data;
  if (event == "history" && data)
    for (const state of Object.values(data))
      Object.assign(account.meetings, (state && state.meetings) || {});
  if (event == "meeting" && data && data.id) account.meetings[data.id] = data;
  if (event == "leftMeeting") delete account.meetings[data];
  if (event == "players" && account.playerId && data && data[account.playerId])
    account.name = data[account.playerId].name;
  record(account, { seq, t: t || Date.now(), event, data });
  account.onFrame(event, data);
}

function open(developerId, game) {
  const account = {
    id: shortid.generate(),
    developerId,
    gameId: game.id,
    status: "connecting",
    events: [],
    meetings: {},
    lastSeq: 0,
    onFrame: () => {},
  };
  accounts.set(account.id, account);
  persist(account);

  return new Promise((resolve) => {
    const finish = (status, error) => {
      if (account.status != "connecting") return;
      setStatus(account, status, error);
      clearTimeout(timer);
      resolve(account);
    };
    const timer = setTimeout(() => finish("closed", "Timed out joining the game."), JOIN_TIMEOUT_MS);

    account.ws = new WebSocket(`ws://localhost:${game.port}`);
    account.ws.on("message", (raw) => handleFrame(account, raw));
    account.ws.on("close", () => {
      finish("closed", "Connection closed.");
      if (account.status != "left") setStatus(account, "closed");
    });
    account.ws.on("error", (e) => finish("closed", e.message));
    account.onFrame = async (event, data) => {
      if (event == "connected") {
        account.ws.send(stringifyMessage("enableSeq", true));
        account.ws.send(stringifyMessage("auth", await redis.createAuthToken(developerId)));
      } else if (event == "authSuccess") {
        account.ws.send(stringifyMessage("join", { gameId: game.id, isBot: true }));
      } else if (event == "loaded") finish("joined");
      else if (event == "error" && account.status == "connecting") {
        finish("closed", String(data));
        account.ws.close();
      }
    };
  });
}

async function spawn(developerId, gameId, count, canUsePublic) {
  const spawned = [];
  for (let i = 0; i < count; i++) {
    const game = await redis.getGameInfo(String(gameId));
    const error = placementError({
      game,
      developerAccounts: countLive((a) => a.developerId == developerId),
      gameTestAccounts: countLive((a) => a.gameId == gameId),
      canUsePublic,
    });
    if (error) {
      if (spawned.length == 0) throw new RangeError(error);
      break;
    }
    spawned.push(publicView(await open(developerId, { ...game, id: String(gameId) })));
  }
  return spawned;
}

function owned(developerId, accountId) {
  const account = accounts.get(String(accountId));
  return account && account.developerId == developerId ? account : null;
}

function checkSendable(account, event) {
  if (serverOnlyEvents.has(event)) throw new RangeError(`${event} cannot be sent through the API.`);
  if (!live(account)) throw new RangeError("This test account is no longer connected.");
}

function send(account, event, data) {
  checkSendable(account, event);
  const wait = takeSendToken(account.developerId);
  if (wait) throw new ApiError(429, `Too many sends; retry in ${wait} ms.`, "rate_limited");
  account.ws.send(stringifyMessage(event, data));
}

function talkMeeting(account) {
  const meetings = Object.values(account.meetings).filter((m) => m.canTalk && m.speech);
  return (meetings.find((m) => m.name == "Village") || meetings.find((m) => m.name == "Pregame") || meetings[0] || {}).id;
}

async function burst(developerId, { accountIds, messages, content, meetingId }) {
  const targets = accountIds.map((id) => owned(developerId, id));
  if (targets.some((a) => !a)) throw new ApiError(404, "Test account not found.");
  const total = targets.length * messages;
  if (!(messages >= 1) || total > limits.maxBurstSends)
    throw new RangeError(`A burst sends 1 to ${limits.maxBurstSends} messages in total.`);
  for (const account of targets) checkSendable(account, "speak");

  const started = Date.now();
  let sent = 0;
  for (let i = 0; i < messages; i++)
    for (const account of targets) {
      let wait;
      while ((wait = takeSendToken(developerId))) await new Promise((r) => setTimeout(r, wait));
      if (!live(account)) continue;
      account.ws.send(
        stringifyMessage("speak", {
          meetingId: meetingId || talkMeeting(account),
          content: `${content || "burst"} ${i + 1}`,
        })
      );
      sent++;
    }
  return { sent, accounts: targets.length, messages, ms: Date.now() - started };
}

function leave(account) {
  if (live(account)) {
    account.ws.send(stringifyMessage("leave"));
    setTimeout(() => account.ws.close(), 1000);
  }
  setStatus(account, "left");
}

function list(developerId) {
  return [...accounts.values()].filter((a) => a.developerId == developerId).map(publicView);
}

function eventsSince(account, since) {
  return account.events.filter((e) => !(e.seq <= since));
}

function subscribe(developerId, sendEntry) {
  if (!streams.has(developerId)) streams.set(developerId, new Set());
  streams.get(developerId).add(sendEntry);
  return () => streams.get(developerId).delete(sendEntry);
}

async function listWithDropped(developerId) {
  return list(developerId).concat(await droppedAccounts(developerId));
}

function forget(developerId) {
  for (const account of accounts.values())
    if (account.developerId == developerId && !live(account)) accounts.delete(account.id);
}

module.exports = {
  spawn,
  owned,
  send,
  burst,
  leave,
  list,
  listWithDropped,
  droppedAccounts,
  eventsSince,
  subscribe,
  forget,
  publicView,
};
