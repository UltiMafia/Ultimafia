const expressSession = require("express-session");
const mongoStore = require("./mongoStore");

module.exports = expressSession({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    domain: "127.0.0.1",
    path: "/",
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000,
    secure: false,
    // secure: true
  },
  store: mongoStore,
});
