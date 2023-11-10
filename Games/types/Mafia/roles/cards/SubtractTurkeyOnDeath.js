const Card = require("../../Card");

module.exports = class SubtractTurkeyOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (player === this.player) {
          this.game.queueAlert(
            ":turkey: The town thought they caught a Turkey, but instead you lose your lunch..."
          );
          for (let person of this.game.players) {
            if (
              (person.hasItem("Food") &&
                person.alive &&
                person.role.name !== "Turkey") ||
              person.role.name !== "Tofurkey"
            ) {
              person.item.drop("Food");
            }
          }
        }
      },
    };
  }
};
