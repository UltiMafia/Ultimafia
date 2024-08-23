const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class VillageMightSurviveCondemn extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["save"],
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (!this.actor.alive) return;

          const villagePlayers = this.game.alivePlayers().filter((p) => p.role.alignment == "Village" || p.role.winCount == "Village");

          let shuffledPlayers = Random.randomizeArray(villagePlayers);

          
          
            shuffledPlayers[0].giveEffect("Condemn Immune", 5, 1);
          
        },
      },
    ];
  }
};
