const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class LearnTwoNonLeader extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        let nonLeader = this.game.players.filter((p) => p.role.alignment != "Leader");
        var chosenTwo = [
          Random.randArrayVal(nonLeader, true),
          Random.randArrayVal(nonLeader, true),
        ];

        if (this.player.hasEffect("Insanity")){
          var chosenTwo = [
            Random.randArrayVal(this.game.players, true),
            Random.randArrayVal(this.game.players, true),
          ];
        }

        this.player.queueAlert(`You learn that ${chosenTwo[0].name} and ${chosenTwo[1].name} are not the Leader!`);
      }
    };
  }
}
