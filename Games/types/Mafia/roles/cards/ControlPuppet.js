const Card = require("../../Card");

module.exports = class ControlPuppet extends Card {
  constructor(role) {
    super(role);
    this.listeners = {
      state: function (stateInfo) {
        let ability = {
          name: "Control Puppet",
          targetsDescription: { include: ["all"], exclude: ["self"] },
          targetType: "player",
          verb: "",
        };

        for (let item of this.player.items) {
          if (item.name == "OverturnSpectator") {
            item.meetings["Overturn Vote"].speechAbilities = [ability];
          }
           if (item.name == "Room" && item.Room && item.Room.name) {
            item.meetings[item.Room.name].speechAbilities = [ability];
          }
        }
      },
    };
  }

  speak(message) {
    if (message.abilityName != "Control Puppet") return;

    message.modified = true;

    let puppet = this.role.game.getPlayer(message.abilityTarget);
    message.sender = puppet;

    message.recipients = [];
    for (let player of message.game.players)
      if (player != puppet) message.recipients.push(player);

    message.parseForReview = this.parseForReview;
  }

  parseForReview(message) {
    message.recipients = message.versions["*"].recipients;

    let puppet = this.game.getPlayer(message.abilityTarget);
    message.prefix = `controlling ${puppet.name}`;

    return message;
  }
};
