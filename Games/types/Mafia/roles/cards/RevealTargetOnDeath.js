const Card = require("../../Card");
const { PRIORITY_REVEAL_TARGET_ON_DEATH } = require("../../const/Priority");

module.exports = class RevealTargetOnDeath extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Reveal on Death (no visit)": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_REVEAL_TARGET_ON_DEATH,
          run() {
            this.actor.role.data.playerToReveal = this.target;
          },
        },
      },
    };
    this.listeners = {
      death(player, killer, deathType) {
        if (player == this.player && this.data.playerToReveal)
          this.data.playerToReveal.role.revealToAll();
      },
    };
    this.stealableListeners = {
      death: this,
    };
  }
};
