const Card = require("../../Card");

module.exports = class NightKillerRampager extends Card {
  constructor(role) {
    super(role);
    
    this.listeners = {
      state: function (stateInfo) {
        if (this.game.getStateName() != "Day") return;
        if (!this.player.alive) return;

        if ((!this.data.previousTarget || this.data.previousTarget.length == 0) && !this.data.rampageLast && this.game.getStateInfo().id > 1){
          this.player.holdItem("Rampager3");
          this.data.rampageLast = true;
        } else {
          this.player.holdItem("Rampager1");
          this.data.rampageLast = false;
        }
        this.data.previousTarget = [];
      }
    }
  }
};
