const Role = require("../../Role");

module.exports = class Villager extends Role {
  constructor(player, data) {
    super("Snake", player, data);

    this.alignment = "Town";
    this.cards = ["MoveSnake"];

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
