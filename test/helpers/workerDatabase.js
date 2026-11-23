// Give every Mocha --parallel worker its own Redis and MongoDB database, and
// clear that database before each test file runs.
//
// Suites in this repo call flushdbAsync(), deleteMany({}) and
// dropDatabase() to isolate their own fixtures. With the single shared
// REDIS_DB=0 and Mongo test database that CI uses, those wipes also erase
// another worker's fixtures mid-test, which is why the parallel job reports
// far more failures than running the same files one at a time.
//
// Mocha sets MOCHA_WORKER_ID on each worker process
// (mocha/lib/nodejs/buffered-worker-pool.js). A run without --parallel has no
// id; it keeps slot 0.
//
// The helper runs in Mocha's main process as well as in every worker, and
// workers inherit the main process environment, so the base name is kept in
// MONGO_TEST_BASE_DB and the worker database is always derived from it.
//
// Redis ships with 16 logical databases. Tests start at 1 so they never flush
// the development database (0).

const redis = require("redis");

const rawWorkerId = Number(process.env.MOCHA_WORKER_ID);
const workerId =
  Number.isInteger(rawWorkerId) && rawWorkerId >= 0 ? rawWorkerId : 0;

// 1..15, wrapping only if a machine asks for more than 15 workers.
process.env.REDIS_DB = String((workerId % 15) + 1);

// Games/games.js opens a WebSocket server at require time on
// GAME_PORT + NODE_APP_INSTANCE. With one shared port the second worker to
// load it dies with EADDRINUSE, which is what the "Uncaught error outside
// test suite" entries were.
process.env.GAME_PORT = String(3010 + workerId);
process.env.GAME_PORTS = JSON.stringify([3010 + workerId]);
process.env.CHAT_PORT = String(2999 + workerId);

if (!process.env.MONGO_TEST_BASE_DB) {
  process.env.MONGO_TEST_BASE_DB = process.env.MONGO_DB || "ultimafia";
}

// db/db.js appends "_test" in NODE_ENV=test, so this becomes
// ultimafia_w<N>_test.
process.env.MONGO_DB = `${process.env.MONGO_TEST_BASE_DB}_w${workerId}`;

async function flushRedisDatabase() {
  const client = redis.createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  });
  // The app's client rethrows connection errors; the reset is best-effort and
  // must not take down a worker before its tests get a chance to report.
  client.on("error", () => {});
  client.select(process.env.REDIS_DB || 0);
  await new Promise((resolve, reject) =>
    client.flushdb((err) => (err ? reject(err) : resolve()))
  );
  await new Promise((resolve) => client.quit(resolve));
}

// Root hooks run once per test file, after the file is loaded and before its
// own hooks and tests. This makes a reused worker start each file from the
// same clean Redis database as a fresh process would.
exports.mochaHooks = {
  async beforeAll() {
    await flushRedisDatabase();
  },
};
