const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class AddDawn extends Card {
  constructor(role) {
    super(role);
    this.listeners = {
      extraStateCheck: function (stateName) {
        if (this.game.ExtraStates == null) {
          this.game.ExtraStates = [];
        }
        if (stateName == "Dawn" && !this.game.ExtraStates.includes("Dawn")) {
          this.game.ExtraStates.push("Dawn");
        }
      },
    };
  }
};
