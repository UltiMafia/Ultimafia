const Card = require("../../Card");

module.exports = class Odd extends Card {
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

          return this.game.getStateInfo().dayCount % 2 == 1;
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        let shouldAct = stateInfo.dayCount % 2 == 1;
        // disable voting in mafia meeting
        if (this.meetings["Mafia"]) {
          this.meetings["Mafia"].canVote = shouldAct;
        }
      },
    };
  }
};
