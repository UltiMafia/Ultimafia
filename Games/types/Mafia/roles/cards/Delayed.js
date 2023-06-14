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
            meetingName == "Cult" ||
            meetingName == "Graveyard"
          )
            return true;

          return this.game.getStateInfo().id > 1;
        },
      },
    };
  }
};
