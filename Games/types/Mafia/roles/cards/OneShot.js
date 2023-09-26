const Card = require("../../Card");

module.exports = class OneShot extends Card {
  constructor(role) {
    super(role);

    role.metCount = {};
    this.meetingMods = {
      "*": {
        shouldMeet: function (meetingName) {
          // core meetings
          if (
            meetingName == "Village" ||
            meetingName == "Mafia" ||
            meetingName == "Cult" ||
            meetingName == "Graveyard"
          )
            return true;

          // meetings invited by others
          if (
            meetingName == "Party!" ||
            meetingName == "Banquet" ||
            meetingName.startsWith("Jail with") ||
            meetingName.startsWith("Seance with")
          ) {
            return true;
          }

          return (this.metCount[`meets:${meetingName}`] || 0) < 1;
        },
      },
    };
    this.listeners = {
      meeting: function (meeting) {
        if (!meeting.members[this.player.id]) return;

        if (!this.metCount[`meets:${meeting.name}`])
          this.metCount[`meets:${meeting.name}`] = 1;
        else this.metCount[`meets:${meeting.name}`]++;
      },
    };
  }
};
