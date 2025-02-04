const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class AdmiralGame extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      ReplaceAlways: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;
        this.player.role.data.FalseAdmiralCondemns = 0;
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
      death: function (player, killer, deathType) {
        if (player.Gold > 0) {
          this.player.queueAlert(
            `${player.name} had ${player.Gold} Gold Bars!`
          );
          this.player.Gold += player.Gold;
          player.Gold = 0;
          return;
        }
        if(deathType == "Condemn"){
          this.player.role.data.FalseAdmiralCondemns += 1;
          this.player.queueAlert(
            `You Condemned a Player who didn't steal any Gold from You!`
          );
          if(this.player.role.data.FalseAdmiralCondemns >= 2){
            this.player.kill("basic", this.player, instant);
          }
          else{
            this.player.queueAlert(
            `If You Condemn another Player who didn't steal any Gold from You, You will die.`
          );
          }
        }
      },
    };
  }
};
