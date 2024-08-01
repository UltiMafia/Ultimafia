const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class SilencePuppet extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Silence: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          labels: ["effect", "silence"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.dominates()) {
              this.target.giveEffect("Silenced", 1);
              this.actor.role.data.puppetTarget = this.target;
            }
          },
        },
      },
    };
  }

  speak(message) {
    if (message.abilityName != "Speak as") return;

    message.modified = true;
    let puppet;
    if (this.player.role.data.puppetTarget) {
      puppet = this.player.role.data.puppetTarget;
    } else {
      puppet = this.player;
    }
    message.sender = puppet;

    message.recipients = [];
    for (let player of message.game.players)
      if (player != puppet) message.recipients.push(player);

    message.parseForReview = this.parseForReview;
  }

  parseForReview(message) {
    message.recipients = message.versions["*"].recipients;

    //let puppet = this.game.getPlayer(message.abilityTarget);
    let puppet;
    if (this.player.role.data.puppetTarget) {
      puppet = this.player.role.data.puppetTarget;
    } else {
      puppet = this.player;
    }
    message.prefix = `controlling ${puppet.name}`;

    return message;
  }
};
