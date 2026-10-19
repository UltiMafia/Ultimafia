// Shared helpers for the Advanced Text Effects shop item backup/rollback scripts.
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { EJSON } = mongoose.mongo.BSON;

const PRICE = 100;
const query = { "itemsOwned.textEffects": { $exists: true } };
const projection = { _id: 0, id: 1, coins: 1, "itemsOwned.textEffects": 1 };

function users() {
  return mongoose.connection.db.collection("users");
}

function writeJson(dir, name, docs) {
  fs.writeFileSync(path.join(dir, `${name}.json`), EJSON.stringify(docs, null, 2, { relaxed: false }), { mode: 0o600 });
}

function readJson(dir, name) {
  const file = path.join(dir, `${name}.json`);
  return fs.existsSync(file) ? EJSON.parse(fs.readFileSync(file, "utf8")) : null;
}

async function refreshCaches(ids) {
  const redis = require("../../modules/redis");
  for (const id of ids) await redis.cacheUserInfo(id, true).catch(() => {});
}

module.exports = { PRICE, query, projection, users, writeJson, readJson, refreshCaches };
