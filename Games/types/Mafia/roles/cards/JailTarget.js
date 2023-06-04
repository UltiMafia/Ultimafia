const Card = require("../../Card");
const {
  PRIORITY_DAY_DEFAULT,
  PRIORITY_KILL_DEFAULT,
} = require("../../const/Priority");
const { MEETING_PRIORITY_JAIL } = require("../../const/MeetingPriority");

module.exports = class JailTarget extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.meetingName = "Jail with " + this.player.name;
        this.meetings[this.data.meetingName] = this.meetings["JailPlaceholder"];
        delete this.meetings["JailPlaceholder"];
      },
    };

    this.meetings = {
      "Jail Target": {
        states: ["Day"],
        flags: ["voting"],
        action: {
          labels: ["jail"],
          priority: PRIORITY_DAY_DEFAULT,
          run: function () {
            if (this.dominates()) {
              this.target.holdItem(
                "Handcuffs",
                this.actor.role.data.meetingName,
                this.actor
              );
              this.actor.role.data.prisoner = this.target;
            }
          },
        },
      },
      JailPlaceholder: {
        meetingName: "Jail",
        actionName: "Execute Prisoner",
        states: ["Night"],
        flags: ["exclusive", "group", "speech", "voting", "anonymous"],
        inputType: "boolean",
        leader: true,
        priority: MEETING_PRIORITY_JAIL,
        shouldMeet: function () {
          for (let player of this.game.players) {
            if (
              player.alive &&
              player.hasItemProp(
                "Handcuffs",
                "meetingName",
                this.data.meetingName
              )
            ) {
              return true;
            }
          }

          return false;
        },
        action: {
          labels: ["kill", "jail"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            var prisoner = this.actor.role.data.prisoner;

            if (!prisoner) return;

            if (this.target == "Yes" && this.dominates(prisoner))
              prisoner.kill("basic", this.actor);
          },
        },
      },
    };
  }
};
