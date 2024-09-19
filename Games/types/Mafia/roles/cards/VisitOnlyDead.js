const Card = require("../../Card");
const {
  IMPORTANT_MEETINGS_NIGHT,
  INVITED_MEETINGS,
  STARTS_WITH_MEETINGS,
  IMPORTANT_MEETINGS_DAY,
} = require("../../const/ImportantMeetings");

module.exports = class VisitOnlyDead extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      "*": {
        targets: function (meetingName) {
          // core meetings

          
          if (meetingName == "Village") return { include: [canBeVoted], exclude: [cannotBeVoted] };
          if (meetingName == "Faction Kill" || !meetingName){
            return {
              include: ["alive"],
              exclude: [excludeMafiaOnlyIfNotAnonymous],
            };
          }
         
          for(let w = 0; w<IMPORTANT_MEETINGS_NIGHT.length;w++){
            if(meetingName == IMPORTANT_MEETINGS_NIGHT[w] || !meetingName){
              return;
            }
          }

          for(let w = 0; w<INVITED_MEETINGS.length;w++){
            if(meetingName == INVITED_MEETINGS[w]){
              return;
            }
          }

          for(let w = 0; w<STARTS_WITH_MEETINGS.length;w++){
            if(meetingName && meetingName.startsWith(STARTS_WITH_MEETINGS[w])){
              return;
            }
          }

          for(let w = 0; w<IMPORTANT_MEETINGS_DAY.length;w++){
            if(meetingName == IMPORTANT_MEETINGS_DAY[w]){
              return;
            }
          }
         
         
         
         
         
          return { include: ["dead"], exclude: ["alive"] };
        },
      },
    };
  }
};

function isHost(player) {
  return player.role.name == "Host";
}

function excludeMafiaOnlyIfNotAnonymous(player) {
  let mafiaMeeting = player.game.getMeetingByName("Faction Kill");
  if (mafiaMeeting && mafiaMeeting.anonymous && FACTION_KILL.includes(player.faction)) {
    return false;
  }

  if (player.faction && FACTION_KILL.includes(player.faction)) {
    return true;
  }
}
function cannotBeVoted(player) {
  return player.hasEffect("CannotBeVoted");
}
function canBeVoted(player) {
  return (
    player.alive ||
    (!player.alive && !player.exorcised && player.game.ExorciseVillageMeeting)
  );
}
