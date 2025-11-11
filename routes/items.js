const express = require("express");
const itemData = require("../data/items");
const logger = require("../modules/logging")(".");

const router = express.Router();

const fullItemData = {};

for (let gameType in itemData) {
  fullItemData[gameType] = Object.entries(itemData[gameType]).map(
    ([name, info]) => ({ name, ...info })
  );
}

function findItem(gameType, name) {
  const items = fullItemData[gameType];
  if (!items) return null;

  const lowerName = name.toLowerCase();

  return (
    items.find(
      (item) =>
        item.name.toLowerCase() === lowerName ||
        (Array.isArray(item.internal) &&
          item.internal.some((alias) => alias.toLowerCase() === lowerName))
    ) || null
  );
}

router.get("/", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    res.send(fullItemData);
  } catch (e) {
    logger.error(e);
    res.send({});
  }
});

router.get("/:gameType", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const gameType = String(req.params.gameType);
    res.send(fullItemData[gameType] || []);
  } catch (e) {
    logger.error(e);
    res.send([]);
  }
});

router.get("/:gameType/:name", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const gameType = String(req.params.gameType);
    const name = String(req.params.name);
    const item = findItem(gameType, name);

    if (item) res.send(item);
    else res.send({ error: "Unable to find item" });
  } catch (e) {
    logger.error(e);
    res.send({ error: "Unable to find item" });
  }
});

module.exports = router;
