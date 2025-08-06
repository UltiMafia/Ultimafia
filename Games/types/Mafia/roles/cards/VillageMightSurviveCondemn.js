const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class VillageMightSurviveCondemn extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["save"],
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (!this.actor.alive) return;

          const villagePlayers = this.game
            .alivePlayers()
            .filter(
              (p) =>
                p.role.alignment == "Village" || p.role.winCount == "Village"
            );

          let shuffledPlayers = Random.randomizeArray(villagePlayers);

          shuffledPlayers[0].giveEffect("Condemn Immune", 5, 1);
        },
      },
    ];
*/
    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Protection", "Modifier"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          labels: ["save"],
          run: function () {
            const villagePlayers = this.game
              .alivePlayers()
              .filter(
                (p) =>
                  p.role.alignment == "Village" || p.role.winCount == "Village"
              );

            let shuffledPlayers = Random.randomizeArray(villagePlayers);

            shuffledPlayers[0].giveEffect("Condemn Immune", 5, 1);
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
