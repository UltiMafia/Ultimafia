const Card = require("../../Card");
const {
  IMPORTANT_MEETINGS_NIGHT,
  INVITED_MEETINGS,
  STARTS_WITH_MEETINGS,
  IMPORTANT_MEETINGS_DAY,
} = require("../../const/ImportantMeetings");

module.exports = class OneShot extends Card {
  constructor(role) {
    super(role);

    this.role.OneShotNight = 0;
    this.role.OneShotDay = 0;

    this.meetings = {
      "One Shot Night": {
        actionName: "Use Night Ability?",
        states: ["Dusk"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          labels: ["hidden", "absolute"],
          priority: 0,
          run: function () {
            if (this.target == "No") return;

            this.actor.role.OneShotNight = 1;
          },
        },
        shouldMeet() {
          return this.OneShotNight == 0;
        },
      },
      "One Shot Day": {
        actionName: "Use Day Ability?",
        states: ["Dawn"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          labels: ["hidden", "absolute"],
          priority: 0,
          run: function () {
            if (this.target == "No") return;

            this.actor.role.OneShotDay = 1;
          },
        },
        shouldMeet() {
          return this.OneShotDay == 0;
        },
      },
    };

    role.metCount = {};
    this.meetingMods = {
      "*": {
        shouldMeetOneShot: function (meetingName) {
          // core meetings
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
          if (
            meetingName == "One Shot Night" ||
            meetingName == "One Shot Day"
          ) {
            return true;
          }
          if (meetingName == "Graveyard") return true;

          // meetings invited by others
          for (let w = 0; w < INVITED_MEETINGS.length; w++) {
            if (meetingName == INVITED_MEETINGS[w]) {
              return true;
            }
          }

          for (let w = 0; w < STARTS_WITH_MEETINGS.length; w++) {
            if (
              meetingName &&
              meetingName.startsWith(STARTS_WITH_MEETINGS[w])
            ) {
              return true;
            }
          }

          if (
            this.game.getStateName() == "Day" &&
            this.player.role.OneShotDay == 1
          ) {
            return true;
          } else if (
            this.game.getStateName() == "Night" &&
            this.player.role.OneShotNight == 1
          ) {
            return true;
          }

          return false; //(this.metCount[`meets:${meetingName}`] || 0) < 1;
        },
      },
    };
    this.listeners = {
      meeting: function (meeting) {
        if (!meeting.members[this.player.id]) return;

        if (!this.metCount[`meets:${meeting.name}`])
          this.metCount[`meets:${meeting.name}`] = 1;
        else this.metCount[`meets:${meeting.name}`]++;
      },
      state: function (stateInfo) {
        //this.game.queueAlert(`Night ${this.player.role.OneShotNight} Day ${this.player.role.OneShotDay}`);
        if (stateInfo.name.match(/Day/)) {
          if (this.player.role.OneShotNight == 1) {
            this.player.role.OneShotNight = 2;
          }
        }
        if (stateInfo.name.match(/Night/)) {
          if (this.player.role.OneShotDay == 1) {
            this.player.role.OneShotDay = 2;
          }
        }
      },
    };
  }
};
