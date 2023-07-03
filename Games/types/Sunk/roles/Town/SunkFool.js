const Role = require("../../Role");

module.exports = class SunkFool extends Role {
  constructor(player, data) {
    super("SunkFool", player, data);

    this.alignment = "Town";
    this.cards = ["TownCore", "WinWithTown", "AnnounceAndCheckWord"];
    this.appearance["self"] = "Villager";

    this.listeners = {
      roleAssigned: [
        function (player) {
          if (player != this.player) {
            return;
          }

          this.word = this.game.foolWord;
        },
      ],
    };
  }
};
