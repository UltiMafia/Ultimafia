const Card = require("../../Card");
const Action = require("../../Action");
const Player = require("../../../../core/Player");
const {
  PRIORITY_SELF_BLOCK_EARLY,
  PRIORITY_SELF_BLOCK_LATER,
} = require("../../const/Priority");

module.exports = class Complex extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Blocking", "Modifier"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_SELF_BLOCK_EARLY,
        labels: ["block", "hidden", "absolute"],
        role: role,
        run: function () {
          if (!this.isSelfBlock()) {
            return;
          }
          this.blockingMods(this.role);
        },
      },
      {
        ability: ["Blocking", "Modifier"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_SELF_BLOCK_LATER,
        labels: ["block", "hidden", "absolute"],
        role: role,
        run: function () {
          this.blockingMods(this.role);
        },
      },
    ];
  }
};
