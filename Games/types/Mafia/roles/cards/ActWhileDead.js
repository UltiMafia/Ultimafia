const Card = require("../../Card");

module.exports = class ActWhileDead extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
        "*": {
          whileDead: true,
          whileAlive: false,
        },
      };
  }
};
