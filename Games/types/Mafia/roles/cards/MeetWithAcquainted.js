const Card = require("../../Card");
const { MEETING_PRIORITY_SOCIAL } = require("../const/MeetingPriority");

module.exports = class MeetWithAcquainted extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Acquainted Meeting": {
        actionName: "End Acquainted Meeting?",
        states: ["Night"],
        flags: ["exclusive", "group", "speech", "voting", "mustAct", "noVeg"],
        priority: MEETING_PRIORITY_SOCIAL,
        inputType: "boolean",
      },
    };
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;

        for (let player of this.game.players) {
          if (
            player.role.modifier === "Acquainted" &&
            player !== this.player &&
            !player.role.oblivious["self"]
          ) {
            this.revealToPlayer(player);
          }
        }
      },
    };
  }
};
