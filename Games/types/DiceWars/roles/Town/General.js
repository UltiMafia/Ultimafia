const Role = require("../../Role");

module.exports = class General extends Role {
  constructor(player, data) {
    super("General", player, data);

    this.alignment = "Town";
    this.cards = ["AttackTerritory", "EndTurn", "TownCore"];

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

