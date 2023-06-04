const expressSession = require("express-session");
const mongoStore = require("connect-mongo")(expressSession);
const db = require("../db/db");

module.exports = new mongoStore({
  mongooseConnection: db.conn,
  ttl: 14 * 24 * 60 * 60,
  touchAfter: 24 * 60 * 60,
  stringify: false,
});
