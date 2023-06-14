const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class Famished extends Effect {
  constructor() {
    super("Famished");

    this.listeners = {
      actionsNext() {
        if (!this.player.alive) return;

        if (this.player.role.name === "Turkey") return;

        let bakerAlive = false;
        let turkeyInGame = false;
        for (const player of this.game.players) {
          if (player.role.name === "Baker" && player.alive) {
            bakerAlive = true;
          }
          if (player.role.name === "Turkey") {
            turkeyInGame = true;
          }
        }

        if (bakerAlive && !turkeyInGame) return;

        // food items are eaten in this order
        const foodTypes = ["Turkey", "Bread", "Orange"];
        for (const food of foodTypes) {
          const foodItems = this.player.getItems(food);
          for (const item of foodItems) {
            if (!item.cursed) {
              item.drop();
              return;
            }
          }
        }

        this.game.queueAction(
          new Action({
            actor: this.player,
            target: this.player,
            game: this.player.game,
            power: 5,
            labels: ["kill", "famine"],
            run() {
              if (this.dominates()) this.target.kill("famine", this.actor);
            },
          })
        );
      },
    };
  }
};
