const expressSession = require("express-session");
const mongoStore = require("./mongoStore");

module.exports = expressSession({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    path: "/",
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000,
    secure: false,
    // secure: true
  },
  store: mongoStore,
});
