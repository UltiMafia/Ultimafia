const Role = require("../../Role");

module.exports = class Villager extends Role {
  constructor(player, data) {
    super("Villager", player, data);

    this.alignment = "Town";
    this.cards = ["TownCore", "WinWithTown", "AnnounceAndCheckWord"];

    this.listeners = {
      roleAssigned: [
        function (player) {
          if (player != this.player) {
            return;
          }

          this.word = this.game.townWord;
        },
      ],
    };
  }
};
