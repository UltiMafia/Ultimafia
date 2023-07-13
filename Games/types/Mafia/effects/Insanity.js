const crypto = require("crypto");
const Effect = require("../Effect");
const Random = require("../../../../lib/Random");
const { rlyehianify } = require("../../../../lib/TranslatorRlyehian");

module.exports = class Insanity extends Effect {
  constructor() {
    super("Insanity");
  }

  apply(player) {
    super.apply(player);

    player.queueAlert(
      ":sy3f: Reality fades as your mind is consumed by insanity."
    );

    player.role.meetings["Village"].canVote = false;
    player.role.meetings["Village"].canWhisper = false;
  }

  remove() {
    this.player.role.meetings["Village"].canVote = true;
    player.role.meetings["Village"].canWhisper = true;

    this.player.queueAlert(":sy3f: You are cured of your insanity.");

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
