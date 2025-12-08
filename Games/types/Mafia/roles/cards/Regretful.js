const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Regretful extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Modifier", "Kill"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden", "absolute"],
        run: function () {
          let visits = this.getVisits(this.actor);
          let killers = visits.map((v) => this.getVisitors(v, "kill"));

          if (killers.length == 0) {
            return;
          } else if (this.dominates(this.actor)) {
            this.actor.kill("basic", this.actor);
          }
        },
      },
    ];
  }
};
