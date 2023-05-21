const express = require("express");
const routeUtils = require("./utils");
const logger = require("../modules/logging")(".");
const router = express.Router();
const axios = require("axios");

router.post("/send", async function (req, res) {
    try {
        var userId = await routeUtils.verifyLoggedIn(req);
        let feedbackType = req.body.type;
        let feedbackCategory = req.body.category;
        let title = req.body.title;
        let feedback = req.body.value;

        var feedbackRes = await axios.post(`${process.env.TRELLO_API_URL}?key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_API_TOKEN}&idList=${process.env.TRELLO_API_LIST_ID}&name=${title}&desc=${feedback}`)

        res.sendStatus(200);
    }
    catch (e) {
        logger.error(e);
        res.status(500);
        res.send("Error sending feedback.");
    }
});

module.exports = router;