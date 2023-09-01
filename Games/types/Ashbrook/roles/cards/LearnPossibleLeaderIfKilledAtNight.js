const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class LearnPossibleLeaderIfKilledAtNight extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (player != this.player) return;

        if (killer.role.alignment == "Leader"){
          let otherPlayer = this.game.players.filter((p) => p != killer);
          var chosenTwo = [
            killer,
            Random.randArrayVal(otherPlayer),
          ];

          if (this.player.hasEffect("Insanity")){
            let alive = this.game.players.filter((p) => p.alive);

            var chosenTwo = [
              Random.randArrayVal(alive, true),
              Random.randArrayVal(alive, true),
            ];
          }

          chosenTwo = Random.randomizeArray(chosenTwo);
          this.actor.queueAlert(`You learn that one of ${chosenTwo[0].name} and ${chosenTwo[1].name} is the Leader!`);
        }
      }
    }
  }
}
