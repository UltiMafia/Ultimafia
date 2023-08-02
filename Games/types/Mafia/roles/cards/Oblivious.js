const Card = require("../../Card");

module.exports = class Oblivious extends Card {
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

    this.oblivious = {
      self: true,
      Mafia: true,
      Cult: true,
    };
  }
};
