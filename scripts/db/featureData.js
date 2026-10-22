const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const { EJSON } = mongoose.mongo.BSON;

const collections = ["groups", "ingroups", "devapikeys", "modactions"];
const userFields = { _id: 0, id: 1, github: 1, contributorTypes: 1 };

function collection(name) {
  return mongoose.connection.db.collection(name);
}

function writeJson(dir, name, docs) {
  fs.writeFileSync(path.join(dir, `${name}.json`), EJSON.stringify(docs, { relaxed: false }), { mode: 0o600 });
}

function readJson(dir, name) {
  const file = path.join(dir, `${name}.json`);
  return fs.existsSync(file) ? EJSON.parse(fs.readFileSync(file, "utf8"), { relaxed: false }) : null;
}

module.exports = { collections, userFields, collection, writeJson, readJson };
