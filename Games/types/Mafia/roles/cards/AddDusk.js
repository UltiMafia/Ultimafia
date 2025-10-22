const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class AddDusk extends Card {
  constructor(role) {
    super(role);
    this.listeners = {
      extraStateCheck: function (stateName) {
        if(this.game.ExtraStates == null){
          this.game.ExtraStates = [];
        }
        if(stateName == "Dusk" && !this.game.ExtraStates.includes("Dusk")){
          this.game.ExtraStates.push("Dusk");
        }
        
      },
    };
  }
};
