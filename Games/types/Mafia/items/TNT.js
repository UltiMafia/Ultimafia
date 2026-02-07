const Item = require("../Item");
const Action = require("../Action");

module.exports = class TNT extends Item {
  constructor(lifespan) {
    super("TNT");

    //this.cannotBeStolen = true;
    this.lifespan = lifespan || Infinity;
    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (
          player == this.holder &&
          this.neighbors &&
          killer &&
          deathType != "condemn"
        ) {
          var action = new Action({
            actor: this.holder,
            target: killer,
            game: this.holder.game,
            labels: ["kill", "bomb"],
            run: function () {
              if (this.dominates(this.neighbors[0])){
                this.target.kill("bomb", this.actor, instant);
              }
              if (this.dominates(this.neighbors[1])){
                this.target.kill("bomb", this.actor, instant);
              }
            },
          });

          action.do();
        }
        else if(this.holder.alive){
          this.neighbors = this.holder.getNeighbors()
        }
      },
    };
  }

  hold(player) {
    super.hold(player);
    this.neighbors = player.getNeighbors()
  }
  
};
