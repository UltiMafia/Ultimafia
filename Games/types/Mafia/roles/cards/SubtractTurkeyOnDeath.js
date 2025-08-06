const Card = require("../../Card");

module.exports = class SubtractTurkeyOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (player === this.player) {
          if (!this.hasAbility(["Item", "WhenDead"])) {
            return;
          }
          this.game.queueAlert(
            ":turkey: The town thought they caught a Turkey, but instead you lose your lunch…"
          );
          for (let person of this.game.players) {
            if (
              (person.hasItem("Food") &&
                person.alive &&
                person.role.name !== "Turkey") ||
              person.role.name !== "Tofurkey"
            ) {
              person.dropItem("Food");
            }
          }
        }
      },
    };
  }
};
