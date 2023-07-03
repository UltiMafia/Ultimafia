const Role = require("../../Role");

module.exports = class SunkVillager extends Role {
  constructor(player, data) {
    super("SunkVillager", player, data);

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
