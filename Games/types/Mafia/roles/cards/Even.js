const Card = require("../../Card");

module.exports = class Even extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      "*": {
        shouldMeet(meetingName) {
          if (
            meetingName == "Village" ||
            meetingName == "Mafia" ||
            meetingName == "Monsters" ||
            meetingName == "Graveyard"
          )
            return true;

          return this.game.getStateInfo().dayCount % 2 == 0;
        },
      },
    };
  }
};
