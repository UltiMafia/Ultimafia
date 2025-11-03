const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_UNTARGETABLE } = require("../../const/Priority");

module.exports = class Ascetic extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Blocking", "Modifier"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_UNTARGETABLE,
        labels: ["stop", "hidden"],
        role: role,
        run: function () {
          this.makeUntargetable(this.actor, "kill");
        },
      },
    ];
  }
};
