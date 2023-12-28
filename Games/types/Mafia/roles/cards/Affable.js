const Card = require("../../Card");
const { MEETING_PRIORITY_AFFABLE } = require("../../const/MeetingPriority");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Gregarious extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.meetingNumber = 1;

        this.data.meetingName = `Hangout with ${this.player.name} ${this.data.meetingNumber}`;
        this.meetings[this.data.meetingName] =
          this.meetings["HangoutPlaceholder"];
        delete this.meetings["HangoutPlaceholder"];
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

          let visits = this.getVisits(this.actor);
          visits.map((v) => v.holdItem("SecretHandshake", this.actor.role.data.meetingName));
          this.actor.holdItem("SecretHandshake", this.actor.role.data.meetingName);
          this.actor.role.data.meetingNumber += 1;
        },
      },
    ];
  }
};
