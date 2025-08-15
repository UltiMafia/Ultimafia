const Card = require("../../Card");

module.exports = class PublicReveal extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.revealed = true;
      for (let player of this.game.players) {
        if(player == this.player){
        continue;
        }
          this.player.role.revealToPlayer(player);  
      }
      //this.revealToAll();
      },
    };
  }
};
