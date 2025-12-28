const Effect = require("../Effect");
const Action = require("../Action");
const modifiers = require("../../../../data/modifiers");

module.exports = class Zombification extends Effect {
  constructor(infector) {
    super("Zombification");
    this.infector = infector;
    this.isMalicious = true;
  }

  apply(player) {
    super.apply(player);

    this.action = new Action({
      actor: this.infector,
      target: player,
      game: this.infector.game,
      labels: ["zombification", "hidden", "absolute", "uncontrollable"],
      delay: 1,
      effect: this,
      run: function () {
        if (
          this.target.role.name === "Survivor" &&
          this.target.role.canDoSpecialInteractions()
        ) {
          return;
        }

        if (!this.target.hasEffect("Zombification")) {
          return;
        }

        if (this.dominates()) {
          this.target.setRole("Zombie");
          /* if (!this.target.alive) {
                        this.target.revive("zombie", undefined, undefined, true);
                    } */
        }

        this.effect.remove();
      },
    });

    if (!player.getImmunity("zombification") && player.role.name !== "Zombie") {
      this.game.queueAction(this.action);
    } else {
      this.remove();
    }
  }

  remove() {
    super.remove();
    this.action.cancel(true);
  }
};
