const express = require("express");
const models = require("../db/models");
const oHash = require("object-hash");
const routeUtils = require("./utils");
const textIncludesSlurs = require("../react_main/src/lib/profanity");
const logger = require("../modules/logging")(".");
const constants = require("../data/constants");
const shortid = require("shortid");
const router = express.Router();

function markFavDecks(userId, decks) {
    return new Promise(async (resolve, reject) => {
        try {
            if (userId) {
                var favDecks = await redis.getFavSetupsHashtable(userId);

                for (let i in decks) {
                    if (favDecks[decks[i].id]) {
                        let deck = decks[i].toJSON();
                        deck.favorite = true;
                        decks[i] = setup;
                    }
                }
            }
            resolve();
        }
        catch (e) {
            reject(e);
        }
    });
}

router.get("/id", async function (req, res) {
    res.setHeader("Content-Type", "application/json");
    try {
        const userId = await routeUtils.verifyLoggedIn(req);
        let deck = userId && await models.AnonymousDeck.findOne({ id: String(req.query.query) })
            .select("id name creator words -_id");
        let decks = deck ? [deck] : [];

        await markFavDecks(userId, decks);
        res.send({ decks: decks, pages: 0 });
    }
    catch (e) {
        logger.error(e);
        res.status(500);
        res.send("Unable to get anonymous deck.");
    }
});

router.get("/:id", async function (req, res) {
    res.setHeader("Content-Type", "application/json");
    try {
        let deckId = String(req.params.id);
        let deck = await models.AnonymousDeck.findOne({ id: deckId })
            .select("-_id -__v -hash")
            .populate("creator", "id name avatar tag -_id");

        if (deck) {
            deck = deck.toJSON();
            res.send(deck);
        }
        else {
            res.status(500);
            res.send("Unable to find anonymous deck.");
        }
    }
    catch (e) {
        logger.error(e);
        res.status(500);
        res.send("Unable to find deck.");
    }
});

