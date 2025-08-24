const Card = require("../../Card");
const { MEETING_PRIORITY_DAY } = require("../../const/MeetingPriority");

module.exports = class DaySantista extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.meetingName = "Day Meeting with " + this.player.faction;
        this.meetings[this.data.meetingName] =
          this.meetings["DayMeetingPlaceholder"];
        delete this.meetings["DayMeetingPlaceholder"];

        for (let p of this.game.alivePlayers()) {
          if (p.faction == this.player.faction) {
            p.holdItem("DayMeeting", this.role.data.meetingName);
          }
        }
      },
      death: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let p of this.game.alivePlayers()) {
          if (p.faction == this.player.faction && p.role == "Santista") {
            return;
          }
        }

        for (let p of this.game.alivePlayers()) {
          if (p.faction == this.player.faction) {
            p.dropItem("DayMeeting", this.role.data.meetingName);
          }
        }
      },
    };

    this.meetings = {
      DayMeetingPlaceholder: {
        meetingName: "Day Meeting",
        actionName: "End Day Meeting?",
        states: ["Day"],
        flags: ["group", "speech", "voting"],
        inputType: "boolean",
        priority: MEETING_PRIORITY_DAY,
        shouldMeet: function () {
          for (let player of this.game.players)
            if (
              player.hasItemProp(
                "DayMeeting",
                "meetingName",
                this.data.meetingName
              )
            ) {
              return true;
            }

          return false;
        },
      },
    };
  }
};