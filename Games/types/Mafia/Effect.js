const Effect = require("../../core/Effect");

module.exports = class MafiaEffect extends Effect {
  constructor(name, data) {
    super(name, data);
    this.source = "None";
  }

  shouldAutoRemove(){
  if(this.source == "None"){
    return false;
  }
  if(this.source.modifier && this.modifier.split("/").includes("Forgettable") && !this.source.hasAbility("Effect")){
    this.remove();
    return true;
  }
  }

  age() {
    if (
      this.game &&
      this.game.getStateName() != "Day" &&
      this.game.getStateName() != "Night"
    ) {
    } else {
      this.lifespan--;
    }

    if (this.lifespan < 0) this.remove();
  }
};
