const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class SubtractTurkeyOnDeath extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Turkey Meeting": {
        states: ["Night"],
        flags: ["group", "speech"],
      },
    };

    this.listeners = {
      priority: PRIORITY_ITEM_TAKER_DEFAULT,
      death: function (player, killer, deathType) {
        if (player === this.player) {
          this.game.queueAlert(
            ":turkey: The town thought they caught a Turkey, but instead you lose your lunch..."
          );
          for (let person of this.game.players) {
            if (
              (person.alive && person.role.name !== "Turkey") ||
              person.role.name !== "Tofurkey"
            ) {
              this.stealItemByName("Food", "Turkey");
            }
          }
        }
      },
    };
  }
};
