const Card = require("../../Card");
const { MEETING_PRIORITY_AFFABLE } = require("../../const/MeetingPriority");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Affable extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.meetingNumber = 1;

        this.data.meetingName = "Hangout " + this.data.meetingNumber + " " + this.player.name;
      },
    };

    this.meetings = {
      HangoutPlaceholder: {
        meetingName: "Hangout",
        actionName: "End Hangout Meeting?",
        states: ["Night"],
        flags: [
          "group",
          "speech",
          "voting",
          "mustAct",
          "noVeg",
        ],
        inputType: "boolean",
        priority: MEETING_PRIORITY_AFFABLE,
        shouldMeet: function () {
          for (let player of this.game.players)
            if (
              player.hasItemProp("SecretHandshake", "meetingName", this.data.meetingName)
            ) {
              return true;
            }

          return false;
        },
      },
    };
    this.actions = [
      {
        priority: PRIORITY_ITEM_GIVER_DEFAULT,
        labels: ["giveItem", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          let targets = this.getVisits(this.actor);

          for (let target of targets) {
            this.actor.role.data.meetingNumber = this.actor.role.data.meetingNumber + 1;
            target.holdItem("SecretHandshake", this.actor.role.data.meetingName);
            this.actor.holdItem("SecretHandshake", this.actor.role.data.meetingName);
          }
        },
      },
    ];
  }
};
