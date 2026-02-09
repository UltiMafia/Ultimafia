const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_EFFECT_GIVER_EARLY } = require("../../const/Priority");

module.exports = class CauseBleedingToTargets extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Effect", "Modifier", "WhenDead"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_EFFECT_GIVER_EARLY,
        labels: ["effect"],
        run: function () {
          let visits = this.getSecondaryActions(this.actor);
          for (let v of visits) {
            if (this.dominates(v)) {
              this.role.giveEffect(v, "Bleeding", this.actor);
            }
          }
        },
      },
    ];
  }
};
