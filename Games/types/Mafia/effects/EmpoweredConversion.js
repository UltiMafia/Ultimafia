const Effect = require("../Effect");
const Action = require("../Action");
const roles = require("../../../../data/roles");
const Random = require("../../../../lib/Random");

module.exports = class EmpoweredConversion extends Effect {
  constructor(target, lifespan) {
    super("EmpoweredConversion");
    this.target = target;
    this.lifespan = lifespan || 1;

    this.listeners = {
      roleAssigned: function (player) {
        
        if (player.role.name == "Cultist" && player === this.target) {
          let action = new Action({
            actor: this.target,
            target: this.player,
            game: this.game,
            labels: ["convert", "curse", "hidden"],
            effect: this,
            power: 2,
            run: function () {
              if (this.dominates()) {
                const randomCultRole = Random.randArrayVal(Object.entries(roles.Mafia).filter((roleData) => roleData[1].alignment === "Cult").map((roleData) => roleData[0]));
            this.target.setRole(randomCultRole);
              }
              this.effect.remove();
            },
          });

          this.game.instantAction(action);
        }
      },
    };
  }
};
