const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class ProtectNeighborsIfBothTown extends Card {
  constructor(role) {
    super(role);
/*
    this.actions = [
      {
        priority: PRIORITY_NIGHT_SAVER,
        labels: ["save"],
        run: function () {
          if (!this.actor.alive) return;

          const neighbors = this.getAliveNeighbors();
          const allNeighborsGood =
            neighbors.filter(
              (p) =>
                p.role.alignment == "Village" || p.role.winCount == "Village"
            ).length == 2;

          if (!allNeighborsGood) return;

          for (let n of neighbors) {
            n.giveEffect("Immortal", 5, 1);
          }
        },
      },
    ];
*/
      this.listeners = {
      AbilityToggle: function (player) {
        for(let effect of this.ImmortalEffects){
          if(effect.player){
          var index = effect.player.passiveEffects.indexOf(effect);
          if (index != -1) {
            this.player.passiveEffects.splice(index, 1);
          }
          effect.remove();
        }
        }
        this.ImmortalEffects = [];
        if (this.player.hasAbility(["Protection", "OnlyWhenAlive"])) {
            let neighbors = this.player.getNeighbors();
          if(neighbors[0].isEvil() == true || neighbors[1].isEvil() == true){
            return;
          }
         for(let player of neighbors) {
            this.player.passiveEffects.push(player.giveEffect(
              "Immortal",
              5,
              Infinity
            ));
        }
        }
      },
    };

    
  }
};
