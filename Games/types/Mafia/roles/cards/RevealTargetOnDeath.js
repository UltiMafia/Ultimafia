const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
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
        if (player == this.player && this.data.playerToReveal){

              if(this.player.hasEffect("FalseMode")){
              let wrongPlayers = this.game.alivePlayers().filter((p) => p.role.alignment != this.target.role.alignment);
              let wrongPlayer = Random.randArrayVal(wrongPlayers);
              this.data.playerToReveal.setTempAppearance("reveal", wrongPlayer.role);
              }
          
          this.data.playerToReveal.role.revealToAll();
        }
      },
    };
    this.copyableListeners = {
      death: this,
    };
  }
};
