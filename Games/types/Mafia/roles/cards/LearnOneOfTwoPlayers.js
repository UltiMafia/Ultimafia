const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnOneOfTwoPlayers extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        run: function () {
          if (!this.actor.alive) return;
          if (this.game.getStateName() != "Night") return;
          if (this.actor.role.hasInfo) return;

          var alive = this.game.players.filter(
            (p) => p.alive && p != this.actor
          );

          if (alive.length < 3) {
            this.actor.queueAlert(
              ` You learn nothing because only 2 players are alive.`
            );
            return;
          } else {
            const chosenPlayer = Random.randArrayVal(alive);
            var aliveRemoveTarget = alive.filter((p) => p != chosenPlayer);
            const chosenRandom = Random.randArrayVal(aliveRemoveTarget);
            let chosenRole = chosenPlayer.getRoleAppearance();
            let chosenNames = [chosenPlayer, chosenRandom];
            let chosenNamesRan = Random.randomizeArray(chosenNames);

            if(this.actor.hasEffect("FalseMode")){
              aliveRemoveTarget = aliveRemoveTarget.filter((p) => p.getRoleAppearance().split(" (")[0] != chosenNamesRan[0].role.name);
              aliveRemoveTarget = aliveRemoveTarget.filter((p) => p.getRoleAppearance().split(" (")[0] != chosenNamesRan[1].role.name);
              chosenRole = Random.randArrayVal(aliveRemoveTarget).getRoleAppearance();
            }
            
            this.actor.queueAlert(
              ` You learn that ${chosenNamesRan[0].name} or ${chosenNamesRan[1].name} is a ${chosenRole}.`
            );
            this.actor.role.hasInfo = true;
          }
        },
      },
    ];
  }
};
