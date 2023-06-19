const Card = require("../../Card");

module.exports = class Lone extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      Mafia: {
        disabled: true,
      },
      Cult: {
        disabled: true,
      },
    };
  }
};
