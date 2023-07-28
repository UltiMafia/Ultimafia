const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class LearnCondemnedRoles extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType, instant){
        if (!this.player.alive) return;
        if (this.player == player) return;

        let roleName;
        if (this.player.hasEffect("Insanity")){
          roleName = player.role.name;
        } else {
          roleName = Random.randArrayVal(this.game.allCharacters);
        }

        if (deathType == "condemn"){
          this.player.queueAlert(`:invest: You learn that ${player.name}'s role is ${roleName}.`);
        }
      }
    }
  }
};
