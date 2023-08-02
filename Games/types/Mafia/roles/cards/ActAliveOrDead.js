const Card = require("../../Card");

module.exports = class ActAliveOrDead extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
        "*": {
          whileDead: true,
          whileAlive: true,
        },
      };
  }
};
