const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class VillageMightSurviveCondemn extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Protection", "Modifier"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["save"],
        run: function () {
          const villagePlayers = this.game
            .alivePlayers()
            .filter(
              (p) =>
                p.getRoleAlignment() == "Village" || p.role.winCount == "Village"
            );

          let shuffledPlayers = Random.randomizeArray(villagePlayers);

          shuffledPlayers[0].giveEffect("Condemn Immune", 5, 1);
        },
      },
    ];
  }
};
