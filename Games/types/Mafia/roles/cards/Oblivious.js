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
      Faction: {
        disabled: true,
      },
      "Faction Fake": {
        disabled: true,
      },
      "Faction Kill": {
        disabled: true,
      },
    };

    this.oblivious = {
      self: true,
      Faction: true,
    };
  }
};
