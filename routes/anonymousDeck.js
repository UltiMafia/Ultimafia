const express = require("express");
const models = require("../db/models");
const routeUtils = require("./utils");
const { textIncludesSlurs } = require("../react_main/src/lib/profanity");
const logger = require("../modules/logging")(".");
const router = express.Router();


router.get("/:id", async function (req, res) {
    res.setHeader("Content-Type", "application/json");
    try {
        let deckId = String(req.params.id);
        let deck = await models.AnonymousDeck.findOne({ id: deckId })
            .select("id name creator disabled words")
            .populate("creator", "id name avatar tag -_id");
 
        if (deck) {
            deck = deck.toJSON();
            res.send(deck);
        } else {
            res.status(500);
            res.send("Unable to find deck.");
        }
    } catch (e) {
        logger.error(e);
        res.status(500);
        res.send("Unable to find deck.");
    }
});

router.post("/create", async function (req, res) {
    try {
        const userId = await routeUtils.verifyLoggedIn(req);
        var user = await models.User.findOne({ id: userId, deleted: false });
        
        if (user.anonymousDecks.length >= user.itemsOwned.anonymousDecks) {
            res.status(500);
            res.send("You need to purchase more anonymous decks from the shop.");
            return;
        }
        
        let deck = Object(req.body);
        deck.name = String(deck.name || "");
        deck.words = Object(deck.words);

        if (!deck.name || !deck.name.length) {
            res.status(500);
            res.send("You must give your deck a name.");
            return;
        }

        let hasSlur, slurWord = verifyDeckWords(deck.words);
        if (hasSlur) {
            res.status(500);
            res.send(`The following word is banned: ${slurWord}`);
            return;
        }
        
        deck.id = shortid.generate();
        deck.creator = req.session.user._id;

        let deckModel = new models.Setup(deck);
        await deckModel.save()
        await models.User.updateOne({ id: userId }, { $push: { anonymousDecks: deckModel._id } }).exec();
        res.send(deck.id);
    } 
    catch (e) {
        logger.error(e);
        res.status(500);
        res.send("Unable to make deck.");
    }
});

router.post("/edit", async function (req, res) {
    try {
        const userId = await routeUtils.verifyLoggedIn(req);
        let deck = Object(req.body);

        let deckObj = await models.AnonymousDeck.findOne({ id: deckObj.id })
            .select("creator")
            .populate("creator", "id");
        
        if (!deckObj || deckObj.creator.id != userId) {
            res.status(500);
            res.send("You can only edit decks you have created.");
            return;
        }

        if (!deck.name || !deck.name.length) {
            res.status(500);
            res.send("You must give your deck a name.");
            return;
        }

        let hasSlur, slurWord = verifyDeckWords(deck.words);
        if (hasSlur) {
            res.status(500);
            res.send(`The following word is banned: ${slurWord}`);
            return;
        }
        
        await models.AnonymousDeck.updateOne({ id: deck.id }, { $set: deckObj }).exec();
        res.send(deck.id);
    } catch (e) {
        logger.error(e);
        res.status(500);
        res.send("Unable to edit deck.");
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

function verifyDeckWords(words) {
    for (let w in words) {
        w = String(w)
        if (textIncludesSlurs(w)) {
            return [true, w] ;
        }
    }

    return [false]
}

module.exports = router;
