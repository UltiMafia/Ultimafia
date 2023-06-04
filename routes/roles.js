const express = require("express");
const constants = require("../data/constants");
const roleData = require("..//data/roles");
const logger = require("../modules/logging")(".");
const router = express.Router();

var condensedRoleData = { Modifiers: {} };

for (let gameType in roleData) {
  condensedRoleData[gameType] = [];

  for (let roleName in roleData[gameType]) {
    condensedRoleData[gameType].push({
      name: roleName,
      alignment: roleData[gameType][roleName].alignment,
      disabled: roleData[gameType][roleName].disabled,
    });
  }
}

for (let game in constants.modifiers)
  condensedRoleData["Modifiers"][game] = Object.keys(constants.modifiers[game]);
delete condensedRoleData["Modifiers"]["Mafia"]["Lizard"];

router.get("/all", async function (req, res, next) {
  res.setHeader("Content-Type", "application/json");
  try {
    res.send(condensedRoleData);
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
