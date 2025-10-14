const Role = require("../../Role");

module.exports = class GapSnake extends Role {
  constructor(player, data) {
    super("Gap Snake", player, data);

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
