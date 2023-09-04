const Item = require("../Item");
const Action = require("../Action");

module.exports = class Bomb extends Item {
  constructor(lifespan) {
    super("Bomb");

    this.cannotBeStolen = true;
    this.lifespan = lifespan || Infinity;
    this.meetings = {
      "Rush with Bomb": {
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        action: {
          labels: ["kill", "bomb"],
          run: function () {
            this.game.queueAlert(
              `:dynamite: ${this.actor.name} rushes at ${this.target.name} and explodes!`
            );

            this.actor.kill("basic", this.actor, true);

            if (this.dominates()) this.target.kill("bomb", this.target, true);
          },
        },
      },
    };
    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (
          player == this.holder &&
          killer &&
          killer.role.name != "Ninja" &&
          deathType != "condemn"
        ) {
          var action = new Action({
            actor: this.holder,
            target: killer,
            game: this.holder.game,
            labels: ["kill", "bomb"],
            run: function () {
              if (this.dominates())
                this.target.kill("bomb", this.actor, instant);
            },
          });

          action.do();
        }
      },
    };
  }
};
