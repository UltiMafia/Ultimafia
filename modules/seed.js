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
            description: deck.description || "",
            words: deck.words,
            coverPhoto: deck.coverPhoto || "",
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

  try {
    const currentIds = defaultDecks.map((d) => d.id);
    await models.WordDeck.deleteMany({
      isDefault: true,
      id: { $nin: currentIds },
    });
  } catch (e) {
    logger.error(`Failed pruning stale default decks: ${e}`);
  }
};
