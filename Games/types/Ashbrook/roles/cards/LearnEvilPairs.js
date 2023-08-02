const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class LearnEvilPairs extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        let index = 0;
        let evilPairs = 0;
        let neighbor;
        let alive = this.game.alivePlayers();
        let currentPlayer = alive[0];
        let evil = this.game.players.filter((p) => p.role.alignment !== "Villager" && p.role.alignment !== "Outcast");
        while (index !== alive.length){
          index = alive.indexOf(currentPlayer);

          index = (index + 1) % alive.length;
          neighbor = alive[index];

          if (evil.indexOf(neighbor) > -1 && evil.indexOf(currentPlayer) > -1) evilPairs++;

          currentPlayer = neighbor;
          index++;
        }

        if (this.player.hasEffect("Insanity")){
          evilPairs += Random.randArrayVal([1, -1]);
          if (evilPairs < 0) evilPairs = 0;
        }

        this.player.queueAlert(`You learn that there are ${evilPairs} Evil pairs!`);
      }
    };
  }
};
