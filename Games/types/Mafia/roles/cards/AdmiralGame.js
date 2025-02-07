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
          (p) => p.role.data.UnReplaceable != true && p != this.player
        );
        for (let x = 0; x < players.length; x++) {
          for (let item of players[x].items) {
            item.drop();
          }
          if (
            players[x].role.alignment == "Mafia" ||
            players[x].role.alignment == "Cult"
          ) {
            this.game.AdmiralEvilRoles.push(
              `${players[x].role.name}:${players[x].role.modifier}`
            );
          } else if (
            players[x].role.name == "Admiral" ||
            players[x].role.name == "Grouch"
          ) {
          } else {
            this.game.AdmiralGoodRoles.push(
              `${players[x].role.name}:${players[x].role.modifier}`
            );
          }
          players[x].setRole(`Grouch`);
        }
        this.player.holdItem("TreasureChest", this.player);
      },
      death: function (player, killer, deathType, instant) {
        if (player.isEvil()) {
          this.game.queueAlert(`${player.name} had ${player.Gold} Gold Bars!`);
          this.player.Gold += player.Gold;
          player.Gold = 0;
          return;
        }
        if (deathType == "condemn") {
          this.player.role.data.FalseAdmiralCondemns += 1;
          this.player.queueAlert(`You Condemned an Innocent player!`);
          if (this.player.role.data.FalseAdmiralCondemns >= 2) {
            for (let p of this.game.alivePlayers()) {
              if (p.faction === this.player.faction) {
                p.kill("basic", this.player, instant);
              }
            }
          } else {
            this.player.queueAlert(
              `If You Condemn another Player who is Innocent, You will lose.`
            );
          }
        }
      },
    };
  }
};
