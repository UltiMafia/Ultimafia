const express = require("express");
const constants = require("../data/constants");
const roleData = require("..//data/roles");
const modifierData = require("../data/modifiers");
const tagData = require("../data/roletags");
const gameSettingData = require("../data/gamesettings");
const logger = require("../modules/logging")(".");
const router = express.Router();

var condensedRoleData = { Modifiers: {} };
var fullModifierData = {};
var fullGameSettingData = {};
var fullTagData = {};

for (let gameType in roleData) {
  condensedRoleData[gameType] = [];

  for (let roleName in roleData[gameType]) {
    condensedRoleData[gameType].push({
      name: roleName,
      alignment: roleData[gameType][roleName].alignment,
      category: roleData[gameType][roleName].category,
      tags: roleData[gameType][roleName].tags,
      featured: roleData[gameType][roleName].featured,
      newlyAdded: roleData[gameType][roleName].newlyAdded,
      recentlyUpdated: roleData[gameType][roleName].recentlyUpdated,
      disabled: roleData[gameType][roleName].disabled,
    });
  }
}

for (let game in constants.modifiers) {
  condensedRoleData["Modifiers"][game] = Object.keys(constants.modifiers[game]);
  delete condensedRoleData["Modifiers"]["Mafia"]["Lizard"];
}

for (let gameType in modifierData) {
  fullModifierData[gameType] = Object.entries(modifierData[gameType]).map(
    (v) => ({ name: v[0], ...v[1] })
  );
}

for (let gameType in gameSettingData) {
  fullGameSettingData[gameType] = Object.entries(gameSettingData[gameType]).map(
    (v) => ({ name: v[0], ...v[1] })
  );
}

for (let gameType in tagData) {
  fullTagData[gameType] = Object.entries(tagData[gameType]).map(
    (v) => ({ name: v[0], ...v[1] })
  );
}

router.get("/all", async function (req, res, next) {
  res.setHeader("Content-Type", "application/json");
  try {
    res.send(condensedRoleData);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

router.get("/raw", async function (req, res, next) {
  res.setHeader("Content-Type", "application/json");
  try {
    res.send(roleData);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

router.get("/modifiers", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    res.send(fullModifierData);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

router.get("/gamesettings", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    res.send(fullGameSettingData);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

router.get("/roletags", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    res.send(fullTagData);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

router.get("/:gameType/:name", async function (req, res, next) {
  res.setHeader("Content-Type", "application/json");
  try {
    const gameType = String(req.params.gameType);
    const name = String(req.params.name);

    if (
      roleData.hasOwnProperty(gameType) &&
      roleData[gameType].hasOwnProperty(name)
    )
      res.send(roleData[gameType][name]);
    else res.send({ error: "Unable to find role" });
  } catch (e) {
    logger.error(e);
    res.send({ error: "Unable to find role" });
  }
});

module.exports = router;
