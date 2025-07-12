const Card = require("../../Card");

module.exports = class RevealToVillage extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        for (let player of this.game.players) {
        if(player == this.player){
        continue;
        }
        if (player.faction == "Village") {
          this.player.role.revealToPlayer(player);
        }
      }
      },
    };
  }
};
