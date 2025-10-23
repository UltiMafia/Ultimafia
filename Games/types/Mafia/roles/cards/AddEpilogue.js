const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class AddEpilogue extends Card {
  constructor(role) {
    super(role);
    this.listeners = {
      extraStateCheck: function (stateName) {
        if (this.game.ExtraStates == null) {
          this.game.ExtraStates = [];
        }
        if (this.game.poetGuessPhaseActive != true) {
          return;
        }
        if (
          stateName == "Epilogue" &&
          !this.game.ExtraStates.includes("Epilogue")
        ) {
          this.game.ExtraStates.push("Epilogue");
        }
      },
    };
  }
};
