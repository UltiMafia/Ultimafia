const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class LearnParticularVillager extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        let Villager = this.game.players.filter((p) => p.role.alignment == "Villager");
        let VillagerRole = Villager.role.name;
        let otherPlayer = this.game.players.filter((p) => p != Villager);
        var chosenTwo = [
          Random.randArrayVal(Villager),
          Random.randArrayVal(otherPlayer),
        ];

        chosenTwo = Random.randomizeArray(chosenTwo);

        this.actor.queueAlert(`You learn that one of ${chosenTwo[0].name} and ${chosenTwo[1].name} is ${VillagerRole}!`);
      }
    };
  }
}
