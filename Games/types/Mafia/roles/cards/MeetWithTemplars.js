const Card = require("../../Card");

module.exports = class MeetWithTemplars extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Templar Meeting": {
        actionName: "End Templar Meeting?",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct", "noVeg"],
        inputType: "boolean",
      },
    };
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;

        for (let player of this.game.players) {
          if (
            player.role.name === "Templar" &&
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
