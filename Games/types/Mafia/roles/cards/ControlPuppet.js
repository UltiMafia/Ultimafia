const Card = require("../../Card");

module.exports = class ControlPuppet extends Card {
  constructor(role) {
    super(role);
  }

  speak(message) {
    if (message.abilityName != "Control Puppet") return;

    message.modified = true;

    const puppet = this.role.game.getPlayer(message.abilityTarget);
    message.sender = puppet;

    message.recipients = [];
    for (const player of message.game.players)
      if (player != puppet) message.recipients.push(player);

    message.parseForReview = this.parseForReview;
  }

  parseForReview(message) {
    message.recipients = message.versions["*"].recipients;

    const puppet = this.game.getPlayer(message.abilityTarget);
    message.prefix = `controlling ${puppet.name}`;

    return message;
  }
};
