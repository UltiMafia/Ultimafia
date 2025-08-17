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
      state: function (stateInfo) {
        if (!this.hasAbility(["Meeting", "Kill"])) {
          return;
        }

        if (stateInfo.name.match(/Day/)) {
          this.hasBeenDay = true;
          return;
        }
      },
      meetingsMade: function () {
        if (this.game.getStateName() == "Night") {
          this.data.jailSuccess = false;
          let jailMeeting = this.game.getMeetingByName(this.data.meetingName);
          if (jailMeeting && jailMeeting.hasJoined(this.data.prisoner)) {
            this.data.jailSuccess = true;
          }
        }
      },
    };

    this.stateMods = {
      Day: {
        type: "delayActions",
        delayActions: true,
      },
      /*
      Overturn: {
        type: "delayActions",
        delayActions: true,
      },
      Court: {
        type: "delayActions",
        delayActions: true,
      },
      Jailing: {
        type: "add",
        index: 5,
        length: 1000 * 30,
        shouldSkip: function () {
          if (!this.player.alive) {
            return true;
          }
          for (let action of this.game.actions[0]) {
            if (action.hasLabel("condemn")) {
              return true;
            }
          }
          return false;
        },
      },
      */
    };

    this.meetings = {
      "Jail Target": {
        states: ["Dusk"],
        flags: ["voting"],
        shouldMeet: function () {
          if (
            !this.hasAbility(["Meeting", "Kill"]) ||
            this.hasBeenDay != true
          ) {
            return false;
          }
          for (let action of this.game.actions[0]) {
            if (action.hasLabel("condemn")) {
              return false;
            }
          }
          return true;
        },
        action: {
          role: this.role,
          labels: ["jail"],
          priority: PRIORITY_DAY_DEFAULT,
          run: function () {
            if (!this.role.hasAbility(["Meeting", "Jail"])) {
              return;
            }
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
        displayOptions: {
          disableShowDoesNotVote: true,
        },
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

            //let jailMeeting = this.actor.role.data.jailMeeting;
            //if (!jailMeeting.hasJoined(prisoner)) return;
            if (this.actor.role.data.jailSuccess == false) return;

            if (this.target === "Yes" && this.dominates(prisoner)) {
              prisoner.kill("basic", this.actor);
            }
          },
        },
      },
    };
  }
};
