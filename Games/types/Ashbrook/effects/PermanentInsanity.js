const Effect = require("../Effect");

module.exports = class PermanentInsanity extends Effect {
  constructor(drunk) {
    super("PermanentInsanity");
    this.drunk = drunk || false;
    this.lifespan = Infinity;

    this.listeners = {
      state: function (stateInfo){
        if (!this.player.hasEffect("Insanity")) this.player.giveEffect("Insanity");
      },
      aboutToFinish: function () {
        if (this.drunk) this.player.setRole("Plaguebearer");
      },
    }
  }
};
