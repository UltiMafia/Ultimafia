const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class Lovesick extends Effect {
  constructor(lover) {
    super("Lovesick");
    this.lover = lover;
    this.isMalicious = true;

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (player == this.lover) {
          var action = new Action({
          labels: ["kill", "hidden"],
          actor: this.lover,
          target: this.player,
          game: this.player.game,
          priority: 0,
          run: function () {
            if (this.dominates()){
            this.target.kill("love", this.lover, instant);
            }
          },
        });
          action.do();
        }
      },
    };
  }
};
