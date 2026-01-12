const Card = require("../../Card");

module.exports = class ModifierTelepathic extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      Village: {
        speechAbilities: [
          {
            name: "Contact Telepathic",
            targetsDescription: { include: ["all"], exclude: ["self"] },
            targetType: "player",
            verb: "",
          },
        ],
      },
      "Village Dusk": {
        speechAbilities: [
          {
            name: "Contact Telepathic",
            targetsDescription: { include: ["all"], exclude: ["self"] },
            targetType: "player",
            verb: "",
          },
        ],
      },
    };
  }
  speak(message) {
    if (message.abilityName != "Contact Telepathic") return;

    message.modified = true;
    message.anonymous = true;
    message.quotable = false;
    message.recipients = [message.sender];
    message.parseForReview = this.parseForReview;

    for (let player of message.game.players)
      if (player.id == message.abilityTarget) {
        message.recipients.push(player);
        message.prefix = `says to ${player.name}`;
      }
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
