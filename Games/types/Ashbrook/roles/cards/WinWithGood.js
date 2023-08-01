const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithGood extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        let leaderCount = counts["Leader"] || 0;

        let leaderDead = this.game.deadPlayers().filter((p) => p.role.alignment == "Leader").length > 0
        
        if (this.game.shadow){
          let shadowsAlive = this.game.shadow.filter((p) => p.alive);
          if (shadowsAlive.length == 2) return;
        }
        
        if (leaderCount == 0 && leaderDead){
          winners.addPlayer(this.player, "Good");
        }
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player.role.name != "Hitman") return;
        if (this.player.role.alignment !== "Outcast") return;

        let doneCharacters = [];
        if (player.hasEffect("Insanity")){
          let randomOutcast = Random.randArrayVal(this.game.allCharactersByAlignment["Outcast"]);
          while (randomOutcast in doneCharacters){
            randomOutcast = Random.randArrayVal(this.game.allCharactersByAlignment["Outcast"]);
          }
          player.queueAlert(`You learn that there is a ${randomOutcast} in play!`);
        } else {
          player.queueAlert(`You learn that there is a ${this.player.role.name} in play!`);
        }
      }
    }
  }
};
