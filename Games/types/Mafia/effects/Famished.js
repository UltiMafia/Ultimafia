const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class Famished extends Effect {
  constructor() {
    super("Famished");

    this.listeners = {
      afterActions: function () {
        if (!this.player.alive) return;

        if (
          this.game.getStateName() != "Day" ||
          this.game.getStateInfo().dayCount === 1
        ) {
          return;
        }

        if (this.player.getImmunity("famine")) return;

        if (this.consumeFood(this.player)) {
          const hasFood = this.hasFood(this.player);
          this.player.queueAlert(
            `You eat some food... ${
              hasFood ? "you have more food left." : "you are out of food!"
            }`
          );
          return;
        }

        let action = new Action({
          actor: this.player,
          target: this.player,
          game: this.player.game,
          effect: this,
          power: 5,
          labels: ["kill", "famine"],
          run: function () {
            if (!this.effect.hasFood(this.target) && this.dominates()) {
              this.target.kill("famine", this.actor);
            }
          },
        });
        action.do();
      },
    };
  }
  foodTypes = ["Turkey", "Bread", "Orange"];

  hasFood(player) {
    const target = player || this.player;
    for (const food of this.foodTypes) {
      const foodItems = target.getItems(food);
      for (const item of foodItems) {
        if (!item.cursed) {
          return true;
        }
      }
    }
    return false;
  }

  consumeFood(player) {
    const target = player || this.player;
    for (const food of this.foodTypes) {
      const foodItems = target.getItems(food);
      for (const item of foodItems) {
        if (!item.cursed) {
          item.drop();
          return true;
        }
      }
    }
    return false;
  }

  apply(player) {
    if (player.hasEffect("Famished")) {
      return;
    }

    super.apply(player);
    this.player.queueAlert("You are famished.");
  }
};
