const Card = require("../../Card");

module.exports = class VisitOnlyDead extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
        "*": {
            targets: function (meetingName) {
          // core meetings
          if (
            meetingName == "Village" ||
            meetingName == "Mafia" ||
            meetingName == "Cult" ||
            meetingName == "Graveyard"
          )
            return;

          // meetings invited by others
          if (
            meetingName == "Party!" ||
            meetingName == "Hot Springs" ||
            meetingName == "Banquet" ||
            meetingName.startsWith("Jail with") ||
            meetingName.startsWith("Seance with")
          ) {
            return;
          }

          else include: ["dead"]; exclude: ["alive", "self"] },
        },
      };
  }
};
