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
          
        
        //this.meetings[this.data.meetingName] = this.meetings["JailPlaceholder"];
        //delete this.meetings["JailPlaceholder"];
      },
      state: function () {
        if(!this.data.meetingName){
        this.data.meetingName = "Jail with " + this.player.name;
        this.data.meetingName = "Jail with " + this.player.name;
        this.meetings[this.data.meetingName] = this.meetings["JailPlaceholder"];
        delete this.meetings["JailPlaceholder"];
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


    this.meetings = {
      "Jail Target": {
        states: ["Dusk"],
        flags: ["voting"],
        shouldMeet: function () {
          if (
            !this.hasAbility(["Meeting", "Kill"])
          ) {
            return false;
          }
          for (let action of this.game.actions[0]) {
            if (action.hasLabel("condemn")) {
              this.player.sendAlert("condemn is true");
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
            this.actor.sendAlert("JailPlaceholder Found "+this.role.data.meetingName);
            if (this.dominates()) {
              this.target.holdItem(
                "Handcuffs",
                this.role.data.meetingName,
                this.actor
              );
              this.role.data.prisoner = this.target;
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
          role: this.role,
          run: function () {
            var prisoner = this.role.data.prisoner;

            if (!prisoner) return;

            //let jailMeeting = this.actor.role.data.jailMeeting;
            //if (!jailMeeting.hasJoined(prisoner)) return;
            if (this.role.data.jailSuccess == false) return;

            if (this.target === "Yes" && this.dominates(prisoner)) {
              prisoner.kill("basic", this.actor);
            }
          },
        },
      },
    };
  }
};
