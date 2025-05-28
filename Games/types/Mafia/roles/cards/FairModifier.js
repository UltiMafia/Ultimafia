const Card = require("../../Card");
const {
  IMPORTANT_MEETINGS_NIGHT,
  INVITED_MEETINGS,
  STARTS_WITH_MEETINGS,
  IMPORTANT_MEETINGS_DAY,
} = require("../../const/ImportantMeetings");

module.exports = class LimitedModifier extends Card {
  constructor(role) {
    super(role);
  
    this.listeners = {
            state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: null,
          target: this.player,
          game: this.player.game,
          priority:  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT -20,
          labels: ["block", "hidden", "absolute"],
          run: function () {
            if (!this.target.hasAbility(["Modifier", "WhenDead", "Blocking"])) {
              return;
            }
            let visits = [];
            let actionList = this.game.lastNightVisits;
            for (let action of actionList) {
              let toCheck1 = action.target;
              if (!Array.isArray(action.target)) {
                toCheck1 = [action.target];
              }

              if (
                action.actors.indexOf(this.actor) != -1 &&
                !action.hasLabel("hidden") &&
                action.target &&
                toCheck1[0] instanceof Player
              ) {
                visits.push(...toCheck1);
              }
            }
            
            this.actor.role.data.LimitedLastNightVisits = visits;
            if(this.actor.role.data.LimitedAllVisits == null){
              this.actor.role.data.LimitedAllVisits = visits;
            }
            else{
              this.actor.role.data.LimitedAllVisits = this.actor.role.data.LimitedAllVisits.concat(visits);
            }
          },
        });

        this.game.queueAction(action);
      },
      meetingsMade: function () {
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
          if(meeting.item != null){
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
          if (meeting.inputType == "player") {
            meeting.targets = { include: ["alive"], exclude: ["previousAll"] };
            meeting.targetsDescription = null;
            meeting.generateTargets();
            for (let member of meeting.members) {
              member.player.sendMeeting(meeting);
            }
          }
        });
      },
      
    };

    /*
    this.meetingMods = {
      "*": {
        targets: function (meetingName) {
          // core meetings

          if (meetingName == "Village")
            return { include: [canBeVoted], exclude: [cannotBeVoted] };
          if (meetingName == "Faction Kill" || !meetingName) {
            return {
              include: ["alive"],
              exclude: [excludeMafiaOnlyIfNotAnonymous],
            };
          }

          for (let w = 0; w < IMPORTANT_MEETINGS_NIGHT.length; w++) {
            if (meetingName == IMPORTANT_MEETINGS_NIGHT[w] || !meetingName) {
              return;
            }
          }

          for (let w = 0; w < INVITED_MEETINGS.length; w++) {
            if (meetingName == INVITED_MEETINGS[w]) {
              return;
            }
          }

          for (let w = 0; w < STARTS_WITH_MEETINGS.length; w++) {
            if (
              meetingName &&
              meetingName.startsWith(STARTS_WITH_MEETINGS[w])
            ) {
              return;
            }
          }

          for (let w = 0; w < IMPORTANT_MEETINGS_DAY.length; w++) {
            if (meetingName == IMPORTANT_MEETINGS_DAY[w]) {
              return;
            }
          }

          return { include: ["dead"], exclude: ["alive"] };
        },
      },
    };
    */
  }
};
/*
function isHost(player) {
  return player.role.name == "Host";
}

function excludeMafiaOnlyIfNotAnonymous(player) {
  let mafiaMeeting = player.game.getMeetingByName("Faction Kill");
  if (
    mafiaMeeting &&
    mafiaMeeting.anonymous &&
    FACTION_KILL.includes(player.faction)
  ) {
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
*/
