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

    this.meetingMods = {
      "*": {
        shouldMeet: function (meetingName) {
          for(let w = 0; w<IMPORTANT_MEETINGS_NIGHT.length;w++){
            if(meetingName == IMPORTANT_MEETINGS_NIGHT[w] || !meetingName){
              return true;
            }
          }
          for(let w = 0; w<IMPORTANT_MEETINGS_DAY.length;w++){
            if(meetingName == IMPORTANT_MEETINGS_DAY[w] || !meetingName){
              return true;
            }
          }
          if (meetingName == "Graveyard") return true;

          return this.game.getStateInfo().id > 1;
        },
      },
    };
  }
};
