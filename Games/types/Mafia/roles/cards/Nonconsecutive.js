const Card = require("../../Card");
const Action = require("../../Action");
const Player = require("../../../../core/Player");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");
const {
  IMPORTANT_MEETINGS_NIGHT,
  INVITED_MEETINGS,
  STARTS_WITH_MEETINGS,
  IMPORTANT_MEETINGS_DAY,
} = require("../../const/ImportantMeetings");

module.exports = class Nonconsecutive extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_NIGHT_ROLE_BLOCKER - 1,
          labels: ["block", "hidden", "absolute"],
          run: function () {
            if (!this.actor.hasAbility(["Modifier", "WhenDead", "Blocking"])) {
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
            for (let action of this.game.actions[0]) {
              if (action.hasLabel("absolute")) {
                continue;
              }
              if (action.hasLabel("mafia")) {
                continue;
              }
              if (action.hasLabel("hidden")) {
                continue;
              }

              let toCheck = action.target;
              if (!Array.isArray(action.target)) {
                toCheck = [action.target];
              }

              if (
                action.actors.indexOf(this.actor) != -1 &&
                !action.hasLabel("hidden") &&
                action.target &&
                toCheck[0] instanceof Player
              ) {
                for (let y = 0; y < toCheck.length; y++) {
                  if (visits.includes(toCheck[y])) {
                    if (
                      action.priority > this.priority &&
                      !action.hasLabel("absolute")
                    ) {
                      action.cancelActor(this.actor);
                      break;
                    }
                  }
                }
              }
            }
          },
        });

        this.game.queueAction(action);
      },
      /*
      meetingsMade: function () {


        this.player.getMeetings().forEach((meeting) => {
          if(meeting.name == "Village"){
            return;
          }
          if(IMPORTANT_MEETINGS_NIGHT.includes(meeting.name)){
            return;
          }
          if(IMPORTANT_MEETINGS_DAY.includes(meeting.name)){
            return;
          }
          if(INVITED_MEETINGS.includes(meeting.name)){
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
          if(meeting.inputType == "player"){
            let visits = [];
            let actionList = this.game.lastNightVisits;
            for (let action of actionList) {
              let toCheck1 = action.target;
              if (!Array.isArray(action.target)) {
                toCheck1 = [action.target];
              }

              if (
                action.actors.indexOf(this.player) != -1 &&
                !action.hasLabel("hidden") &&
                action.target &&
                toCheck1[0] instanceof Player
              ) {
                visits.push(...toCheck1);
              }
            }
            this.data.prevTargets = visits;
            if(meeting.targets["exclude"]){
            meeting.targets["exclude"].push(isOneOfPrevTarget);
            }
            else{
            meeting.targets["exclude"] = [isOneOfPrevTarget];
            }
            meeting.targetsDescription = null;
            meeting.generateTargets();
            for (let member of meeting.members) {
              member.player.sendMeeting(meeting);
            }
          }
        });

      },
      */
    };
  }
};

function isOneOfPrevTarget(player) {
  return this.role && this.role.data.prevTargets.includes(player);
}