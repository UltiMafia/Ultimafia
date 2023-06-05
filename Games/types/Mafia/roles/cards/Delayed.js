const Card = require("../../Card");

module.exports = class Delayed extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      "*": {
        shouldMeet: function (meetingName) {
          if (
            meetingName == "Village" ||
            meetingName == "Mafia" ||
            meetingName == "Monsters" ||
            meetingName == "Graveyard"
          )
            return true;

          return this.game.getStateInfo().id > 1;
        },
      },
    };
  }
};
