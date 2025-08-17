const Card = require("../../Card");
const {
  IMPORTANT_MEETINGS_NIGHT,
  INVITED_MEETINGS,
  STARTS_WITH_MEETINGS,
  IMPORTANT_MEETINGS_DAY,
} = require("../../const/ImportantMeetings");

module.exports = class Delayed extends Card {
  constructor(role) {
    super(role);
    this.role.DelayedMax = this.role.modifier
      .split("/")
      .filter((m) => m == "Delayed").length;

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

          return this.game.getStateInfo().dayCount > this.DelayedMax;
        },
      },
    };
  }
};
