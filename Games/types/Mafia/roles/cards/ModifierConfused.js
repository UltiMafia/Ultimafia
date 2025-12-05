const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class ModifierConfused extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
      death: true,
      condemn: true,
    };

    this.passiveActions = [
      {
        ability: ["Modifier"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_NIGHT_ROLE_BLOCKER,
        labels: ["block", "hidden", "absolute"],
        run: function () {
            if (Random.randInt(0, 1) == 0) {
              this.actor.giveEffect("FalseMode", 1);
            }
        },
      },
    ];
  }
};
