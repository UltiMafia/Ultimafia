const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class DieIfVisited extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Modifier", "Kill"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden"],
        role: role,
        run: function () {
          if (this.hasVisitors() === true) {
            if (this.dominates(this.actor)) {
              this.actor.kill("basic", this.actor);
            }
          }
        },
      },
    ];
  }
};
