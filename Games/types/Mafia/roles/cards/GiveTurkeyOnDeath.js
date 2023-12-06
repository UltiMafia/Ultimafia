const Card = require("../../Card");

module.exports = class GiveTurkeyOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (player === this.player) {
          this.game.queueAlert(
            ":turkey: The town cooks the Turkey and turns it into a meal for everyone!"
          );
          for (let person of this.game.players) {
            if (person.alive && person.role.name !== "Turkey") {
              person.holdItem("Food", "Turkey");
            }
          }
        }
      },
    };
  }
};
