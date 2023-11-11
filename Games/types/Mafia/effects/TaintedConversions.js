const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class TaintedConversions extends Effect {
  constructor() {
    super("TaintedConversions");
    this.lifespan = Infinity;

    this.listeners = {
        immune: function (action) {
          if (
            action.target === this.player &&
            action.hasLabel("convert") &&
            !this.player.tempImmunity["convert"]
          ) {
  
            this.player.giveEffect("Fishy", action.actor);
          }
        },
      };
  }
};
