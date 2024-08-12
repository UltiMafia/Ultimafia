const { addArticle } = require("../../../../core/Utils");
const Random = require("../../../../../lib/Random");
const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate", "role", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          let visitors = this.getVisitors(this.actor);

          if (this.actor.hasEffect("FalseMode")) {
            let players = this.game
              .alivePlayers()
              .filter((p) => p != this.actor);
            let playerNames = players.map((p) => p.name);
            let playerFake = Random.randArrayVal(players, true);
            let roleFake = Random.randArrayVal(players, true);
            if (visitors.length <= 0) {
              this.actor.queueAlert(
                `:invest: You learn that ${
                  playerFake.name
                }'s role is ${addArticle(roleFake.getRoleAppearance())}.`
              );
            }
            return;
          }

          for (let visitor of visitors) {
            this.actor.queueAlert(
              `:invest: You learn that ${visitor.name}'s role is ${addArticle(
                visitor.getRoleAppearance()
              )}.`
            );
          }
        },
      },
    ];
  }
};
