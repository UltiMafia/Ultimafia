const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class ModifierBloodthirsty extends Card {
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
        labels: ["kill"],
        run: function () {
            let visits = this.getVisits(this.actor);
            for (let v of visits) {
              if (this.dominates(v)) {
                v.kill("basic", this.actor);
              }
            }
        },
      },
    ];

  }
};
