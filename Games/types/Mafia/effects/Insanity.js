const crypto = require("crypto");
const Effect = require("../Effect");
const Random = require("../../../../lib/Random");
const { rlyehianify } = require("../../../../lib/TranslatorRlyehian");

module.exports = class Insanity extends Effect {
  constructor() {
    super("Insanity");
    this.isMalicious = true;
    this.listeners = {
      death: function (player) {
        if (player === this.player) {
          this.remove();
        }
      },
      state: function (stateInfo) {
        for (let item of this.player.items) {
          if (item.name == "Room" && this.game.RoomOne.includes(this.player)) {
            item.meetings["Room 1"].canVote = false;
            item.meetings["Room 1"].canWhisper = false;
          }
          if (item.name == "Room" && this.game.RoomTwo.includes(this.player)) {
            item.meetings["Room 2"].canVote = false;
            item.meetings["Room 2"].canWhisper = false;
          }
        }
      },
    };
  }

  apply(player) {
    super.apply(player);

    player.queueAlert(
      ":insane: Reality fades as your mind is consumed by insanity."
    );

    player.role.meetings["Village"].canVote = false;
    player.role.meetings["Village"].canWhisper = false;
  }

  remove() {
    this.player.role.meetings["Village"].canVote = true;
    this.player.role.meetings["Village"].canWhisper = true;

    this.player.queueAlert(":sane: You are cured of your insanity.");

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
