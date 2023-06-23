const Card = require("../../Card");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class BlockTargets extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_NIGHT_ROLE_BLOCKER,
        labels: ["block", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          for (let action of this.game.actions[0]) {
            if (action.actor == this.actor) {
              this.blockActions(this.actor);
            }
          }
        },
      },
    ];
  }
};
