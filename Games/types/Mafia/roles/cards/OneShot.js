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
    this.isUsingOneShotNight = false;
    this.isUsingOneShotDay = false;
    this.role.OneShotMax = this.role.modifier.split("/").filter((m) => m == "X-Shot").length;

    this.meetings = {
      "X-Shot Night": {
        actionName: "Use Night Ability?",
        states: ["Night"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        whileDead: true,
        whileAlive: true,
        action: {
          role: this.role,
          labels: ["hidden", "absolute"],
          priority: 0,
          run: function () {
            if (this.target == "No") return;
            this.role.OneShotNight += 1;
            this.role.isUsingOneShotNight = true;
            this.actor.joinMeetings(this.role.meetings);
            for (let meeting of this.game.meetings){
               meeting.generateTargets();
            }
            this.actor.sendMeetings();
          },
        },
        shouldMeet() {
          return this.OneShotNight <= this.OneShotMax && !this.player.exorcised && !this.isUsingOneShotNight;
        },
      },
      "X-Shot Day": {
        actionName: "Use Day Ability?",
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        whileDead: true,
        whileAlive: true,
        action: {
          role: this.role,
          labels: ["hidden", "absolute"],
          priority: 0,
          run: function () {
            if (this.target == "No") return;

            this.role.OneShotDay += 1;
            this.role.isUsingOneShotDay = true;
            this.actor.joinMeetings(this.role.meetings);
            for (let meeting of this.game.meetings){
               meeting.generateTargets();
            }
            this.actor.sendMeetings();
          },
        },
        shouldMeet() {
          return this.OneShotDay <= this.OneShotMax && !this.player.exorcised && !this.isUsingOneShotDay;
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
            meetingName == "X-Shot Night" ||
            meetingName == "X-Shot Day"
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
            this.isUsingOneShotDay
          ) {
            return true;
          } else if (
            this.game.getStateName() == "Night" &&
            this.isUsingOneShotNight
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
        this.OneShotMax = this.modifier.split("/").filter((m) => m == "X-Shot").length;
        //this.game.queueAlert(`Night ${this.player.role.OneShotNight} Day ${this.player.role.OneShotDay} Max ${this.player.role.OneShotMax}`);
        if (stateInfo.name.match(/Day/)) {
          if (this.OneShotNight == this.OneShotMax && this.isUsingOneShotNight) {
            this.OneShotNight = this.OneShotMax+1;
            this.isUsingOneShotNight = false;
          }
          if(this.isUsingOneShotNight){
            this.isUsingOneShotNight = false;
          }
        }
        if (stateInfo.name.match(/Night/)) {
          
          if (this.OneShotDay == this.OneShotMax && this.isUsingOneShotDay) {
            this.OneShotDay = this.OneShotMax+1;
            this.isUsingOneShotDay = false;
          }
          if(this.isUsingOneShotDay){
            this.isUsingOneShotDay = false;
          }
        }
      },
    };
  }
};
