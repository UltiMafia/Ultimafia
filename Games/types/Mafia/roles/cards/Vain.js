const Card = require("../../Card");
const Action = require("../../Action");
const Player = require("../../../../core/Player");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Vain extends Card {
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
        labels: ["kill", "hidden"],
        run: function () {
          if (!this.actor.alive) return;

          let visits = this.getSecondaryActions(this.actor);

          for(let visit of visits){
            if (visit.getRoleAlignment() == this.actor.role.alignment) {
                  if (this.dominates(this.actor)) {
                    this.actor.kill("basic", this.actor);
                  }
                }
          }
        },
      },
    ];
  }
};
