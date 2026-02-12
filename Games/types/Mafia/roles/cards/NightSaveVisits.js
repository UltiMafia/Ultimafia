const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class NightSaveVisits extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Modifier"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_NIGHT_SAVER,
        labels: ["save"],
         run: function () {
            let visits = this.getSecondaryActions(this.actor);
            for (let v of visits) {
              if (this.dominates(v)) {
                this.heal(1, v);
              }
            }
          },
      },
    ];
  }
};
