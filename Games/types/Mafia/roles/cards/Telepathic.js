const Card = require("../../Card");

module.exports = class Telepathic extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      Village: {
        speechAbilities: [
          {
            name: "Contact",
            targetsDescription: { include: ["members"], exclude: ["self"] },
            targetType: "player",
            verb: "",
          },
        ],
      },
    };
  }
  speak(message) {
    if (message.abilityName != "Contact") return;

    message.modified = true;
    message.anonymous = true;
    message.quotable = false;
    message.prefix = `says to ${message.abilityTarget}`;
    message.recipients = [message.sender];
    message.parseForReview = this.parseForReview;

    for (let player of message.game.players)
      if (player.role.name == message.abilityTarget)
        message.recipients.push(player);

    if (message.recipients.length == 1) {
      message.cancel = true;
      return;
    }
  }

  parseForReview(message) {
    message.recipients = message.versions["*"].recipients;
    message.prefix = message.versions["*"].prefix;
    return message;
  }
};
