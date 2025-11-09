const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_BLOCK_SELF_IF_KILLED } = require("../../const/Priority");

module.exports = class BlockedIfKilled extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Modifier", "WhenDead"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_BLOCK_SELF_IF_KILLED,
        labels: ["block", "hidden"],
        role: role,
        run: function () {
          if (!this.actor.alive) {
            this.blockActions(this.actor);
          }
        },
      },
    ];
  }
};
