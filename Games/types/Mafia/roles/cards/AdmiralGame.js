const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class AdmiralGame extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      ReplaceAlways: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;

        let players = this.game.players.filter(
          (p) => p.role.data.UnReplaceable != true
        );
        for (let x = 0; x < players.length; x++) {
          for (let item of players[x].items) {
            item.drop();
          }
          if(players[x].role.alignment == "Mafia" || players[x].role.alignment == "Cult"){
          this.game.AdmiralEvilRoles.push(`${players[x].role.name}:${players[x].role.modifier}`);
          }
          else{
            this.game.AdmiralGoodRoles.push(`${players[x].role.name}:${players[x].role.modifier}`);
          }
          players[x].setRole(
            `Survivor`
          );
    
        }

        
      },
    };
  }
};
