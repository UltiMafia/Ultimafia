const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_SELF_BLOCK_POST_BLOCK } = require("../../const/Priority");

module.exports = class BlockIfVisited extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Modifier", "WhenDead"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_SELF_BLOCK_POST_BLOCK,
        labels: ["block", "hidden"],
        role: role,
        run: function () {
          if (this.hasVisitors() === true) {
            this.blockActions(this.actor);
          }
        },
      },
    ];
  }
};
