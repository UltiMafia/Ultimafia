// Main-thread face of the rule classifier. The model runs in a worker thread
// (modules/ruleWorker.js) because an in-process ONNX call blocks the event loop
// for ~25-30 ms; a burst of checks delayed an unrelated HTTP request by 223 ms
// on a two-core box. Everything here fails open: a missing reply, a dead
// worker or a full queue returns null, and the caller treats that as
// "not flagged".
const path = require("node:path");
const { Worker } = require("node:worker_threads");
const logger = require("./logging")(".");

const THRESHOLD = 0.5;
const REQUEST_TIMEOUT_MS = 2000;
const READY_TIMEOUT_MS = 5000;
// A busy server must not queue an unbounded number of inferences in front of
// one worker; past this, messages go unscored rather than piling up.
const MAX_PENDING = 200;

let worker = null;
let nextId = 1;
const pending = new Map();
let readyPromise = null;
// After a failure (usually the native module is not installed) do not spawn a
// worker per message; try again after this cooldown instead.
let failedAt = 0;
const SPAWN_COOLDOWN_MS = 30000;

function rejectAll() {
  for (const resolve of pending.values()) resolve(null);
  pending.clear();
}

function spawn() {
  worker = new Worker(path.join(__dirname, "ruleWorker.js"));

  worker.on("message", (message) => {
    if (!message) return;

    if (message.type === "ready") {
      if (message.ready) logger.info("rule filter ready (worker thread)");
      else logger.error("rule worker not ready", message.error || "");
      return;
    }

    if (message.type === "result") {
      const resolve = pending.get(message.id);
      if (!resolve) return;
      pending.delete(message.id);
      resolve(message.result);
    }
  });

  worker.on("error", (e) => {
    logger.error("rule worker error", e);
    failedAt = Date.now();
    rejectAll();
  });

  worker.on("exit", (code) => {
    if (code !== 0) {
      logger.error(`rule worker exited with ${code}`);
      failedAt = Date.now();
    }
    worker = null;
    rejectAll();
  });
}

// Spawn and wait for the model to load, so the first message of the day is
// not silently unscored. Resolves either way; the gate always fails open.
function init() {
  if (readyPromise) return readyPromise;

  if (!worker) {
    if (failedAt && Date.now() - failedAt < SPAWN_COOLDOWN_MS) {
      return Promise.resolve(false);
    }
    spawn();
  }

  readyPromise = new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), READY_TIMEOUT_MS);
    const onMessage = (message) => {
      if (message && message.type === "ready") {
        clearTimeout(timer);
        worker.removeListener("message", onMessage);
        resolve(Boolean(message.ready));
      }
    };
    worker.on("message", onMessage);
    worker.once("exit", () => {
      clearTimeout(timer);
      resolve(false);
    });
  });

  return readyPromise;
}

function classify(text) {
  if (!worker) {
    if (failedAt && Date.now() - failedAt < SPAWN_COOLDOWN_MS) {
      return Promise.resolve(null);
    }
    spawn();
  }
  if (pending.size >= MAX_PENDING) return Promise.resolve(null);

  const id = nextId++;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve(null);
    }, REQUEST_TIMEOUT_MS);

    pending.set(id, (result) => {
      clearTimeout(timer);
      resolve(result);
    });

    try {
      worker.postMessage({ type: "classify", id, text: String(text || "") });
    } catch (e) {
      pending.delete(id);
      clearTimeout(timer);
      resolve(null);
    }
  });
}

function isReady() {
  return Boolean(worker);
}

module.exports = { THRESHOLD, init, classify, isReady };
