const shortid = require("shortid");
const Utils = require("./Utils");

module.exports = class Event {
  constructor(name, modifiers, game) {
    this.game = game;
    this.id = shortid.generate();
    this.fullName = `${name}:${modifiers}`;
    this.name = name;
    this.modifiers = modifiers;
    //this.game.queueAlert(`Core ${modifiers}`);
    /*
    if(this.modifiers <= 0){
      this.modifiers = [];
    }
    else{
      this.modifiers = this.modifiers.split("/");
    }
    */
    this.actions = [];
  }

  getRequirements() {
    if (
      this.getModifierRequirements() == true &&
      this.getNormalRequirements() == true
    ) {
      return true;
    } else {
      return false;
    }
  }

  getModifierRequirements() {
    return true;
  }

  getNormalRequirements() {
    return true;
  }

  doEvent() {}

  queueActions() {
    for (let action of this.actions) this.game.queueAction(action);
  }

  dequeueActions() {
    for (let action of this.actions) this.game.dequeueAction(action);
  }
};
