const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class LearnPossibleDeityIfKilledAtNight extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (player != this.player) return;

        if (killer.role.alignment == "Deity"){
          let otherPlayer = this.game.players.filter((p) => p != killer);
          var chosenTwo = [
            killer,
            Random.randArrayVal(otherPlayer),
          ];

          chosenTwo = Random.randomizeArray(chosenTwo);
          this.actor.queueAlert(`You learn that one of ${chosenTwo[0].name} and ${chosenTwo[1].name} is the Deity!`);
        }
      }
    }
  }
}
