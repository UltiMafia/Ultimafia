const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillVisitors extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Kill"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden"],
        run: function () {
          let visitors = this.getVisitors();

          for (let visitor of visitors)
            if (this.dominates(visitor)) visitor.kill("basic", this.actor);
        },
      },
    ];
  }
};
