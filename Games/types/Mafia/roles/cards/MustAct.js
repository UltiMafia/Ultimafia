const Card = require("../../Card");
const {
  IMPORTANT_MEETINGS_NIGHT,
  INVITED_MEETINGS,
  STARTS_WITH_MEETINGS,
  IMPORTANT_MEETINGS_DAY,
} = require("../../const/ImportantMeetings");

module.exports = class MustAct extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
       playerHasJoinedMeetings: function (player) {
        if(player != this.player){
          return;
        }
        this.player.getMeetings().forEach((meeting) => {
          if (meeting.name == "Village") {
            return;
          }
          if (IMPORTANT_MEETINGS_NIGHT.includes(meeting.name)) {
            return;
          }
          if (IMPORTANT_MEETINGS_DAY.includes(meeting.name)) {
            return;
          }
          if (INVITED_MEETINGS.includes(meeting.name)) {
            return;
          }
          for (let w = 0; w < STARTS_WITH_MEETINGS.length; w++) {
            if (
              meeting.name &&
              meeting.name.startsWith(STARTS_WITH_MEETINGS[w])
            ) {
              return;
            }
          }
          meeting.mustAct = true;
          meeting.generateTargets();
          for (let member of meeting.members) {
            member.player.sendMeeting(meeting);
          }
        });
        /*
        for(let meeting of this.player.getMeetings()){
          if(meeting.name == "Village"){
            continue;
          }
          if(IMPORTANT_MEETINGS_NIGHT.includes(meeting.name)){
            continue;
          }
          if(IMPORTANT_MEETINGS_DAY.includes(meeting.name)){
            continue;
          }
          if(INVITED_MEETINGS.includes(meeting.name)){
            continue;
          }
          for (let w = 0; w < STARTS_WITH_MEETINGS.length; w++) {
            if (
              meeting.name &&
              meeting.name.startsWith(STARTS_WITH_MEETINGS[w])
            ) {
              continue;
            }
          }
          this.game.queueAlert(`Meeting ${meeting.name}`);
          if(meeting.inputType == "player"){
            meeting.targets = { include: ["dead"], exclude: ["alive"] };
            meeting.targetsDescription = null;
            meeting.generateTargets();
          }
          


          
        }
          */
      },
    };
  }
};
