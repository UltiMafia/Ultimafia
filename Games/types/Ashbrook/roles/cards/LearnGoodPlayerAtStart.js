const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class LearnGoodPlayerAtStart extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        let good;
        if (this.player.hasEffect("Insanity")){
          good = this.game.players;
        } else {
          good = this.game.players.filter((p) => p.role.alignment !== "Follower" && p.role.alignment !== "Leader");
        }
        let chosenGood = Random.randArrayVal(good);
        this.player.queueAlert(`You learn that ${chosenGood.name} is Good!`);
      }
    };
  }
}
