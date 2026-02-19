const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");

module.exports = class TargetSelf50Percent extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Redirection", "Modifier"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_REDIRECT_ACTION,
        labels: ["block", "hidden", "absolute"],
        run: function () {
          if (Random.randInt(0, 1) == 0) {
            this.redirectAllSecondaryActions(this.actor, this.actor);
          }
        },
      },
    ];
  }
};
