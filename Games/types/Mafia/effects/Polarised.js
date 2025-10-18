const Effect = require("../Effect");
const Action = require("../Action");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");

module.exports = class Polarised extends Effect {
  constructor(bear) {
    super("Polarised");
    this.isMalicious = true;

    this.bear = bear;
    this.listeners = {
      state: function (stateInfo) {
        if (this.game.getStateName() != "Night") {
          this.game.HasDonePolarisedAction = false;
          return;
        }
        if (this.game.HasDonePolarisedAction == true) {
          return;
        }
        this.game.HasDonePolarisedAction = true;

        var action = new Action({
          actor: this.bear,
          game: this.player.game,
          priority: PRIORITY_KILL_DEFAULT,
          labels: ["kill", "hidden", "absolute"],
          run: function () {
            for (let player of this.game.players) {
              let visitors = this.getVisitors(player);
              if (player.hasEffect("Polarised")) {
                for (let v of visitors) {
                  if (!v.hasEffect("Polarised")) {
                    continue;
                  }

                  if (this.dominates(player)) {
                    player.kill("polarised", this.actor);
                  }

                  if (this.dominates(v)) {
                    v.kill("polarised", this.actor);
                  }
                }
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
