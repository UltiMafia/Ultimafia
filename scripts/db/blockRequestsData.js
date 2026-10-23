// Shared helpers for the block request backup / backfill / rollback scripts.
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { EJSON } = mongoose.mongo.BSON;

function collection(name) {
  return mongoose.connection.db.collection(name);
}

function writeJson(dir, name, docs) {
  fs.writeFileSync(
    path.join(dir, `${name}.json`),
    EJSON.stringify(docs, null, 2, { relaxed: false }),
    { mode: 0o600 }
  );
}

function readJson(dir, name) {
  const file = path.join(dir, `${name}.json`);
  return fs.existsSync(file)
    ? EJSON.parse(fs.readFileSync(file, "utf8"))
    : null;
}

module.exports = { collection, writeJson, readJson };
