const Card = require("../../Card");
const {
  IMPORTANT_MEETINGS_NIGHT,
  INVITED_MEETINGS,
  STARTS_WITH_MEETINGS,
  IMPORTANT_MEETINGS_DAY,
} = require("../../const/ImportantMeetings");

module.exports = class Even extends Card {
  constructor(role) {
    super(role);

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

          if(!this.meetings[meetingName]){
            return true;
          }

          return this.game.getStateInfo().dayCount % 2 == 0;
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        let shouldAct = stateInfo.dayCount % 2 == 0;
        // disable voting in mafia meeting
        if (this.meetings["Mafia"]) {
          this.meetings["Mafia"].canVote = shouldAct;
        }
      },
    };
  }
};
