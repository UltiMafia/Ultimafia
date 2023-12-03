const Card = require("../../Card");

module.exports = class ActAliveOrDead extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      "*": {
        whileDead: function (meetingName) {
          // core meetings
          if (
            meetingName == "Village" ||
            meetingName == "Mafia" ||
            meetingName == "Cult"
          )
            return false;

          // meetings invited by others
          if (
            meetingName == "Party!" ||
            meetingName == "Hot Springs" ||
            meetingName == "Banquet" ||
            meetingName.startsWith("Jail with") ||
            meetingName.startsWith("Seance with")
          ) {
            return false;
          } else return true;
        },
        whileAlive: function (meetingName) {
          if (meetingName == "Graveyard") return false;
          else return true;
        },
      },
    };
  }
};
