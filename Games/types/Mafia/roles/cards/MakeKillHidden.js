const Card = require("../../Card");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class MakeKillHidden extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        labels: ["hidden"],
        // roleblockable
        priority: PRIORITY_NIGHT_ROLE_BLOCKER + 5,
        run: function () {
          if (!this.actor.alive) return;

          if (this.game.getStateName() != "Night") return;

          for (let action of this.game.actions[0]) {
            if (action.actors.includes(this.actor) && action.hasLabel("kill")) {
              action.labels = [...action.labels, "hidden"];
            }
          }
        },
      },
    ];
  }
};
