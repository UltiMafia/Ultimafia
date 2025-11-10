const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class BlockTargets extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Modifier", "WhenDead"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_NIGHT_ROLE_BLOCKER,
        labels: ["block", "hidden"],
        role: role,
        run: function () {
          let visits = this.getVisits(this.actor);
          visits.map((v) => this.blockActions(v));
        },
      },
    ];
  }
};
