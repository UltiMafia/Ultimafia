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
          this.game.getStateInfo().dayCount === 0
        ) {
          return;
        }
        let bakerAlive = false;
        let turkeyInGame = false;
        for (let player of this.game.players) {
          if (player.role.name === "Baker" && player.alive) {
            bakerAlive = true;
          }
          if (player.role.name === "Turkey") {
            turkeyInGame = true;
          }
        }
        if (bakerAlive && !turkeyInGame && !this.game.eveTakenApple) return;

        if (this.player.getImmunity("famine")) return;

        // food items are eaten in this order
        let foodTypes = ["Food", "Bread", "Orange"];
        for (let food of foodTypes) {
          let foodItems = this.player.getItems(food);
          for (let item of foodItems) {
            if (!item.cursed) {
              this.player.queueAlert("You eat some food.");
              item.eat();
              item.drop();
              return;
            }
          }
        }

        this.player.queueAlert("You are out of food!");

        let action = new Action({
          actor: this.player,
          target: this.player,
          game: this.player.game,
          power: 5,
          labels: ["kill", "famine"],
          run: function () {
            if (this.dominates()) this.target.kill("famine", this.actor);
          },
        });
        action.do();
      },
    };
  }

  apply(player) {
    player.queueAlert("You are famished.");
    super.apply(player);
  }
};
