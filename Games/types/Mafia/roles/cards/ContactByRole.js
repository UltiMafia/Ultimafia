const Card = require("../../Card");

module.exports = class ContactByRole extends Card {
  constructor(role) {
    super(role);
  }

  speak(message) {
    if (message.abilityName != "Contact") return;

    message.modified = true;
    message.anonymous = true;
    message.quotable = false;
    message.prefix = `says to the ${message.abilityTarget}`;
    message.recipients = [message.sender];
    message.parseForReview = this.parseForReview;

    for (const player of message.game.players)
      if (player.role.name == message.abilityTarget)
        message.recipients.push(player);

    if (message.recipients.length == 1) {
      message.cancel = true;
    }
  }

  parseForReview(message) {
    message.recipients = message.versions["*"].recipients;
    message.prefix = message.versions["*"].prefix;
    return message;
  }
};
