const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillConverters extends Card {
  constructor(role) {
    super(role);

    this.role.killLimit = 2;

    this.passiveActions = [
      {
        ability: ["Kill", "Modifier"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden"],
        run: function () {
          if (this.role.killLimit <= 0) {
            return;
          }

          var convertingVisitors = this.getVisitors(this.actor, "convert");

          for (let visitor of convertingVisitors) {
            if (this.role.killLimit > 0 && this.dominates(visitor)) {
              visitor.kill("basic", this.actor);
              this.role.killLimit--;
            }
          }
        },
      },
    ];
  }
};
