const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class MummyMarkVisitors extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Effect"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["hidden", "giveEffect"],
        run: function () {
          let visitors = this.getVisitors();
          for (let visitor of visitors) {
            if (this.dominates(visitor)) {
              this.role.giveEffect(visitor, "Entombed");
            }
          }
        },
      },
    ];
  }
};
