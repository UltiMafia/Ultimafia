const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_BLOCK_EARLY } = require("../../const/Priority");

module.exports = class BlockedIfScary extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Modifier", "WhenDead"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_BLOCK_EARLY,
        labels: ["block", "hidden"],
        role: role,
        run: function () {
            let ScaryPlayers = this.game
              .alivePlayers()
              .filter((p) => p.hasEffect("Scary"));
            if (ScaryPlayers.length > 0) {
              this.blockActions(this.actor);
            }
        },
      },
    ];
    
  }
};
