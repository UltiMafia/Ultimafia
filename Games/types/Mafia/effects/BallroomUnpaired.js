const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class BallroomUnpaired extends Effect {
  constructor() {
    super("Ballroom Unpaired");

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (!this.player.alive) return;
        if (this.game.getStateName() === "Reception") return;
        var action = new Action({
        labels: ["kill", "hidden"],
        actor: this.partner,
        target: this.player,
        game: this.player.game,
        priority: 0,
        run: function () {
          if (this.dominates()){
          this.target.kill("ballroomUnpaired", this.actor, instant);
          }
        },
        });
        action.do();
      },
    };
  }
};