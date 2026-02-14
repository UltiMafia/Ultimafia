const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");

module.exports = class TargetRandom extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Redirection", "Modifier"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_REDIRECT_ACTION - 1,
        labels: ["block", "hidden", "absolute"],
        run: function () {
          let players = this.game.alivePlayers().filter((p) => p != this.actor);
          if (Random.randInt(0, 1) == 0) {
            this.redirectAllActions(this.actor, Random.randArrayVal(players), "mafia");
          }
        },
      },
    ];
  }
};
