const Role = require("../../Role");

module.exports = class CheeseSnake extends Role {
  constructor(player, data) {
    super("Cheese Snake", player, data);

    this.alignment = "Town";
    this.cards = ["MoveSnake", "TownCore"];

    this.listeners = {
      roleAssigned: [
        function (player) {
          if (player != this.player) {
            return;
          }
        },
      ],
    };
  }
};
