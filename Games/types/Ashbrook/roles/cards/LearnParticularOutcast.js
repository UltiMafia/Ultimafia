const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class LearnParticularOutcast extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        let outcast = this.game.players.filter((p) => p.role.alignment == "Outcast");
        if (outcast.length == 0){
          this.player.queueAlert(`You learn that there are no Outcasts in play!`)
        } else {
          let chosenOutcast = Random.randArrayVal(outcast);
          let outcastRole = chosenOutcast.role.name;
          let otherPlayer = this.game.players.filter((p) => p != chosenOutcast);
          var chosenTwo = [
            chosenOutcast,
            Random.randArrayVal(otherPlayer),
          ];

          if (this.player.hasEffect("Insanity")){
            var chosenTwo = [
              Random.randArrayVal(this.game.players, true),
              Random.randArrayVal(this.game.players, true),
            ];
          }

          chosenTwo = Random.randomizeArray(chosenTwo);

          this.player.queueAlert(`You learn that one of ${chosenTwo[0].name} and ${chosenTwo[1].name} is ${outcastRole}!`);
          }
        }
    };
  }
}
