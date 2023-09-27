const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class TaintedConversions extends Card {
  constructor(role) {
    super(role);

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
