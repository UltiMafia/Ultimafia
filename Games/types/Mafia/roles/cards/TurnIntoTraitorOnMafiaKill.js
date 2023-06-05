const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class TurnIntoTraitorOnMafiaKill extends Card {
  constructor(role) {
    super(role);

    this.immunity["mafia"] = Infinity;
    this.listeners = {
      immune: function (action) {
        if (action.target !== this.player) {
          return;
        }

        if (!action.hasLabel("mafia")) {
          return;
        }

        let convertAction = new Action({
          labels: ["convert"],
          actor: this.player,
          target: this.player,
          game: this.player.game,
          run: function () {
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
