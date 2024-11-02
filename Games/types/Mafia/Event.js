const Event = require("../../core/Event");

module.exports = class MafiaEvent extends Event {
  constructor(name, game, data) {
    super(name, game, data);
  }

getModifierRequirements() {
    if(this.game.getStateInfo().dayCount % 2 == 0 && this.modifiers.includes("Odd")){
    return false;
    }
    if(this.game.getStateInfo().dayCount % 1 == 0 && this.modifiers.includes("Even")){
            return false;
    }
    if(this.game.getStateInfo().dayCount == 1 && this.modifiers.includes("Delayed")){
      return false;
    }
}

doEvent() {
  if(this.modifiers.includes("One Shot") && !(this.modifiers.includes("Banished"))){
    this.game.PossibleEvents.slice(this.game.PossibleEvents.indexOf(this.fullName), 1);
  }
  else if(this.modifiers.includes("One Shot") && (this.modifiers.includes("Banished"))){
    this.game.PossibleEvents.slice(this.game.BanishedEvents.indexOf(this.fullName), 1);
  }
}


  
};
