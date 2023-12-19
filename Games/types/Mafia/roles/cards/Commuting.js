const Card = require("../../Card");
const { PRIORITY_UNTARGETABLE } = require("../../const/Priority");

module.exports = class Commuting extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_UNTARGETABLE,
        labels: ["stop", "absolute", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          this.makeUntargetable(this.actor);
        },
      },
    ];
  }
};