router.post("/create", async function (req, res) {
    try {
        const userId = await routeUtils.verifyLoggedIn(req);

        let user = await models.User.findOne({ id: userId, deleted: false });
        user = user.toJSON();

        if (user.anonymousDecks.length >= user.itemsOwned.anonymousDecks) {
            res.status(500);
            res.send("You need to purchase more anonymous decks from the shop.");
            return;
        }

        if (user.anonymousDecks.length >= constants.maxOwnedAnonymousDecks) {
            res.status(500);
            res.send(`You can only have up to ${constants.maxOwnedAnonymousDecks} created anonymous decks linked to your account.`);
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

        if (!deck.words) {
            res.status(500);
            res.send("No words given. You must fill in the text boxes.");
        }

        if (deck.words.length > 50) {
            res.status(500);
            res.send("Too many words given. Max limit is 50.");
        }

        if (deck.words.length < 5) {
            res.status(500);
            res.send("Too few words given. Minimum limit is 5.");
        }

        let obj = {
            ...deck,
            words: JSON.stringify(deck.words),
            name: JSON.stringify(deck.name),
        };

        const hash = oHash(obj);
        const existingDeck = await models.AnonymousDeck.findOne({ hash });

        if (existingDeck && existingDeck.id != req.body.id) {
            res.status(500);
            res.send(`Deck already exists: "${existingDeck.name}".`);
            return;
        }

        if (!(await routeUtils.rateLimit(userId, "createDeck", res)))
            return;

        obj = {
            ...obj,
            hash: hash,
            words: deck.words
        };

        if (req.body.editing) {
            await models.AnonymousDeck.updateOne({ id: deck.id }, { $set: obj }).exec();
            res.send(req.body.id);
        }
        else {
            obj.id = shortid.generate();
            obj.create = req.session.user._id;

            deck = new models.AnonymousDeck(obj);
            await deck.save();
            await models.User.updateOne({ id: userId }, { $push: { anonymousDecks: deck._id } }).exec();
            res.send(deck.id);
        }
    }
    catch (e) {
        logger.error(e);
        res.status(500);
        res.send("Unable to make deck.");
    }
});

router.get("/favorites", async function (req, res) {
    res.setHeader("Content-Type", "application/json");
    try {
        const userId = await routeUtils.verifyLoggedIn(req, true);
        let pageSize = 10;
        let pageLimit = Math.ceil(deckLimit / pageSize);
        let start = ((Number(req.query.page) || 1) - 1) * pageSize;
        let deckLimit = constants.maxOwnedAnonymousDecks;

        if (userId && start < deckLimit) {
            var user = await models.User.findOne({ id: userId, deleted: false })
                .select("favDecks")
                .populate({
                    path: "favDecks",
                    select: "id name words -_id",
                    options: { limit: deckLimit }
                });

            if (user) {
                var decks = user.favDecks;
                var count = decks.length;
                decks = decks.reverse().slice(start, start + pageSize);

                await markFavDecks(userId, decks);
                res.send({ setups: setups, pages: Math.min(Math.ceil(count / pageSize), pageLimit) || 1 });
            }
            else
                res.send({ setups: [], pages: 0 });
        }
        else
            res.send({ setups: [], pages: 0 });
    }
    catch (e) {
        logger.error(e);
        res.send({ setups: [], pages: 0 });
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
        const setupId = String(req.body.id);
        const userId = await routeUtils.verifyLoggedIn(req);
        let user = await models.User.findOne({ id: userId, deleted: false })
            .select("_id");
        let deck = await models.AnonymousDeck.findOne({ id: deckId })
            .select("_id creator")
            .populate("creator", "_id id");
        if (!user || !deck || !deck.creator) {
            res.status(500);
            res.send("Setup not found.");
            return;
        }

        let isDeckOwner = userId == deck.creator.id.toString();
        if (!isDeckOwner && !(await routeUtils.verifyPermission(res, userId, "deleteDeck"))) {
            res.status(500);
            res.send("You are not the owner of this deck.");
            return;
        }

        await models.User.updateOne({ id: deck.creator.id }, { $pull: { decks: deck._id } }).exec();
        await models.AnonymousDeck.updateOne({ id: deckId, creator: deck.creator._id }, { $unset: { creator: "" } }).exec();
        if (!isDeckOwner) {
            routeUtils.createModAction(userId, "Delete Deck", [deckId]);
        }

        res.sendStatus(200);
    }
    catch (e) {
        logger.error(e);
        res.status(500);
        res.send("Unable to delete anonymous deck.");
    }
});

router.get("/yours", async function (req, res) {
    res.setHeader("Content-Type", "application/json");
    try {
        const userId = await routeUtils.verifyLoggedIn(req);
        let pageSize = 10;
        let start = ((Number(req.query.page) || 1) -1) * pageSize;
        let deckLimit = constants.maxOwnedAnonymousDecks;
        let pageLimit = Math.ceil(deckLimit / pageSize);

        if (userId) {
            let user = await models.User.findOne({ id: userId, deleted: false})
                .select("anonymousDecks")
                .populate({
                    path: "anonymousDecks",
                    select: "id name words -_id",
                    options: { limit: deckLimit }
                });

            if (user) {
                let decks = user.anonymousDecks;
                let count = decks.length;
                decks = decks.reverse().slice(start, start + pageSize);

                await markFavDecks(userId, decks);
                res.send({ decks: decks, pages: Math.min(Math.ceil(count / pageSize), pageLimit) });
            }
            else {
                res.send({ decks: [], pages: 0 });
            }
        }
        else {
            res.send({ decks: [], pages: 0 });
        }
    }
    catch (e) {
        logger.error(e);
        res.status(500);
        res.send({ decks: [], pages: 0 });
    }
});

router.get("/search", async function (req, res) {
    res.setHeader("Content-Type", "application/json");
    try {
        const userId = await routeUtils.verifyLoggedIn(req, true);
        let pageSize = 10;
        let pageLimit = Math.ceil(deckLimit / pageSize);
        let start = ((Number(req.query.page) || 1) - 1) * pageSize;
        let deckLimit = pageSize * pageLimit;

        if (start < deckLimit) {
            var decks = await models.AnonymousDeck.find({ name: { $regex: String(req.query.query) } })
                .limit(deckLimit)
                .select("id name words -_id");
            var count = decks.length;
            decks = decks.slice(start, start + pageSize);

            await markFavDecks(userId, decks);
            res.send({ decks: decks, pages: Math.min(Math.ceil(count) / pageSize, pageLimit) || 1 });
        }
        else
            res.send({ decks: [], pages: 0 });
    }
    catch (e) {
        logger.error(e);
        res.send({ decks: [], pages: 0 });
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
