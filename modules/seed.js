const models = require("../db/models");
const defaultDecks = require("../data/wordDecks");
const logger = require("./logging")(".");

module.exports.seedDefaultWordDecks = async function () {
  for (const deck of defaultDecks) {
    try {
      await models.WordDeck.updateOne(
        { id: deck.id },
        {
          $set: {
            id: deck.id,
            name: deck.name,
            words: deck.words,
            isDefault: true,
            featured: true,
            disabled: false,
            creator: null,
          },
        },
        { upsert: true }
      );
    } catch (e) {
      logger.error(`Failed seeding deck ${deck.id}: ${e}`);
    }
  }
};
