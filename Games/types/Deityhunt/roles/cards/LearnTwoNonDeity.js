const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class LearnTwoNonDeity extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        if (player !== this.player) {
          return;
        }

        let nonDeity = this.game.players.filter((p) => p.role.alignment != "Deity");
        var chosenTwo = [
          Random.randArrayVal(nonDeity, true),
          Random.randArrayVal(nonDeity, true),
        ];

        this.actor.queueAlert(`"You learn that ${chosenTwo[0]} and ${chosenTwo[1]} are not the Deity!`);
      }
    };
  }
}
