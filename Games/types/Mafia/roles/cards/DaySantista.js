const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");
const { MEETING_PRIORITY_DAY } = require("../../const/MeetingPriority");

module.exports = class DaySantista extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.meetingName = this.alignment + "Day Meeting";
        this.meetings[this.data.meetingName] =
          this.meetings["DayMeetingPlaceholder"];
        delete this.meetings["DayMeetingPlaceholder"];

        if (!this.hasAbility(["Meeting"])) {
          return;
        }

        var action1 = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_DAY_DEFAULT,
          labels: ["giveItem", "hidden"],
          role: this.role,
          run: function () {
            for (let p of this.game.alivePlayers()) {
              if (p.role.alignment == this.role.alignment) {
                p.holdItem("DayMeeting", this.role.data.meetingName)
                // p.queueAlert(`The ${this.role.data.meetingName} day meeting has begun.`);
              }
            }
          },
        });

        this.game.queueAction(action1);
      },
      death: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let p of this.game.alivePlayers()) {
          if (p.role.alignment == this.player.role.alignment && p.role == "Santista") {
            return;
          }
        }

        var action2 = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_DAY_DEFAULT,
          labels: ["dropItem", "hidden"],
          role: this.role,
          run: function () {
            for (let p of this.game.alivePlayers()) {
              if (p.role.alignment == this.role.alignment) {
                p.dropItem("DayMeeting", this.role.data.meetingName)
                // p.queueAlert(`The ${this.role.data.meetingName} day meeting has ended.`);
              }
            }
          },
        });

        this.game.queueAction(action2);
      },
    };

    this.meetings = {
      DayMeetingPlaceholder: {
        meetingName: "Day Meeting",
        // actionName: "End Day Meeting?",
        states: ["Day"],
        // flags: ["group", "speech", "voting"],
        flags: ["group", "speech"],
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