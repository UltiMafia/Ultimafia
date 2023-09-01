const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class LearnParticularVillager extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        let villager = this.game.players.filter((p) => p.role.alignment == "Villager");
        let chosenVillager = Random.randArrayVal(villager);
        let villagerRole = chosenVillager.role.name;
        let otherPlayer = this.game.players.filter((p) => p != chosenVillager);

        var chosenTwo = [
          chosenVillager,
          Random.randArrayVal(otherPlayer),
        ];

        if (this.player.hasEffect("Insanity")){
          var chosenTwo = [
            Random.randArrayVal(this.game.players, true),
            Random.randArrayVal(this.game.players, true),
          ];
        }

        chosenTwo = Random.randomizeArray(chosenTwo);

        this.player.queueAlert(`You learn that one of ${chosenTwo[0].name} and ${chosenTwo[1].name} is ${villagerRole}!`);
      }
    };
  }
}
