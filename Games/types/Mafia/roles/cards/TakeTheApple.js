const Card = require("../../Card");

module.exports = class TakeTheApple extends Card {
  constructor(role) {
    super(role);

    role.checkIfShouldTakeApple = function () {
      if (this.game.eveTakenApple) return;
      if (!this.player.alive) return;

      let aliveMafia = this.game
        .alivePlayers()
        .filter((p) => p.role.alignment == "Mafia");
      if (aliveMafia.length != 1) return;

      // take apple
      this.game.eveTakenApple = true;
      this.game.queueAlert("Eve has taken the apple! The famine has started!");

      // give bread
      for (let p of this.game.alivePlayers()) {
        p.holdItem("Bread");
        if (!p.hasEffect("Famished")) {
          p.giveEffect("Famished");
        }
      }
      // extra bread
      this.player.holdItem("Bread");
    };
    this.listeners = {
      death: function () {
        this.checkIfShouldTakeApple();
      },
      start: function () {
        this.checkIfShouldTakeApple();
      },
    };
  }
};
