const express = require("express");
const models = require("../db/models");
const routeUtils = require("./utils");
const logger = require("../modules/logging")(".");
const router = express.Router();


router.get("/:id", async function (req, res) {
    try {
        const userId = await routeUtils.verifyLoggedIn(req);
    }
    catch (e) {
        logger.error(e);
        res.status(500);
        res.send("Unable to get anonymous deck.");
    }
});

router.post("/create", async function (req, res) {
    try {
        const userId = await routeUtils.verifyLoggedIn(req);
    }
    catch (e) {
        logger.error(e);
        res.status(500);
        res.send("Unable to make anonymous deck.");
    }
});

router.post("/edit", async function (req, res) {
    try {
        const userId = await routeUtils.verifyLoggedIn(req);
    }
    catch (e) {
        logger.error(e);
        res.status(500);
        res.send("Unable to edit anonymous deck.");
    }
});

router.post("/delete", async function (req, res) {
    try {
        const userId = await routeUtils.verifyLoggedIn(req);
    }
    catch (e) {
        logger.error(e);
        res.status(500);
        res.send("Unable to delete anonymous deck.");
    }
});

router.get("/yours", async function (req, res) {
    try {
        const userId = await routeUtils.verifyLoggedIn(req);
    }
    catch (e) {
        logger.error(e);
        res.status(500);
        res.send("Unable to get anonymous decks.");
    }
});

module.exports = router;
