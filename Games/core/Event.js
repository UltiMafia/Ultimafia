const shortid = require("shortid");
const Utils = require("./Utils");

module.exports = class Event {
  constructor(name, game) {
    
    this.game = game;
    this.id = shortid.generate();
    this.name = name.event.split(":")[0];
    this.modifiers = name.split(":")[1].split("/")
    this.actions = [];
  }


  getRequirements(){
    return true;
  }

  getModifierRequirements(){
    return true;
  }


  doEvent(){
    
  }

  queueActions() {
    for (let action of this.actions) this.game.queueAction(action);
  }

  dequeueActions() {
    for (let action of this.actions) this.game.dequeueAction(action);
  }
};
