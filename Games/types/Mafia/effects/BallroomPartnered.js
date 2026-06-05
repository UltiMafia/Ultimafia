const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class BallroomPartnered extends Effect {
  constructor(pair) {
    super("Ballroom Partnered");

    this.partner = pair.find((p) => p != this.player);
    this.representative = pair[0];

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (player == this.partner) {
          var action = new Action({
          labels: ["kill", "hidden"],
          actor: this.partner,
          target: this.player,
          game: this.player.game,
          priority: 0,
          run: function () {
            if (this.dominates()){
            this.target.kill("ballroomUnpartnered", this.actor, instant);
            }
          },
          });
          action.do();
        }
      },
      state: function (stateInfo) {
        this.representative = pair[(stateInfo.dayCount + 1) % 2];
      },
    };
  }
};
