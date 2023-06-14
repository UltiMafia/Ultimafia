const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class TurnIntoTraitorOnMafiaKill extends Card {
  constructor(role) {
    super(role);

    this.immunity.mafia = Infinity;
    this.listeners = {
      immune(action) {
        if (action.target !== this.player) {
          return;
        }

        if (!action.hasLabel("mafia")) {
          return;
        }

        const convertAction = new Action({
          labels: ["convert"],
          actor: this.player,
          target: this.player,
          game: this.player.game,
          run() {
            if (this.dominates()) {
              this.target.setRole("Traitor");
            }
          },
        });
        convertAction.do();
      },
    };
  }
};
