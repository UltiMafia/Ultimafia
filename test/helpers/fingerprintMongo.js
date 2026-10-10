const crypto = require("crypto");
const mongoose = require("mongoose");
const schemas = require("../../db/schemas");

function connectionUri() {
  if (process.env.FINGERPRINT_TEST_MONGO_URI) return process.env.FINGERPRINT_TEST_MONGO_URI;
  const configured = process.env.MONGO_URL;
  if (!configured) throw new Error("Mongo test configuration is required (MONGO_URL or FINGERPRINT_TEST_MONGO_URI).");
  if (/^mongodb(\+srv)?:\/\//.test(configured)) return configured;
  const user = encodeURIComponent(process.env.MONGO_USER || "");
  const password = encodeURIComponent(process.env.MONGO_PW || "");
  const credentials = user || password ? `${user}:${password}@` : "";
  return `mongodb://${credentials}${configured}/?authSource=admin`;
}

async function createFingerprintMongo() {
  const namespace = `fingerprint_${process.pid}_${crypto.randomBytes(6).toString("hex")}`;
  const uri = connectionUri();
  const connection = await mongoose.createConnection(uri, {
    dbName: namespace,
    serverSelectionTimeoutMS: 10000,
  }).asPromise();
  if (connection.name !== namespace) {
    await connection.close();
    throw new Error("Fingerprint tests must use their own isolated database.");
  }
  const models = {
    // Keep the public model names aligned with the production schemas.  This
    // matters for routes which populate refs while still isolating every test
    // in its own connection and collections.
    User: connection.model("User", schemas.User, `users_${namespace}`),
    Ban: connection.model("Ban", schemas.Ban, `bans_${namespace}`),
    Session: connection.model("Session", schemas.Session, `sessions_${namespace}`),
    Notification: connection.model("Notification", schemas.Notification, `notifications_${namespace}`),
    ModAction: connection.model("ModAction", schemas.ModAction, `modactions_${namespace}`),
    Report: connection.model("Report", schemas.Report, `reports_${namespace}`),
    ViolationTicket: connection.model("ViolationTicket", schemas.ViolationTicket, `violations_${namespace}`),
  };
  return {
    models,
    async close() {
      await connection.dropDatabase();
      await connection.close();
    },
  };
}

function loadWithModels(modulePath, models) {
  const modelsPath = require.resolve("../../db/models");
  const previous = require.cache[modelsPath];
  require.cache[modelsPath] = { id: modelsPath, filename: modelsPath, loaded: true, exports: models };
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  const loaded = require(modulePath);
  return {
    loaded,
    restore() {
      delete require.cache[resolved];
      if (previous) require.cache[modelsPath] = previous;
      else delete require.cache[modelsPath];
    },
  };
}

module.exports = { createFingerprintMongo, loadWithModels };
