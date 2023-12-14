const Card = require("../../Card");
const { PRIORITY_REVEAL_DEFAULT } = require("../../const/Priority");

module.exports = class RevealTargetOnDeath extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Reveal on Death": {
        actionName: "Reveal on Death",
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_REVEAL_DEFAULT,
          run: function () {
            this.actor.role.data.playerToReveal = this.target;
          },
        },
      },
    };
    this.listeners = {
      death: function (player, killer, deathType) {
        if (player == this.player && this.data.playerToReveal)
          this.data.playerToReveal.role.revealToAll();
      },
    };
    this.copyableListeners = {
      death: this,
    };
  }
};
