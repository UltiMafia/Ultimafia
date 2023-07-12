const crypto = require("crypto");
const Effect = require("../Effect");
const Random = require("../../../../lib/Random");
const {rlyehianify} = require("../../../../lib/TranslatorRlyehian");

module.exports = class Insanity extends Effect {
  constructor() {
    super("Insanity");
  }

  apply(player) {
    super.apply(player);

    player.role.meetings["Village"].canVote = false;
  }

  remove() {
    this.player.role.meetings["Village"].canVote = true;

    super.remove();
  }

  speak(message) {
    message.content = this.makeStringInsane(message.content);
    message.parseForReview = this.parseForReview;
    message.modified = true;
  }

  speakQuote(quote) {
    quote.cancel = true;
  }

  parseForReview(message) {
    message.content = message.versions["*"].content;
    return message;
  }

  makeStringInsane(inputString) {
    return rlyehianify(inputString);
  }
};
