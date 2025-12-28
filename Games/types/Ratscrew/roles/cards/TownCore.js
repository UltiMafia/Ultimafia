const Card = require("../../Card");

module.exports = class TownCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      [this.role.game.chatName]: {
        states: ["Play Cards", "Call Lie", "Slap"],
        flags: ["group", "speech"],
        whileDead: true,
        passiveDead: true,
        speakDead: true,
      },
    };
  }
};
