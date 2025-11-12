const Card = require("../../Card");
const Action = require("../../Action");
const Player = require("../../Player");
const {
  IMPORTANT_MEETINGS_NIGHT,
  INVITED_MEETINGS,
  STARTS_WITH_MEETINGS,
  IMPORTANT_MEETINGS_DAY,
} = require("../../const/ImportantMeetings");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class Consecutive extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        state: "Night",
        actor: null,
        target: role.player,
        game: role.player.game,
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 20,
        labels: ["block", "hidden", "absolute"],
        role: role,
        run: function () {
            let visits = [];
            let actionList = this.game.actions[0];
            for (let action of actionList) {
              let toCheck1 = action.target;
              if (!Array.isArray(action.target)) {
                toCheck1 = [action.target];
              }

              if (
                action.actors.indexOf(this.target) != -1 &&
                !action.hasLabel("hidden") &&
                action.target &&
                toCheck1[0] instanceof Player
              ) {
                visits.push(...toCheck1);
              }
            }

            this.target.role.data.LimitedLastNightVisits = visits;
            if (this.target.role.data.LimitedAllVisits == null) {
              this.target.role.data.LimitedAllVisits = visits;
            } else {
              this.target.role.data.LimitedAllVisits =
                this.target.role.data.LimitedAllVisits.concat(visits);
            }
          },
      },
    ];

    this.listeners = {
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
          if (meeting.item != null) {
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
            this.player.customizeMeetingTargets(meeting);
          }
        });
      },
    };
  }
};
