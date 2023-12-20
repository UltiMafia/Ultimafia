const Card = require("../../Card");

module.exports = class MeetWithAcquainted extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Acquainted Gathering": {
        actionName: "End Acquainted Gathering?",
        states: ["Night"],
        flags: ["group", "speech", "voting", "mustAct", "noVeg"],
        inputType: "boolean",
      },
    };
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;

        for (let player of this.game.players) {
          let modifiers = player.role.modifier;
          if (
            player !== this.player &&
            modifiers.match(/Acquainted/) &&
            !player.role.oblivious["self"]
          ) {
            this.revealToPlayer(player);
          }
        }
      },
    };
  }
};
