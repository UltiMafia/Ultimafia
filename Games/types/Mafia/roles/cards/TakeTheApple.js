const Card = require("../../Card");

module.exports = class TakeTheApple extends Card {
  constructor(role) {
    super(role);

    role.data.numStatesSinceApple = 0;
    role.methods.checkIfShouldTakeApple = function () {
      if (this.data.takenApple) return;
      if (!this.player.alive) return;

      let aliveMafia = this.game
        .alivePlayers()
        .filter((p) => p.role.alignment == "Mafia");
      if (aliveMafia.length != 1) return;

      this.data.takenApple = true;
      this.game.queueAlert(
        "Eve has taken the apple! A disaster will obliterate everyone at the end of the next phase"
      );
    };
    this.listeners = {
      death: function () {
        this.methods.checkIfShouldTakeApple();
      },
      start: function () {
        this.methods.checkIfShouldTakeApple();
      },
      afterActions: function () {
        if (!this.data.takenApple) {
          return;
        }

        const currentState = this.game.getStateName();
        if (currentState != "Day" && currentState != "Night") {
          return;
        }

        this.data.numStatesSinceApple += 1;
        if (this.data.numStatesSinceApple >= 2) {
          // kill everyone
          for (let p of this.game.alivePlayers()) {
            if (p != this.player) {
              p.kill("basic", this.player);
            }
          }
        }
      },
    };
  }
};
