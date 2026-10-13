const models = require("../db/models");
const constants = require("../data/constants");
const logger = require("./logging")("games");

const HOUR = 60 * 60 * 1000;
const limits = {
  flushMs: 2000,
  linesPerChunk: 500,
  maxPayloadBytes: 16 * 1024,
  maxGameBytes: 32 * 1024 * 1024,
  ttlMs: 7 * 24 * HOUR,
  testingTtlMs: 24 * HOUR,
  skippedEvents: new Set(["p"]),
};

const buffers = new Map();
let timer = null;

function enabled(game) {
  if (process.env.NODE_ENV == "test") return false;
  const mode = process.env.GAME_EVENT_LOG || "all";
  if (mode == "off") return false;
  if (mode == "testing") return game.lobby == constants.testingLobby;
  return true;
}

function ttlFor(lobby) {
  return lobby == constants.testingLobby ? limits.testingTtlMs : limits.ttlMs;
}

function line(entry) {
  let payload = entry.payload === undefined ? null : entry.payload;
  let text = JSON.stringify({ ...entry, payload });
  if (text.length > limits.maxPayloadBytes) {
    payload = { truncated: true, bytes: JSON.stringify(payload).length };
    text = JSON.stringify({ ...entry, payload });
  }
  return text;
}

function bufferFor(game) {
  let buffer = buffers.get(game.id);
  if (!buffer) {
    buffer = {
      gameId: game.id,
      lobby: game.lobby,
      hostId: game.originalHostId || game.hostId,
      lines: [],
      bytes: 0,
      chunk: 0,
      full: false,
    };
    buffers.set(game.id, buffer);
  }
  return buffer;
}

function record(game, entry) {
  if (!game || game.isTest || !enabled(game)) return;
  if (limits.skippedEvents.has(entry.event)) return;
  const buffer = bufferFor(game);
  if (buffer.full) return;

  const text = line(entry);
  buffer.bytes += text.length;
  if (buffer.bytes > limits.maxGameBytes) {
    buffer.full = true;
    buffer.lines.push(line({ t_server_ms: Date.now(), direction: "server", event: "logTruncated", payload: { maxBytes: limits.maxGameBytes } }));
  } else buffer.lines.push(text);

  if (buffer.lines.length >= limits.linesPerChunk) flush(buffer);
  if (!timer) timer = setInterval(flushAll, limits.flushMs);
}

function server(game, event, payload) {
  record(game, { t_server_ms: Date.now(), seq: null, socketId: null, userId: null, direction: "server", event, payload });
}

function frame(game, frameInfo) {
  const socket = frameInfo.socket;
  record(game, {
    t_server_ms: frameInfo.t,
    seq: frameInfo.seq,
    socketId: socket.logId || null,
    userId: socket.logUserId || null,
    direction: frameInfo.direction,
    event: frameInfo.event,
    payload: frameInfo.data,
  });
}

function flush(buffer) {
  if (buffer.lines.length == 0) return;
  const lines = buffer.lines;
  buffer.lines = [];
  const now = Date.now();
  models.GameEventLogChunk.create({
    gameId: buffer.gameId,
    n: buffer.chunk++,
    lobby: buffer.lobby,
    hostId: buffer.hostId,
    lines,
    bytes: lines.reduce((sum, l) => sum + l.length, 0),
    createdAt: now,
    expireAt: new Date(now + ttlFor(buffer.lobby)),
  }).catch((e) => logger.error(e));
}

function flushAll() {
  for (const buffer of buffers.values()) flush(buffer);
}

function close(game) {
  const buffer = buffers.get(game.id);
  if (!buffer) return;
  flush(buffer);
  buffers.delete(game.id);
}

module.exports = { record, server, frame, close, flushAll, limits, ttlFor };
