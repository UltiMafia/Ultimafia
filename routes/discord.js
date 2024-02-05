const express = require("express");
const fbAdmin = require("firebase-admin");
const shortid = require("shortid");
const axios = require("axios");
const crypto = require("crypto");
const constants = require("../data/constants");
const routeUtils = require("../routes/utils");
const models = require("../db/models");
const fbServiceAccount = require("../" + process.env.FIREBASE_JSON_FILE);
const logger = require("../modules/logging")(".");
const router = express.Router();
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const fetch = require("node-fetch");

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1/discord/redirect",
    scope: ["identify", "email"]
  }, async (accessToken, refreshToken, profile, done) => {
      console.log(accessToken, refresh);
      console.log(profile);
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  // done(null, user);
});

router.get("/", async function(req, res) {
    res.send(200);
  });
  
  router.get("/redirect", passport.authenticate("discord"), (req, res) => {
    res.send(200);
  });

  module.exports = router;