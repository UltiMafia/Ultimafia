const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_ITEM_GIVER_DEFAULT,
  PRIORITY_ITEM_GIVER_EARLY,
  PRIORITY_ITEM_TAKER_DEFAULT,
  PRIORITY_ITEM_TAKER_EARLY,
} = require("../../const/Priority");
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

        if (!this.hasAbility(["Meeting"])) {
          return;
        }

        var action1 = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          labels: ["giveItem", "hidden"],
          role: this.role,
          run: function () {
            let alignedPlayers = this.game.alivePlayers().filter((p) => p.role.alignment == this.actor.alignment);
            alignedPlayers.map((p) => p.holdItem("DayMeeting", this.role.data.meetingName));
          },
        });

        this.game.queueAction(action1);
      },
      death: function (player) {
        if (player !== this.player) {
          return;
        }

        for (let p of this.game.alivePlayers()) {
          if (p.alignment == this.player.alignment && p.role == "Santista") {
            return;
          }
        }

        var action2 = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_ITEM_GIVER_DEFAULT + 1,
          labels: ["giveItem", "hidden"],
          role: this.role,
          run: function () {
            let alignedPlayers = this.game.alivePlayers().filter((p) => p.role.alignment == this.actor.alignment);
            alignedPlayers.map((p) => p.dropItem("DayMeeting", this.role.data.meetingName));
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