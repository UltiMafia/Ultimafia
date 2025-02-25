const Effect = require("../Effect");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class Meteor extends Effect {
  constructor(lifespan) {
    super("Meteor");
    this.lifespan = lifespan;

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Day/)) {
          return;
        }
        
      },
      death: function (player, killer, deathType, instant) {
      this.remove();
      },
      afterActions: function (){
        this.game.MeteorEnd = true;
        for(let player of this.game.alivePlayers()){
          player.kill("basic");
        }
      },
    };
  }
};
