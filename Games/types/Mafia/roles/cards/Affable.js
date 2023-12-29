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
            let meetingName = "Hangout with " + this.target.name + " and " + this.actor.name;
            this.actor.role.meetings[meetingName] = this.actor.role.meetings["HangoutPlaceholder"];
            target.holdItem("SecretHandshake", meetingName);
            this.actor.holdItem("SecretHandshake", meetingName);
          }
        },
      },
    ];
  }
};
