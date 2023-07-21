const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class LearnParticularOutcast extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        let outcast = this.game.players.filter((p) => p.role.alignment == "Outcast");
        if (outcast.length == 0){
          this.actor.queueAlert(`You learn that there are no Outcasts in play!`)
        } else {
          let outcastRole = outcast.role.name;
          let otherPlayer = this.game.players.filter((p) => p != Outcast);
          var chosenTwo = [
            Random.randArrayVal(outcast),
            Random.randArrayVal(otherPlayer),
          ];

          chosenTwo = Random.randomizeArray(chosenTwo);

          this.actor.queueAlert(`You learn that one of ${chosenTwo[0].name} and ${chosenTwo[1].name} is ${outcastRole}!`);
          }
        }
    };
  }
}
