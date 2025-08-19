const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class ProtectNeighborsIfBothTown extends Card {
  constructor(role) {
    super(role);
    this.ImmortalEffects = [];
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
        if (this.ImmortalEffects == null) {
          this.ImmortalEffects = [];
        }
        for (let x = 0; x < this.ImmortalEffects.length; x++) {
          if (this.ImmortalEffects[x].player) {
            var index = this.passiveEffects.indexOf(this.ImmortalEffects[x]);
            if (index != -1) {
              this.passiveEffects.splice(index, 1);
            }
            this.ImmortalEffects[x].remove();
          }
        }
        this.ImmortalEffects = [];
        if (this.hasAbility(["Protection", "OnlyWhenAlive"])) {
          let neighbors = this.player.getNeighbors();
          if (neighbors[0].isEvil() == true || neighbors[1].isEvil() == true) {
            return;
          }
          for (let player of neighbors) {
            let effect = player.giveEffect("Immortal", 5, Infinity);
            this.passiveEffects.push(effect);
            this.ImmortalEffects.push(effect);
          }
        }
      },
    };
  }
};
