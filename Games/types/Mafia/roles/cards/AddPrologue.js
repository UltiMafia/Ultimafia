const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class AddPrologue extends Card {
  constructor(role) {
    super(role);
    this.listeners = {
      extraStateCheck: function (stateName) {
        if (this.game.ExtraStates == null) {
          this.game.ExtraStates = [];
        }
        if (
          stateName == "Prologue" &&
          !this.game.ExtraStates.includes("Prologue")
        ) {
          this.game.ExtraStates.push("Prologue");
        }
      },
      state: function (stateInfo) {
        if (stateInfo.name.match(/Prologue/)) {
          this.game.HavePrologueState = false;
          if (this.game.isDayStart()) {
            this.game.HavePrologueStateBlock = "Day";
          } else {
            this.game.HavePrologueStateBlock = "Night";
          }
        }
        if (
          stateInfo.name.match(/Night/) &&
          this.game.HavePrologueStateBlock == "Night"
        ) {
          this.game.HavePrologueStateBlock = null;
        }
        if (
          stateInfo.name.match(/Day/) &&
          this.game.HavePrologueStateBlock == "Day"
        ) {
          this.game.HavePrologueStateBlock = null;
        }
      },
    };

    this.stateMods = {
      Day: {
        type: "shouldSkip",
        shouldSkip: function () {
          return this.game.shouldSkipState("Day");
        },
      },
      Night: {
        type: "shouldSkip",
        shouldSkip: function () {
          return this.game.shouldSkipState("Night");
        },
      },
    };
  }
};
