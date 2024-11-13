const Card = require("../../Card");
const {
  IMPORTANT_MEETINGS_NIGHT,
  INVITED_MEETINGS,
  STARTS_WITH_MEETINGS,
  IMPORTANT_MEETINGS_DAY,
} = require("../../const/ImportantMeetings");

module.exports = class Suspended extends Card {
  constructor(role) {
    super(role);
    if (this.role.SuspendedDate == null || this.role.SuspendedDate <= 0) {
      this.role.SuspendedDate = 1;
    } else {
      this.role.SuspendedDate = this.role.SuspendedDate + 1;
    }

    this.meetingMods = {
      "*": {
        shouldMeetMod: function (meetingName) {
          for (let w = 0; w < IMPORTANT_MEETINGS_NIGHT.length; w++) {
            if (meetingName == IMPORTANT_MEETINGS_NIGHT[w] || !meetingName) {
              return true;
            }
          }
          for (let w = 0; w < IMPORTANT_MEETINGS_DAY.length; w++) {
            if (meetingName == IMPORTANT_MEETINGS_DAY[w] || !meetingName) {
              return true;
            }
          }
          if (meetingName == "Graveyard") return true;

          return this.game.getStateInfo().id <= this.player.role.SuspendedDate;
        },
      },
    };
  }
};
